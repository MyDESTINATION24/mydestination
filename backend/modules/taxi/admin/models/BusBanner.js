import mongoose from 'mongoose';

const busBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: '',
      trim: true,
    },
    linkUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: 'banner',
      enum: ['banner', 'offer'],
      trim: true,
    },
  },
  { timestamps: true }
);

export const BusBanner =
  mongoose.models.TaxiBusBanner || mongoose.model('TaxiBusBanner', busBannerSchema);
