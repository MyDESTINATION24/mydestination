import mongoose from 'mongoose';

// Hero banner artwork for a customer screen. Image only -- the hero renders
// the uploaded image and nothing else, so any headline or CTA belongs baked
// into the artwork itself.
//
// `category` scopes a banner to a screen: the Yatras and Treks tabs and the
// Airways home each draw their own. Named TourBanner for its original use;
// it backs several modules now.
//
// Multiple active banners in one category rotate as a carousel, ordered by
// `order`.
const tourBannerSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['yatra', 'trek', 'airways'],
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
