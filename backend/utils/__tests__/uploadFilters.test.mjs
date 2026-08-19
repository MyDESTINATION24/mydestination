// Run: node utils/__tests__/uploadFilters.test.mjs
import assert from 'node:assert/strict';
import path from 'node:path';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif'];
const hasAllowedExtension = (file, allowed) =>
  allowed.includes(path.extname(file.originalname || '').toLowerCase());

// Mirrors imageFilter in utils/multer.js
const accepts = (file) =>
  file.mimetype.startsWith('image/') && hasAllowedExtension(file, IMAGE_EXTENSIONS);

// The bug: mime type is client-supplied, so an .html claiming image/png passed
// and was hosted as raw HTML.
assert.equal(accepts({ originalname: 'probe.html', mimetype: 'image/png' }), false);
assert.equal(accepts({ originalname: 'shell.php', mimetype: 'image/jpeg' }), false);
assert.equal(accepts({ originalname: 'x.svg', mimetype: 'image/svg+xml' }), false); // svg can carry script

// Real images still work, extension case-insensitively.
assert.equal(accepts({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), true);
assert.equal(accepts({ originalname: 'PHOTO.PNG', mimetype: 'image/png' }), true);
assert.equal(accepts({ originalname: 'pic.webp', mimetype: 'image/webp' }), true);

// A real extension with a non-image mime type is still refused.
assert.equal(accepts({ originalname: 'photo.jpg', mimetype: 'text/html' }), false);
assert.equal(accepts({ originalname: 'noext', mimetype: 'image/png' }), false);

console.log('uploadFilters: all assertions passed');
