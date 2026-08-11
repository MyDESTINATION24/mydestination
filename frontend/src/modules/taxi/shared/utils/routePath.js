// Helpers for keeping a drawn route stable while the vehicle moves along it.
//
// Re-requesting directions on every location fix replaces the whole path with a
// slightly different one, which makes the line snap. Instead: request once, then
// trim the travelled part away as the vehicle advances, and only re-request when
// the vehicle has actually left the route.

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

export const distanceMeters = (from, to) => {
  if (!from || !to) {
    return Infinity;
  }

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a = Math.sin(dLat / 2) ** 2
    + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Over a city-sized route, treating lat/lng as a plane (with lng squashed by
// cos(lat)) is accurate enough to pick the closest segment, and it is far
// cheaper than haversine -- this runs across the whole path every frame.
const projectOnSegment = (point, start, end, lngScale) => {
  const ax = start.lng * lngScale;
  const ay = start.lat;
  const bx = end.lng * lngScale;
  const by = end.lat;
  const px = point.lng * lngScale;
  const py = point.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;

  // Degenerate segment (duplicate points): treat as the start vertex.
  if (lengthSq === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return { t: 0, distanceSq: ex * ex + ey * ey, point: start };
  }

  // How far along the segment the perpendicular foot falls, clamped so the
  // result never leaves the segment.
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;

  return {
    t,
    distanceSq: ex * ex + ey * ey,
    point: { lat: cy, lng: cx / lngScale },
  };
};

// Closest point anywhere ON the route (not just at a vertex), plus the index of
// the segment it fell on. Projecting onto segments is what makes the line
// shorten continuously rather than in vertex-sized jumps.
export const findNearestOnPath = (path = [], position) => {
  if (!Array.isArray(path) || path.length === 0 || !position) {
    return null;
  }

  if (path.length === 1) {
    return { index: 0, point: path[0], t: 0 };
  }

  const lngScale = Math.cos(toRad(position.lat)) || 1;
  let best = null;

  for (let index = 0; index < path.length - 1; index += 1) {
    const candidate = projectOnSegment(position, path[index], path[index + 1], lngScale);

    if (!best || candidate.distanceSq < best.distanceSq) {
      best = { ...candidate, index };
    }
  }

  return best;
};

export const nearestIndexOnPath = (path = [], position) => {
  const nearest = findNearestOnPath(path, position);
  return nearest ? nearest.index : -1;
};

export const distanceToPathMeters = (path = [], position) => {
  const nearest = findNearestOnPath(path, position);
  return nearest ? distanceMeters(position, nearest.point) : Infinity;
};

// Drop the stretch already driven and start the line at the vehicle, so the
// route visibly shortens instead of being redrawn from the original origin.
export const trimPathToPosition = (path = [], position) => {
  if (!Array.isArray(path) || path.length < 2 || !position) {
    return path;
  }

  const nearest = findNearestOnPath(path, position);

  if (!nearest) {
    return path;
  }

  // Everything from the end of the segment we are on. The projected foot is not
  // re-added: the vehicle marker sits on it, and starting the line at the
  // vehicle's own position keeps the two visually joined.
  const remaining = path.slice(nearest.index + 1);

  if (remaining.length === 0) {
    return [position, path[path.length - 1]];
  }

  return [position, ...remaining];
};

// Google's overview_path is decimated and visibly cuts corners. The per-step
// paths are the full-resolution geometry, which is what makes the line sit on
// the road the way Uber/Ola do.
export const extractDetailedPath = (route) => {
  const steps = route?.legs?.flatMap((leg) => leg?.steps || []) || [];
  const detailed = [];

  for (const step of steps) {
    const points = step?.path || step?.lat_lngs || [];

    for (const point of points) {
      const lat = typeof point?.lat === 'function' ? point.lat() : point?.lat;
      const lng = typeof point?.lng === 'function' ? point.lng() : point?.lng;

      if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
        continue;
      }

      const last = detailed[detailed.length - 1];

      // Steps repeat their shared boundary point.
      if (last && last.lat === Number(lat) && last.lng === Number(lng)) {
        continue;
      }

      detailed.push({ lat: Number(lat), lng: Number(lng) });
    }
  }

  if (detailed.length > 1) {
    return detailed;
  }

  // Fall back to the coarse overview if steps are unavailable.
  return (route?.overview_path || []).map((point) => ({
    lat: typeof point.lat === 'function' ? point.lat() : point.lat,
    lng: typeof point.lng === 'function' ? point.lng() : point.lng,
  }));
};

export default trimPathToPosition;
