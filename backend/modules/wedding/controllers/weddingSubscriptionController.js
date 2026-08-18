import WeddingSubscriptionPlan from '../models/WeddingSubscriptionPlan.js';
import User from '../../user/models/User.js';
import WeddingSubscriptionTransaction from '../models/WeddingSubscriptionTransaction.js';

// @desc    Create a new subscription plan
// @route   POST /api/wedding/admin/subscriptions
// @access  Private (Admin)
export const createPlan = async (req, res) => {
  try {
    const { planName, price, originalPrice, validityMonths, validityType, numberOfLeads, features, isActive } = req.body;
    const plan = await WeddingSubscriptionPlan.create({
      planName,
      price,
      // Only keep a strike-through price if it is actually higher than what is
      // charged; otherwise it would render as a nonsensical 'discount'.
      originalPrice: Number(originalPrice) > Number(price) ? Number(originalPrice) : null,
      validityMonths, validityType, numberOfLeads, features, isActive
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all subscription plans
// @route   GET /api/wedding/admin/subscriptions OR /api/wedding/subscriptions
// @access  Private (Admin) or Public (Vendor viewing plans)
export const getAllPlans = async (req, res) => {
  try {
    // If request from vendor/public, show only active plans, else show all
    const filter = req.user?.role === 'admin' || req.user?.role === 'superadmin' ? {} : { isActive: true };
    const plans = await WeddingSubscriptionPlan.find(filter).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a subscription plan
// @route   PATCH /api/wedding/admin/subscriptions/:id
// @access  Private (Admin)
export const updatePlan = async (req, res) => {
  try {
    const plan = await WeddingSubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a subscription plan
// @route   DELETE /api/wedding/admin/subscriptions/:id
// @access  Private (Admin)
export const deletePlan = async (req, res) => {
  try {
    const plan = await WeddingSubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Purchase a subscription plan
// @route   POST /api/wedding/vendor/subscriptions/purchase
// @access  Private (Vendor)
export const purchaseSubscription = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;
    
    // Validate plan
    const plan = await WeddingSubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!plan.isActive) return res.status(400).json({ success: false, message: 'Plan is no longer active' });

    // In a production app, verify the paymentId with Razorpay/Stripe here.
    // For now, we simulate success since paymentId is passed.

    // Fetch current user to check for existing active subscription
    const currentUser = await User.findById(req.user.id || req.user._id);

    let additionalLeads = 0;
    let newExpiryDate = new Date();

    // Rollover Logic: If user has an active subscription that hasn't expired yet
    if (currentUser.hasActiveSubscription && currentUser.subscriptionExpiryDate && currentUser.subscriptionExpiryDate > new Date()) {
      // Calculate remaining days from current active plan
      const remainingTime = currentUser.subscriptionExpiryDate.getTime() - new Date().getTime();
      const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 3600 * 24)));
      
      // Carry forward existing leads
      additionalLeads = currentUser.leadsRemaining > 0 ? currentUser.leadsRemaining : 0;
      
      // Add new plan's time AND remaining days
      if (plan.validityType === 'days') {
        newExpiryDate.setDate(newExpiryDate.getDate() + plan.validityMonths + remainingDays);
      } else {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + plan.validityMonths);
        newExpiryDate.setDate(newExpiryDate.getDate() + remainingDays);
      }
    } else {
      // Start fresh from today
      if (plan.validityType === 'days') {
        newExpiryDate.setDate(newExpiryDate.getDate() + plan.validityMonths);
      } else {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + plan.validityMonths);
      }
    }

    const totalLeads = plan.numberOfLeads + additionalLeads;

    // Update vendor user document safely without disturbing other fields
    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      {
        hasActiveSubscription: true,
        subscriptionPlanId: plan._id,
        leadsRemaining: totalLeads,
        subscriptionExpiryDate: newExpiryDate
      },
      { new: true }
    );

    // Record the transaction
    await WeddingSubscriptionTransaction.create({
      vendor: user._id,
      plan: plan._id,
      amount: plan.price,
      paymentId: paymentId || 'manual',
      status: 'Paid',
      validityMonths: plan.validityMonths,
      validityType: plan.validityType || 'months'
    });

    res.status(200).json({ 
      success: true, 
      message: 'Subscription purchased successfully',
      user: {
        id: user._id,
        role: user.role,
        hasActiveSubscription: user.hasActiveSubscription,
        leadsRemaining: user.leadsRemaining,
        subscriptionExpiryDate: user.subscriptionExpiryDate
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
