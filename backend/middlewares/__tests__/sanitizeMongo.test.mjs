// Run: node middlewares/__tests__/sanitizeMongo.test.mjs
import assert from 'node:assert/strict';
import { sanitizeMongo, __sanitizeValue as strip } from '../sanitizeMongo.js';

// Operators are removed, leaving the object safe to hand to Mongo.
assert.deepEqual(strip({ email: { $ne: null } }), { email: {} });
assert.deepEqual(strip({ $where: 'sleep(1)' }), {});
assert.deepEqual(strip({ 'a.b': 1, ok: 2 }), { ok: 2 }); // dotted-path key dropped

// Nested and arrays.
assert.deepEqual(strip({ a: { b: { $gt: '' } } }), { a: { b: {} } });
assert.deepEqual(strip({ list: [{ $ne: 1 }, { keep: 3 }] }), { list: [{}, { keep: 3 }] });

// Legit values survive untouched, including a password that merely contains '$'.
assert.deepEqual(strip({ email: 'a@b.com', password: 'p$ssw0rd' }), { email: 'a@b.com', password: 'p$ssw0rd' });
assert.deepEqual(strip({ phone: '7610416911', otp: '0000' }), { phone: '7610416911', otp: '0000' });

// Middleware form mutates body/params in place and calls next().
let called = false;
const req = { body: { email: { $ne: null }, name: 'ok' }, params: { id: { $gt: '' } } };
sanitizeMongo(req, {}, () => { called = true; });
assert.equal(called, true);
assert.deepEqual(req.body, { email: {}, name: 'ok' });
assert.deepEqual(req.params, { id: {} });

console.log('sanitizeMongo: all assertions passed');
