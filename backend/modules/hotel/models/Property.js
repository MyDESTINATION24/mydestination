// models/Property.js
import mongoose from "mongoose";

const nearbyPlaceSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    // enum removed to allow flexibilty (bus_stop, restaurant, other, etc.)
  },
  distanceKm: Number
});

const propertySchema = new mongoose.Schema({

  // BASIC INFO
  propertyName: { type: String, required: true },
  contactNumber: { type: String },
  propertyType: {
    type: String,
    enum: ["villa", "resort", "hotel", "hostel", "pg", "homestay"],
    required: true
  },

  pgType: {
    type: String,
    enum: ["boys", "girls", "unisex"]
  },

  hostelType: {
    type: String,
    enum: ["boys", "girls", "mixed"]
  },

  hostLivesOnProperty: { type: Boolean, default: false },
  suitability: {
    type: String,
    enum: ["Couple Friendly", "Family Friendly", "Both", "none"],
    default: "none"
  },

  resortType: {
    type: String,
    enum: ["beach", "hill", "jungle", "desert"]
  },

  hotelCategory: {
    type: String,
    enum: ["Budget", "Premium", "Luxury"]
  },
  starRating: {
    type: Number,
    min: 1,
    max: 5
  },

  activities: [String],

  shortDescription: String,

  // OWNER
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true
  },

  // LOCATION
  address: {
    country: String,
    state: String,
    city: String,
    area: String,
    fullAddress: String,
    pincode: String
  },

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number]
  },

  nearbyPlaces: {
    type: [nearbyPlaceSchema],
    default: []
  },

  // MEDIA
  coverImage: { type: String, required: true },
  propertyImages: [String],

  // AMENITIES (PROPERTY LEVEL)
  amenities: [String],

  // POLICIES
  checkInTime: String,
  checkOutTime: String,
  cancellationPolicy: String,
  houseRules: [String],

  // STATUS
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "draft"
  },

  isLive: { type: Boolean, default: false },

  // RATINGS
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // PRICING / DISCOUNT
  originalPrice: { type: Number, default: null }

}, { timestamps: true });

propertySchema.index({ location: "2dsphere" });

export default mongoose.model("Property", propertySchema);

