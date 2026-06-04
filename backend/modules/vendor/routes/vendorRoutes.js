import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import { updateFcmToken } from '../../user/controllers/userController.js';

const router = express.Router();

// @route   POST /api/vendor/fcm-token
// @desc    Update FCM Token for Vendor (uses universal controller)
// @access  Private
router.post('/fcm-token', protect, updateFcmToken);

export default router;
