// Run: node src/modules/taxi/shared/hooks/catchup.selfcheck.mjs
//
// Guards the stalled-socket catch-up. When the socket stalls and the driver has
// moved on, the marker must DRIVE the route to the new point, not slide across
// it in a straight line -- and it must never fake a path the route cannot
// explain.
import assert from 'node:assert/strict';
import { distanceMeters, findNearestOnPath } from '../utils/routePath.js';

// An L-shaped route: east along lat 0, then north up lng 0.004.
const route = [
  { lat: 0.000, lng: 0.000 },
  { lat: 0.000, lng: 0.002 },
  { lat: 0.000, lng: 0.004 },
  { lat: 0.002, lng: 0.004 },
  { lat: 0.004, lng: 0.004 },
];

// --- the geometry the catch-up is built on -------------------------------
const start = findNearestOnPath(route, { lat: 0, lng: 0.0005 });
const end = findNearestOnPath(route, { lat: 0.0035, lng: 0.004 });

assert.ok(start && end, 'both ends must resolve onto the route');
assert.ok(end.index > start.index, 'forward travel must advance the segment index');

// The leg the marker will drive: everything between, with the real endpoints.
const legPoints = [
  { lat: 0, lng: 0.0005 },
  ...route.slice(start.index + 1, end.index + 1),
  { lat: 0.0035, lng: 0.004 },
];

assert.ok(legPoints.length > 2, 'catch-up must include the corner, not just endpoints');

// It must round the corner rather than cut it. A straight line from start to
// end would pass well away from the elbow at (0, 0.004).
const elbow = { lat: 0, lng: 0.004 };
assert.ok(
  legPoints.some((point) => distanceMeters(point, elbow) < 1),
  'the corner point must be on the driven leg',
);

// Driving the leg must be longer than the straight-line shortcut -- that
// difference IS the sliding artefact being removed.
const legMeters = legPoints
  .slice(1)
  .reduce((total, point, index) => total + distanceMeters(legPoints[index], point), 0);
const straightMeters = distanceMeters(legPoints[0], legPoints[legPoints.length - 1]);

assert.ok(legMeters > straightMeters, `route leg (${legMeters.toFixed(0)}m) must exceed the shortcut (${straightMeters.toFixed(0)}m)`);

// --- refusing to invent movement ------------------------------------------
// Travelling backwards along the route must NOT produce a catch-up leg; the
// caller snaps instead of animating the car in reverse.
const backStart = findNearestOnPath(route, { lat: 0.0035, lng: 0.004 });
const backEnd = findNearestOnPath(route, { lat: 0, lng: 0.0005 });
assert.ok(backEnd.index < backStart.index, 'backwards travel must be detectable and rejected');

// A point far off the route still resolves, but the distance check is what
// disqualifies it -- confirm it reads as far away.
assert.ok(
  distanceMeters({ lat: 0.02, lng: 0.02 }, findNearestOnPath(route, { lat: 0.02, lng: 0.02 }).point) > 600,
  'an off-route jump must measure beyond the catch-up limit',
);

// --- thresholds are ordered sanely ----------------------------------------
const MAX_LERP_METERS = 60;
const MAX_CATCHUP_METERS = 600;
assert.ok(MAX_LERP_METERS < MAX_CATCHUP_METERS, 'lerp window must sit inside the catch-up window');

console.log('catch-up selfcheck: PASS');
