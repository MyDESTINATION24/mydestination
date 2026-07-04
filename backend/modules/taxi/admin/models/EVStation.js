import mongoose from 'mongoose';

const evStationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    stallsTotal: {
      type: Number,
      default: 8,
    },
    stallsAvailable: {
      type: Number,
      default: 8,
    },
    powerKW: {
      type: Number, // e.g. 150 or 250 kW
      default: 150,
    },
    pricing: {
      type: String, // e.g. "₹15/kWh"
      default: '₹15/kWh',
    },
    connectorTypes: {
      type: [String], // e.g. ['CCS2', 'Type 2', 'Tesla Supercharger']
      default: ['CCS2', 'Type 2'],
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'coming_soon'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Create index for geolocation queries
evStationSchema.index({ location: '2dsphere' });
evStationSchema.index({ status: 1 });

export const EVStation =
  mongoose.models.TaxiEVStation ||
  mongoose.model('TaxiEVStation', evStationSchema);
