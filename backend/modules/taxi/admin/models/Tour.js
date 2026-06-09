import mongoose from 'mongoose';

const tourItinerarySchema = new mongoose.Schema(
  {
    day: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const tourHotelSchema = new mongoose.Schema(
  {
    destination: { type: String, default: '' },
    name: { type: String, default: '' },
    mealPlan: { type: String, default: 'All Meals' },
  },
  { _id: false }
);

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    meals: {
      type: String,
      default: '',
      trim: true,
    },
    helicopterType: {
      type: String,
      default: '',
      trim: true,
    },
    startPoint: {
      type: String,
      default: '',
      trim: true,
    },
    endPoint: {
      type: String,
      default: '',
      trim: true,
    },
    destinations: {
      type: [String],
      default: [],
    },
    packageType: {
      type: String,
      default: '',
      trim: true,
    },
    itinerary: {
      type: [tourItinerarySchema],
      default: [],
    },
    inclusions: {
      type: [String],
      default: [],
    },
    exclusions: {
      type: [String],
      default: [],
    },
    hotels: {
      type: [tourHotelSchema],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ['per_day', 'total'],
      default: 'per_day',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused'],
      default: 'active',
    },
    image: {
      type: String,
      default: '',
    },
    gallery: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

tourSchema.index({ name: 1 });
tourSchema.index({ status: 1 });

export const Tour =
  mongoose.models.TaxiTour ||
  mongoose.model('TaxiTour', tourSchema);
