import emailService from '../../../services/emailService.js';
import { logOtpForDebug } from '../../../utils/otpDebugLog.js';
import notificationService from '../../../services/notificationService.js';
import Admin from '../../admin/models/Admin.js';
import User from '../../user/models/User.js';
import Partner from '../../partner/models/Partner.js';
import Otp from '../models/Otp.js';
import PropertyDocument from '../../hotel/models/PropertyDocument.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import smsService from '../../../utils/smsService.js';
import referralService from '../../../services/referralService.js';
import { uploadToCloudinary, deleteFromCloudinary, uploadBase64ToCloudinary } from '../../../utils/cloudinary.js';
import fs from 'fs';

// Opt-in test logins, e.g. for app-store review:
//   HOTEL_TEST_OTP_PHONES=9000000001,9000000002  HOTEL_TEST_OTP_CODE=482913
// Both must be set, and the code must be 6 digits that are not all one digit
// or a plain run like 123456.
const getTestOtpFor = (phone) => {
  const code = String(process.env.HOTEL_TEST_OTP_CODE || '').trim();
  if (!/^\d{6}$/.test(code) || /^(\d)\1{5}$/.test(code) || ['123456', '654321'].includes(code)) return null;
  const phones = String(process.env.HOTEL_TEST_OTP_PHONES || '')
    .split(',')
    .map((p) => p.replace(/\D/g, '').slice(-10))
    .filter(Boolean);
  return phones.includes(String(phone || '').replace(/\D/g, '').slice(-10)) ? code : null;
};

const MAX_OTP_ATTEMPTS = 5;

