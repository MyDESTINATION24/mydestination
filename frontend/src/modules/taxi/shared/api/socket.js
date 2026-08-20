import { io } from 'socket.io-client';
import { BACKEND_ORIGIN, TAXI_SOCKET_PATH } from './runtimeConfig';
import { getTaxiAdminToken, getTaxiUserToken, getTokenPayload } from '../authStorage';
import { refreshSession, hasRefreshToken } from './refreshSession';

const SOCKET_ORIGIN = BACKEND_ORIGIN || undefined;

const getSessionItem = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredTokenByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  const entries = (
    normalizedRole === 'driver' || normalizedRole === 'owner'
      ? [
          getSessionItem('driverToken'),
          localStorage.getItem('driverToken'),
        ]
      : [
          role === 'user' ? getTaxiUserToken() : role === 'admin' ? getTaxiAdminToken() : localStorage.getItem(`${role}Token`),
        ]
  ).filter(Boolean);

  return entries.find((token) => String(getTokenPayload(token)?.role || '').toLowerCase() === normalizedRole) || null;
};

const resolveTokenForRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  const adminToken = getStoredTokenByRole('admin') || getTaxiAdminToken();
  const userToken = getStoredTokenByRole('user');
  const driverToken = getStoredTokenByRole('driver');
  const ownerToken = getStoredTokenByRole('owner');

  if (normalizedRole === 'admin') {
    return adminToken;
  }

  if (normalizedRole === 'driver') {
    return driverToken || ownerToken;
  }

  if (normalizedRole === 'owner') {
    return ownerToken || driverToken;
  }

  if (normalizedRole === 'user') {
    return userToken;
  }

  return userToken || driverToken || ownerToken || adminToken || null;
};

const normalizeAuthRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (value === 'super-admin') {
    return 'admin';
  }

  // Mirror the server (normalizeRole in taxi authMiddleware): a wedding vendor
  // is also a taxi customer, and their token's subject IS the User document.
  // Without this, a vendor's token was not recognised as a 'user' token, so no
  // Authorization header was attached at all -- the API answered 'Authorization
  // token is required' and the app read that as a dead session and demanded a
  // fresh OTP. 'partner' stays unmapped here too: a partner is a different
  // document with its own id.
  if (value === 'vendor') {
    return 'user';
  }

  return value;
};

const clearStaleAuthState = (role = '', staleToken = '') => {
  const normalizedRole = normalizeAuthRole(role);

  if (!normalizedRole || normalizedRole === 'user') {
    if (!staleToken || getTaxiUserToken() === staleToken) {
      localStorage.removeItem('taxiUserToken');
    }
    localStorage.removeItem('taxiUserInfo');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('role');
  }

  if (!normalizedRole || normalizedRole === 'driver' || normalizedRole === 'owner') {
    if (!staleToken || localStorage.getItem('driverToken') === staleToken) {
      localStorage.removeItem('driverToken');
    }
    try {
      if (!staleToken || getSessionItem('driverToken') === staleToken) {
        sessionStorage.removeItem('driverToken');
      }
    } catch {}
    try {
      sessionStorage.removeItem('driverInfo');
      sessionStorage.removeItem('chatRole');
    } catch {}
    localStorage.removeItem('driverInfo');
  }

  if (!normalizedRole || normalizedRole === 'admin') {
    if (!staleToken || localStorage.getItem('adminToken') === staleToken) {
      localStorage.removeItem('adminToken');
    }
    if (!staleToken || getTaxiAdminToken() === staleToken) {
      localStorage.removeItem('taxiAdminToken');
    }
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('taxiAdminInfo');
  }

  localStorage.removeItem('chatRole');
};

const dispatchStaleAuthEvent = ({ role = '', message = '', token = '' } = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('app:auth-stale', {
    detail: {
      role: role || null,
      message: message || '',
      token: token || '',
    },
  }));
};

// How long a health round trip may take before the socket is judged stale.
const HEALTH_PROBE_TIMEOUT_MS = 5000;
// An idle driver waiting for a request is exactly who a zombie socket hurts,
// and no lifecycle event fires while they sit there -- so probe on a timer too.
const HEALTH_HEARTBEAT_MS = 25000;

