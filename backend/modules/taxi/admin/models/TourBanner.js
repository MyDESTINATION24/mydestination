import mongoose from 'mongoose';

// Hero banner for the tours screen. Mirrors BusBanner, plus the headline,
// subtext and CTA the tours hero renders over the image -- those were
// hardcoded in ToursHome, so the copy could not be changed without a deploy.
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
    heading: {
      type: String,
      default: '',
      trim: true,
    },
    subheading: {
      type: String,
      default: '',
      trim: true,
    },
    ctaLabel: {
      type: String,
      default: '',
      trim: true,
    },
    ctaLink: {
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
  heading: item.heading || '',
  subheading: item.subheading || '',
  ctaLabel: item.ctaLabel || '',
  ctaLink: item.ctaLink || '',
  isActive: item.isActive !== false,
  order: Number(item.order || 0),
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});
