const TAXI_USER_TOKEN_KEY = 'token';
const TAXI_ADMIN_TOKEN_KEY = 'taxiAdminToken';
const TAXI_USER_INFO_KEY = 'user';
const TAXI_ADMIN_INFO_KEY = 'taxiAdminInfo';

const decodeBase64Url = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return normalized + '='.repeat(padding);
};

export const getTokenPayload = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(atob(decodeBase64Url(payload)));
  } catch {
    return null;
  }
};

const isScopedToken = (token, allowedRoles = []) => {
  const payload = getTokenPayload(token);
  if (!payload?.sub && !payload?.id && !payload?._id) {
    return false;
  }

  if (!allowedRoles.length) {
    return true;
  }

  return allowedRoles.includes(String(payload.role || '').toLowerCase());
};

export const getTaxiUserToken = () =>
  isScopedToken(localStorage.getItem(TAXI_USER_TOKEN_KEY), ['user'])
    ? localStorage.getItem(TAXI_USER_TOKEN_KEY) || ''
    : '';

export const setTaxiUserSession = ({ token = '', user = null } = {}) => {
  if (token) {
    localStorage.setItem(TAXI_USER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TAXI_USER_TOKEN_KEY);
  }

  if (user) {
    localStorage.setItem(TAXI_USER_INFO_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TAXI_USER_INFO_KEY);
  }
};

export const clearTaxiUserSession = () => {
  localStorage.removeItem(TAXI_USER_TOKEN_KEY);
  localStorage.removeItem(TAXI_USER_INFO_KEY);
  localStorage.removeItem('userInfo');
  localStorage.removeItem('role');
  localStorage.removeItem('chatRole');
};

export const getTaxiUserInfo = () => {
  try {
    const scopedInfo = localStorage.getItem(TAXI_USER_INFO_KEY);
    if (scopedInfo) {
      return JSON.parse(scopedInfo);
    }
  } catch {}

  try {
    const genericInfo = localStorage.getItem('userInfo');
    return genericInfo ? JSON.parse(genericInfo) : {};
  } catch {
    return {};
  }
};

export const getTaxiAdminToken = () =>
  isScopedToken(localStorage.getItem(TAXI_ADMIN_TOKEN_KEY), ['admin', 'super-admin'])
    ? localStorage.getItem(TAXI_ADMIN_TOKEN_KEY) || ''
    : '';

export const setTaxiAdminSession = ({ token = '', admin = null } = {}) => {
  if (token) {
    localStorage.setItem(TAXI_ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TAXI_ADMIN_TOKEN_KEY);
  }

  if (admin) {
    localStorage.setItem(TAXI_ADMIN_INFO_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(TAXI_ADMIN_INFO_KEY);
  }
};

export const getTaxiAdminInfo = () => {
  try {
    const scopedInfo = localStorage.getItem(TAXI_ADMIN_INFO_KEY);
    if (scopedInfo) {
      return JSON.parse(scopedInfo);
    }
  } catch {}

  try {
    const genericInfo = localStorage.getItem('adminInfo');
    return genericInfo ? JSON.parse(genericInfo) : {};
  } catch {
    return {};
  }
};

export const clearTaxiAdminSession = () => {
  localStorage.removeItem(TAXI_ADMIN_TOKEN_KEY);
  localStorage.removeItem(TAXI_ADMIN_INFO_KEY);
  localStorage.removeItem('adminInfo');
};
