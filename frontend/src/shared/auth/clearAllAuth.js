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

export const clearAllAuth = () => {
  AUTH_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  });
};

export default clearAllAuth;
