import WeddingEnquiry from '../models/WeddingEnquiry.js';
import WeddingVendor from '../models/WeddingVendor.js';
import WeddingVenue from '../models/WeddingVenue.js';
import VendorWallet from '../models/VendorWallet.js';
import WeddingPlatformSettings from '../models/WeddingPlatformSettings.js';
import User from '../../user/models/User.js';
import { sendWeddingNotification, sendWeddingNotificationToAdmins } from '../../../services/weddingNotificationService.js';

/**
 * @desc    Create a new enquiry (User Side)
 */
export const createEnquiry = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      eventDate, 
      weddingDate,
      guestCount, 
      budget, 
      budgetRange,
      message, 
      notes,
      destination,
      selectedServices,
      services,
      targetType, 
      targetId 
    } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Missing required fields (name, email, phone)' });
    }

    const settings = await WeddingPlatformSettings.findOne() || { platformFee: 499 };

    const enquiry = await WeddingEnquiry.create({
      name,
      email,
      phone,
      weddingDate: weddingDate || eventDate,
      guestCount,
      budget: budget || budgetRange,
      message: message || notes,
      destination,
      services: services || selectedServices,
      targetType: targetType || 'General',
      targetId: targetId || null,
      platformFee: settings.platformFee,
      user: req.user ? req.user._id : null
    });

    // Push Notifications: Vendor ko naya enquiry aaya, Admin ko bhi batao
    if (targetId) {
      let vendorUserId = null;
      if (targetType === 'Venue' || targetType === 'venue') {
        const venue = await WeddingVenue.findById(targetId);
        if (venue) vendorUserId = venue.vendor;
      } else {
        const vendor = await WeddingVendor.findById(targetId);
        if (vendor) vendorUserId = vendor.user;
      }

      // Notify Vendor: Naya enquiry mila
      if (vendorUserId) {
        sendWeddingNotification(
          vendorUserId,
          'vendor',
          {
            title: '💍 New Wedding Enquiry!',
            body: `New enquiry from ${name} for ${weddingDate ? new Date(weddingDate).toLocaleDateString('en-IN') : 'your wedding services'}.`
          },
          { type: 'enquiry', url: '/wedding/vendor/leads', enquiryId: String(enquiry._id) }
        ).catch(e => console.error('[WeddingFCM] Vendor notify error:', e.message));
      }
    }

    // Notify all Admins: Naya enquiry system mein aaya
    sendWeddingNotificationToAdmins(
      {
        title: '📋 New Wedding Enquiry',
        body: `${name} ne enquiry submit ki — ${guestCount || ''} guests, Budget: ${budget || budgetRange || 'N/A'}`
      },
      { type: 'enquiry', url: '/wedding/admin/enquiries', enquiryId: String(enquiry._id) }
    ).catch(e => console.error('[WeddingFCM] Admin notify error:', e.message));

    res.status(201).json({ success: true, enquiry });
  } catch (error) {
    console.error('Create Enquiry Error:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getMyEnquiries = async (req, res) => {
  try {
    const queryOr = [
      { user: req.user._id }
    ];
    const getPhoneRegex = (phone) => new RegExp(`^0?${phone.replace(/^0+/, '')}$`);

    if (req.user.email) queryOr.push({ email: req.user.email });
    if (req.user.phone) queryOr.push({ phone: { $regex: getPhoneRegex(req.user.phone) } });
    if (req.user.mobile) queryOr.push({ phone: { $regex: getPhoneRegex(req.user.mobile) } });
    if (req.user.mobileNumber) queryOr.push({ phone: { $regex: getPhoneRegex(req.user.mobileNumber) } });

    const enquiries = await WeddingEnquiry.find({ 
      $or: queryOr
    })
    .sort({ createdAt: -1 })
    .lean();

    for (let enquiry of enquiries) {
      if (enquiry.targetType === 'Venue' && enquiry.targetId) {
        enquiry.targetId = await WeddingVenue.findById(enquiry.targetId).lean() || enquiry.targetId;
      } else if (enquiry.targetType === 'Vendor' && enquiry.targetId) {
        enquiry.targetId = await WeddingVendor.findById(enquiry.targetId).lean() || enquiry.targetId;
      } else {
        enquiry.targetId = null;
      }
    }

    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get leads for a specific vendor
 */
export const getVendorLeads = async (req, res) => {
  try {
    const vendorProfile = await WeddingVendor.findOne({ user: req.user._id });
    const venueProfile = await WeddingVenue.findOne({ vendor: req.user._id });

    const targetIds = [];
    if (vendorProfile) targetIds.push(vendorProfile._id);
    if (venueProfile) targetIds.push(venueProfile._id);

    if (targetIds.length === 0) {
      return res.status(200).json([]);
    }

    const enquiries = await WeddingEnquiry.find({ 
      targetId: { $in: targetIds } 
    }).sort({ createdAt: -1 });

    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a single lead by ID (Vendor Side)
 */
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await WeddingEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Lead not found' });

    // Verify ownership
    const vendorProfile = await WeddingVendor.findOne({ user: req.user._id });
    const venueProfile = await WeddingVenue.findOne({ vendor: req.user._id });

    const isOwner = (vendorProfile && enquiry.targetId?.equals(vendorProfile._id)) ||
                    (venueProfile && enquiry.targetId?.equals(venueProfile._id));

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to view this lead' });
    }

    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update lead status (Vendor Side)
 */
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if the enquiry belongs to this vendor
    const enquiry = await WeddingEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

    // Verify ownership (simplified: check if target is owned by user)
    const vendorProfile = await WeddingVendor.findOne({ user: req.user._id });
    const venueProfile = await WeddingVenue.findOne({ vendor: req.user._id });
    
    const isOwner = (vendorProfile && enquiry.targetId.equals(vendorProfile._id)) || 
                    (venueProfile && enquiry.targetId.equals(venueProfile._id));

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const previousStatus = enquiry.status;
    enquiry.status = status;
    await enquiry.save();

    // Push Notification: User ko batao uski enquiry ka status change hua
    if (enquiry.user && previousStatus !== status) {
      const statusMessages = {
        Contacted:  { title: '📞 Vendor Ne Contact Kiya!', body: 'Your wedding enquiry vendor ne review ki aur jald aapse contact karega.' },
        Accepted:   { title: '✅ Enquiry Accepted!',       body: 'Badhai ho! Vendor ne aapki wedding enquiry accept kar li. Ab aap booking complete kar sakte hain.' },
        Booked:     { title: '🎉 Booking Confirmed!',     body: 'Aapki wedding booking confirm ho gayi! Payment complete karein.' },
        Completed:  { title: '💍 Wedding Complete!',      body: 'Aapki wedding service successfully complete ho gayi. Please ek review zaroor den!' },
        Lost:       { title: 'Enquiry Closed',            body: 'Aapki enquiry close ho gayi. Agar koi sawaal ho to support se contact karein.' },
      };
      const notif = statusMessages[status];
      if (notif) {
        sendWeddingNotification(
          enquiry.user,
          'user',
          notif,
          { type: 'enquiry_status', url: '/wedding/my-enquiries', enquiryId: String(enquiry._id), newStatus: status }
        ).catch(e => console.error('[WeddingFCM] User status notify error:', e.message));
      }
    }
    
    res.status(200).json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminEnquiries = async (req, res) => {
  try {
    const { status } = req.query;
    console.log('📍 Fetching Admin Enquiries with status:', status);
    const query = {};
    if (status) query.status = status;

    const enquiries = await WeddingEnquiry.find(query)
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${enquiries.length} enquiries`);
    res.status(200).json(enquiries);
  } catch (error) {
    console.error('❌ Error fetching admin enquiries:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const oldEnquiry = await WeddingEnquiry.findById(id);
    if (!oldEnquiry) return res.status(404).json({ message: 'Enquiry not found' });

    const previousStatus = oldEnquiry.status;
    const enquiry = await WeddingEnquiry.findByIdAndUpdate(id, { status }, { new: true });

    // Admin status update → Notify user about status change
    if (enquiry.user && previousStatus !== status) {
      sendWeddingNotification(
        enquiry.user,
        'user',
        {
          title: '📋 Enquiry Status Updated',
          body: `Aapki wedding enquiry ka status admin ne '${status}' kar diya hai.`
        },
        { type: 'enquiry_status', url: '/wedding/my-enquiries', enquiryId: String(enquiry._id), newStatus: status }
      ).catch(e => console.error('[WeddingFCM] Admin status notify error:', e.message));
    }
    
    res.status(200).json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await WeddingEnquiry.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markVendorPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params;
    
    const enquiry = await WeddingEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

    const vendorProfile = await WeddingVendor.findOne({ user: req.user._id });
    const venueProfile = await WeddingVenue.findOne({ vendor: req.user._id });
    
    const isOwner = (vendorProfile && enquiry.targetId.equals(vendorProfile._id)) || 
                    (venueProfile && enquiry.targetId.equals(venueProfile._id));

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    enquiry.vendorPaymentStatus = 'Received';
    await enquiry.save();
    
    res.status(200).json({ success: true, message: 'Payment marked as received', enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  export const confirmBooking = async (req, res) => {
    try {
      const { id } = req.params;
      const { bookingAmount } = req.body;
      const enquiry = await WeddingEnquiry.findById(id);

    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    if (enquiry.status === 'Booked') return res.status(400).json({ success: false, message: 'Already booked' });

    let vendorUserId = null;
    if (enquiry.targetType === 'Venue' || enquiry.targetType === 'venue') {
      const venue = await WeddingVenue.findById(enquiry.targetId);
      if (venue) vendorUserId = venue.vendor;
    } else {
      const vendor = await WeddingVendor.findById(enquiry.targetId);
      if (vendor) vendorUserId = vendor.user;
    }

    if (!vendorUserId) return res.status(400).json({ success: false, message: 'Vendor not found' });

    // Fetch settings to get dynamic fees
    const settings = await WeddingPlatformSettings.findOne() || { 
      vendorCommission: 499, platformFee: 499,
      platformFeeType: 'fixed', vendorCommissionType: 'fixed'
    };
    
    const parsedBookingAmount = Number(bookingAmount) || 0;
    
    let calculatedPlatformFee = settings.platformFee;
    if (settings.platformFeeType === 'percentage') {
      calculatedPlatformFee = Math.round(parsedBookingAmount * (settings.platformFee / 100));
    }

    let calculatedVendorCommission = settings.vendorCommission;
    if (settings.vendorCommissionType === 'percentage') {
      calculatedVendorCommission = Math.round(parsedBookingAmount * (settings.vendorCommission / 100));
    }

    // Vendor Wallet Deduction Logic
    let wallet = await VendorWallet.findOne({ vendorUser: vendorUserId });
    if (!wallet) {
      wallet = await VendorWallet.create({
        vendorUser: vendorUserId,
        balance: 0,
        transactions: []
      });
    }

    // Deduct from wallet balance (allowing negative balance)
    wallet.balance -= Number(calculatedVendorCommission);
    wallet.transactions.push({
      type: 'debit',
      amount: Number(calculatedVendorCommission),
      description: `Commission for Booking Enquiry ID: ${enquiry._id}`,
      date: new Date()
    });
    
    await wallet.save();

    // Record the financial transaction details for the Admin Dashboard
    enquiry.status = 'Booked';
    enquiry.paymentStatus = 'Paid';
    enquiry.commissionAmount = calculatedVendorCommission;
    enquiry.platformFee = calculatedPlatformFee;
    enquiry.actualAmount = calculatedPlatformFee; 
    enquiry.bookingAmount = parsedBookingAmount;
    
    await enquiry.save();

    // Push Notifications: Booking confirm hone ke baad vendor aur admin ko batao
    sendWeddingNotification(
      vendorUserId,
      'vendor',
      {
        title: '🎉 Booking Confirmed!',
        body: `${enquiry.name} ki booking confirm ho gayi! Commission: ₹${calculatedVendorCommission}`
      },
      { type: 'booking_confirmed', url: '/wedding/vendor/leads', enquiryId: String(enquiry._id) }
    ).catch(() => {});

    sendWeddingNotificationToAdmins(
      {
        title: '💰 Booking & Payment Complete',
        body: `${enquiry.name} ki booking confirmed. Platform fee: ₹${calculatedPlatformFee}, Commission: ₹${calculatedVendorCommission}`
      },
      { type: 'booking_confirmed', url: '/wedding/admin/enquiries', enquiryId: String(enquiry._id) }
    ).catch(() => {});

    res.status(200).json({ success: true, message: 'Booking confirmed and commission deducted!', enquiry });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
