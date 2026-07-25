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
    // Display text, e.g. "06 Days / 05 Nights". Never used for pricing.
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    // The number the fare is actually multiplied by. Kept separate from
    // `duration` because admins format that field freely ("6 Days/5 Nights",
    // "06/05") and a parser deciding a price is how a 6-day package ended up
    // billing for one. 0 means "fall back to parsing the text".
    durationDays: {
      type: Number,
      default: 0,
      min: 0,
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

// Prefers the explicit durationDays field. The text parsing below only exists
// for tours created before that field did -- it misses formats like "06/05",
// which is exactly the bug it caused.
export const getTourDurationDays = (tour = {}) => {
  const explicit = Number(tour.durationDays);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

  const match = String(tour.duration || '').match(/(\d+)\s*Days?/i);
  if (match) return Number(match[1]);
  return Array.isArray(tour.itinerary) && tour.itinerary.length ? tour.itinerary.length : 1;
};

export const TOUR_TAX_RATE = 0.05;

// Authoritative fare. Never trust a client-supplied total: the booking endpoint
// took `totalFare` straight off the request body, so a crafted request could
// book any package for whatever it liked.
export const calculateTourFare = (tour = {}, numberOfPassengers = 1) => {
  const price = Math.max(0, Number(tour.price) || 0);
  const passengers = Math.max(1, Math.floor(Number(numberOfPassengers) || 1));
  const days = tour.priceType === 'per_day' ? getTourDurationDays(tour) : 1;

  const subtotal = price * days * passengers;
  const tax = Math.round(subtotal * TOUR_TAX_RATE);

  return { subtotal, tax, total: subtotal + tax };
};
