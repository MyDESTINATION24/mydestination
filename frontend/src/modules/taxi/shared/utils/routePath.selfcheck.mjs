// Run: node src/modules/taxi/shared/utils/routePath.selfcheck.mjs
import assert from 'node:assert/strict';
import {
  distanceMeters,
  distanceToPathMeters,
  extractDetailedPath,
  findNearestOnPath,
  nearestIndexOnPath,
  trimPathToPosition,
} from './routePath.js';

// A straight west->east path; 0.001 deg lng is ~111m at the equator.
const path = [
  { lat: 0, lng: 0.000 },
  { lat: 0, lng: 0.001 },
  { lat: 0, lng: 0.002 },
  { lat: 0, lng: 0.003 },
];

const d = distanceMeters(path[0], path[1]);
assert.ok(d > 100 && d < 120, `expected ~111m, got ${d}`);

// --- segment projection (the thing that makes trimming smooth) ---------------
// A point halfway between two vertices must measure as ON the route, not as far
// away as the nearest vertex. Vertex-only matching would report ~55m here.
const midway = { lat: 0, lng: 0.0015 };
assert.ok(distanceToPathMeters(path, midway) < 1, 'midpoint should lie on the route');

// A point perpendicular to the middle of a segment measures its true offset.
const offset = { lat: 0.0001, lng: 0.0015 };
const offsetDistance = distanceToPathMeters(path, offset);
assert.ok(offsetDistance > 5 && offsetDistance < 20, `expected ~11m, got ${offsetDistance}`);

// The projected foot lands on the segment, not on a vertex.
const nearest = findNearestOnPath(path, offset);
assert.equal(nearest.index, 1, 'should match the segment, not a vertex index');
assert.ok(Math.abs(nearest.point.lng - 0.0015) < 1e-9, 'foot should be mid-segment');

assert.equal(nearestIndexOnPath([], { lat: 0, lng: 0 }), -1);

// --- trimming ---------------------------------------------------------------
const here = { lat: 0, lng: 0.00105 };
const trimmed = trimPathToPosition(path, here);
assert.deepEqual(trimmed[0], here, 'line must start at the vehicle');
assert.deepEqual(trimmed[trimmed.length - 1], path[3], 'destination must survive');
assert.ok(
  trimmed.every((point) => point === here || point.lng > 0.00105),
  'no point behind the vehicle should remain',
);

// Progress along the route must shorten the line monotonically.
const lengths = [0.0005, 0.0012, 0.0021, 0.0028]
  .map((lng) => trimPathToPosition(path, { lat: 0, lng }).length);
assert.deepEqual([...lengths].sort((a, b) => b - a), lengths, `expected shrinking, got ${lengths}`);

// At the destination there is still a drawable segment, never a 1-point line.
assert.ok(trimPathToPosition(path, { lat: 0, lng: 0.003 }).length >= 2);

// Degenerate inputs pass through untouched.
assert.deepEqual(trimPathToPosition([], here), []);
assert.deepEqual(trimPathToPosition(path, null), path);

// Duplicate consecutive points must not divide by zero.
assert.ok(findNearestOnPath([{ lat: 0, lng: 0 }, { lat: 0, lng: 0 }], here));

// --- detailed path extraction ------------------------------------------------
const fakeRoute = {
  legs: [{
    steps: [
      { path: [{ lat: 1, lng: 1 }, { lat: 1, lng: 2 }] },
      // steps repeat the shared boundary point; it must be de-duplicated
      { path: [{ lat: 1, lng: 2 }, { lat: 1, lng: 3 }] },
    ],
  }],
  overview_path: [{ lat: 9, lng: 9 }, { lat: 9, lng: 8 }],
};
const detailed = extractDetailedPath(fakeRoute);
assert.equal(detailed.length, 3, `expected de-duplicated 3 points, got ${detailed.length}`);
assert.deepEqual(detailed[2], { lat: 1, lng: 3 });

// Falls back to overview_path when steps are missing, and supports the
// LatLng-object form Google actually returns.
const overviewOnly = extractDetailedPath({
  overview_path: [{ lat: () => 5, lng: () => 6 }, { lat: () => 5, lng: () => 7 }],
});
assert.deepEqual(overviewOnly[0], { lat: 5, lng: 6 });

console.log('routePath selfcheck: PASS');
