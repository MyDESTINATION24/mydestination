// Run: node modules/taxi/admin/models/tourPricing.test.js
import assert from 'node:assert/strict';
import { calculateTourFare, getTourDurationDays } from './Tour.js';

// the explicit field wins over anything in the text
assert.equal(getTourDurationDays({ durationDays: 6, duration: '2 Days' }), 6);
assert.equal(getTourDurationDays({ durationDays: 7, duration: '06/05' }), 7);
// 0 / absent means "fall back to parsing the text"
assert.equal(getTourDurationDays({ durationDays: 0, duration: '3 Days' }), 3);
// the format that caused the bug: unparseable, so it needs the explicit field
assert.equal(getTourDurationDays({ duration: '06/05' }), 1);
assert.equal(
  calculateTourFare({ price: 50000, priceType: 'per_day', duration: '06/05', durationDays: 6 }, 1).subtotal,
  300000,
);

// day extraction from the free-text duration field
assert.equal(getTourDurationDays({ duration: '6 Days / 5 Nights' }), 6);
assert.equal(getTourDurationDays({ duration: '2Day' }), 2);
assert.equal(getTourDurationDays({ duration: 'Weekend', itinerary: [{}, {}, {}] }), 3);
assert.equal(getTourDurationDays({ duration: '' }), 1);

// per_day multiplies by days AND passengers; 5% GST rounded
const perDay = calculateTourFare(
  { price: 10000, priceType: 'per_day', duration: '3 Days' },
  2
);
assert.deepEqual(perDay, { subtotal: 60000, tax: 3000, total: 63000 });

// flat total ignores day count
const flat = calculateTourFare(
  { price: 8500, priceType: 'total', duration: '3 Days' },
  2
);
assert.deepEqual(flat, { subtotal: 17000, tax: 850, total: 17850 });

// the attack this replaced: a hostile numberOfPassengers must not zero the fare
for (const hostile of [0, -5, 'free', null, undefined, NaN, 0.4]) {
  const { total } = calculateTourFare({ price: 8500, priceType: 'total' }, hostile);
  assert.equal(total, 8925, `passengers=${hostile} must still charge one passenger`);
}

// a negative price on the tour itself cannot produce a negative fare
assert.equal(calculateTourFare({ price: -100, priceType: 'total' }, 1).total, 0);

console.log('tourPricing: ok');
