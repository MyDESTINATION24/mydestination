import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 10 * 60 * 1000 // 10 minutes
  },
  tempData: {
    type: Object, // Store temp registration data
    default: null
  },
  // Wrong guesses against this code; the record is deleted once it hits the cap.
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Index for automatic expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;