class SocketService {
  constructor() {
    this.socket = null;
    this.currentToken = null;
    this.listeners = new Map();
    this.healthProbeInFlight = false;
    this.healthTimer = null;
    // Ride rooms this client has joined, replayed after a cold reconnect.
    this.joinedRideIds = new Set();
  }

  // Tear the transport down and dial again. disconnect() first matters: calling
  // connect() on a socket that still believes it is connected is a no-op.
  forceReconnect(reason) {
    if (!this.socket) return;

    console.info('[socket] forcing reconnect', { reason });

    try {
      this.socket.disconnect();
    } catch {
      // already gone; the connect below is what matters
    }

    this.socket.connect();
  }

  // socket.connected is only what the client BELIEVES. When Android suspends a
  // WebView the OS kills the TCP connection without the client ever seeing a
  // close, so the flag stays true while nothing flows -- a zombie socket that
  // silently drops ride requests until the ping timeout finally fires.
  // The only reliable test is a round trip.
  probeConnection(reason) {
    if (!this.socket) return;

    if (!this.socket.connected) {
      this.forceReconnect(reason);
      return;
    }

    if (this.healthProbeInFlight) return;
    this.healthProbeInFlight = true;

    this.socket
      .timeout(HEALTH_PROBE_TIMEOUT_MS)
      .emit('client:health', (error) => {
        this.healthProbeInFlight = false;

        if (error) {
          console.warn('[socket] health probe timed out, socket is stale', { reason });
          this.forceReconnect(`stale:${reason}`);
        }
      });
  }

  ensureAlive(reason = 'lifecycle') {
    this.probeConnection(reason);
  }

