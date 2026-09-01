import mongoose from 'mongoose';
import { generateUserId } from '../../../utils/publicIds.js';

const userSchema = new mongoose.Schema({
  // Public-facing user identifier shown in the app / support flows (e.g. BP-12AB34CD)
  publicId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true, // Allows null/undefined values to duplicate (i.e., multiple users without email)
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'USER', 'partner', 'vendor'],
    default: 'user'
  },
  isPartner: {
    type: Boolean,
    default: false
  },
  partnerApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  partnerSince: {
    type: Date
  },
  // Platform-based FCM tokens (app and web)
  fcmTokens: {
    app: {
      type: String,
      default: null
    },
    web: {
      type: String,
      default: null
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  savedHotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  aadhaarNumber: { type: String, trim: true },
  aadhaarFront: { type: String }, // URL
  aadhaarBack: { type: String }, // URL
  panNumber: { type: String, trim: true },
  panCardImage: { type: String }, // URL
  termsAccepted: { type: Boolean, default: false },

  // Status tracking
  registrationStep: {
    type: Number,
    default: 1 // 1: Basic, 2: Details, 3: Completed
  },
  otp: {
    type: String,
    select: false // Do not return OTP in queries by default
  },
  otpExpires: {
    type: Date,
    select: false
  },
  profileImage: {
    type: String,
    default: null
  },
  profileImagePublicId: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Vendor specific fields
  category: { type: String },
  experience: { type: Number },
  services: [{ 
    name: { type: String },
    price: { type: Number }
  }],
  basicPackage: { type: Number },
  premiumPackage: { type: Number },
  location: { type: String },
  kycStatus: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  },
  // Vendor Subscription fields
  hasActiveSubscription: { type: Boolean, default: false },
  subscriptionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeddingSubscriptionPlan' },
  leadsRemaining: { type: Number, default: 0 },
  subscriptionExpiryDate: { type: Date },

  // --- Taxi Specific Fields ---
  countryCode: { type: String, default: '+91', trim: true },
  dateOfBirth: { type: Date, default: null },
  anniversary: { type: Date, default: null },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say', ''], default: '' },
  referralCode: { type: String, default: '', trim: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  referralCount: { type: Number, default: 0, min: 0 },
  referredRideCompletionCount: { type: Number, default: 0, min: 0 },
  referralRewardGrantedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true, index: true },
  active: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletion_reason: { type: String, default: '', trim: true },
  deletionRequest: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none', index: true },
    reason: { type: String, default: '', trim: true },
    requestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    adminNote: { type: String, default: '', trim: true }
  },
  currentRideId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiRide', default: null },
  addresses: [{
    label: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
    street: { type: String, trim: true },
    additionalDetails: { type: String, default: '', trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] }
    },
    isDefault: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Assign a public ID on creation, and lazily backfill it for users created
// before this field existed (any save() on such a doc fills it in).
// Declared with no `next` parameter so mongoose runs it synchronously; taking
// `next` here made kareem invoke it without a callback, throwing on every save.
userSchema.pre('validate', function assignPublicId() {
  if (!this.publicId) this.publicId = generateUserId();
});

// Compound indexes to allow same phone/email for different roles
userSchema.index({ phone: 1, role: 1 }, { unique: true });
// Partial index: only enforce uniqueness when email is not null
userSchema.index(
  { email: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } }
  }
);

const User = mongoose.model('User', userSchema);
export default User;

