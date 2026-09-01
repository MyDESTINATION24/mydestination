import ReferralCode from '../modules/referral/models/ReferralCode.js';
import User from '../modules/user/models/User.js';
import { Driver } from '../modules/taxi/driver/models/Driver.js';
import { generateReferralCode } from '../utils/publicIds.js';

/**
 * Referral codes are issued by three separate flows -- hotel signup (the
 * ReferralCode collection), taxi user signup (users.referralCode) and driver
 * onboarding (drivers.referralCode). Each used to generate and look up codes
 * only within its own store, so the same code could be handed to two different
 * people, and a code issued by one flow was unrecognisable to the others.
 *
 * This module is the single place that knows about all three.
 */

export const normalizeReferralCode = (value = '') => String(value || '').trim().toUpperCase();

/** True if the code is already in use by ANY of the three stores. */
export const isReferralCodeTaken = async (code) => {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return false;

  const [inRegistry, onUser, onDriver] = await Promise.all([
    ReferralCode.exists({ code: normalized }),
    User.exists({ referralCode: normalized }),
    Driver.exists({ referralCode: normalized }),
  ]);

  return Boolean(inRegistry || onUser || onDriver);
};

/** A code guaranteed unique across every store, not just the caller's own. */
export const generateUniqueReferralCode = async (attempts = 10) => {
  for (let i = 0; i < attempts; i += 1) {
    const candidate = generateReferralCode();
    if (!(await isReferralCodeTaken(candidate))) return candidate;
  }
  // ~1.36e9 possible codes, so repeated collisions mean something is wrong.
  throw new Error(`Could not generate a unique referral code after ${attempts} attempts`);
};

/**
 * Records a code issued by the taxi or driver flow in the shared ReferralCode
 * collection, so it is redeemable everywhere rather than only inside the flow
 * that minted it. Idempotent.
 */
export const registerReferralCode = async ({ code, ownerId, ownerType, referralProgramId = null }) => {
  const normalized = normalizeReferralCode(code);
  if (!normalized || !ownerId || !ownerType) return null;

  return ReferralCode.findOneAndUpdate(
    { code: normalized },
    { $setOnInsert: { code: normalized, ownerId, ownerType, referralProgramId, usageCount: 0, isActive: true } },
    { upsert: true, new: true }
  );
};

/**
 * Resolves a code to its owner regardless of which flow issued it.
 * Returns null when the code is unknown or inactive.
 */
export const resolveReferralCode = async (code) => {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;

  const registered = await ReferralCode.findOne({ code: normalized, isActive: true });
  if (registered) {
    return {
      code: normalized,
      source: 'registry',
      ownerId: registered.ownerId,
      ownerType: registered.ownerType,
      referralCodeId: registered._id,
    };
  }

  const user = await User.findOne({ referralCode: normalized }).select('_id');
  if (user) {
    return { code: normalized, source: 'taxiUser', ownerId: user._id, ownerType: 'User', referralCodeId: null };
  }

  const driver = await Driver.findOne({ referralCode: normalized }).select('_id');
  if (driver) {
    return { code: normalized, source: 'driver', ownerId: driver._id, ownerType: 'TaxiDriver', referralCodeId: null };
  }

  return null;
};

export default {
  normalizeReferralCode,
  isReferralCodeTaken,
  generateUniqueReferralCode,
  registerReferralCode,
  resolveReferralCode,
};
