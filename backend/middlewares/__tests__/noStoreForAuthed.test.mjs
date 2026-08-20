// Run: node middlewares/__tests__/noStoreForAuthed.test.mjs
import assert from 'node:assert/strict';
import { noStoreForAuthed } from '../noStoreForAuthed.js';

const run = (headers) => {
  const sent = {};
  const res = { set: (k, v) => { sent[k] = v; } };
  let nexted = false;
  noStoreForAuthed({ headers }, res, () => { nexted = true; });
  return { sent, nexted };
};

// Authenticated responses must never be stored -- this is the stale
// active-ride body that stranded riders on the searching screen.
const authed = run({ authorization: 'Bearer abc' });
assert.equal(authed.sent['Cache-Control'], 'no-store, no-cache, must-revalidate');
assert.equal(authed.sent.Pragma, 'no-cache');
assert.equal(authed.nexted, true);

// Public responses keep their existing caching behaviour.
const anon = run({});
assert.equal(anon.sent['Cache-Control'], undefined);
assert.equal(anon.nexted, true);

// Header casing from Node is always lowercase, but be explicit about it.
assert.equal(run({ authorization: '' }).sent['Cache-Control'], undefined);

console.log('noStoreForAuthed: all assertions passed');
