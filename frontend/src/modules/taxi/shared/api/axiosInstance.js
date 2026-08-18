import axios from 'axios';
import { TAXI_API_BASE_URL } from './runtimeConfig';
import { getTaxiAdminToken, getTaxiUserToken, getTokenPayload } from '../authStorage';
import { refreshSession, hasRefreshToken } from './refreshSession';

const api = axios.create({
  baseURL: TAXI_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const DEDUPED_GET_TTL_MS = 2500;
const dedupedGetRequests = new Map();
const recentDedupedGetResponses = new Map();

const isDedupedGet = (url = '') => {
  const requestPath = String(url || '').split('?')[0];

  return /^\/users\/me$/.test(requestPath) ||
    /^\/drivers\/me$/.test(requestPath) ||
    /^\/rides\/active\/me$/.test(requestPath) ||
    /^\/deliveries\/active\/me$/.test(requestPath) ||
    /^\/admin\/general-settings\/[^/]+$/.test(requestPath) ||
    /^\/common\/payment-gateway$/.test(requestPath) ||
    /^\/admin\/(countries|service-locations|notification-channels)$/.test(requestPath) ||
    /^\/(countries|common\/ride_modules)$/.test(requestPath);
};

const getDedupedRequestKey = (url = '', config = {}) => {
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${String(url || '')}|${params}`;
};

const normalizeAuthRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (value === 'super-admin') {
    return 'admin';
  }
  return value;
};

const getSessionItem = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const getStoredTokenByRole = (role) => {
  const normalizedRole = normalizeAuthRole(role);
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

  return entries.find((token) => normalizeAuthRole(getTokenPayload(token)?.role) === normalizedRole) || null;
};

const getRoleFromPathname = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const pathname = String(window.location.pathname || '').toLowerCase();

  if (pathname.includes('/admin')) {
    return 'admin';
  }

  // Owners currently authenticate with driver tokens (fleet-owner flow).
  if (pathname.includes('/taxi/owner')) {
    return 'driver';
  }

  if (pathname.includes('/taxi/driver') || pathname.includes('/driver')) {
    return 'driver';
  }

  if (pathname.includes('/taxi/user') || pathname.includes('/user')) {
    return 'user';
  }

  return '';
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
    localStorage.removeItem('adminInfo');
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

// Request Interceptor: Attach Auth Token automatically
api.interceptors.request.use(
  (config) => {
    const requestPath = String(config.url || '').split('?')[0];
    const existingAuthorization = config.headers?.Authorization || config.headers?.authorization;

    if (existingAuthorization) {
      return config;
    }

    const chatRole = localStorage.getItem('chatRole');
    const normalizedChatRole = String(chatRole || '').toLowerCase();
    const userToken = getStoredTokenByRole('user');
    const driverToken = getStoredTokenByRole('driver');
    const ownerToken = getStoredTokenByRole('owner');
    const adminToken = getStoredTokenByRole('admin') || getTaxiAdminToken();

    const isPublicUserRoute =
      /^\/users\/(app-modules|goods-types|vehicle-types|register|signup|login|profile-image|auth\/send-otp|auth\/verify-otp|otp-login)(\/|$)/.test(requestPath);
    const isPublicDriverRoute =
      /^\/drivers\/(register|login|auth\/send-otp|auth\/verify-otp|onboarding\/send-otp|onboarding\/verify-otp|onboarding\/personal|onboarding\/referral|onboarding\/vehicle|onboarding\/documents|onboarding\/complete|onboarding\/session\/|service-locations)(\/|$)/.test(requestPath);
    const isAdminRoute =
      /^\/admin(\/|$)/.test(requestPath) ||
      /^\/(countries|common\/ride_modules|types\/|on-boarding(?:-|\/|$)|roles\/|permissions\/)/.test(requestPath);
    const isDriverRoute = /^\/drivers?(\/|$)/.test(requestPath);
    const isUserRoute = /^\/(users|rides|deliveries|promos)(\/|$)/.test(requestPath);
    const isSupportRoute = /^\/support(\/|$)/.test(requestPath);
    const isChatRoute = /^\/chats?(\/|$)/.test(requestPath);
    const pathRole = getRoleFromPathname();

    let token = null;

    if (isPublicUserRoute || isPublicDriverRoute) {
      token = null;
    } else if (isChatRoute) {
      if (normalizedChatRole === 'admin') {
        token = adminToken;
      } else if (normalizedChatRole === 'driver') {
        token = driverToken || ownerToken;
      } else if (normalizedChatRole === 'owner') {
        token = ownerToken || driverToken;
      } else if (normalizedChatRole === 'user') {
        token = userToken;
      }
    } else if (isAdminRoute) {
      token = adminToken;
    } else if (isSupportRoute) {
      if (pathRole === 'admin') {
        token = adminToken;
      } else if (pathRole === 'driver') {
        token = driverToken || ownerToken;
      } else {
        token = userToken;
      }
    } else if (isUserRoute) {
      token = userToken;
    } else if (isDriverRoute) {
      token = driverToken || ownerToken;
    } else {
      token = userToken || driverToken || ownerToken || adminToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Simplify responses and handle global errors
api.interceptors.response.use(
  (response) => {
    // Pro-Level: Many APIs return data in data.data or data.result, you can flatten it here
    return response.data;
  },
  async (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        const serverMessage = String(error.response.data?.message || '');
        const authHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization || '';
        const token = String(authHeader).startsWith('Bearer ') ? String(authHeader).slice(7) : '';
        const tokenRole = normalizeAuthRole(getTokenPayload(token)?.role || '');

        const expiredOrInvalid =
          serverMessage === 'Authorization token expired' ||
          serverMessage === 'Invalid authorization token';

        // An expired access token is the WhatsApp-switch logout: try to refresh
        // silently and replay the original request before ever signing out.
        // Only for user/driver-family roles, and never for the refresh call
        // itself (that would loop).
        const refreshRole = tokenRole === 'user' ? 'user' : 'driver';
        const isRefreshCall = String(error.config?.url || '').includes('/auth/refresh');

        if (expiredOrInvalid && !isRefreshCall && !error.config?._authRetried && hasRefreshToken(refreshRole)) {
          const fresh = await refreshSession(refreshRole);
          if (fresh) {
            const retryConfig = { ...error.config, _authRetried: true };
            retryConfig.headers = { ...(retryConfig.headers || {}), Authorization: `Bearer ${fresh}` };
            return api(retryConfig);
          }
        }

        const shouldClearAuth =
          serverMessage === 'Authenticated account no longer exists' ||
          serverMessage === 'Authorization token expired' ||
          serverMessage === 'Invalid authorization token' ||
          (tokenRole === 'user' && serverMessage === 'User account is not active');

        // Only sign out once refresh is exhausted or impossible.
        if (shouldClearAuth) {
          clearStaleAuthState(tokenRole, token);
          dispatchStaleAuthEvent({ role: tokenRole, message: serverMessage, token });
        }
      }
      const normalizedError = error;
      normalizedError.status = error.response.status;
      normalizedError.data = error.response.data;
      normalizedError.message =
        error.response.data?.message ||
        error.message ||
        'Request failed';
      return Promise.reject(normalizedError);
    }

    return Promise.reject({ message: 'Network error or server down.' });
  }
);

const rawGet = api.get.bind(api);

api.get = (url, config = {}) => {
  if (!isDedupedGet(url)) {
    return rawGet(url, config);
  }

  const key = getDedupedRequestKey(url, config);
  const now = Date.now();
  const cached = recentDedupedGetResponses.get(key);

  if (cached && now - cached.timestamp < DEDUPED_GET_TTL_MS) {
    return Promise.resolve(cached.data);
  }

  const pending = dedupedGetRequests.get(key);

  if (pending) {
    return pending;
  }

  const request = rawGet(url, config)
    .then((data) => {
      recentDedupedGetResponses.set(key, {
        data,
        timestamp: Date.now(),
      });
      return data;
    })
    .finally(() => {
      dedupedGetRequests.delete(key);
    });

  dedupedGetRequests.set(key, request);
  return request;
};

export default api;
