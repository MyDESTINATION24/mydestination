import mongoose from 'mongoose';
import { Tour } from '../../admin/models/Tour.js';
import { TourBooking } from '../../admin/models/TourBooking.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

export const getUserTours = asyncHandler(async (_req, res) => {
  const tours = await Tour.find({ status: 'active' }).sort({ createdAt: -1 }).lean();
  return ok(res, tours.map(serializeTour), 'Tours fetched successfully');
});

export const getUserTourById = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id).lean();
  if (!tour || tour.status !== 'active') {
    throw new ApiError(404, 'Tour package not found or unavailable');
  }
  return ok(res, serializeTour(tour), 'Tour details fetched successfully');
});

export const createUserTourBooking = asyncHandler(async (req, res) => {
  const {
    tourId,
    customerName,
    customerPhone,
    customerEmail,
    numberOfPassengers,
    totalFare,
    travelDate,
    paymentMethod,
    notes,
    passengerNames,
  } = req.body;

  if (!tourId || !customerName || !travelDate) {
    throw new ApiError(400, 'Tour, customer name, and travel date are required');
  }

  const tour = await Tour.findById(tourId).lean();
  if (!tour || tour.status !== 'active') {
    throw new ApiError(404, 'Tour package not found or unavailable');
  }

  const userId = req.user?._id;
  const bookingCode = `TR-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;

  const booking = await TourBooking.create({
    bookingCode,
    userId,
    tourId,
    tourName: tour.name,
    customerName,
    customerPhone: customerPhone || '',
    customerEmail: customerEmail || '',
    numberOfPassengers: toNumber(numberOfPassengers, 1),
    totalFare: toNumber(totalFare, 0),
    travelDate: new Date(travelDate),
    paymentMethod: paymentMethod || 'reserve',
    paymentStatus: 'pending',
    bookingStatus: 'confirmed',
    notes: notes || '',
    passengerNames: Array.isArray(passengerNames) ? passengerNames : [],
  });

  return created(res, serializeTourBooking(booking), 'Tour booking created successfully');
});

export const listMyTourBookings = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const bookings = await TourBooking.find({ userId })
    .populate('tourId', 'name price priceType')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, bookings.map(serializeTourBooking), 'My tour bookings fetched successfully');
});

export const getMyTourBooking = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const booking = await TourBooking.findOne({ _id: req.params.id, userId })
    .populate('tourId', 'name price priceType')
    .lean();

  if (!booking) {
    throw new ApiError(404, 'Tour booking not found');
  }

  return ok(res, serializeTourBooking(booking), 'Tour booking details fetched successfully');
});
