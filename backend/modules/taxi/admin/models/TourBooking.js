import mongoose from 'mongoose';

const tourBookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiTour',
      required: true,
      index: true,
    },
    tourName: {
      type: String,
      default: '',
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    numberOfPassengers: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalFare: {
      type: Number,
      default: 0,
      min: 0,
    },
    travelDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['reserve', 'online'],
      default: 'reserve',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    passengerNames: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const TourBooking =
  mongoose.models.TaxiTourBooking ||
  mongoose.model('TaxiTourBooking', tourBookingSchema);
