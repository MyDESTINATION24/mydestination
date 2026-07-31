import mongoose from 'mongoose';

// Hero banner for the tours screen. Image only -- the hero renders the
// uploaded artwork and nothing else, so any headline or CTA belongs baked
// into the image itself.
//
// One banner per category, so the Yatras and Treks tabs each get their own.
const tourBannerSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['yatra', 'trek'],
      default: 'yatra',
      index: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

tourBannerSchema.index({ category: 1, isActive: 1, order: 1 });

export const TourBanner =
  mongoose.models.TaxiTourBanner || mongoose.model('TaxiTourBanner', tourBannerSchema);

export const serializeTourBanner = (item = {}) => ({
  id: String(item._id || item.id || ''),
  category: item.category || 'yatra',
  imageUrl: item.imageUrl || '',
  imagePublicId: item.imagePublicId || '',
  isActive: item.isActive !== false,
  order: Number(item.order || 0),
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});
