import { randomUUID } from 'crypto';
import { phonepeClient } from '../services/phonepeClient.js';
import { StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import WeddingEnquiry from '../models/WeddingEnquiry.js';
import WeddingSubscriptionTransaction from '../models/WeddingSubscriptionTransaction.js';
import VendorWallet from '../models/VendorWallet.js';
import User from '../../user/models/User.js';
import WeddingSubscriptionPlan from '../models/WeddingSubscriptionPlan.js';
import WeddingVenue from '../models/WeddingVenue.js';
import WeddingVendor from '../models/WeddingVendor.js';
import WeddingPlatformSettings from '../models/WeddingPlatformSettings.js';
import { sendWeddingNotification, sendWeddingNotificationToAdmins } from '../../../services/weddingNotificationService.js';

const getClient = () => {
  if (!phonepeClient) {
    throw new Error('PhonePe Client is not initialized properly. Check .env variables.');
  }
  return phonepeClient;
};

// --- ENQUIRY / BOOKING PAYMENT ---
export const initiateBookingPayment = async (req, res) => {
  try {
    const { id } = req.params; // Enquiry ID
    const enquiry = await WeddingEnquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // Always fetch LIVE platform fee from admin settings
    const settings = await WeddingPlatformSettings.findOne();
    let platformFee = settings?.platformFee ?? enquiry.platformFee ?? 499;

    // If percentage type, calculate against bookingAmount
    if (settings?.platformFeeType === 'percentage' && enquiry.bookingAmount) {
      platformFee = Math.round(Number(enquiry.bookingAmount) * (platformFee / 100));
    }

    const amount = platformFee * 100; // convert to paise
    const merchantOrderId = `BOOKING_${id}_${randomUUID().substring(0, 8)}`;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wedding/payment/status`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await getClient().pay(request);

    res.json({
      success: true,
      url: response.redirectUrl,
      orderId: merchantOrderId
    });
  } catch (error) {
    console.error('Booking Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initiation failed' });
  }
};

// --- VENDOR SUBSCRIPTION PAYMENT ---
export const initiateSubscriptionPayment = async (req, res) => {
  try {
    const { planId, amount: reqAmount, validityMonths, validityType } = req.body;
    const vendorId = req.user.id || req.user._id;

    if (!planId || !reqAmount) {
      return res.status(400).json({ success: false, message: 'Plan ID and amount are required' });
    }

    const merchantOrderId = `SUBSCRIPTION_${vendorId}_${randomUUID().substring(0, 8)}`;
    const amount = reqAmount * 100; // in paise
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wedding/vendor/payment/status`;

    // Create a Pending transaction record
    const transaction = await WeddingSubscriptionTransaction.create({
      vendor: vendorId,
      plan: planId,
      amount: reqAmount,
      paymentId: merchantOrderId,
      status: 'Pending',
      validityMonths,
      validityType
    });

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await getClient().pay(request);

    res.json({
      success: true,
      url: response.redirectUrl,
      orderId: merchantOrderId
    });
  } catch (error) {
    import('fs').then(fs => fs.writeFileSync('debug_error.log', error.stack || error.toString()));
    console.error('Subscription Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initiation failed' });
  }
};

