import mongoose from 'mongoose';

const driverLoginSessionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiDriver',
      required: true,
    },
    accountRole: {
      type: String,
      enum: ['driver', 'pooling', 'owner', 'bus_driver', 'service_center', 'service_center_staff'],
      default: 'driver',
      required: true,
    },
    // Set when a staff member is signing in against an invite rather than an
    // existing account. The account is created on successful OTP, so the invite
    // can only be redeemed by someone who controls the invited number.
    pendingStaffInviteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiServiceCenterStaffInvite',
      default: null,
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
    verifiedAt: {
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

driverLoginSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DriverLoginSession =
  mongoose.models.TaxiDriverLoginSession ||
  mongoose.model('TaxiDriverLoginSession', driverLoginSessionSchema);
