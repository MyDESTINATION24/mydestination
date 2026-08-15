import mongoose from 'mongoose';

// A staff account has to belong to a centre, so staff cannot self-register --
// picking your own employer would let anyone attach themselves to any centre.
// The centre issues an invite for a specific number instead, and the account is
// only created when whoever holds that number proves it with an OTP.
const serviceCenterStaffInviteSchema = new mongoose.Schema(
  {
    serviceCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiServiceStore',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // The binding that matters: only this number can redeem the invite.
    // Indexed by the partial unique index below, not here -- declaring both
    // makes Mongoose warn about a duplicate index on the same field.
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiServiceCenterStaff',
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// One live invite per number. Redeemed and revoked ones are kept for history,
// so the uniqueness only covers those still open.
serviceCenterStaffInviteSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { redeemedAt: null, revokedAt: null },
  },
);

export const ServiceCenterStaffInvite =
  mongoose.models.TaxiServiceCenterStaffInvite ||
  mongoose.model('TaxiServiceCenterStaffInvite', serviceCenterStaffInviteSchema);

export default ServiceCenterStaffInvite;
