import express from 'express';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import { bookingCreateLimiter, bookingCancelLimiter, paymentLimiter } from '../../../middlewares/rateLimiters.js';
import {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  cancelBooking,
  getPartnerBookingDetail,
  markBookingAsPaid,
  markBookingNoShow,
  markCheckIn,
  markCheckOut,
  getBookingDetail,
  downloadReceipt
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', protect, bookingCreateLimiter, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/partner', protect, authorizedRoles('partner', 'admin'), getPartnerBookings);
router.get('/:id/partner-detail', protect, authorizedRoles('partner', 'admin'), getPartnerBookingDetail); // Specific for partners
router.get('/:id', protect, getBookingDetail); // General detail (User)
router.put('/:id/mark-paid', protect, authorizedRoles('partner', 'admin'), paymentLimiter, markBookingAsPaid);
router.put('/:id/no-show', protect, authorizedRoles('partner', 'admin'), paymentLimiter, markBookingNoShow);
router.put('/:id/check-in', protect, authorizedRoles('partner', 'admin'), markCheckIn);
router.put('/:id/check-out', protect, authorizedRoles('partner', 'admin'), markCheckOut);
router.post('/:id/cancel', protect, bookingCancelLimiter, cancelBooking);
router.get('/:id/receipt', protect, downloadReceipt);

export default router;

