import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      select: false,
    },
    role: {
      type: String,
      default: 'superadmin',
      trim: true,
    },
    admin_type: {
      type: String,
      enum: ['superadmin', 'subadmin'],
      default: 'superadmin',
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    service_location_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaxiServiceLocation',
        },
      ],
      default: [],
    },
    zone_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaxiZone',
        },
      ],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      trim: true,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    // Wrong-guess counter for the reset OTP. Six digits is 900k options, but
    // without a cap an attacker just hammers the 10-minute window until one
    // lands -- and a hit gives full admin access.
    resetPasswordAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { 
    timestamps: true,
  },
);

adminSchema.index({ admin_type: 1, active: 1 });

export const Admin = mongoose.models.TaxiAdmin || mongoose.model('TaxiAdmin', adminSchema);
