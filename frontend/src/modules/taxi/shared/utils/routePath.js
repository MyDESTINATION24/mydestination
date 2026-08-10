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

// Index of the path point the vehicle is currently closest to.
export const nearestIndexOnPath = (path = [], position) => {
  if (!Array.isArray(path) || path.length === 0 || !position) {
    return -1;
  }

  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < path.length; index += 1) {
    const distance = distanceMeters(position, path[index]);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
};

export const distanceToPathMeters = (path = [], position) => {
  const index = nearestIndexOnPath(path, position);
  return index === -1 ? Infinity : distanceMeters(position, path[index]);
};

// Drop the stretch already driven and start the line at the vehicle, so the
// route visibly shortens instead of being redrawn from the original origin.
export const trimPathToPosition = (path = [], position) => {
  if (!Array.isArray(path) || path.length < 2 || !position) {
    return path;
  }

  const index = nearestIndexOnPath(path, position);

  if (index === -1) {
    return path;
  }

  const remaining = path.slice(index + 1);

  // Near the destination there is nothing left to draw ahead of the vehicle.
  if (remaining.length === 0) {
    return [position, path[path.length - 1]];
  }

  return [position, ...remaining];
};

export default trimPathToPosition;
