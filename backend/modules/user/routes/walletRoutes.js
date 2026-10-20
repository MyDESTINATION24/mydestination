import express from 'express';
import {
  getWallet,
  getTransactions,
  requestWithdrawal,
  getWithdrawals,
  updateBankDetails,
  getWalletStats,
  createAddMoneyOrder,
  verifyAddMoneyPayment,
  deleteBankDetails
} from '../controllers/walletController.js';
import { protect } from '../../../middlewares/authMiddleware.js';
import { paymentLimiter, withdrawalLimiter } from '../../../middlewares/rateLimiters.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get wallet balance and details
router.get('/', getWallet);

// Get wallet statistics
router.get('/stats', getWalletStats);

// Add Money (Razorpay)
router.post('/add-money', paymentLimiter, createAddMoneyOrder);
router.post('/verify-add-money', paymentLimiter, verifyAddMoneyPayment);

// Get transaction history
router.get('/transactions', getTransactions);

// Request withdrawal
router.post('/withdraw', withdrawalLimiter, requestWithdrawal);

// Get withdrawal history
router.get('/withdrawals', getWithdrawals);

// Update/Delete bank details (where payouts go, so changes are capped too)
router.put('/bank-details', withdrawalLimiter, updateBankDetails);
router.delete('/bank-details', withdrawalLimiter, deleteBankDetails);

export default router;