// Checks and consumes a code stored in the Otp collection for `phone`, issued
// for `purpose` (tempData.role). Wrong guesses count toward the same 5-attempt
// cap verifyOtp uses.
const consumeRegistrationOtp = async (phone, otp, purpose) => {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return { ok: false, status: 400, message: 'Please enter the 6-digit OTP sent to your phone' };
  }
  const record = await Otp.findOne({ phone });
  if (!record || record.expiresAt < Date.now() || record.tempData?.role !== purpose) {
    return { ok: false, status: 400, message: 'OTP has expired. Please request a new one.' };
  }
  const expected = Buffer.from(String(record.otp));
  const given = Buffer.from(otp);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    const attempts = Number(record.attempts || 0) + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: record._id });
      return { ok: false, status: 400, message: 'Too many wrong attempts. Please request a new OTP.' };
    }
    await Otp.updateOne({ _id: record._id }, { $set: { attempts } });
    return { ok: false, status: 400, message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - attempts} attempt(s) left.` };
  }
  // Single use: only the request that deletes it may proceed.
  const deleted = await Otp.deleteOne({ _id: record._id });
  if (deleted.deletedCount !== 1) {
    return { ok: false, status: 400, message: 'OTP has already been used. Please request a new one.' };
  }
  return { ok: true, tempData: record.tempData };
};

/**
 * @desc    Send an OTP to a new phone number before it replaces the account's
 * @route   POST /api/auth/phone-change/send-otp
 * @access  Private
 */
export const sendPhoneChangeOtp = async (req, res) => {
  try {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }
    if (phone === req.user.phone) {
      return res.status(400).json({ message: 'This is already your phone number' });
    }
    const Model = req.user.role === 'partner' ? Partner : User;
    if (await Model.exists({ phone, _id: { $ne: req.user._id } })) {
      return res.status(409).json({ message: 'Phone number already in use' });
    }

    const otp = getTestOtpFor(phone) || crypto.randomInt(100000, 1000000).toString();
    await Otp.findOneAndUpdate(
      { phone },
      { phone, otp, attempts: 0, expiresAt: Date.now() + 10 * 60 * 1000, tempData: { role: 'phone_change', accountId: String(req.user._id) } },
      { upsert: true, new: true }
    );
    logOtpForDebug(phone, otp, 'auth/phone-change');
    if (!getTestOtpFor(phone)) {
      await smsService.sendOTP(phone, otp);
    }
    res.json({ success: true, message: 'OTP sent to the new number', expiresIn: 600 });
  } catch (error) {
    console.error('Phone Change OTP Error:', error);
    res.status(500).json({ message: 'Could not send OTP' });
  }
};

// Shared by every profile update that can change the phone number: the new
// number must be proven with an OTP sent to it, or anyone signed in could take
// over a number they don't own (and block its owner from registering).
export const verifyPhoneChange = async (account, newPhone, phoneOtp) => {
  const check = await consumeRegistrationOtp(newPhone, phoneOtp, 'phone_change');
  if (!check.ok) return check;
  if (check.tempData?.accountId !== String(account._id)) {
    return { ok: false, status: 400, message: 'OTP was not issued for this account' };
  }
  return { ok: true };
};

const generateToken = (id, role) => {
  // Customer/partner tokens never expire (users only get logged out manually),
  // but admin tokens do: a leaked admin token used to be valid forever.
  if (['admin', 'superadmin'].includes(String(role || '').toLowerCase())) {
    return jwt.sign({ id, sub: id, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
    });
  }
  return jwt.sign({ id, sub: id, role }, process.env.JWT_SECRET);
};

export const checkExists = async (req, res) => {
  try {
    const { phone, email, role = 'user' } = req.body;
    let Model = role === 'partner' ? Partner : User;

    if (phone) {
      const existingByPhone = await Model.findOne({ phone, isDeleted: false });
      if (existingByPhone) {
        return res.status(409).json({
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this phone number already exists.`,
          requiresLogin: true
        });
      }
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingByEmail = await Model.findOne({ email: normalizedEmail, isDeleted: false });
      if (existingByEmail) {
        return res.status(409).json({
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this email address already registered.`,
          requiresLogin: true
        });
      }
    }

    res.status(200).json({ success: true, message: 'Details available' });
  } catch (error) {
    console.error('Check Exists Error:', error);
    res.status(500).json({ message: 'Server error during validation' });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { phone, type, role = 'user', email: rawEmail } = req.body; // type: 'login' or 'register'
    console.log(`[AUTH] sendOtp called with phone=${phone}, type=${type}, role=${role}`);
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    let user;
    let Model = role === 'partner' ? Partner : User;

    // FOR LOGIN: Check if user exists & is not blocked BEFORE sending OTP
    if (type === 'login') {
      user = await Model.findOne({ phone });
      if (!user) {
        if (role === 'partner') {
          return res.status(404).json({ message: 'Partner account not found. Please register first.' });
        }
        return res.status(404).json({
          message: 'Account not found. Please create an account first.',
          requiresRegistration: true
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by admin. Please contact support.',
          isBlocked: true
        });
      }

      if (user.isDeleted) {
        // We allow them to request OTP. Re-activation happens in verifyOtp.
        console.log(`[AUTH] Deleted account ${phone} requesting OTP for re-activation.`);
      }
    }

    // FOR REGISTER: Check if phone or email already exists
    if (type === 'register') {
      // Basic formatting check
      if (!phone || phone.length !== 10) {
        return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
      }

      // 1. Check Phone
      const existingByPhone = await Model.findOne({ phone, isDeleted: false });
      if (existingByPhone) {
        return res.status(409).json({
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this phone number already exists. Please login instead.`,
          requiresLogin: true
        });
      }

      // 2. Check Email (if provided)
      if (email) {
        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        const existingByEmail = await Model.findOne({ email, isDeleted: false });
        if (existingByEmail) {
          return res.status(409).json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this email address already registered. Please use another email or login.`,
            requiresLogin: true
          });
        }
      }
    }

    // A hardcoded list of real numbers used to accept 123456 here, in
    // production, so anyone who knew a number could sign in as its owner --
    // partners included. Test numbers are now opt-in from the environment
    // (HOTEL_TEST_OTP_PHONES + HOTEL_TEST_OTP_CODE) and off unless both are set.
    const testOtp = getTestOtpFor(phone);
    const isTestNumber = Boolean(testOtp);

    const otp = testOtp || crypto.randomInt(100000, 1000000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    logOtpForDebug(phone, otp, 'auth/send-otp');

    if (user) {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Store in Otp collection for new/unregistered users
      await Otp.findOneAndUpdate(
        { phone },
        { phone, otp, expiresAt: otpExpires, tempData: { role, type } },
        { upsert: true, new: true }
      );
    }

    // Send SMS only for non-test numbers
    if (!isTestNumber) {
      await smsService.sendOTP(phone, otp);
    } else {
      console.log(`🧪 Test Number Detected: ${phone} - using the configured test OTP`);
    }

    res.status(200).json({
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
};

export const registerPartner = async (req, res) => {
  try {
    const {
      full_name,
      email: rawEmail,
      phone,
      aadhaar_number,
      aadhaar_front,
      aadhaar_back,
      pan_number,
      pan_card_image,
      termsAccepted
    } = req.body;

    console.log(`[AUTH] Partner Registration payload:`, { phone, email: rawEmail });

    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';
    const getUrl = (val) => (val && typeof val === 'object' ? val.url : val);

    const aadhaarFrontUrl = getUrl(aadhaar_front);
    const aadhaarBackUrl = getUrl(aadhaar_back);
    const panImageUrl = getUrl(pan_card_image);

    // Validation
    if (!full_name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    if (!aadhaar_number || !aadhaarFrontUrl || !aadhaarBackUrl) {
      return res.status(400).json({ message: 'Aadhaar details and documents are required' });
    }

    if (!pan_number || !panImageUrl) {
      return res.status(400).json({ message: 'PAN details are required' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept terms and conditions' });
    }

    if (typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
    }

    // Registration used to need no proof of the phone at all, and it restored
    // a deleted partner account (wallet, properties) to whoever re-registered
    // its number or email. The number must now be verified with the OTP sent
    // by /send-otp (type 'register', role 'partner').
    const otpCheck = await consumeRegistrationOtp(phone, req.body?.otp, 'partner');
    if (!otpCheck.ok) {
      return res.status(otpCheck.status).json({ message: otpCheck.message, requiresOtp: true });
    }

    // Check if partner already exists
    const existingPartners = await Partner.find({ $or: [{ email }, { phone }] });
    if (existingPartners.some((p) => !p.isDeleted)) {
      return res.status(409).json({ message: 'Partner with this email or phone already exists' });
    }
    // Only the owner of the account's own phone number may restore it.
    let partner = existingPartners.find((p) => p.isDeleted && p.phone === phone) || null;
    if (!partner && existingPartners.length > 0) {
      return res.status(409).json({ message: 'Partner with this email or phone already exists' });
    }

    const isRestoration = !!(partner && partner.isDeleted);

    // Generate random password for partner
    const randomPassword = crypto.randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    if (isRestoration) {
      // Re-fill the deleted record
      partner.isDeleted = false;
      partner.name = full_name;
      partner.email = email;
      partner.password = passwordHash;
      partner.role = 'partner';
      partner.isPartner = true;
      partner.partnerApprovalStatus = 'pending';
      partner.isVerified = false;
      partner.ownerName = full_name;
      partner.aadhaarNumber = aadhaar_number;
      partner.aadhaarFront = aadhaarFrontUrl;
      partner.aadhaarBack = aadhaarBackUrl;
      partner.panNumber = pan_number;
      partner.panCardImage = panImageUrl;
      partner.address = {};
      partner.termsAccepted = termsAccepted;
      console.log(`[AUTH] Deleted partner account ${partner._id} restored during registration.`);
    } else {
      // Create fresh record
      partner = new Partner({
        name: full_name,
        email,
        phone,
        password: passwordHash,
        role: 'partner',
        isPartner: true,
        partnerApprovalStatus: 'pending',
        isVerified: false,
        ownerName: full_name,
        aadhaarNumber: aadhaar_number,
        aadhaarFront: aadhaarFrontUrl,
        aadhaarBack: aadhaarBackUrl,
        panNumber: pan_number,
        panCardImage: panImageUrl,
        address: {},
        termsAccepted
      });
    }

    await partner.save();

    // Referral processing removed for partners

    // Partner referral code generation removed

    // Send notification to admins
    notificationService.sendToAdmins({
      title: 'New Partner Registration',
      body: `${full_name} has registered as a partner and is pending approval.`
    }, { type: 'partner_registration', partnerId: partner._id }).catch(err => console.error('Failed to notify admins:', err));

    // Send welcome email to partner
    if (email) {
      emailService.sendPartnerRegistrationEmail(partner).catch(err =>
        console.error('Failed to send partner registration email:', err)
      );
    }

    const token = generateToken(partner._id, partner.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      token,
      user: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        role: partner.role,
        isPartner: true,
        partnerApprovalStatus: partner.partnerApprovalStatus,
        aadhaarNumber: partner.aadhaarNumber,
        aadhaarFront: partner.aadhaarFront,
        aadhaarBack: partner.aadhaarBack,
        panNumber: partner.panNumber,
        panCardImage: partner.panCardImage
      }
    });

  } catch (error) {
    console.error('Register Partner Error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email or Phone already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    // ... (existing verification logic)
    const { phone, otp, name, email, role = 'user', referralCode } = req.body;

    // ... (logic to verify OTP)
    // Select Model based on Role
    let Model = role === 'partner' ? Partner : User;

    // 1. Find User (if any)
    let user = await Model.findOne({ phone }).select('+otp +otpExpires +otpAttempts');

    // 2. Find registration-flow OTP Record (if any)
    const otpRecord = await Otp.findOne({ phone });

    let isRegistration = false;
    let verified = false;

    // Try verifying with User OTP (Existing User/Login Flow)
    if (user && user.otp && user.otp === otp && user.otpExpires >= Date.now()) {
      verified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;

      // If found but deleted, this is a direct login-based re-activation
      if (user.isDeleted) {
        user.isDeleted = false;
        console.log(`[AUTH] Account ${user._id} re-activated via Login flow.`);
      }
    }
    // Try verifying with Otp Record (Registration Flow / Deleted Account Recovery)
    else if (otpRecord && otpRecord.otp === otp && otpRecord.expiresAt >= Date.now()) {
      if (otpRecord.tempData && otpRecord.tempData.role && otpRecord.tempData.role !== role) {
        return res.status(400).json({ message: 'Invalid role context.' });
      }
      verified = true;

      if (user) {
        // Exists but was deleted (handled via registration path)
        if (user.isDeleted) {
          user.isDeleted = false;
          console.log(`[AUTH] Account ${user._id} re-activated via Registration flow.`);
        }
      } else {
        // Truly a new user
        isRegistration = true;
      }

      await Otp.deleteOne({ phone });
    }

    if (!verified) {
      const MAX_OTP_ATTEMPTS = 5;
      let attemptsLeft = null;

      if (user && user.otp) {
        user.otpAttempts = Number(user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
          user.otp = undefined;
          user.otpExpires = undefined;
          user.otpAttempts = 0;
        } else {
          attemptsLeft = MAX_OTP_ATTEMPTS - user.otpAttempts;
        }
        await user.save();
      } else if (otpRecord) {
        const attempts = Number(otpRecord.attempts || 0) + 1;
        if (attempts >= MAX_OTP_ATTEMPTS) {
          await Otp.deleteOne({ phone });
        } else {
          attemptsLeft = MAX_OTP_ATTEMPTS - attempts;
          await Otp.updateOne({ phone }, { $set: { attempts } });
        }
      }

      return res.status(400).json({
        message: attemptsLeft === null
          ? 'Invalid OTP or OTP has expired. Please request OTP again.'
          : `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left before you need a new code.`,
      });
    }

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by admin. Please contact support.',
          isBlocked: true
        });
      }
    } else {
      // Create new user (Truly first time)
      if (req.query.verifyOnly === 'true') {
        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
      }

      // Check if this was a LOGIN attempt but user doesn't exist
      if (otpRecord.tempData?.type === 'login') {
        await Otp.deleteOne({ phone });
        return res.status(404).json({
          message: 'Account not found. Please create an account first.',
          requiresRegistration: true
        });
      }

      // REGISTRATION FLOW - Name is required
      if (!name) {
        return res.status(400).json({ message: 'Name is required for registration.' });
      }
      if (email) {
        const emailExists = await Model.findOne({ email });
        if (emailExists) return res.status(409).json({ message: 'Email already exists.' });
      }

      user = new User({
        name,
        phone,
        email,
        role: 'user',
        isVerified: true,
        password: await bcrypt.hash(Math.random().toString(36), 10)
      });
      isRegistration = true;
      await Otp.deleteOne({ phone });
    }

    // Save/Update User
    if (isRegistration || (role === 'user' && (name || email))) {
      // ... (update name/email logic)
      if (name) user.name = name;
      if (email) {
        if (email !== user.email) {
          const emailExists = await Model.findOne({ email, _id: { $ne: user._id } });
          if (emailExists) return res.status(409).json({ message: 'Email already in use.' });
          user.email = email;
        }
      }
      user.isVerified = true;
    }

    // ... (partner check logic)

    await user.save();

    // NOTIFICATION: New Login Alert
    if (!isRegistration && user.email) {
      emailService.sendLoginAlertEmail(user, req.headers['user-agent'] || 'Rukkoin App/Web').catch(e => console.error(e));
    }

    // NOTIFICATION & EMAIL TRIGGERS (USER REGISTRATION)
    if (isRegistration && role === 'user') {
      // Send Welcome Email
      if (user.email) {
        emailService.sendUserWelcomeEmail(user).catch(err => console.error('Failed to send welcome email:', err));
      }

      // Send Welcome Notification (Stored + Push if token exists later)
      notificationService.sendToUser(user._id, {
        title: 'Welcome aboard!',
        body: 'Find your perfect stay today.'
      }, { type: 'welcome' }, 'user').catch(err => console.error('Failed to send welcome notification:', err));

      // REFERRAL: Process Signup Referral
      if (referralCode) {
        console.log(`[REFERRAL_DEBUG] User signup with code: ${referralCode}`);
        const { resolveReferralCode } = await import('../../../services/referralRegistry.js');
        const validCode = await resolveReferralCode(referralCode);
        if (!validCode) {
          return res.status(400).json({ message: 'Invalid referral code provided' });
        }
        referralService.processReferralSignup(user, referralCode).catch(err => console.error('[REFERRAL_DEBUG] Referral Signup Error:', err));
      }

      // REFERRAL: Auto-generate code for new user
      referralService.generateCodeForUser(user).catch(err => console.error('Code Gen Error:', err));

      // NOTIFICATION: Notify Admin of new user
      notificationService.sendToAdmins({
        title: 'New User Registration 👤',
        body: `${user.name} has joined the platform.`
      }, { type: 'new_user_registration', userId: user._id }).catch(err => console.error('Admin User alert failed:', err));

    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: isRegistration ? 'Registration successful' : 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPartner: user.isPartner || (role === 'partner'),
        partnerApprovalStatus: user.partnerApprovalStatus,
        profileImage: user.profileImage,
        address: user.address,
        aadhaarNumber: user.aadhaarNumber,
        panNumber: user.panNumber,
        createdAt: user.createdAt,
        partnerSince: user.partnerSince,
        isBlocked: user.isBlocked,
        registrationStep: user.registrationStep
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// ... (registerPartner)

export const verifyPartnerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // 1. Check OTP in Otp collection
    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid request or OTP expired. Please register again.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // 2. Find existing Partner (they were saved during registration)
    const partner = await Partner.findOne({ phone });
    if (!partner) {
      return res.status(404).json({ message: 'Partner registration not found. Please register again.' });
    }

    if (partner.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by admin. Please contact support.',
        isBlocked: true
      });
    }

    if (partner.isVerified) {
      // Optional: allow re-verification or just proceed
    }

    // 3. Update Partner as Verified
    partner.isVerified = true;
    await partner.save();

    // 4. Cleanup OTP
    await Otp.deleteOne({ phone });

    // NOTIFICATION & EMAIL TRIGGERS (PARTNER REGISTRATION)
    if (partner.email) {
      emailService.sendPartnerRegistrationEmail(partner).catch(err => console.error('Failed to send partner confirmation email:', err));
    }

    // Notify Admins
    notificationService.sendToAdmins({
      title: `New Partner Registration: ${partner.name}`,
      body: 'Review needed.'
    }, { type: 'partner_registration', partnerId: partner._id }).catch(err => console.error('Failed to notify admins:', err));

    const token = generateToken(partner._id, partner.role);

    res.status(200).json({
      success: true,
      message: 'Partner registration completed successfully.',
      token,
      user: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        role: partner.role,
        isPartner: partner.isPartner,
        partnerApprovalStatus: partner.partnerApprovalStatus,
        profileImage: partner.profileImage,
        address: partner.address,
        aadhaarNumber: partner.aadhaarNumber,
        panNumber: partner.panNumber,
        createdAt: partner.createdAt,
        partnerSince: partner.partnerSince
      }
    });

  } catch (error) {
    console.error('Verify Partner OTP Error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email or Phone already exists for this role.' });
    }
    res.status(500).json({ message: 'Server error verifying partner OTP' });
  }
};

/**
 * @desc    Admin Login with Email & Password
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Must be strings. A JSON object here used to reach findOne as a query
    // fragment, and only bcrypt.compare throwing on a non-string kept it from
    // matching an arbitrary admin.
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated' });
    }

    const isMatched = await bcrypt.compare(password, admin.password);
    if (!isMatched) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    // NOTIFICATION: Admin Login Alert
    emailService.sendLoginAlertEmail(admin, req.headers['user-agent'] || 'Admin Dashboard').catch(e => console.error(e));

    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

/**
 * @desc    Get Current User/Admin/Partner Profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // req.user is already populated by authMiddleware (which checks User, Partner, Admin)
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPartner: user.isPartner || false,
        partnerApprovalStatus: user.partnerApprovalStatus,
        address: user.address,
        profileImage: user.profileImage,
        aadhaarNumber: user.aadhaarNumber,
        aadhaarFront: user.aadhaarFront,
        aadhaarBack: user.aadhaarBack,
        panNumber: user.panNumber,
        panCardImage: user.panCardImage,
        partnerSince: user.partnerSince,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update User Profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, profileImage, profileImagePublicId, aadhaarNumber, aadhaarFront, aadhaarBack, panNumber, panCardImage } = req.body;
    const currentUser = req.user; // From middleware

    // Determine Model based on role
    let Model = currentUser.role === 'partner' ? Partner : User;
    if (['admin', 'superadmin'].includes(currentUser.role)) {
      // Admins use updateAdminProfile usually, but if they hit this:
      Model = Admin;
    }

    let user = await Model.findById(currentUser._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      if (email !== user.email) {
        const existingUser = await Model.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) {
          return res.status(409).json({ message: 'Email already in use' });
        }
        user.email = email;
      }
    }
    if (phone) {
      if (phone !== user.phone) {
        if (typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
          return res.status(400).json({ message: 'Valid 10-digit phone number is required' });
        }
        const existingUser = await Model.findOne({ phone, _id: { $ne: user._id } });
        if (existingUser) {
          return res.status(409).json({ message: 'Phone number already in use' });
        }
        // Admins change their own number from the admin panel without OTP.
        if (Model !== Admin) {
          const phoneCheck = await verifyPhoneChange(user, phone, req.body.phoneOtp);
          if (!phoneCheck.ok) {
            return res.status(phoneCheck.status).json({ message: phoneCheck.message, requiresPhoneOtp: true });
          }
        }
        user.phone = phone;
      }
    }

    if (aadhaarNumber !== undefined) user.aadhaarNumber = aadhaarNumber;
    if (aadhaarFront !== undefined) user.aadhaarFront = aadhaarFront;
    if (aadhaarBack !== undefined) user.aadhaarBack = aadhaarBack;
    if (panNumber !== undefined) user.panNumber = panNumber;
    if (panCardImage !== undefined) user.panCardImage = panCardImage;

    if (user.role === 'partner' || currentUser.role === 'partner') {
      user.partnerApprovalStatus = 'pending';
    }

    if (address) {
      user.address = {
        street: address.street || user.address?.street || '',
        city: address.city || user.address?.city || '',
        state: address.state || user.address?.state || '',
        zipCode: address.zipCode || user.address?.zipCode || '',
        country: address.country || user.address?.country || 'India',
        coordinates: {
          lat: address.coordinates?.lat || user.address?.coordinates?.lat,
          lng: address.coordinates?.lng || user.address?.coordinates?.lng
        }
      };
    }

    if (profileImage !== undefined) user.profileImage = profileImage;
    if (profileImagePublicId !== undefined) user.profileImagePublicId = profileImagePublicId;

    await user.save();

    // NOTIFICATION: Security alert for profile update
    if (user.email) {
      emailService.sendSecurityAlertEmail(user, 'Profile Details').catch(e => console.error(e));
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPartner: user.isPartner || false,
        partnerApprovalStatus: user.partnerApprovalStatus,
        address: user.address,
        profileImage: user.profileImage,
        aadhaarNumber: user.aadhaarNumber,
        aadhaarFront: user.aadhaarFront,
        aadhaarBack: user.aadhaarBack,
        panNumber: user.panNumber,
        panCardImage: user.panCardImage,
        partnerSince: user.partnerSince,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * @desc    Update Admin Profile
 * @route   PUT /api/auth/admin/update-profile
 * @access  Private (Admin/Superadmin)
 */
export const updateAdminProfile = async (req, res) => {
  // ... (Keep existing implementation)
  try {
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins can update this profile' });
    }

    const { name, email, phone } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (name) {
      admin.name = name;
    }

    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      admin.email = email;
    }

    if (phone && phone !== admin.phone) {
      const existingPhone = await Admin.findOne({ phone, _id: { $ne: admin._id } });
      if (existingPhone) {
        return res.status(409).json({ message: 'Phone number already in use' });
      }
      admin.phone = phone;
    }

    await admin.save();

    // NOTIFICATION: Security alert for Admin
    if (admin.email) {
      emailService.sendSecurityAlertEmail(admin, 'Admin Profile Details').catch(e => console.error(e));
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    console.error('Update Admin Profile Error:', error);
    res.status(500).json({ message: 'Server error updating admin profile' });
  }
};

/**
 * @desc    Update Admin Password
 * @route   PUT /api/auth/admin/update-password
 * @access  Private (Admin/Superadmin)
 */
export const updateAdminPassword = async (req, res) => {
  try {
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins can update password' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const admin = await Admin.findById(req.user.id).select('+password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    // NOTIFICATION: Security alert for Admin Password Change
    if (admin.email) {
      emailService.sendSecurityAlertEmail(admin, 'Admin Password').catch(e => console.error(e));
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update Admin Password Error:', error);
    res.status(500).json({ message: 'Server error updating admin password' });
  }
};



/**
 * @desc    Upload Documents (Partner Registration)
 * @route   POST /api/auth/partner/upload-docs
 * @access  Public
 */
export const uploadDocs = async (req, res) => {
  try {
    // Handle both single file (req.file) and multiple files (req.files)
    const filesToUpload = req.files || (req.file ? [req.file] : []);

    console.log(`[Upload Docs] Received ${filesToUpload.length} files`);

    if (!filesToUpload || filesToUpload.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    const uploadPromises = filesToUpload.map(file =>
      uploadToCloudinary(file.path, 'partner-documents')
    );

    const results = await Promise.all(uploadPromises);

    const files = results.map(result => ({
      url: result.url,
      publicId: result.publicId
    }));

    console.log(`[Upload Docs] Successfully uploaded ${files.length} documents`);

    res.json({ success: true, files });
  } catch (error) {
    console.error('Upload Docs Error:', error);
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};

/**
 * @desc    Delete Document from Cloudinary
 * @route   POST /api/auth/partner/delete-doc
 * @access  Public
 */
export const deleteDoc = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // This route is unauthenticated because a partner removes a document
    // mid-registration, before an account exists. It used to delete ANY public
    // id, and public ids are visible in every image URL the site serves -- so
    // scraping the site was enough to wipe its whole media library. Confine it
    // to the folder partner uploads actually land in.
    const PARTNER_DOCS_PREFIX = 'rukkoin/partner-documents/';

    if (typeof publicId !== 'string' || !publicId.startsWith(PARTNER_DOCS_PREFIX) || publicId.includes('..')) {
      return res.status(403).json({ message: 'Only partner documents can be removed here' });
    }

    // Even inside that folder, anyone could delete a registered partner's
    // KYC documents (or a profile photo, which uses the same upload). A file
    // still referenced by an account is not a mid-registration upload, so it
    // is left alone; replacing it goes through the account's own profile.
    const escaped = publicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ref = { $regex: escaped };
    // Only query fields the schema has: strictQuery would drop unknown ones and
    // leave {} conditions that match every document.
    const referencedBy = (Model) => {
      const conditions = ['aadhaarFront', 'aadhaarBack', 'panCardImage', 'profileImage']
        .filter((field) => Model.schema.path(field))
        .map((field) => ({ [field]: ref }));
      if (Model.schema.path('profileImagePublicId')) conditions.push({ profileImagePublicId: publicId });
      return conditions.length ? Model.exists({ $or: conditions }) : null;
    };
    const referenced = await Promise.all([
      referencedBy(Partner),
      referencedBy(User),
      PropertyDocument.exists({ 'documents.fileUrl': ref }),
    ]);
    if (referenced.some(Boolean)) {
      return res.status(403).json({ message: 'This document is in use and cannot be removed here' });
    }

    const result = await deleteFromCloudinary(publicId);
    res.json(result);
  } catch (error) {
    console.error('Delete Doc Error:', error);
    res.status(500).json({ message: error.message || 'Delete failed' });
  }
};

/**
 * @desc    Upload Documents via Base64 (Flutter Camera)
 * @route   POST /api/auth/partner/upload-docs-base64
 * @access  Public
 */
export const uploadDocsBase64 = async (req, res) => {
  try {
    let { images } = req.body;

    // Handle single image sent not in an array (Flutter bridge compatibility)
    if (images && !Array.isArray(images)) {
      images = [images];
    }

    console.log(`[Upload Docs Base64] Received ${images ? images.length : 0} image items`);

    if (!images || images.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }
    // Public endpoint: bound what one request can push to Cloudinary.
    const MAX_IMAGES = 10;
    const MAX_BASE64_CHARS = 14 * 1024 * 1024; // ~10MB decoded
    if (images.length > MAX_IMAGES) {
      return res.status(400).json({ message: `At most ${MAX_IMAGES} images per upload` });
    }
    if (images.some((img) => {
      const data = typeof img === 'object' && img !== null ? img.base64 : img;
      return typeof data !== 'string' || data.length > MAX_BASE64_CHARS;
    })) {
      return res.status(400).json({ message: 'Each image must be under 10MB' });
    }

    const uploadPromises = images.map(async (img, index) => {
      // Support both {base64: '...'} object and raw '...' base64 string
      const base64Data = typeof img === 'object' ? img.base64 : img;
      const fileName = typeof img === 'object' ? img.fileName : null;

      if (!base64Data) {
        throw new Error(`Image ${index + 1} missing base64 data`);
      }

      // Generate unique publicId with random suffix to prevent collisions during batch uploads
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const publicId = fileName
        ? `${Date.now()}-${randomSuffix}-${fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')}`
        : `${Date.now()}-${randomSuffix}-doc-${index}`;

      return uploadBase64ToCloudinary(base64Data, 'partner-documents', publicId);
    });

    const results = await Promise.all(uploadPromises);

    const files = results.map(result => ({
      url: result.url,
      publicId: result.publicId
    }));

    console.log(`[Upload Docs Base64] Successfully uploaded ${files.length} documents`);

    res.json({ success: true, files });
  } catch (error) {
    console.error('Upload Docs Base64 Error:', error);
    res.status(500).json({ message: error.message || 'Base64 doc upload failed' });
  }
};


