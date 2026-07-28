// Run: node modules/taxi/services/paymentClients.test.js
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyRazorpaySignature } from './paymentClients.js';

const keySecret = 'test_secret_key';
const orderId = 'order_ABC123';
const paymentId = 'pay_XYZ789';

const sign = (payload, secret = keySecret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

// the genuine callback Razorpay sends
const valid = sign(`${orderId}|${paymentId}`);
assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: valid, keySecret }), true);

// forgeries that must all be rejected
const rejected = {
  'signed with the wrong secret': sign(`${orderId}|${paymentId}`, 'attacker_secret'),
  'signed over swapped fields': sign(`${paymentId}|${orderId}`),
  'signed over the order only': sign(orderId),
  'one byte flipped': valid.slice(0, -1) + (valid.endsWith('a') ? 'b' : 'a'),
  'truncated': valid.slice(0, 32),
  'empty': '',
};

for (const [name, signature] of Object.entries(rejected)) {
  assert.equal(
    verifyRazorpaySignature({ orderId, paymentId, signature, keySecret }),
    false,
    `must reject a signature ${name}`,
  );
}

// a valid signature for a DIFFERENT order must not authorise this one --
// otherwise one real payment could confirm any number of bookings
const otherOrder = sign(`order_OTHER|${paymentId}`);
assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: otherOrder, keySecret }), false);

// missing/garbage input must not throw (timingSafeEqual dies on length mismatch)
for (const signature of [undefined, null, 0, 'zz']) {
  assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature, keySecret }), false);
}

console.log('paymentClients: ok');
