import mongoose from 'mongoose';

const userAuthSessionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    // Wrong-guess counter. A 4-digit OTP is only 9000 possibilities, so without
    // a cap it can be walked through well inside the code's lifetime.
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

userAuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserAuthSession =
  mongoose.models.TaxiUserAuthSession ||
  mongoose.model('TaxiUserAuthSession', userAuthSessionSchema);
