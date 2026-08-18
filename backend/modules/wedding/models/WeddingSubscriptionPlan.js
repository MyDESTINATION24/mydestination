import mongoose from 'mongoose';

const weddingSubscriptionPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      trim: true
    },
    // Struck-through "was" price. Optional: when it is set and higher than
    // price, the plan is shown as a discount. Null means no strike-through.
    originalPrice: {
      type: Number,
      default: null,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    validityMonths: {
      type: Number,
      required: true,
      min: 1
    },
    validityType: {
      type: String,
      enum: ['days', 'months'],
      default: 'months'
    },
    numberOfLeads: {
      type: Number,
      required: true,
      min: 1
    },
    features: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('WeddingSubscriptionPlan', weddingSubscriptionPlanSchema);