// --- VENDOR WALLET TOPUP ---
export const initiateWalletTopup = async (req, res) => {
  try {
    const { amount: reqAmount } = req.body;
    const vendorId = req.user.id || req.user._id;

    if (!reqAmount || reqAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const merchantOrderId = `WALLET_${vendorId}_${randomUUID().substring(0, 8)}`;
    const amount = reqAmount * 100; // in paise
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wedding/vendor/payment/status`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await getClient().pay(request);

    res.json({
      success: true,
      url: response.redirectUrl,
      orderId: merchantOrderId
    });
  } catch (error) {
    console.error('Wallet Topup Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment initiation failed' });
  }
};

// --- HELPER: COMPLETE BOOKING ---
const completeBookingPayment = async (enquiryId, orderId, paidAmount) => {
  const enquiry = await WeddingEnquiry.findById(enquiryId);
  if (!enquiry || enquiry.paymentStatus === 'Paid') return;

  let vendorUserId = null;
  if (enquiry.targetType === 'Venue' || enquiry.targetType === 'venue') {
    const venue = await WeddingVenue.findById(enquiry.targetId);
    if (venue) vendorUserId = venue.vendor;
  } else {
    const vendor = await WeddingVendor.findById(enquiry.targetId);
    if (vendor) vendorUserId = vendor.user;
  }

  const settings = await WeddingPlatformSettings.findOne() || { 
    vendorCommission: 499, platformFee: 499,
    platformFeeType: 'fixed', vendorCommissionType: 'fixed'
  };
  
  const parsedBookingAmount = Number(enquiry.bookingAmount) || 0;

  let calculatedVendorCommission = settings.vendorCommission;
  if (settings.vendorCommissionType === 'percentage') {
    calculatedVendorCommission = Math.round(parsedBookingAmount * (settings.vendorCommission / 100));
  }

  if (vendorUserId) {
    let wallet = await VendorWallet.findOne({ vendorUser: vendorUserId });
    if (!wallet) {
      wallet = await VendorWallet.create({
        vendorUser: vendorUserId,
        balance: 0,
        transactions: []
      });
    }

    wallet.balance -= Number(calculatedVendorCommission);
    wallet.transactions.push({
      type: 'debit',
      amount: Number(calculatedVendorCommission),
      description: `Commission for Booking Enquiry ID: ${enquiry._id}`,
      date: new Date()
    });
    
    await wallet.save();
  }

  const updatedEnquiry = await WeddingEnquiry.findByIdAndUpdate(enquiryId, {
    paymentStatus: 'Paid',
    status: 'Booked',
    transactionId: orderId,
    actualAmount: parsedBookingAmount,
    platformFee: paidAmount,
    commissionAmount: calculatedVendorCommission
  }, { new: true });

  // Push: User ko booking confirmation
  if (updatedEnquiry?.user) {
    sendWeddingNotification(
      updatedEnquiry.user,
      'user',
      {
        title: '🎉 Booking Confirmed!',
        body: `Aapki wedding booking confirm ho gayi! Platform fee ₹${paidAmount} paid. Vendor jald contact karega.`
      },
      { type: 'booking_paid', url: '/wedding/my-enquiries', enquiryId: String(enquiryId) }
    ).catch(() => {});
  }

  // Push: Vendor ko commission deduction alert
  if (vendorUserId) {
    sendWeddingNotification(
      vendorUserId,
      'vendor',
      {
        title: '💰 New Booking Payment Received',
        body: `Client ne platform fee pay kar di. Commission ₹${calculatedVendorCommission} wallet se deduct hogi.`
      },
      { type: 'booking_paid', url: '/wedding/vendor/leads', enquiryId: String(enquiryId) }
    ).catch(() => {});
  }

  // Push: Admins ko revenue alert
  sendWeddingNotificationToAdmins(
    {
      title: '💵 Payment Received',
      body: `Wedding booking payment received — ₹${paidAmount} platform fee. Commission: ₹${calculatedVendorCommission}`
    },
    { type: 'booking_paid', url: '/wedding/admin/enquiries', enquiryId: String(enquiryId) }
  ).catch(() => {});
};

// --- WEBHOOK CALLBACK ---
export const paymentCallback = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const username = process.env.WH_PHONEPE_WEBHOOK_USERNAME;
    const password = process.env.WH_PHONEPE_WEBHOOK_PASSWORD;

    let payload, state, originalMerchantOrderId;

    // Without credentials this used to fall through to trusting the request
    // body, so an unauthenticated POST claiming state COMPLETED could mark a
    // booking paid, activate a vendor subscription, or credit a vendor wallet
    // with any amount. There is no way to authenticate a callback without the
    // webhook credentials, so refuse rather than guess: payments are still
    // confirmed by /payment/status/:orderId, which asks PhonePe directly.
    if (!username || !password) {
      console.error('[PhonePe Webhook] Rejected: WH_PHONEPE_WEBHOOK_USERNAME/PASSWORD are not configured.');
      return res.status(503).json({ success: false, message: 'Webhook not configured' });
    }

    const callbackResponse = getClient().validateCallback(username, password, authHeader, bodyString);
    payload = callbackResponse.payload;
    state = payload.state;
    originalMerchantOrderId = payload.originalMerchantOrderId;

    console.log('[PhonePe Webhook] orderId:', originalMerchantOrderId, '| state:', state);

    if (state === 'COMPLETED') {
      if (originalMerchantOrderId?.startsWith('BOOKING_')) {
        const enquiryId = originalMerchantOrderId.split('_')[1];
        const enquiry = await WeddingEnquiry.findById(enquiryId);
        const paidAmount = payload?.amount ? payload.amount / 100 : (enquiry ? enquiry.platformFee : 499);
        await completeBookingPayment(enquiryId, originalMerchantOrderId, paidAmount);

      } else if (originalMerchantOrderId?.startsWith('SUBSCRIPTION_')) {
        const vendorId = originalMerchantOrderId.split('_')[1];
        const transaction = await WeddingSubscriptionTransaction.findOneAndUpdate(
          { paymentId: originalMerchantOrderId },
          { status: 'Paid' },
          { new: true }
        );

        // ✅ Activate subscription in User model
        if (transaction) {
          await activateVendorSubscription(
            vendorId,
            transaction.plan,
            transaction.validityMonths,
            transaction.validityType
          );
        }

      } else if (originalMerchantOrderId?.startsWith('WALLET_')) {
        const vendorId = originalMerchantOrderId.split('_')[1];
        const amountPaise = payload?.amount || 0;
        const amountRupees = amountPaise / 100;

        if (amountRupees > 0) {
          let wallet = await VendorWallet.findOne({ vendor: vendorId });
          if (!wallet) {
            wallet = await VendorWallet.create({ vendor: vendorId, balance: 0, transactions: [] });
          }
          wallet.balance = (wallet.balance || 0) + amountRupees;
          wallet.transactions = wallet.transactions || [];
          wallet.transactions.push({
            type: 'credit',
            amount: amountRupees,
            description: 'Wallet Top-up via PhonePe',
            date: new Date()
          });
          await wallet.save();
        }
      }
    } else if (state === 'FAILED') {
      if (originalMerchantOrderId?.startsWith('SUBSCRIPTION_')) {
        await WeddingSubscriptionTransaction.findOneAndUpdate(
          { paymentId: originalMerchantOrderId },
          { status: 'Failed' }
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error processing callback');
  }
};


// --- Helper: Activate vendor subscription after payment ---
const activateVendorSubscription = async (vendorId, planId, validityMonths, validityType) => {
  const plan = await WeddingSubscriptionPlan.findById(planId);
  if (!plan) throw new Error('Plan not found');

  const currentUser = await User.findById(vendorId);
  if (!currentUser) throw new Error('Vendor not found');

  let additionalLeads = 0;
  let newExpiryDate = new Date();

  const vMonths = validityMonths || plan.validityMonths;
  const vType = validityType || plan.validityType || 'months';

  // Rollover logic
  if (currentUser.hasActiveSubscription && currentUser.subscriptionExpiryDate && currentUser.subscriptionExpiryDate > new Date()) {
    const remainingTime = currentUser.subscriptionExpiryDate.getTime() - new Date().getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 3600 * 24)));
    additionalLeads = currentUser.leadsRemaining > 0 ? currentUser.leadsRemaining : 0;
    if (vType === 'days') {
      newExpiryDate.setDate(newExpiryDate.getDate() + vMonths + remainingDays);
    } else {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + vMonths);
      newExpiryDate.setDate(newExpiryDate.getDate() + remainingDays);
    }
  } else {
    if (vType === 'days') {
      newExpiryDate.setDate(newExpiryDate.getDate() + vMonths);
    } else {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + vMonths);
    }
  }

  const totalLeads = plan.numberOfLeads + additionalLeads;

  await User.findByIdAndUpdate(vendorId, {
    hasActiveSubscription: true,
    subscriptionPlanId: plan._id,
    leadsRemaining: totalLeads,
    subscriptionExpiryDate: newExpiryDate
  });

  return { totalLeads, newExpiryDate };
};

// --- VERIFY PAYMENT STATUS (Double Check API — called on redirect from PhonePe) ---
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const response = await getClient().getOrderStatus(orderId);
    
    // DB updates on redirect (since webhook may fail in localhost/dev)
    if (response.state === 'COMPLETED') {
      if (orderId.startsWith('SUBSCRIPTION_')) {
        // Format: SUBSCRIPTION_{vendorId}_{uuid}
        const parts = orderId.split('_');
        const vendorId = parts[1];

        // Find the pending transaction
        const transaction = await WeddingSubscriptionTransaction.findOne({ paymentId: orderId });
        
        if (transaction && transaction.status !== 'Paid') {
          // Mark transaction as paid
          transaction.status = 'Paid';
          await transaction.save();

          // ✅ CRITICAL: Activate vendor subscription in User model
          await activateVendorSubscription(
            vendorId,
            transaction.plan,
            transaction.validityMonths,
            transaction.validityType
          );
        } else if (!transaction) {
          // Transaction record missing — still activate subscription if payment succeeded
          console.warn('Subscription transaction record not found for:', orderId);
        }

      } else if (orderId.startsWith('BOOKING_')) {
        // Format: BOOKING_{enquiryId}_{uuid}
        const enquiryId = orderId.split('_')[1];
        const enquiry = await WeddingEnquiry.findById(enquiryId);
        const paidAmount = response?.amount ? response.amount / 100 : (enquiry ? enquiry.platformFee : 499);
        await completeBookingPayment(enquiryId, orderId, paidAmount);

      } else if (orderId.startsWith('WALLET_')) {
        // Format: WALLET_{vendorId}_{uuid}
        const vendorId = orderId.split('_')[1];
        const amountPaise = response.amount || 0;
        const amountRupees = amountPaise / 100;

        if (amountRupees > 0) {
          let wallet = await VendorWallet.findOne({ vendor: vendorId });
          if (!wallet) {
            wallet = await VendorWallet.create({ vendor: vendorId, balance: 0, transactions: [] });
          }
          wallet.balance = (wallet.balance || 0) + amountRupees;
          wallet.transactions = wallet.transactions || [];
          wallet.transactions.push({
            type: 'credit',
            amount: amountRupees,
            description: 'Wallet Top-up via PhonePe',
            date: new Date()
          });
          await wallet.save();
        }
      }
    } else if (response.state === 'FAILED') {
      if (orderId.startsWith('SUBSCRIPTION_')) {
        await WeddingSubscriptionTransaction.findOneAndUpdate(
          { paymentId: orderId },
          { status: 'Failed' }
        );
      }
    }
    
    res.json({
      success: true,
      state: response.state,
      amount: response.amount,
      data: response
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
};
