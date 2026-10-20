import { sendOtp, verifyOtp, verifyPartnerOtp, adminLogin, getMe, updateProfile, updateAdminProfile, updateAdminPassword, registerPartner, uploadDocs, deleteDoc, uploadDocsBase64, checkExists, uploadProfileImage, validateReferralCode, sendPhoneChangeOtp } from '../controllers/authController.js';
import { protect } from '../../../middlewares/authMiddleware.js';
import { adminLoginEmailLimiter, otpSendPhoneLimiter, otpVerifyPhoneLimiter, publicUploadLimiter } from '../../../middlewares/rateLimiters.js';
import { uploadDocuments } from '../../../utils/multer.js';
import express from "express";
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const router = express.Router();

// None of the credential endpoints were rate limited. Admin sign-in took
// unlimited password guesses, and send-otp could be looped to run up the SMS
// bill or flood a stranger's phone. The per-code attempt cap in verifyOtp
// handles a distributed guesser; these cap the single-source case.
const makeLimiter = (limit, message) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (req, res) => res.status(429).json({ success: false, message }),
});

const loginLimiter = makeLimiter(10, 'Too many sign-in attempts. Please try again in a few minutes.');
const otpSendLimiter = makeLimiter(12, 'Too many OTP requests. Please wait a few minutes before trying again.');
const otpVerifyLimiter = makeLimiter(20, 'Too many verification attempts. Please wait a few minutes before trying again.');

// These answer differently for registered and unregistered numbers, so cap
// them to slow down enumerating who has an account.
const lookupLimiter = makeLimiter(60, 'Too many requests. Please wait a few minutes before trying again.');

router.post('/validate-exists', lookupLimiter, checkExists);
router.post('/validate-referral', lookupLimiter, validateReferralCode);
router.post('/send-otp', otpSendLimiter, otpSendPhoneLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, otpVerifyPhoneLimiter, verifyOtp);
router.post('/partner/register', otpSendLimiter, otpSendPhoneLimiter, registerPartner);
router.post('/partner/verify-otp', otpVerifyLimiter, otpVerifyPhoneLimiter, verifyPartnerOtp);

// Upload routes for partner registration (no account exists yet, so per IP)
router.post('/partner/upload-docs', publicUploadLimiter, uploadDocuments.array('images', 20), uploadDocs);
router.post('/partner/upload-docs-base64', publicUploadLimiter, uploadDocsBase64); // Flutter camera upload
router.post('/partner/delete-doc', publicUploadLimiter, deleteDoc);

router.post('/admin/login', loginLimiter, adminLoginEmailLimiter, adminLogin);
router.get('/me', protect, getMe);
// Changing the phone number needs an OTP sent to the new number first.
router.post('/phone-change/send-otp', protect, otpSendLimiter, otpSendPhoneLimiter, sendPhoneChangeOtp);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-profile-image', protect, uploadDocuments.single('image'), uploadProfileImage);
router.put('/admin/update-profile', protect, updateAdminProfile);
router.put('/admin/update-password', protect, updateAdminPassword);

export default router;
