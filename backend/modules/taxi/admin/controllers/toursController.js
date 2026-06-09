import mongoose from 'mongoose';
import { Tour } from '../models/Tour.js';
import { TourBooking } from '../models/TourBooking.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

const toText = (value = '') => String(value || '').trim();
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTourPayload = (payload = {}, existing = null) => {
  const price = Math.max(0, toNumber(payload.price, existing?.price || 0));
  
  // Itinerary
  const itinerary = Array.isArray(payload.itinerary)
    ? payload.itinerary.map(item => ({
        day: toText(item.day),
        title: toText(item.title),
        description: toText(item.description)
      })).filter(item => item.day || item.title || item.description)
    : (Array.isArray(existing?.itinerary) ? existing.itinerary : []);

  // Hotels
  const hotels = Array.isArray(payload.hotels)
    ? payload.hotels.map(item => ({
        destination: toText(item.destination),
        name: toText(item.name),
        mealPlan: toText(item.mealPlan || 'All Meals')
      })).filter(item => item.destination || item.name)
    : (Array.isArray(existing?.hotels) ? existing.hotels : []);

  // Destinations
  const destinations = Array.isArray(payload.destinations)
    ? payload.destinations.map(item => toText(item)).filter(Boolean)
    : (Array.isArray(existing?.destinations) ? existing.destinations : []);

  // Inclusions & Exclusions
  const inclusions = Array.isArray(payload.inclusions)
    ? payload.inclusions.map(item => toText(item)).filter(Boolean)
    : (Array.isArray(existing?.inclusions) ? existing.inclusions : []);

  const exclusions = Array.isArray(payload.exclusions)
    ? payload.exclusions.map(item => toText(item)).filter(Boolean)
    : (Array.isArray(existing?.exclusions) ? existing.exclusions : []);

  return {
    name: toText(payload.name || existing?.name),
    overview: toText(payload.overview || existing?.overview),
    duration: toText(payload.duration || existing?.duration),
    meals: toText(payload.meals || existing?.meals),
    helicopterType: toText(payload.helicopterType || existing?.helicopterType),
    startPoint: toText(payload.startPoint || existing?.startPoint),
    endPoint: toText(payload.endPoint || existing?.endPoint),
    destinations,
    packageType: toText(payload.packageType || existing?.packageType),
    itinerary,
    inclusions,
    exclusions,
    hotels,
    price,
    priceType: ['per_day', 'total'].includes(toText(payload.priceType || existing?.priceType).toLowerCase())
      ? toText(payload.priceType || existing?.priceType).toLowerCase()
      : 'per_day',
    status: ['draft', 'active', 'paused'].includes(toText(payload.status || existing?.status).toLowerCase())
      ? toText(payload.status || existing?.status).toLowerCase()
      : 'active',
    image: toText(payload.image || existing?.image),
    gallery: Array.isArray(payload.gallery)
      ? payload.gallery.map(item => toText(item)).filter(Boolean)
      : (Array.isArray(existing?.gallery) ? existing.gallery : []),
  };
};

const serializeTour = (item = {}) => ({
  id: String(item._id || item.id || ''),
  name: item.name || '',
  overview: item.overview || '',
  duration: item.duration || '',
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
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

const serializeTourBooking = (item = {}) => ({
  id: String(item._id || item.id || ''),
  bookingCode: item.bookingCode || '',
  userId: item.userId ? String(item.userId._id || item.userId) : null,
  tourId: String(item.tourId?._id || item.tourId || ''),
  tourName: item.tourName || item.tourId?.name || '',
  customerName: item.customerName || '',
  customerPhone: item.customerPhone || '',
  customerEmail: item.customerEmail || '',
  numberOfPassengers: Number(item.numberOfPassengers || 1),
  totalFare: Number(item.totalFare || 0),
  travelDate: item.travelDate || null,
  paymentMethod: item.paymentMethod || 'reserve',
  paymentStatus: item.paymentStatus || 'pending',
  bookingStatus: item.bookingStatus || 'confirmed',
  notes: item.notes || '',
  passengerNames: Array.isArray(item.passengerNames) ? item.passengerNames : [],
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

export const getTours = asyncHandler(async (_req, res) => {
  const tours = await Tour.find().sort({ createdAt: -1 }).lean();
  return ok(res, tours.map(serializeTour), 'Tours fetched successfully');
});

export const createTour = asyncHandler(async (req, res) => {
  const normalized = normalizeTourPayload(req.body);
  if (!normalized.name || !normalized.overview || !normalized.duration) {
    throw new ApiError(400, 'Tour name, overview, and duration are required');
  }

  const tour = await Tour.create(normalized);
  return created(res, serializeTour(tour), 'Tour created successfully');
});

export const updateTour = asyncHandler(async (req, res) => {
  const existing = await Tour.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Tour not found');
  }

  const normalized = normalizeTourPayload(req.body, existing.toObject());
  Object.assign(existing, normalized);
  await existing.save();

  return ok(res, serializeTour(existing), 'Tour updated successfully');
});

export const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    throw new ApiError(404, 'Tour not found');
  }

  // Delete bookings linked with this tour
  await TourBooking.deleteMany({ tourId: tour._id });

  return ok(res, null, 'Tour deleted successfully');
});

export const getTourBookings = asyncHandler(async (_req, res) => {
  const bookings = await TourBooking.find()
    .populate('tourId', 'name price priceType')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, bookings.map(serializeTourBooking), 'Tour bookings fetched successfully');
});

export const createTourBooking = asyncHandler(async (req, res) => {
  const {
    tourId,
    customerName,
    customerPhone,
    customerEmail,
    numberOfPassengers,
    totalFare,
    travelDate,
    paymentMethod,
    paymentStatus,
    bookingStatus,
    notes,
    passengerNames,
  } = req.body;

  if (!tourId || !customerName || !travelDate) {
    throw new ApiError(400, 'Tour, customer name, and travel date are required');
  }

  const tour = await Tour.findById(tourId).lean();
  if (!tour) {
    throw new ApiError(404, 'Selected Tour not found');
  }

  const bookingCode = `TR-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

  const booking = await TourBooking.create({
    bookingCode,
    tourId,
    tourName: tour.name,
    customerName,
    customerPhone: customerPhone || '',
    customerEmail: customerEmail || '',
    numberOfPassengers: toNumber(numberOfPassengers, 1),
    totalFare: toNumber(totalFare, 0),
    travelDate: new Date(travelDate),
    paymentMethod: paymentMethod || 'reserve',
    paymentStatus: paymentStatus || 'pending',
    bookingStatus: bookingStatus || 'confirmed',
    notes: notes || '',
    passengerNames: Array.isArray(passengerNames) ? passengerNames : [],
  });

  return created(res, serializeTourBooking(booking), 'Tour booking created successfully');
});

export const updateTourBookingStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;
  
  const booking = await TourBooking.findById(req.params.id);
  if (!booking) {
    throw new ApiError(404, 'Tour booking not found');
  }

  if (status) {
    const nextStatus = status.toLowerCase();
    if (!['confirmed', 'cancelled'].includes(nextStatus)) {
      throw new ApiError(400, 'Invalid tour booking status');
    }
    booking.bookingStatus = nextStatus;
  }

  if (paymentStatus) {
    const nextPaymentStatus = paymentStatus.toLowerCase();
    if (!['pending', 'paid', 'failed', 'refunded'].includes(nextPaymentStatus)) {
      throw new ApiError(400, 'Invalid payment status');
    }
    booking.paymentStatus = nextPaymentStatus;
  }

  await booking.save();
  return ok(res, serializeTourBooking(booking), 'Booking status updated successfully');
});
