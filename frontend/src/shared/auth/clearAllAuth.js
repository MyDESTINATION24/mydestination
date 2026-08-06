// Single source of truth for wiping an authenticated session.
//
// Every panel (user, partner, wedding vendor, wedding admin, hotel admin, taxi
// admin, CMS admin, driver/owner) used to clear its own hand-picked subset of
// these keys, so logging out of one panel left another panel's token behind and
// the guards -- which re-read storage on every render -- happily let you back in.
//
// sessionStorage matters as much as localStorage here: the driver flow mirrors
// its token into sessionStorage, and `localStorage.clear()` never touched it.
const AUTH_KEYS = [
  // user
  'token',
  'user',
  'userToken',
  'userInfo',
  'role',
  'chatRole',
  // taxi user
  'taxiUserToken',
  'taxiUserInfo',
  // admin (hotel / wedding / taxi / cms)
  'adminToken',
  'adminInfo',
  'admin_token',
  'admin_user',
  'cmsToken',
  'taxiAdminToken',
  'taxiAdminInfo',
  // wedding vendor
  'vendor_token',
  'vendor_user',
  // driver / owner
  'driverToken',
  'driverInfo',
  'driverRole',
  'driverRegistrationSession',
];

// Push registration markers are not credentials, but they gate re-registration,
// so logout has to reset them too. The browser path skips re-sending while
// `lastBrowserFcmRegistration` still matches role+token, and the native bridge
// only re-submits what is *pending* -- a successful registration clears that.
// Leaving these behind means the next account to log in on this device never
// registers its token and silently receives no ride notifications.
const PUSH_LAST_BROWSER_KEY = 'lastBrowserFcmRegistration';
const PUSH_LAST_NATIVE_KEY = 'lastNativeFcmRegistration';
const PUSH_PENDING_NATIVE_KEY = 'pendingNativeFcmRegistration';

const resetPushRegistration = () => {
  // Re-arm the native bridge: the device token stays valid across logout, so
  // keep it but drop the role binding. `inferRole` then resolves the role from
  // whoever logs in next, and the bridge's focus/visibilitychange retry
  // re-submits it against the new session.
  try {
    const last = JSON.parse(localStorage.getItem(PUSH_LAST_NATIVE_KEY) || 'null');

    if (last?.token) {
      localStorage.setItem(PUSH_PENDING_NATIVE_KEY, JSON.stringify({
        token: last.token,
        role: '',
        platform: last.platform || 'mobile',
        updatedAt: new Date().toISOString(),
      }));
    }
  } catch {}

  [PUSH_LAST_BROWSER_KEY, PUSH_LAST_NATIVE_KEY].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  });
};

export const clearAllAuth = () => {
  AUTH_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  });

  resetPushRegistration();
};

export default clearAllAuth;
