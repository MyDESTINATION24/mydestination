import mongoose from 'mongoose';

// Refresh tokens are stored HASHED. The raw value exists only in the client's
// storage and in the request that redeems it, so a dump of this collection does
// not hand anyone a working session.
//
// Redeemed rows are kept rather than deleted: if a used token is presented
// again it was replayed, and the whole family is revoked.
const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    // Whatever the access token's `sub` is -- User, Driver, Owner, ServiceStore
    // -- so one store covers every role.
    subjectId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    // Set when issued by rotating an older token, so a replay can be traced
    // back and the entire chain revoked.
    rotatedFrom: { type: String, default: null },
  },
  { timestamps: true },
);

// Expired rows clean themselves up.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken =
  mongoose.models.TaxiRefreshToken || mongoose.model('TaxiRefreshToken', refreshTokenSchema);

export default RefreshToken;
