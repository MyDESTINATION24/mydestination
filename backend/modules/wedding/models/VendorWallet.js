import mongoose from 'mongoose';

const vendorWalletSchema = new mongoose.Schema({
  vendorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'] },
    amount: { type: Number },
    description: { type: String },
    // Gateway order id on credits, so a completed order is applied once.
    reference: { type: String },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('VendorWallet', vendorWalletSchema);
