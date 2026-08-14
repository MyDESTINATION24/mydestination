// Run: node src/modules/taxi/shared/utils/vehicleIconHeading.selfcheck.mjs
//
// A vehicle rotated 90 degrees off its direction of travel reads as sliding
// sideways. Uploads do not share one orientation, so the offset is derived from
// each image's own proportions -- these are the real files in production.
import assert from 'node:assert/strict';
import { resolveIconHeadingOffset, CUSTOM_MAP_ICON_HEADING_OFFSET } from './vehicleIconHeading.js';

const BUNDLED = ['/assets/car.png', '/assets/bike.png'];
const UPLOAD = 'https://res.cloudinary.com/x/upload/vehicle.webp';

// Bundled artwork is drawn nose-up and must never be rotated, whatever shape.
assert.equal(resolveIconHeadingOffset('/assets/bike.png', BUNDLED, 3.0), 0, 'bundled art must never be offset');
assert.equal(resolveIconHeadingOffset(null, BUNDLED, 3.0), 0, 'missing icon falls back to bundled behaviour');

// The real uploaded Bike icon: 173x330, portrait -> drawn nose-up -> no offset.
// This is the case the old blanket +90 got wrong, and why the bike crabbed.
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, 173 / 330), 0, 'portrait upload is nose-up');

// The real uploaded Auto icon: 1536x1024, landscape -> drawn nose-left.
assert.equal(
  resolveIconHeadingOffset(UPLOAD, BUNDLED, 1536 / 1024),
  CUSTOM_MAP_ICON_HEADING_OFFSET,
  'landscape upload is nose-sideways',
);

// Before the image loads there is no ratio; assume nose-up rather than apply a
// quarter turn that cannot be justified.
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, null), 0, 'unmeasured icon must not be rotated');
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, 0), 0, 'degenerate ratio must not be rotated');

// Near-square art carries no reliable signal.
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, 1.0), 0, 'square art stays unrotated');
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, 1.05), 0, 'marginally wide art stays unrotated');

// Clearly landscape does rotate.
assert.equal(resolveIconHeadingOffset(UPLOAD, BUNDLED, 2.0), CUSTOM_MAP_ICON_HEADING_OFFSET);

console.log('vehicleIconHeading selfcheck: PASS');
