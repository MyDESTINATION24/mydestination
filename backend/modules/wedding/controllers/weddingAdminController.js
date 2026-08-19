import WeddingVenue from '../models/WeddingVenue.js';
import WeddingVendor from '../models/WeddingVendor.js';
import WeddingEnquiry from '../models/WeddingEnquiry.js';
import WeddingSubscriptionTransaction from '../models/WeddingSubscriptionTransaction.js';
import User from '../../user/models/User.js';
import Admin from '../../admin/models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWeddingNotification } from '../../../services/weddingNotificationService.js';

/**
 * @desc    Wedding Admin Login
 * @route   POST /api/wedding/admin/login
 * @access  Public
 */
export const loginWeddingAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: admin.role }, 
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// The POST /api/wedding/admin/seed endpoint lived here. It was
// unauthenticated and returned the superadmin email and password in plain
// text to any caller -- and created that account with a known password if it
// did not exist. A one-off setup convenience has no business being a live
// route; create admins through the admin panel instead.

export const getAdminStats = async (req, res) => {
  try {
    // Run all count queries in parallel for faster response
    const [
      totalVenues, pendingVenues,
      totalEnquiries, pendingEnquiries,
      totalVendors, pendingVendors
    ] = await Promise.all([
      WeddingVenue.countDocuments(),
      WeddingVenue.countDocuments({ status: 'pending' }),
      WeddingEnquiry.countDocuments(),
      WeddingEnquiry.countDocuments({ status: 'New' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'vendor', partnerApprovalStatus: 'pending' })
    ]);

    res.status(200).json({
      totalVenues, pendingVenues,
      totalEnquiries, pendingEnquiries,
      totalVendors, pendingVendors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'user' })
      .select('name email phone createdAt isBlocked profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomerBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const customer = await User.findOneAndUpdate(
      { _id: id, role: 'user' },
      { isBlocked },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: `Customer ${isBlocked ? 'blocked' : 'unblocked'} successfully`, customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findOneAndDelete({ _id: id, role: 'user' });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAdminVendors = async (req, res) => {
  try {
    // Select only required fields — exclude heavy base64 KYC images from list view
    // KYC images are fetched separately only when admin opens a vendor's detail modal
    const items = await User.find({ role: 'vendor' })
      .select('name email phone category location experience basicPackage premiumPackage partnerApprovalStatus kycStatus services createdAt isBlocked')
      .sort({ createdAt: -1 })
      .lean(); // .lean() returns plain JS objects — faster than Mongoose documents
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New endpoint: fetch a single vendor with full KYC documents (called when admin opens detail modal)
export const getAdminVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await User.findOne({ _id: id, role: 'vendor' })
      .select('name email phone category location experience basicPackage premiumPackage partnerApprovalStatus kycStatus services createdAt profileImage aadhaarFront panCardImage')
      .lean();
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const kycStatusValue = status === 'approved' ? 'Verified' : (status === 'rejected' ? 'Rejected' : 'Pending');
    
    const item = await User.findByIdAndUpdate(
      id, 
      { 
        partnerApprovalStatus: status,
        kycStatus: kycStatusValue
      }, 
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Vendor not found' });
    
    // Also update WeddingVendor profile status
    const weddingStatus = status === 'approved' ? 'active' : (status === 'rejected' ? 'inactive' : 'pending');
    await WeddingVendor.findOneAndUpdate({ user: id }, { status: weddingStatus });

    // Push Notification: Vendor ko unka approval status batao
    const notifMap = {
      approved: {
        title: '🎉 Vendor Account Approved!',
        body: 'Badhai ho! Aapka My Destination vendor account approve ho gaya. Ab aap leads receive kar sakte hain.'
      },
      rejected: {
        title: '❌ Vendor Application Rejected',
        body: 'Aapka vendor application reject ho gaya. Agar koi sawaal ho to support se contact karein.'
      },
      pending: {
        title: '⏳ Vendor Account Under Review',
        body: 'Aapka vendor account review ke liye pending hai. Jald hi update milegi.'
      }
    };
    const notif = notifMap[status];
    if (notif) {
      sendWeddingNotification(
        id,
        'vendor',
        notif,
        { type: 'vendor_status', url: '/wedding/vendor/dashboard', newStatus: status }
      ).catch(e => console.error('[WeddingFCM] Vendor status notify error:', e.message));
    }
    
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminFinancials = async (req, res) => {
  try {
    const bookedEnquiries = await WeddingEnquiry.find({ status: 'Booked' })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });

    const subscriptionTransactions = await WeddingSubscriptionTransaction.find({ status: 'Paid' })
      .populate('vendor', 'name email')
      .populate('plan', 'planName')
      .sort({ createdAt: -1 });

    const totalRevenueEnquiries = bookedEnquiries.reduce((acc, curr) => acc + (curr.actualAmount || 0), 0);
    const commissionsEarned = bookedEnquiries.reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
    const platformFeesEarned = bookedEnquiries.reduce((acc, curr) => acc + (curr.platformFee || 0), 0);
    
    const totalRevenueSubscriptions = subscriptionTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalRevenue = totalRevenueEnquiries + totalRevenueSubscriptions;
    
    // For now, let's assume pending payouts and net profit are derived
    const pendingPayouts = totalRevenueEnquiries - commissionsEarned; 
    const netProfit = commissionsEarned + platformFeesEarned + totalRevenueSubscriptions; // Simplified

    // Fetch target information manually since targetId is polymorphic and may not populate correctly
    for (let enq of bookedEnquiries) {
      if (enq.targetType === 'Venue' || enq.targetType === 'venue') {
        enq.targetInfo = await WeddingVenue.findById(enq.targetId).select('propertyName name').lean();
      } else if (enq.targetId) {
        enq.targetInfo = await WeddingVendor.findById(enq.targetId).select('name').lean();
      }
    }

    const recentTransactions = bookedEnquiries.map(enq => ({
      id: enq.transactionId || enq._id,
      vendor: enq.targetInfo?.propertyName || enq.targetInfo?.name || 'N/A',
      client: enq.name || enq.user?.name || 'N/A',
      amount: `₹${enq.actualAmount?.toLocaleString('en-IN')}`,
      platformFee: `₹${enq.platformFee?.toLocaleString('en-IN')}`,
      date: new Date(enq.updatedAt).toLocaleDateString(),
      status: 'Paid',
      type: 'Booking Fee'
    }));

    const recentSubscriptions = subscriptionTransactions.map(sub => ({
      id: sub.paymentId || sub._id,
      vendor: sub.vendor?.name || 'N/A',
      plan: sub.plan?.planName || 'N/A',
      amount: `₹${sub.amount?.toLocaleString('en-IN')}`,
      date: new Date(sub.createdAt).toLocaleDateString(),
      status: sub.status,
      type: 'Subscription'
    }));

    res.status(200).json({
      success: true,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      commissionsEarned: `₹${commissionsEarned.toLocaleString('en-IN')}`,
      platformFeesEarned: `₹${platformFeesEarned.toLocaleString('en-IN')}`,
      subscriptionRevenue: `₹${totalRevenueSubscriptions.toLocaleString('en-IN')}`,
      pendingPayouts: `₹${pendingPayouts.toLocaleString('en-IN')}`,
      netProfit: `₹${netProfit.toLocaleString('en-IN')}`,
      recentTransactions,
      recentSubscriptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
