import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentDetails,
  processRefund
} from '../controllers/paymentController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import { paymentLimiter } from '../../../middlewares/rateLimiters.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', protect, paymentLimiter, createPaymentOrder);

// Verify payment
router.post('/verify', protect, paymentLimiter, verifyPayment);

// Razorpay webhook (no auth needed, signature verified)
router.post('/webhook', handleWebhook);

// Get payment details
// Admin only: this returns the raw gateway record (payer contact, card/UPI
// details) for any payment id, so any logged-in user could read anyone's.
router.get('/:paymentId', protect, authorizedRoles('admin', 'superadmin'), getPaymentDetails);

// Process refund
// Admin only: any logged-in user could cancel and refund any booking, and the
// partner/admin payouts were never reversed. Customers cancel via /bookings.
router.post('/refund/:bookingId', protect, authorizedRoles('admin', 'superadmin'), processRefund);

export default router;

