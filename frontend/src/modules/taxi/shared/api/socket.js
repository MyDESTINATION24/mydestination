import { io } from 'socket.io-client';
import { BACKEND_ORIGIN, TAXI_SOCKET_PATH } from './runtimeConfig';
import { getTaxiAdminToken, getTaxiUserToken, getTokenPayload } from '../authStorage';

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

class SocketService {
  constructor() {
    this.socket = null;
    this.currentToken = null;
    this.listeners = new Map();
  }

  // Force an immediate reconnect instead of waiting for a heartbeat to fail.
  ensureAlive(reason = 'lifecycle') {
    if (!this.socket) return;
    if (this.socket.connected) return;

    console.info('[socket] forcing reconnect', { reason });
    this.socket.connect();
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

      if (this.socket?.recovered !== true) {
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
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
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
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }
}

export const socketService = new SocketService();
