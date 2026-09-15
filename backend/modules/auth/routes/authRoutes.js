import { sendOtp, verifyOtp, verifyPartnerOtp, adminLogin, getMe, updateProfile, updateAdminProfile, updateAdminPassword, registerPartner, uploadDocs, deleteDoc, uploadDocsBase64, checkExists, uploadProfileImage, validateReferralCode } from '../controllers/authController.js';
import { protect } from '../../../middlewares/authMiddleware.js';
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

router.post('/validate-exists', checkExists);
router.post('/validate-referral', validateReferralCode);
router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/partner/register', registerPartner);
router.post('/partner/verify-otp', otpVerifyLimiter, verifyPartnerOtp);

// Upload routes for partner registration
router.post('/partner/upload-docs', uploadDocuments.array('images', 20), uploadDocs);
router.post('/partner/upload-docs-base64', uploadDocsBase64); // Flutter camera upload
router.post('/partner/delete-doc', deleteDoc);

router.post('/admin/login', loginLimiter, adminLogin);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-profile-image', protect, uploadDocuments.single('image'), uploadProfileImage);
router.put('/admin/update-profile', protect, updateAdminProfile);
router.put('/admin/update-password', protect, updateAdminPassword);

export default router;
