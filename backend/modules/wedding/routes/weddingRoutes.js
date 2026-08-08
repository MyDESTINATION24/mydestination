import express from 'express';
import { 
  registerVendor, 
  sendVendorOtp,
  loginVendor,
  updatePassword,
  getMe
} from '../controllers/weddingAuthController.js';
import { 
  getVenues, 
  getVenueDetail,
  getAdminVenues, 
  updateVenueStatus,
  createVenue,
  getVendorVenues,
  updateVenue,
  deleteVenue
} from '../controllers/weddingVenueController.js';
import {
  getVendorProfile,
  updateVendorProfile,
  applyAsVendor,
  getPublicVendors,
  getVendorDetail,
  getVendorDashboardStats,
  incrementView
} from '../controllers/weddingVendorController.js';
import { 
  getDestinations, 
  getDestinationById,
  addDestination, 
  updateDestination, 
  deleteDestination,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from '../controllers/weddingDestinationController.js';
import { 
  createEnquiry, 
  getAdminEnquiries, 
  updateEnquiryStatus, 
  deleteEnquiry,
  getVendorLeads,
  getLeadById,
  updateLeadStatus,
  getMyEnquiries,
  confirmBooking,
  markVendorPaymentReceived
} from '../controllers/weddingEnquiryController.js';
import { 
  getGallery, 
  addGalleryImage, 
  deleteGalleryImage,
  getRealWeddings,
  addRealWedding,
  deleteRealWedding
} from '../controllers/weddingGalleryController.js';
import {
  submitTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  updateTestimonialStatus,
  deleteTestimonial
} from '../controllers/weddingTestimonialController.js';
import {
  getTickets,
  resolveTicket,
  resolveAllTickets,
  createTicket,
  replyToTicket,
  getTicketById
} from '../controllers/weddingSupportController.js';
import {
  createReview,
  getVendorReviews,
  replyToReview,
  getPublicReviews
} from '../controllers/weddingReviewController.js';
import {
  loginWeddingAdmin,
  seedWeddingAdmin,
  getAdminStats,
  getAdminCustomers,
  getAdminVendors,
  getAdminVendorById,
  updateVendorStatus,
  getAdminFinancials,
  updateCustomerBlockStatus,
  deleteCustomer
} from '../controllers/weddingAdminController.js';
import {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
  purchaseSubscription
} from '../controllers/weddingSubscriptionController.js';
import { getSettings, updateSettings } from '../controllers/weddingPlatformSettingsController.js';
import { getWallet, addMoney } from '../controllers/vendorWalletController.js';
import { protect, authorizedRoles, optionalProtect } from '../../../middlewares/authMiddleware.js';

import {
  initiateBookingPayment,
  initiateSubscriptionPayment,
  initiateWalletTopup,
  paymentCallback,
  verifyPaymentStatus
} from '../controllers/weddingPaymentController.js';

// FCM Token Update (inline handler — no separate controller needed)
import User from '../../user/models/User.js';

const router = express.Router();

// Wedding FCM Token Registration endpoint
// Vendor aur User dono isko call karenge login ke baad
router.put('/fcm-token', protect, async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token required' });
    }

    const targetPlatform = platform === 'app' ? 'app' : 'web';
    const tokenField = `fcmTokens.${targetPlatform}`;

    // Remove this token from any other user to prevent duplicate delivery
    await User.updateMany(
      { [tokenField]: fcmToken, _id: { $ne: req.user._id } },
      { $set: { [tokenField]: null } }
    );

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.fcmTokens) user.fcmTokens = { app: null, web: null };
    user.fcmTokens[targetPlatform] = fcmToken;
    await user.save();

    console.log(`[WeddingFCM] ${user.role} ${user._id} FCM token saved (${targetPlatform}).`);
    res.json({ success: true, message: `FCM token saved for ${targetPlatform}` });
  } catch (error) {
    console.error('[WeddingFCM] FCM token update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public Routes
router.get('/categories', getCategories);
router.get('/destinations', getDestinations);
router.get('/destinations/:id', getDestinationById);
router.get('/venues', getVenues);
router.get('/venues/:id', getVenueDetail);
router.post('/enquiry', optionalProtect, createEnquiry);
router.get('/gallery', getGallery);
router.get('/real-weddings', getRealWeddings);
router.get('/vendors', getPublicVendors);
router.get('/vendors/:id', getVendorDetail);
router.get('/testimonials', getApprovedTestimonials);
router.post('/testimonials', submitTestimonial);
router.post('/support', createTicket);
router.get('/support/:ticketId', getTicketById);
router.get('/subscriptions', optionalProtect, getAllPlans);

// Public Vendor Application (No auth required)
router.post('/vendor/apply', applyAsVendor);
router.patch('/increment-view/:type/:id', incrementView);

// Public Review Routes
router.get('/reviews/:targetId', getPublicReviews);
router.post('/reviews', optionalProtect, createReview);
router.get('/my-enquiries', protect, getMyEnquiries);
router.post('/enquiries/:id/pay-and-book', protect, confirmBooking);

// Auth Routes (Vendor)
router.post('/vendor/register', registerVendor);
router.post('/vendor/send-otp', sendVendorOtp);
router.post('/vendor/login', loginVendor);

// Vendor Profile Routes (Protected)
router.get('/vendor/dashboard/stats', protect, authorizedRoles('vendor'), getVendorDashboardStats);
router.get('/vendor/profile', protect, authorizedRoles('vendor'), getVendorProfile);
router.post('/vendor/profile', protect, authorizedRoles('user', 'vendor'), updateVendorProfile);
router.patch('/vendor/password', protect, authorizedRoles('vendor'), updatePassword);
router.get('/vendor/me', protect, authorizedRoles('vendor'), getMe);

// Vendor Venue Routes (Protected)
router.post('/vendor/venues', protect, authorizedRoles('vendor'), createVenue);
router.get('/vendor/venues', protect, authorizedRoles('vendor'), getVendorVenues);
router.put('/vendor/venues/:id', protect, authorizedRoles('vendor'), updateVenue);
router.delete('/vendor/venues/:id', protect, authorizedRoles('vendor'), deleteVenue);

// Vendor Lead Routes (Protected)
router.get('/vendor/leads', protect, authorizedRoles('vendor'), getVendorLeads);
router.get('/vendor/leads/:id', protect, authorizedRoles('vendor'), getLeadById);
router.patch('/vendor/leads/:id/status', protect, authorizedRoles('vendor'), updateLeadStatus);
router.patch('/vendor/leads/:id/payment-status', protect, authorizedRoles('vendor'), markVendorPaymentReceived);

// Vendor Review Routes (Protected)
router.get('/vendor/reviews', protect, authorizedRoles('vendor'), getVendorReviews);
router.patch('/vendor/reviews/:id/reply', protect, authorizedRoles('vendor'), replyToReview);

// Vendor Subscription Routes (Protected)
router.post('/vendor/subscriptions/purchase', protect, authorizedRoles('vendor'), purchaseSubscription);

// Vendor Wallet Routes (Protected)
router.get('/vendor/wallet', protect, authorizedRoles('vendor'), getWallet);
router.post('/vendor/wallet/add', protect, authorizedRoles('vendor'), addMoney);

// Admin Auth Routes (Public)
router.post('/admin/login', loginWeddingAdmin);
router.post('/admin/seed', seedWeddingAdmin);

// Admin Routes (Protected)
router.get('/admin/stats', protect, authorizedRoles('admin', 'superadmin'), getAdminStats);
router.get('/admin/enquiries', protect, authorizedRoles('admin', 'superadmin'), getAdminEnquiries);
router.patch('/admin/enquiries/:id/status', protect, authorizedRoles('admin', 'superadmin'), updateEnquiryStatus);
router.delete('/admin/enquiries/:id', protect, authorizedRoles('admin', 'superadmin'), deleteEnquiry);
router.get('/admin/customers', protect, authorizedRoles('admin', 'superadmin'), getAdminCustomers);
router.patch('/admin/customers/:id/block', protect, authorizedRoles('admin', 'superadmin'), updateCustomerBlockStatus);
router.delete('/admin/customers/:id', protect, authorizedRoles('admin', 'superadmin'), deleteCustomer);

// Admin Gallery/Weddings
router.post('/admin/gallery', protect, authorizedRoles('admin', 'superadmin'), addGalleryImage);
router.delete('/admin/gallery/:id', protect, authorizedRoles('admin', 'superadmin'), deleteGalleryImage);
router.post('/admin/real-weddings', protect, authorizedRoles('admin', 'superadmin'), addRealWedding);
router.delete('/admin/real-weddings/:id', protect, authorizedRoles('admin', 'superadmin'), deleteRealWedding);

// Admin Venues
router.get('/admin/venues', protect, authorizedRoles('admin', 'superadmin'), getAdminVenues);
router.patch('/admin/venues/:id/status', protect, authorizedRoles('admin', 'superadmin'), updateVenueStatus);

// Admin Vendor Routes
router.get('/admin/vendors', protect, authorizedRoles('admin', 'superadmin'), getAdminVendors);
router.get('/admin/vendors/:id', protect, authorizedRoles('admin', 'superadmin'), getAdminVendorById);
router.patch('/admin/vendors/:id/status', protect, authorizedRoles('admin', 'superadmin'), updateVendorStatus);
router.get('/admin/financials', protect, authorizedRoles('admin', 'superadmin'), getAdminFinancials);

// Admin Platform Settings Routes
router.get('/admin/settings/financial', protect, authorizedRoles('admin', 'superadmin'), getSettings);
router.patch('/admin/settings/financial', protect, authorizedRoles('admin', 'superadmin'), updateSettings);

// Public Settings Routes
router.get('/settings/financial', getSettings);

// Admin Destination Routes
router.post('/admin/destinations', protect, authorizedRoles('admin', 'superadmin'), addDestination);
router.patch('/admin/destinations/:id', protect, authorizedRoles('admin', 'superadmin'), updateDestination);
router.delete('/admin/destinations/:id', protect, authorizedRoles('admin', 'superadmin'), deleteDestination);

// Admin Category Routes
router.post('/admin/categories', protect, authorizedRoles('admin', 'superadmin'), addCategory);
router.patch('/admin/categories/:id', protect, authorizedRoles('admin', 'superadmin'), updateCategory);
router.delete('/admin/categories/:id', protect, authorizedRoles('admin', 'superadmin'), deleteCategory);

// Admin Testimonial Routes
router.get('/admin/testimonials', protect, authorizedRoles('admin', 'superadmin'), getAllTestimonials);
router.patch('/admin/testimonials/:id/status', protect, authorizedRoles('admin', 'superadmin'), updateTestimonialStatus);
router.delete('/admin/testimonials/:id', protect, authorizedRoles('admin', 'superadmin'), deleteTestimonial);

// Admin Support Routes
router.get('/admin/support', protect, authorizedRoles('admin', 'superadmin'), getTickets);
router.patch('/admin/support/:id/resolve', protect, authorizedRoles('admin', 'superadmin'), resolveTicket);
router.post('/admin/support/resolve-all', protect, authorizedRoles('admin', 'superadmin'), resolveAllTickets);
router.patch('/admin/support/:id/reply', protect, authorizedRoles('admin', 'superadmin'), replyToTicket);

// Admin Subscription Routes
router.post('/admin/subscriptions', protect, authorizedRoles('admin', 'superadmin'), createPlan);
router.get('/admin/subscriptions', protect, authorizedRoles('admin', 'superadmin'), getAllPlans);
router.patch('/admin/subscriptions/:id', protect, authorizedRoles('admin', 'superadmin'), updatePlan);
router.delete('/admin/subscriptions/:id', protect, authorizedRoles('admin', 'superadmin'), deletePlan);

// Payment Routes
router.post('/payment/booking/:id', protect, initiateBookingPayment); // User Booking Payment
router.post('/payment/subscription', protect, authorizedRoles('vendor'), initiateSubscriptionPayment); // Vendor Subscription
router.post('/payment/wallet-topup', protect, authorizedRoles('vendor'), initiateWalletTopup); // Vendor Wallet Topup

// Webhook & Verification (Public & Secure)
router.post('/payment/callback', paymentCallback);
router.get('/payment/status/:orderId', verifyPaymentStatus);

export default router;
