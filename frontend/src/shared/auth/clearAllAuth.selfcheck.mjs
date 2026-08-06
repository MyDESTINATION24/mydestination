// Run: node src/shared/auth/clearAllAuth.selfcheck.mjs
//
// Guards the logout contract: credentials must be gone, and push registration
// must be re-armed so the NEXT account to log in on this device registers its
// token. Getting the second part wrong is silent -- the driver looks online and
// simply never receives a ride.
import assert from 'node:assert/strict';

const makeStore = (seed = {}) => {
  const data = { ...seed };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
};

globalThis.localStorage = makeStore({
  token: 'user-jwt',
  driverToken: 'driver-jwt',
  lastBrowserFcmRegistration: JSON.stringify({ role: 'driver', token: 'DEVICE_TOKEN' }),
  lastNativeFcmRegistration: JSON.stringify({ token: 'DEVICE_TOKEN', platform: 'mobile' }),
});
globalThis.sessionStorage = makeStore({ driverToken: 'driver-jwt-mirror' });

const { clearAllAuth } = await import('./clearAllAuth.js');
clearAllAuth();

const ls = globalThis.localStorage;

// 1. credentials gone from BOTH stores (the driver flow mirrors into sessionStorage)
assert.equal(ls.getItem('token'), null, 'user token should be cleared');
assert.equal(ls.getItem('driverToken'), null, 'driver token should be cleared');
assert.equal(globalThis.sessionStorage.getItem('driverToken'), null, 'sessionStorage mirror should be cleared');

// 2. the browser skip-guard is gone, so the next login re-registers
assert.equal(ls.getItem('lastBrowserFcmRegistration'), null, 'browser skip-guard must not survive logout');
assert.equal(ls.getItem('lastNativeFcmRegistration'), null, 'native last-registration must not survive logout');

// 3. the native bridge is re-armed: device token kept, role dropped so the next
//    session's role is inferred and the retry re-submits it.
const pending = JSON.parse(ls.getItem('pendingNativeFcmRegistration'));
assert.equal(pending.token, 'DEVICE_TOKEN', 'device token should be carried into pending');
assert.equal(pending.role, '', 'role must be dropped so the next login re-infers it');
assert.equal(pending.platform, 'mobile', 'platform should be preserved');

// 4. nothing to re-arm when there was no native token
globalThis.localStorage = makeStore({ token: 'x' });
globalThis.sessionStorage = makeStore();
clearAllAuth();
assert.equal(globalThis.localStorage.getItem('pendingNativeFcmRegistration'), null, 'no phantom pending registration');

console.log('clearAllAuth selfcheck: PASS');
