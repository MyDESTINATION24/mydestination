import mongoose from 'mongoose';
import { verifyPhonePeWebhook, getPhonePeOrderStatus } from './phonepeCheckout.js';

/**
 * One PhonePe webhook for every app: POST /api/payments/phonepe/webhook
 *
 * Payments are normally confirmed when the customer returns from PhonePe and
 * the app asks the server to check the order. If they close the app first,
 * nothing confirmed the payment. This webhook runs that same confirmation.
 *
 * Nothing in the webhook body is trusted beyond the order id: the order status
 * is fetched from PhonePe again, the owner comes from our own records, and each
 * flow's existing verify handler does the work, so its ownership, amount and
 * exactly-once checks all still apply.
 */

// Minimal req/res so the existing express handlers can run in-process.
const runHandler = async (handler, req) => {
  const result = { status: 200, body: null };
  const res = {
    status(code) { result.status = code; return res; },
    json(body) { result.body = body; return res; },
    send(body) { result.body = body; return res; },
    setHeader() { return res; },
  };
  await handler({ headers: {}, query: {}, params: {}, body: {}, ...req }, res);
  return result;
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const settleOrder = async (merchantOrderId) => {
  const id = String(merchantOrderId);

  // Wedding: BOOKING_<enquiry>_<uuid8>, SUBSCRIPTION_<vendor>_<uuid8>, WALLET_<vendor>_<uuid8>
  if (/^(BOOKING|SUBSCRIPTION|WALLET)_[a-f0-9]{24}_[a-f0-9]{8}$/i.test(id)) {
    const { verifyPaymentStatus } = await import('../modules/wedding/controllers/weddingPaymentController.js');
    return runHandler(verifyPaymentStatus, { params: { orderId: id } });
  }

  // Hotel customer/partner wallet top-up: WALLET_<userId>_<13-digit ms>
  const hotelWallet = id.match(/^WALLET_([a-f0-9]{24})_(\d{13})$/i);
  if (hotelWallet) {
    const { verifyAddMoneyPayment } = await import('../modules/user/controllers/walletController.js');
    const { default: User } = await import('../modules/user/models/User.js');
    const { default: Partner } = await import('../modules/partner/models/Partner.js');
    const owner = (await User.findById(hotelWallet[1])) || (await Partner.findById(hotelWallet[1]));
    if (!owner) return { status: 404, body: { message: 'Wallet owner not found' } };
    return runHandler(verifyAddMoneyPayment, { user: owner, body: { phonepe_txn_id: id } });
  }

  // Hotel booking: BK_<bookingId>_<ms>
  const hotelBooking = id.match(/^BK_([a-f0-9]{24})_\d+$/i);
  if (hotelBooking) {
    const { verifyPayment } = await import('../modules/payment/controllers/paymentController.js');
    const { default: Booking } = await import('../modules/hotel/models/Booking.js');
    const booking = await Booking.findById(hotelBooking[1]).select('userId').lean();
    if (!booking) return { status: 404, body: { message: 'Booking not found' } };
    const { default: User } = await import('../modules/user/models/User.js');
    const owner = await User.findById(booking.userId);
    if (!owner) return { status: 404, body: { message: 'Booking owner not found' } };
    return runHandler(verifyPayment, { user: owner, body: { bookingId: String(booking._id), phonepe_txn_id: id } });
  }

  // Taxi wallets: DWAL... (driver), UWAL... (customer). Owner from the session
  // recorded when the checkout was opened.
  if (/^(DWAL|UWAL)/.test(id)) {
    const { findProcessedPayment } = await import('../modules/taxi/common/models/ProcessedPayment.js');
    const record = await findProcessedPayment({ provider: 'phonepe', paymentId: id });
    const ownerId = String(record?.ownerId || '');
    if (!isObjectId(ownerId)) return { status: 404, body: { message: 'Payment session not found' } };
    if (id.startsWith('DWAL')) {
      const { verifyDriverPhonePeWalletTopup } = await import('../modules/taxi/driver/controllers/driverController.js');
      return runHandler(verifyDriverPhonePeWalletTopup, {
        params: { merchantTransactionId: id },
        auth: { sub: ownerId, role: 'driver' },
      });
    }
    const { verifyPhonePeWalletTopup } = await import('../modules/taxi/user/controllers/userController.js');
    return runHandler(verifyPhonePeWalletTopup, {
      params: { merchantTransactionId: id },
      auth: { sub: ownerId, role: 'user' },
    });
  }

  // Flights/tours (UAIR/UTOUR) need the traveller details the app sends with
  // its own verify call, so they are confirmed when the customer returns.
  return { status: 202, body: { message: 'Order type is confirmed by the app on return' } };
};

export const phonePeWebhookHandler = async (req, res) => {
  const auth = verifyPhonePeWebhook(req.headers.authorization || '');
  if (!auth.configured) {
    console.error('[PhonePe webhook] PHONEPE_WEBHOOK_USERNAME/PASSWORD not set; refusing.');
    return res.status(503).json({ success: false, message: 'Webhook not configured' });
  }
  if (!auth.valid) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = String(req.body?.event || req.body?.type || '');
  const payload = req.body?.payload || {};
  const merchantOrderId = String(payload.merchantOrderId || payload.originalMerchantOrderId || '').trim();

  // Acknowledge quickly; PhonePe retries on non-2xx.
  res.status(200).json({ success: true });

  if (!merchantOrderId) return;
  try {
    // Re-check with PhonePe instead of trusting the event.
    const status = await getPhonePeOrderStatus(merchantOrderId);
    if (String(status.state || '').toUpperCase() !== 'COMPLETED') {
      console.log(`[PhonePe webhook] ${event} ${merchantOrderId}: state ${status.state}, nothing to settle`);
      return;
    }
    const result = await settleOrder(merchantOrderId);
    console.log(`[PhonePe webhook] ${event} ${merchantOrderId}: settle -> ${result.status} ${result.body?.message || ''}`);
  } catch (error) {
    console.error(`[PhonePe webhook] ${merchantOrderId} failed:`, error.message);
  }
};
