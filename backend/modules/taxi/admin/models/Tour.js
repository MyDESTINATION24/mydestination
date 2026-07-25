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

// `duration` is free text the admin types ("6 Days / 5 Nights"), so the day
// count has to be recovered from it. This used to happen in the browser only,
// which meant the client and server could disagree about the price.
// ponytail: heuristic over free text -- add a real durationDays field to the
// schema + admin form if admins start typing formats this misses (e.g. "6N/7D").
export const getTourDurationDays = (tour = {}) => {
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
