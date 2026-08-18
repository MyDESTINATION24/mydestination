import { getTaxiUserToken, setTaxiUserSession } from '../authStorage';

// One shared in-flight refresh. Several requests can 401 at the same moment
// (the app fires a burst on resume), and without this each would start its own
// rotation -- the first would succeed and the rest would look like replays,
// which revokes the whole family and signs the user out. Exactly the bug this
// is meant to prevent.
let inFlight = null;

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || 'https://api.mydestination.in/api').replace(/\/$/, '');

const readRefreshToken = (role) => {
  try {
    return localStorage.getItem(role === 'user' ? 'taxiUserRefreshToken' : 'driverRefreshToken') || '';
  } catch {
    return '';
  }
};

export const storeRefreshToken = (role, token) => {
  if (!token) return;

  try {
    localStorage.setItem(role === 'user' ? 'taxiUserRefreshToken' : 'driverRefreshToken', token);
  } catch {}
};

export const clearRefreshToken = (role) => {
  try {
    localStorage.removeItem(role === 'user' ? 'taxiUserRefreshToken' : 'driverRefreshToken');
  } catch {}
};

// Returns a fresh access token, or null when the session is genuinely finished
// and the caller should sign the user out.
export const refreshSession = async (role = 'user') => {
  if (inFlight) {
    return inFlight;
  }

  const refreshToken = readRefreshToken(role);

  if (!refreshToken) {
    return null;
  }

  const path = role === 'user' ? '/taxi/users/auth/refresh' : '/taxi/drivers/auth/refresh';

  inFlight = (async () => {
    try {
      const response = await fetch(`${API_ROOT}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // The refresh token itself is dead: revoked, replayed or expired.
        clearRefreshToken(role);
        return null;
      }

      const payload = await response.json();
      const next = payload?.data || {};

      if (!next.token) {
        clearRefreshToken(role);
        return null;
      }

      storeRefreshToken(role, next.refreshToken);

      if (role === 'user') {
        setTaxiUserSession({ token: next.token, user: null });
      } else {
        try {
          localStorage.setItem('driverToken', next.token);
          sessionStorage.setItem('driverToken', next.token);
        } catch {}
      }

      console.info('[auth] session refreshed silently');
      return next.token;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

export const hasRefreshToken = (role = 'user') => Boolean(readRefreshToken(role));
export { getTaxiUserToken };