  // A driver waiting for a request can sit idle for a long time, which is
  // exactly when a zombie socket goes unnoticed. Probe on a timer too, not only
  // on lifecycle events.
  startHealthHeartbeat() {
    if (this.healthTimer) return;

    this.healthTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      this.probeConnection('heartbeat');
    }, HEALTH_HEARTBEAT_MS);
  }

  stopHealthHeartbeat() {
    if (!this.healthTimer) return;

    clearInterval(this.healthTimer);
    this.healthTimer = null;
  }

  installLifecycleHandlers() {
    if (this.lifecycleHandlersInstalled) return;
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    this.lifecycleHandlersInstalled = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.ensureAlive('foreground');
      }
    });

    // pageshow fires on WebView restore from the back/forward cache, where
    // visibilitychange sometimes does not.
    window.addEventListener('pageshow', () => this.ensureAlive('pageshow'));
    window.addEventListener('online', () => this.ensureAlive('online'));
    window.addEventListener('focus', () => this.ensureAlive('focus'));

    this.startHealthHeartbeat();
  }

  attachRegisteredListeners() {
    if (!this.socket) {
      return;
    }

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    });
  }

  connect(options = {}) {
    const token = options.token || resolveTokenForRole(options.role);

    if (!token) {
      console.warn('[socket] missing token for role', options.role || 'unknown');
      return null;
    }

    if (this.socket && this.currentToken === token) {
      if (!this.socket.connected) {
        console.info('[socket] reconnecting existing socket', {
          role: options.role || 'unknown',
          socketId: this.socket.id || null,
        });
        this.socket.auth = { ...(this.socket.auth || {}), token };
        this.socket.connect();
      }

      console.info('[socket] reusing existing connection', {
        role: options.role || 'unknown',
        socketId: this.socket.id || null,
        connected: this.socket.connected,
      });
      return this.socket;
    }

    if (this.socket) {
      console.info('[socket] disconnecting previous socket before reconnect');
      this.socket.disconnect();
    }

    this.currentToken = token;
    this.socket = io(SOCKET_ORIGIN, {
      path: TAXI_SOCKET_PATH,
      auth: { token },
      // Start with polling and upgrade when possible so reverse proxies that
      // don't immediately pass WebSocket upgrades can still complete the
      // Socket.IO handshake in production.
      transports: ['polling', 'websocket'],
      upgrade: true,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 750,
      reconnectionDelayMax: 2500,
      timeout: 10000,
    });
    this.attachRegisteredListeners();
    this.installLifecycleHandlers();

    this.socket.on('connect', () => {
      console.info('[socket] connected', {
        role: options.role || 'unknown',
        socketId: this.socket?.id || null,
        // true when the server replayed what we missed while disconnected;
        // false means a cold session, so screens should refetch their state
        recovered: this.socket?.recovered === true,
      });

      this.healthProbeInFlight = false;

      if (this.socket?.recovered !== true) {
        // Cold session: the server kept no rooms for us, so re-join before
        // telling screens to refetch. Otherwise live updates never resume.
        this.rejoinRooms();
        window.dispatchEvent(new CustomEvent('taxi-socket-cold-reconnect'));
      }
    });

    this.socket.on('connect_error', (error) => {
      const message = error?.message || 'unknown error';
      const isAuthFailure =
        message === 'Invalid authorization token' ||
        message === 'Authorization token expired' ||
        message === 'Authenticated account no longer exists' ||
        message === 'User account is not active';

      if (isAuthFailure) {
        const tokenRole = normalizeAuthRole(getTokenPayload(token)?.role || options.role || '');

        // The axios layer already refreshes an expired access token before
        // signing out; this path did not, so a socket reconnect on a stale
        // token logged the user straight out -- the mid-booking logout. Try
        // the same refresh and reconnect with the new token first.
        const expired =
          message === 'Authorization token expired' ||
          message === 'Invalid authorization token';
        const refreshRole = tokenRole === 'user' ? 'user' : 'driver';

        if (expired && !this.authRefreshInFlight && hasRefreshToken(refreshRole)) {
          this.authRefreshInFlight = true;
          refreshSession(refreshRole)
            .then((fresh) => {
              this.authRefreshInFlight = false;
              if (fresh) {
                this.connect({ ...options, token: fresh });
                return;
              }
              clearStaleAuthState(tokenRole, token);
              dispatchStaleAuthEvent({ role: tokenRole, message, token });
            })
            .catch(() => {
              this.authRefreshInFlight = false;
              clearStaleAuthState(tokenRole, token);
              dispatchStaleAuthEvent({ role: tokenRole, message, token });
            });
          return;
        }

        clearStaleAuthState(tokenRole, token);
        dispatchStaleAuthEvent({ role: tokenRole, message, token });
      }

      console.error('[socket] connect_error', {
        role: options.role || 'unknown',
        message,
        description: error?.description || null,
        context: error?.context || null,
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[socket] disconnected', {
        role: options.role || 'unknown',
        reason,
      });

      // A probe that was in flight will never be answered now; clear the guard
      // so the next one is allowed to run.
      this.healthProbeInFlight = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.stopHealthHeartbeat();
      this.healthProbeInFlight = false;
      // Full teardown (logout / app exit): these rooms are no longer ours.
      this.joinedRideIds.clear();
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
    }
  }

  on(event, callback) {
    if (!event || typeof callback !== 'function') {
      return;
    }

    const callbacks = this.listeners.get(event) || new Set();
    callbacks.add(callback);
    this.listeners.set(event, callbacks);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (!event) {
      return;
    }

    if (callback) {
      const callbacks = this.listeners.get(event);
      callbacks?.delete(callback);

      if (callbacks?.size === 0) {
        this.listeners.delete(event);
      }
    } else {
      this.listeners.delete(event);
    }

    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
        return;
      }

      this.socket.off(event);
    }
  }

  emit(event, data) {
    // Remember room joins so they can be replayed after a cold reconnect.
    // Screens emit ride:join once, from an effect keyed on rideId, so nothing
    // re-runs when the socket comes back -- without this the client reconnects
    // successfully but sits outside the ride room receiving nothing.
    if (event === 'ride:join' && data?.rideId) {
      this.joinedRideIds.add(String(data.rideId));
    }

    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Server-side room membership is restored automatically only while the
  // connectionStateRecovery window holds. Past that the session is cold and the
  // rooms are gone, so they have to be re-joined explicitly.
  rejoinRooms() {
    if (!this.socket || this.joinedRideIds.size === 0) return;

    this.joinedRideIds.forEach((rideId) => {
      console.info('[socket] rejoining ride room after cold reconnect', { rideId });
      this.socket.emit('ride:join', { rideId });
    });
  }

  forgetRideRoom(rideId) {
    this.joinedRideIds.delete(String(rideId));
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }
}

export const socketService = new SocketService();
