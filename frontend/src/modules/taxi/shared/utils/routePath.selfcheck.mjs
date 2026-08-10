// Run: node src/modules/taxi/shared/utils/routePath.selfcheck.mjs
import assert from 'node:assert/strict';
import { distanceMeters, distanceToPathMeters, nearestIndexOnPath, trimPathToPosition } from './routePath.js';

// A straight west->east path, ~111m apart per 0.001 lng at the equator.
const path = [
  { lat: 0, lng: 0.000 },
  { lat: 0, lng: 0.001 },
  { lat: 0, lng: 0.002 },
  { lat: 0, lng: 0.003 },
];

// distance sanity: 0.001 deg lng at equator is ~111m
const d = distanceMeters(path[0], path[1]);
assert.ok(d > 100 && d < 120, `expected ~111m, got ${d}`);

// nearest index picks the closest vertex
assert.equal(nearestIndexOnPath(path, { lat: 0, lng: 0.00201 }), 2);
assert.equal(nearestIndexOnPath([], { lat: 0, lng: 0 }), -1);

// off-route detection
assert.ok(distanceToPathMeters(path, { lat: 0, lng: 0.0015 }) < 60, 'on-route point should be close');
assert.ok(distanceToPathMeters(path, { lat: 0.01, lng: 0.0015 }) > 60, 'far point should read as off-route');

// trimming drops what is already driven and starts at the vehicle
const here = { lat: 0, lng: 0.00105 };
const trimmed = trimPathToPosition(path, here);
assert.deepEqual(trimmed[0], here, 'line must start at the vehicle');
assert.deepEqual(trimmed[trimmed.length - 1], path[3], 'destination must survive');
assert.ok(trimmed.length < path.length + 1, 'trimmed path should not grow');
assert.ok(
  trimmed.every((point) => point === here || point.lng >= 0.001),
  'no point behind the vehicle should remain',
);

// at the destination there is still a drawable segment, never a 1-point line
const atEnd = trimPathToPosition(path, { lat: 0, lng: 0.003 });
assert.ok(atEnd.length >= 2, 'must keep at least two points to draw');

// degenerate inputs pass through untouched
assert.deepEqual(trimPathToPosition([], here), []);
assert.deepEqual(trimPathToPosition(path, null), path);

console.log('routePath selfcheck: PASS');
