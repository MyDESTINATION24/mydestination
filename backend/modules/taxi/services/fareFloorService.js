import { resolveSetPriceForRide } from './rideService.js';

// The client sends the fare it displayed, and the server used to store it
// verbatim -- so a crafted request could book any distance for almost nothing.
//
// This derives a LOWER BOUND the server can prove, using straight-line distance
// between the two points. Real road distance is always >= straight-line, so a
// legitimate quote can never fall below this and no honest booking is rejected.
// It is a floor, not a re-quote: it stops gross underpricing, it does not
// replace the pricing engine.

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Small allowance so rounding in the client's quote never trips the floor.
const TOLERANCE = 0.95;

const straightLineKm = (from, to) => {
  if (!from || !to) return 0;

  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  if (![lng1, lat1, lng2, lat2].every((n) => Number.isFinite(Number(n)))) {
    return 0;
  }

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.sin(dLng / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

// Returns the minimum acceptable fare, or 0 when no rule applies (in which case
// nothing is enforced -- absence of pricing config must not block bookings).
export const computeMinimumFare = async ({
  pickupCoords,
  dropCoords,
  transportType = 'taxi',
  vehicleTypeId = null,
  serviceLocationId = null,
}) => {
  const pricingRule = await resolveSetPriceForRide({
    serviceLocationId,
    transportType,
    vehicleTypeId,
  });

  if (!pricingRule) {
    return 0;
  }

  const basePrice = Number(pricingRule.base_price || 0);
  const baseDistance = Number(pricingRule.base_distance || 0);
  const perKm = Number(pricingRule.price_per_distance || 0);

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return 0;
  }

  const km = straightLineKm(pickupCoords, dropCoords);
  const chargeableKm = Math.max(0, km - baseDistance);
  const minimum = basePrice + (Number.isFinite(perKm) ? chargeableKm * perKm : 0);

  return Math.floor(minimum * TOLERANCE);
};

export const assertFareMeetsFloor = async ({ fare, ...context }) => {
  const minimum = await computeMinimumFare(context);

  if (minimum > 0 && Number(fare) < minimum) {
    return { ok: false, minimum };
  }

  return { ok: true, minimum };
};
