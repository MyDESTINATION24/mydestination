import mongoose from 'mongoose';
import WeddingVendor from '../models/WeddingVendor.js';
import WeddingVenue from '../models/WeddingVenue.js';
import WeddingEnquiry from '../models/WeddingEnquiry.js';
import WeddingReview from '../models/WeddingReview.js';
import WeddingPlatformSettings from '../models/WeddingPlatformSettings.js';

/**
 * @desc    Get vendor dashboard stats
 * @route   GET /api/wedding/vendor/dashboard/stats
 * @access  Private (Vendor)
 */
export const getVendorDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find vendor profile and venues
    const vendor = await WeddingVendor.findOne({ user: userId });
    const venues = await WeddingVenue.find({ vendor: userId });

    const profileId = vendor?._id;
    const venueIds = venues.map(v => v._id);
    const allTargetIds = [];
    if (profileId) allTargetIds.push(profileId);
    venueIds.forEach(id => allTargetIds.push(id));

    // 2. Aggregate stats
    const totalEnquiries = await WeddingEnquiry.countDocuments({ targetId: { $in: allTargetIds } });
    const newLeads = await WeddingEnquiry.countDocuments({ targetId: { $in: allTargetIds }, status: 'New' });
    const totalReviews = await WeddingReview.countDocuments({ targetId: { $in: allTargetIds } });
    
    // Growth Calculation
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Current Month Stats
    const currentMonthEnquiries = await WeddingEnquiry.countDocuments({ 
      targetId: { $in: allTargetIds },
      createdAt: { $gte: startOfCurrentMonth }
    });
    const currentMonthLeads = await WeddingEnquiry.countDocuments({ 
      targetId: { $in: allTargetIds }, 
      status: 'New',
      createdAt: { $gte: startOfCurrentMonth }
    });

    // Last Month Stats
    const lastMonthEnquiries = await WeddingEnquiry.countDocuments({ 
      targetId: { $in: allTargetIds },
      createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
    });
    const lastMonthLeads = await WeddingEnquiry.countDocuments({ 
      targetId: { $in: allTargetIds }, 
      status: 'New',
      createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
    });

    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? '+100%' : '+0%';
      const percentage = ((current - last) / last) * 100;
      return percentage > 0 ? `+${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;
    };

    const enquiriesGrowth = calculateGrowth(currentMonthEnquiries, lastMonthEnquiries);
    const leadsGrowth = calculateGrowth(currentMonthLeads, lastMonthLeads);

    // Sum views and shortlists from profile and venues
    let totalViews = vendor?.views || 0;
    let totalShortlists = vendor?.shortlistCount || 0;
    
    venues.forEach(v => {
      totalViews += (v.views || 0);
      totalShortlists += (v.shortlistCount || 0);
    });

    // We don't have historical data for views/shortlists in current schema, so setting 0% for now
    const viewsGrowth = '+0%';
    const shortlistsGrowth = '+0%';

    // 3. Get recent leads (first 5)
    const recentLeads = await WeddingEnquiry.find({ targetId: { $in: allTargetIds } })
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      stats: {
        totalEnquiries,
        newLeads,
        profileViews: totalViews,
        shortlisted: totalShortlists,
        totalReviews,
        growth: {
          enquiries: enquiriesGrowth,
          leads: leadsGrowth,
          views: viewsGrowth,
          shortlists: shortlistsGrowth
        }
      },
      recentLeads
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Increment view count for a vendor or venue
 * @route   PATCH /api/wedding/increment-view/:type/:id
 * @access  Public
 */
export const incrementView = async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'vendor') {
      await WeddingVendor.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } else if (type === 'venue') {
      await WeddingVenue.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get current vendor profile
 * @route   GET /api/wedding/vendor/profile
 * @access  Private (Vendor)
 */
export const getVendorProfile = async (req, res) => {
  try {
    let vendor = await WeddingVendor.findOne({ user: req.user._id })
      .populate('destination', 'name location');

    if (!vendor) {
      // If no profile exists, return a draft-like structure or 404
      return res.status(200).json({ 
        success: true, 
        vendor: { 
          status: 'draft',
          name: req.user.name,
          contactEmail: req.user.email,
          contactPhone: req.user.phone,
          category: req.user.category
        } 
      });
    }

    // Fallback logic for premium price (if missing due to older registrations)
    if (vendor && (!vendor.price || !vendor.price.premium)) {
      const User = mongoose.model('User');
      const userDoc = await User.findById(req.user._id);
      if (userDoc && userDoc.premiumPackage) {
        // If price object doesn't exist, create it
        if (!vendor.price) vendor.price = {};
        
        vendor.price.premium = userDoc.premiumPackage;
        // Also save it back to the database for future
        await WeddingVendor.findByIdAndUpdate(vendor._id, {
          'price.premium': userDoc.premiumPackage
        });
      }
    }

    res.status(200).json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create or Update vendor profile
 * @route   POST /api/wedding/vendor/profile
 * @access  Private (Vendor)
 */
export const updateVendorProfile = async (req, res) => {
  try {
    const { basicInfo, portfolio, services, pricing, kyc } = req.body;

    let vendor = await WeddingVendor.findOne({ user: req.user._id });

    const profileData = {
      user: req.user._id,
      name: basicInfo?.name || req.body.name,
      category: basicInfo?.category || req.body.category,
      location: basicInfo?.location || req.body.location,
      experience: basicInfo?.experience || req.body.experience,
      contactPhone: basicInfo?.phone || req.body.contactPhone,
      contactEmail: basicInfo?.email || req.body.contactEmail,
      portfolio: portfolio || req.body.portfolio || [],
      albums: req.body.albums || [],
      videos: req.body.videos || [],
      price: {
        base: pricing?.basePrice || req.body.price?.base || 0,
        baseFeatures: pricing?.baseFeatures || req.body.price?.baseFeatures || '',
        premium: pricing?.premiumPrice || req.body.price?.premium || 0,
        premiumFeatures: pricing?.premiumFeatures || req.body.price?.premiumFeatures || '',
        type: 'total'
      },
      services: services || [],
      status: vendor ? vendor.status : 'pending' // Preserve status if existing, otherwise pending
    };

    if (vendor) {
      // Update existing
      vendor = await WeddingVendor.findOneAndUpdate(
        { user: req.user._id },
        profileData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new
      vendor = await WeddingVendor.create(profileData);
    }

    // Sync status and details to User model for Admin visibility
    const User = mongoose.model('User');
    const currentUser = await User.findById(req.user._id);
    const newApprovalStatus = currentUser?.partnerApprovalStatus === 'approved' 
      ? 'approved' 
      : (currentUser?.partnerApprovalStatus || 'pending');

    // Check for Promotional Trial
    const settings = await WeddingPlatformSettings.findOne();
    const isNewVendor = !vendor;
    const now = new Date();
    
    let trialData = {};
    if (isNewVendor && settings && settings.freeTrialEnabled) {
      if (
        (!settings.freeTrialStartDate || now >= new Date(settings.freeTrialStartDate)) &&
        (!settings.freeTrialEndDate || now <= new Date(settings.freeTrialEndDate))
      ) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (settings.freeTrialDays || 30));
        
        trialData = {
          hasActiveSubscription: true,
          leadsRemaining: settings.freeTrialLeads || 50,
          subscriptionExpiryDate: expiryDate
        };
      }
    }

    await User.findByIdAndUpdate(req.user._id, {
      role: 'vendor',
      partnerApprovalStatus: newApprovalStatus,
      ...trialData,
      category: profileData.category,
      location: profileData.location,
      experience: profileData.experience,
      basicPackage: pricing?.basePrice,
      premiumPackage: pricing?.premiumPrice,
      services: services || [],
      // KYC Docs sync if present
      aadhaarFront: kyc?.aadhar,
      panCardImage: kyc?.pan,
      profileImage: kyc?.photo
    });

    res.status(200).json({
      success: true,
      message: 'Profile submitted successfully for approval',
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Public vendor application — NO login required
 * @route   POST /api/wedding/vendor/apply
 * @access  Public
 */
export const applyAsVendor = async (req, res) => {
  try {
    const { basicInfo, portfolio, services, pricing, kyc } = req.body;

    // Validate required fields
    if (!basicInfo?.name || !basicInfo?.email || !basicInfo?.phone || !basicInfo?.category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, phone, and category are required' 
      });
    }

    const User = mongoose.model('User');
    const bcrypt = (await import('bcryptjs')).default;

    // Check if user already exists with this email or phone
    const normalizedEmail = basicInfo.email.trim().toLowerCase();
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail, role: 'vendor' }, 
        { phone: basicInfo.phone, role: 'vendor' }
      ] 
    });

    let user;
    
    const settings = await WeddingPlatformSettings.findOne();
    const now = new Date();
    let trialData = {};
    
    if (settings && settings.freeTrialEnabled) {
      if (
        (!settings.freeTrialStartDate || now >= new Date(settings.freeTrialStartDate)) &&
        (!settings.freeTrialEndDate || now <= new Date(settings.freeTrialEndDate))
      ) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (settings.freeTrialDays || 30));
        
        trialData = {
          hasActiveSubscription: true,
          leadsRemaining: settings.freeTrialLeads || 50,
          subscriptionExpiryDate: expiryDate
        };
      }
    }
    
    if (existingUser) {
      // Update existing user's vendor application
      user = existingUser;
      const newApprovalStatus = existingUser.partnerApprovalStatus === 'approved' 
        ? 'approved' 
        : (existingUser.partnerApprovalStatus || 'pending');

      // Only assign trial if they don't already have a subscription
      const applyTrial = (!existingUser.hasActiveSubscription) ? trialData : {};

      await User.findByIdAndUpdate(user._id, {
        name: basicInfo.name,
        partnerApprovalStatus: newApprovalStatus,
        ...applyTrial,
        category: basicInfo.category,
        location: basicInfo.location,
        experience: basicInfo.experience,
        basicPackage: pricing?.basePrice,
        premiumPackage: pricing?.premiumPrice,
        services: services?.filter(s => s.name?.trim()) || [],
        aadhaarFront: kyc?.aadhar,
        panCardImage: kyc?.pan,
        profileImage: kyc?.photo
      });
    } else {
      // Create new user account with a default password (vendor will set it after approval)
      const defaultPassword = await bcrypt.hash(basicInfo.phone + '_vendor', 10);
      user = await User.create({
        name: basicInfo.name,
        email: normalizedEmail,
        phone: basicInfo.phone,
        password: defaultPassword,
        role: 'vendor',
        partnerApprovalStatus: 'pending',
        isVerified: false,
        category: basicInfo.category,
        location: basicInfo.location,
        experience: basicInfo.experience,
        ...trialData,
        basicPackage: pricing?.basePrice,
        premiumPackage: pricing?.premiumPrice,
        services: services?.filter(s => s.name?.trim()) || [],
        aadhaarFront: kyc?.aadhar,
        panCardImage: kyc?.pan,
        profileImage: kyc?.photo
      });
    }

    // Create or update WeddingVendor profile
    let vendor = await WeddingVendor.findOne({ user: user._id });

    const vendorData = {
      user: user._id,
      name: basicInfo.name,
      category: basicInfo.category,
      location: basicInfo.location,
      experience: basicInfo.experience,
      contactPhone: basicInfo.phone,
      contactEmail: normalizedEmail,
      portfolio: portfolio || [],
      price: {
        base: pricing?.basePrice || 0,
        baseFeatures: pricing?.baseFeatures || '',
        premium: pricing?.premiumPrice || 0,
        premiumFeatures: pricing?.premiumFeatures || '',
        type: 'total'
      },
      services: services?.filter(s => s.name?.trim()) || [],
      status: vendor ? vendor.status : 'pending'
    };

    if (vendor) {
      vendor = await WeddingVendor.findOneAndUpdate(
        { user: user._id }, vendorData, { new: true }
      );
    } else {
      vendor = await WeddingVendor.create(vendorData);
    }

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully! You will be notified once approved.',
      vendor
    });
  } catch (error) {
    console.error('Vendor apply error:', error);
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email or phone already exists. Please login instead.' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all active vendors (Public)
 * @route   GET /api/wedding/vendors
 * @access  Public
 */
export const getPublicVendors = async (req, res) => {
  try {
    const { category, destinationId, city } = req.query;
    console.log('🔍 Fetching Public Vendors with filters:', { category, destinationId, city });

    // In production, we only show active vendors. 
    // In dev, we might want to see pending ones too if the user is testing.
    const filter = { status: { $in: ['active', 'pending'] } }; 
    
    if (category && category !== 'undefined') {
      // Create a forgiving regex
      let searchTerm = category;
      if (category === 'Photographers' || category === 'Photography') {
        searchTerm = 'Photograph';
      } else if (category === 'Planning & Decor') {
        searchTerm = 'Planning|Decor';
      }
      filter.category = { $regex: searchTerm, $options: 'i' };
    }

    if (destinationId && destinationId !== 'undefined') {
      filter.destination = destinationId;
    }

    if (city && city !== 'undefined') {
      // If city is provided as a string, filter by location field
      filter.location = { $regex: city, $options: 'i' };
    }

    console.log('📂 Applied Filter:', JSON.stringify(filter));

    const totalInDb = await WeddingVendor.countDocuments();
    console.log(`📊 Total Vendors in DB: ${totalInDb}`);

    const vendors = await WeddingVendor.find(filter)
      .populate('destination', 'name location')
      .populate('user', 'hasActiveSubscription leadsRemaining')
      .sort({ rating: -1, createdAt: -1 });

    // Filter out vendors who do not have an active subscription, ran out of leads, or whose subscription expired
    const activeVendors = vendors.filter(v => {
      if (!v.user || !v.user.hasActiveSubscription || v.user.leadsRemaining <= 0) return false;
      if (v.user.subscriptionExpiryDate && new Date(v.user.subscriptionExpiryDate) < new Date()) return false;
      return true;
    });

    console.log(`✅ Found ${activeVendors.length} active vendors (filtered from ${vendors.length})`);
    res.status(200).json(activeVendors);
  } catch (error) {
    console.error('❌ Error in getPublicVendors:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get vendor detail (Public)
 * @route   GET /api/wedding/vendors/:id
 * @access  Public
 */
export const getVendorDetail = async (req, res) => {
  try {
    const vendor = await WeddingVendor.findById(req.params.id)
      .populate('destination', 'name location');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
