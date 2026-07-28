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

const tourGuideSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    languages: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    photo: { type: String, default: '' },
    bio: { type: String, default: '', trim: true },
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

    // A trek is the same booking shape as a yatra -- itinerary, inclusions,
    // hotels, price, gallery -- so it reuses this model rather than forking a
    // parallel one. `category` picks which extra fields the admin form shows
    // and which tab it appears under.
    category: {
      type: String,
      enum: ['yatra', 'trek'],
      default: 'yatra',
      index: true,
    },

    // Hard cap on seats/spots. 0 means unlimited, which is how every existing
    // tour behaved before this field existed.
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- trek-only ---
    difficulty: {
      type: String,
      enum: ['', 'easy', 'moderate', 'difficult', 'expedition'],
      default: '',
    },
    maxAltitudeM: { type: Number, default: 0, min: 0 },
    trailDistanceKm: { type: Number, default: 0, min: 0 },
    bestMonths: { type: [String], default: [] },
    baseCamp: { type: String, default: '', trim: true },
    gearProvided: { type: [String], default: [] },
    gearToCarry: { type: [String], default: [] },
    permitsRequired: { type: [String], default: [] },
    fitnessNote: { type: String, default: '', trim: true },
    minGroupSize: { type: Number, default: 0, min: 0 },
    maxGroupSize: { type: Number, default: 0, min: 0 },

    // Embedded rather than a Guide collection: one guide per trek today.
    // ponytail: promote to its own model the moment the same guide needs to
    // be attached to several treks or carry an availability calendar.
    guide: {
      type: tourGuideSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

tourSchema.index({ name: 1 });
tourSchema.index({ status: 1 });
tourSchema.index({ category: 1, status: 1 });

export const Tour =
  mongoose.models.TaxiTour ||
  mongoose.model('TaxiTour', tourSchema);

// Single serializer for both the admin and user controllers. They used to keep
// byte-identical private copies, which is how `durationDays` had to be added
// twice and how the next field would have been missed on one side.
export const serializeTour = (item = {}) => ({
  id: String(item._id || item.id || ''),
  name: item.name || '',
  overview: item.overview || '',
  duration: item.duration || '',
  durationDays: getTourDurationDays(item),
  meals: item.meals || '',
  helicopterType: item.helicopterType || '',
  startPoint: item.startPoint || '',
  endPoint: item.endPoint || '',
  destinations: Array.isArray(item.destinations) ? item.destinations : [],
  packageType: item.packageType || '',
  itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
  inclusions: Array.isArray(item.inclusions) ? item.inclusions : [],
  exclusions: Array.isArray(item.exclusions) ? item.exclusions : [],
  hotels: Array.isArray(item.hotels) ? item.hotels : [],
  price: Number(item.price || 0),
  priceType: item.priceType || 'per_day',
  status: item.status || 'active',
  image: item.image || '',
  gallery: Array.isArray(item.gallery) ? item.gallery : [],

  category: item.category || 'yatra',
  capacity: Number(item.capacity || 0),

  difficulty: item.difficulty || '',
  maxAltitudeM: Number(item.maxAltitudeM || 0),
  trailDistanceKm: Number(item.trailDistanceKm || 0),
  bestMonths: Array.isArray(item.bestMonths) ? item.bestMonths : [],
  baseCamp: item.baseCamp || '',
  gearProvided: Array.isArray(item.gearProvided) ? item.gearProvided : [],
  gearToCarry: Array.isArray(item.gearToCarry) ? item.gearToCarry : [],
  permitsRequired: Array.isArray(item.permitsRequired) ? item.permitsRequired : [],
  fitnessNote: item.fitnessNote || '',
  minGroupSize: Number(item.minGroupSize || 0),
  maxGroupSize: Number(item.maxGroupSize || 0),
  guide: {
    name: item.guide?.name || '',
    phone: item.guide?.phone || '',
    experienceYears: Number(item.guide?.experienceYears || 0),
    languages: Array.isArray(item.guide?.languages) ? item.guide.languages : [],
    certifications: Array.isArray(item.guide?.certifications) ? item.guide.certifications : [],
    photo: item.guide?.photo || '',
    bio: item.guide?.bio || '',
  },

  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

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