/**
 * @desc    Upload Profile Image
 * @route   POST /api/auth/upload-profile-image
 * @access  Private
 */
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const currentUser = req.user;
    let Model;
    if (currentUser.role === 'partner' || currentUser.role === 'vendor') {
      Model = Partner;
    } else if (['admin', 'superadmin'].includes(currentUser.role)) {
      Model = Admin;
    } else {
      Model = User;
    }

    const user = await Model.findById(currentUser._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'profiles');

    // Delete old image if exists
    if (user.profileImagePublicId) {
      await deleteFromCloudinary(user.profileImagePublicId);
    }

    // Update database
    user.profileImage = result.url;
    user.profileImagePublicId = result.public_id;
    await user.save();

    // Clean up local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });

  } catch (error) {
    console.error('Upload Profile Image Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload profile image' });
  }
};

export const validateReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode || !referralCode.trim()) {
      return res.status(400).json({ valid: false, message: 'Referral code is required' });
    }

    // Resolves against the hotel registry, taxi users and drivers alike, so a
    // code is accepted wherever it was issued.
    const { resolveReferralCode } = await import('../../../services/referralRegistry.js');
    const code = await resolveReferralCode(referralCode);

    if (!code) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    return res.status(200).json({ valid: true, message: 'Valid referral code' });
  } catch (error) {
    console.error('Validate Referral Code Error:', error);
    return res.status(500).json({ valid: false, message: 'Server error checking referral code' });
  }
};
