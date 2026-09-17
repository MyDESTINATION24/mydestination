import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'modelType'
  },
  modelType: {
    type: String,
    required: true,
    enum: ['User', 'Partner', 'Admin'],
    default: 'User'
  },
  role: {
    type: String,
    enum: ['user', 'partner', 'admin'],
    default: 'partner',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  pendingClearance: {
    type: Number,
    default: 0,
    comment: 'Amount pending settlement'
  },
  lastTransactionAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  razorpayContactId: String,
  razorpayFundAccountId: String
}, { timestamps: true });

// Pre-save hook to set modelType based on role
walletSchema.pre('save', async function () {
  if (this.role === 'partner') {
    this.modelType = 'Partner';
  } else if (this.role === 'admin') {
    this.modelType = 'Admin';
  } else {
    this.modelType = 'User';
  }
});

// Methods
//
// credit/debit used to do `this.balance += amount; save()`. Two requests
// holding the same loaded document both wrote their own stale total, so one
// movement was silently lost, and the balance check in debit could be raced
// into an overdraft. Both now apply an atomic $inc (debit conditional on the
// balance), then copy the stored values back onto `this` so callers that read
// wallet.balance afterwards still see the real figure.
const normalizeWalletAmount = (amount) => {
  const value = Number(amount);
  // Zero is left as a no-op movement: several booking callers pass computed
  // shares that can legitimately be 0 and never threw before.
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Invalid wallet amount');
  }
  return value;
};

const syncWalletFromStored = async (doc, stored) => {
  const hadOtherChanges = doc.modifiedPaths().some(
    (path) => !['balance', 'totalEarnings', 'totalWithdrawals', 'lastTransactionAt'].includes(path)
  );
  for (const path of ['balance', 'totalEarnings', 'totalWithdrawals', 'lastTransactionAt']) {
    doc.set(path, stored[path]);
    doc.unmarkModified(path);
  }
  // Preserve the old save() side effect for any unrelated field a caller
  // changed on the document before crediting/debiting.
  if (hadOtherChanges) {
    await doc.save();
  }
};

walletSchema.methods.credit = async function (amount, description, reference, type = 'booking_payment', metadata = {}) {
  amount = normalizeWalletAmount(amount);
  const inc = { balance: amount };
  // Only add to totalEarnings for actual earnings (bookings), not topups, refunds or admin adjustments
  if (type !== 'topup' && type !== 'refund' && type !== 'commission_refund' && type !== 'admin_adjustment') {
    inc.totalEarnings = amount;
  }

  if (this.isNew) {
    // Not stored yet: insert it first so the atomic update below can find it.
    await this.save();
  }

  const stored = await this.constructor.findOneAndUpdate(
    { _id: this._id },
    { $inc: inc, $set: { lastTransactionAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();
  if (!stored) {
    throw new Error('Wallet not found');
  }
  await syncWalletFromStored(this, stored);

  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  await Transaction.create({
    walletId: this._id,
    partnerId: this.partnerId,
    modelType: this.modelType,
    type: 'credit',
    category: type,
    amount,
    balanceAfter: this.balance,
    description,
    reference,
    status: 'completed',
    metadata
  });

  return this;
};

walletSchema.methods.debit = async function (amount, description, reference, type = 'withdrawal') {
  amount = normalizeWalletAmount(amount);
  // Allow overdraft for commission deductions, penalties, refunds, or admin adjustments
  const allowOverdraft = ['commission_deduction', 'no_show_penalty', 'refund_deduction', 'commission_refund', 'admin_adjustment'].includes(type);

  const inc = { balance: -amount };
  if (type === 'withdrawal') {
    inc.totalWithdrawals = amount;
  }

  // If we are reversing a booking payment (refund_deduction), we should decrease totalEarnings
  if (type === 'refund_deduction' || type === 'no_show_penalty') {
    inc.totalEarnings = -amount;
  }

  if (this.isNew) {
    await this.save();
  }

  const filter = allowOverdraft ? { _id: this._id } : { _id: this._id, balance: { $gte: amount } };
  const stored = await this.constructor.findOneAndUpdate(
    filter,
    { $inc: inc, $set: { lastTransactionAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();
  if (!stored) {
    throw new Error(allowOverdraft ? 'Wallet not found' : 'Insufficient balance');
  }
  await syncWalletFromStored(this, stored);

  const Transaction = mongoose.model('Transaction');
  await Transaction.create({
    walletId: this._id,
    partnerId: this.partnerId,
    modelType: this.modelType,
    type: 'debit',
    category: type,
    amount,
    balanceAfter: this.balance,
    description,
    reference,
    status: 'completed'
  });

  return this;
};

// Indexes
walletSchema.index({ createdAt: -1 });
walletSchema.index({ partnerId: 1, role: 1 }, { unique: true }); // Composite key

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;

