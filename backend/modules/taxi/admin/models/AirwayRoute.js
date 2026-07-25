import mongoose from 'mongoose';

const airwayRouteSchema = new mongoose.Schema(
  {
    airwayIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'TaxiAirway',
      default: [],
      index: true,
    },
    airwayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiAirway',
      required: true,
      index: true,
    },
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    flightNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    originAirport: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    destinationAirport: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    distanceKm: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    departureTime: {
      type: String,
      default: '',
      trim: true,
    },
    arrivalTime: {
      type: String,
      default: '',
      trim: true,
    },
    operatingDays: {
      type: [String],
      default: [],
    },
    seatInventory: {
      type: Map,
      of: Number,
      default: {},
    },
    routeStatus: {
      type: String,
      enum: ['scheduled', 'seasonal', 'paused'],
      default: 'scheduled',
    },
    // Drives the "Popular Sectors" cards on the Airways home screen. Those
    // used to be a hardcoded array in the page, so admins could not change
    // the price shown there.
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
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
  { timestamps: true },
);

airwayRouteSchema.index({ airwayId: 1, routeStatus: 1 });
airwayRouteSchema.index({ airwayIds: 1, routeStatus: 1 });
airwayRouteSchema.index({ originAirport: 1, destinationAirport: 1 });
airwayRouteSchema.index({ routeName: 1, flightNumber: 1 });

export const AirwayRoute =
  mongoose.models.TaxiAirwayRoute ||
  mongoose.model('TaxiAirwayRoute', airwayRouteSchema);
