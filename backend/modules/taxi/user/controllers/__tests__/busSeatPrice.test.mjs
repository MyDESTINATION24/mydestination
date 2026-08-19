// Run: node modules/taxi/user/controllers/__tests__/busSeatPrice.test.mjs
import assert from 'node:assert/strict';

// Mirrors resolveBusSeatPrice in userController.js / adminController.js.
const resolveBusSeatPrice = (busService = {}, seat = {}) => {
  const variantPricing = busService?.variantPricing || {};
  const defaultPrice = Number(busService?.seatPrice || 0);
  const variantKey = String(seat?.variant || 'seat').trim().toLowerCase();

  const resolvedPrice = [variantPricing?.[variantKey], variantPricing?.seat, defaultPrice]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  return resolvedPrice || 0;
};

// The production bug: the schema defaults every variant to 0, which used to
// win over the real seatPrice and made every bus unbookable.
const zeroed = { seatPrice: 899, variantPricing: { seat: 0, window: 0, aisle: 0, sleeper: 0 } };
assert.equal(resolveBusSeatPrice(zeroed, { variant: 'window' }), 899);
assert.equal(resolveBusSeatPrice(zeroed, { variant: 'seat' }), 899);

// A real per-variant price still overrides the base price.
const priced = { seatPrice: 899, variantPricing: { seat: 700, window: 1200 } };
assert.equal(resolveBusSeatPrice(priced, { variant: 'window' }), 1200);
assert.equal(resolveBusSeatPrice(priced, { variant: 'sleeper' }), 700); // falls back to seat

// No variantPricing at all.
assert.equal(resolveBusSeatPrice({ seatPrice: 499 }, { variant: 'window' }), 499);

// Genuinely unconfigured stays 0 so the caller can reject the order.
assert.equal(resolveBusSeatPrice({}, { variant: 'seat' }), 0);

console.log('busSeatPrice: all assertions passed');
