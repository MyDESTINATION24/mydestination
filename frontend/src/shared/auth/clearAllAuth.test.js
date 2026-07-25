// Run: node src/shared/auth/clearAllAuth.test.js
import assert from 'node:assert/strict';

const makeStore = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

globalThis.localStorage = makeStore();
globalThis.sessionStorage = makeStore();

const { clearAllAuth } = await import('./clearAllAuth.js');

localStorage.setItem('token', 'user-jwt');
localStorage.setItem('adminToken', 'admin-jwt');
localStorage.setItem('vendor_token', 'vendor-jwt');
localStorage.setItem('driverToken', 'driver-jwt');
// the one that caused "logout ke baad ID open hai": the driver token is
// mirrored into sessionStorage, which localStorage.clear() never touched.
sessionStorage.setItem('driverToken', 'driver-jwt');
sessionStorage.setItem('driverRole', 'pooling');
localStorage.setItem('driver_lang', 'hindi'); // non-auth key, must survive

clearAllAuth();

assert.equal(localStorage.getItem('token'), null);
assert.equal(localStorage.getItem('adminToken'), null);
assert.equal(localStorage.getItem('vendor_token'), null);
assert.equal(localStorage.getItem('driverToken'), null);
assert.equal(sessionStorage.getItem('driverToken'), null, 'sessionStorage driver token must be cleared');
assert.equal(sessionStorage.getItem('driverRole'), null, 'sessionStorage driver role must be cleared');
assert.equal(localStorage.getItem('driver_lang'), 'hindi', 'non-auth keys must be preserved');

console.log('clearAllAuth: ok');
