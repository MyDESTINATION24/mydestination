import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';

// One row per gateway payment that has moved money inside the app (wallet
// credit, booking confirmation, tip...). The unique (provider, paymentId)
// index is the global idempotency guard: per-wallet transaction arrays are
// sliced to the last 50 entries and scoped to one owner, so they could not
// stop a payment id from being replayed later or against another account.
//
// status 'initiated' rows are written when we create a gateway session whose
// id we choose ourselves (PhonePe merchantTransactionId), so verify can prove
// the session was opened by the caller before crediting anything.
const processedPaymentSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      default: '',
      trim: true,
    },
    ownerId: {
      type: String,
      default: '',
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reference: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'processed'],
      default: 'processed',
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

processedPaymentSchema.index({ provider: 1, paymentId: 1 }, { unique: true });

export const ProcessedPayment =
  mongoose.models.TaxiProcessedPayment ||
  mongoose.model('TaxiProcessedPayment', processedPaymentSchema);

// autoIndex is disabled in production (config/database.js), and without the
// unique index this whole guard is a no-op, so build it explicitly once.
let indexesReady = null;
const ensureIndexes = () => {
  if (!indexesReady) {
    indexesReady = ProcessedPayment.createIndexes().catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  return indexesReady;
};

const normalizeKey = ({ provider, paymentId }) => ({
  provider: String(provider || '').trim(),
  paymentId: String(paymentId || '').trim(),
});

export const recordInitiatedPayment = async ({ provider, paymentId, purpose = '', ownerId = '', amount = 0, reference = '' }) => {
  await ensureIndexes();
  const key = normalizeKey({ provider, paymentId });
  return ProcessedPayment.create({
    ...key,
    purpose,
    ownerId: String(ownerId || ''),
    amount: Math.max(0, Number(amount) || 0),
    reference: String(reference || ''),
    status: 'initiated',
  });
};

export const findProcessedPayment = async ({ provider, paymentId }) =>
  ProcessedPayment.findOne(normalizeKey({ provider, paymentId })).lean();

// Claims a payment before money moves. Returns { claimed, record, release }:
// - claimed: true  -> caller owns this payment now and must credit it; call
//   release() if the credit then fails so a retry is possible.
// - claimed: false -> someone already claimed it (record says who); caller
//   must not credit again.
export const claimProcessedPayment = async ({ provider, paymentId, purpose = '', ownerId = '', amount = 0, reference = '' }) => {
  await ensureIndexes();
  const key = normalizeKey({ provider, paymentId });
  if (!key.provider || !key.paymentId) {
    throw new Error('provider and paymentId are required to claim a payment');
  }

  const owner = String(ownerId || '');
  const safeAmount = Math.max(0, Number(amount) || 0);
  const now = new Date();

  const promoted = await ProcessedPayment.findOneAndUpdate(
    { ...key, status: 'initiated', ownerId: owner, purpose },
    {
      $set: {
        status: 'processed',
        amount: safeAmount,
        processedAt: now,
        ...(reference ? { reference: String(reference) } : {}),
      },
    },
    { returnDocument: 'after' },
  ).lean();

  if (promoted) {
    return {
      claimed: true,
      record: promoted,
      release: () => ProcessedPayment.updateOne(
        { _id: promoted._id, status: 'processed' },
        { $set: { status: 'initiated', processedAt: null } },
      ),
    };
  }

  try {
    const record = await ProcessedPayment.create({
      ...key,
      purpose,
      ownerId: owner,
      amount: safeAmount,
      reference: String(reference || ''),
      status: 'processed',
      processedAt: now,
    });

    return {
      claimed: true,
      record: record.toObject(),
      release: () => ProcessedPayment.deleteOne({ _id: record._id, status: 'processed' }),
    };
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const existing = await ProcessedPayment.findOne(key).lean();
    return { claimed: false, record: existing, release: async () => {} };
  }
};

export const isProcessedByOwner = (record, { ownerId, purpose }) =>
  Boolean(record) &&
  record.status === 'processed' &&
  String(record.ownerId || '') === String(ownerId || '') &&
  (!purpose || String(record.purpose || '') === String(purpose));

export const LEGACY_SESSION_MAX_AGE_MS = 72 * 60 * 60 * 1000;

const compactOwnerId = (ownerId) => String(ownerId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8);

// A PhonePe status lookup only needs the merchantTransactionId, which shows up
// in redirect URLs, so on its own it proves nothing about who paid. Sessions
// opened by this code carry an 'initiated' row naming the owner; ids minted
// before those rows existed are accepted only when their shape matches what
// the caller's own create-order call would have produced.
export const assertPhonePeSessionOwner = async ({ merchantTransactionId, prefix, ownerId, purpose = '' }) => {
  const record = await findProcessedPayment({ provider: 'phonepe', paymentId: merchantTransactionId });
  if (record) {
    if (String(record.ownerId || '') !== String(ownerId || '') || (purpose && String(record.purpose || '') !== purpose)) {
      throw new ApiError(403, 'This payment does not belong to your account');
    }
    return record;
  }

  const compact = compactOwnerId(ownerId);
  const txnId = String(merchantTransactionId || '');
  if (!compact || !txnId.startsWith(prefix) || !txnId.endsWith(compact)) {
    throw new ApiError(403, 'This payment does not belong to your account');
  }
  // Legacy ids embed Date.now() right after the prefix. Only fresh ones are
  // honoured, so a months-old session cannot be replayed past the per-wallet
  // history that used to be the only duplicate check.
  const createdAtMs = Number(txnId.slice(prefix.length, prefix.length + 13));
  if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > LEGACY_SESSION_MAX_AGE_MS) {
    throw new ApiError(409, 'This payment session has expired');
  }
  return null;
};
