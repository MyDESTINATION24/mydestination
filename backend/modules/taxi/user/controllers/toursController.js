import mongoose from 'mongoose';
import { Tour, calculateTourFare, serializeTour } from '../../admin/models/Tour.js';
import { TourBooking } from '../../admin/models/TourBooking.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

// Seats already taken on a package. Cancelled bookings free their spots back.
const countBookedSeats = async (tourIds = []) => {
  const ids = tourIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await TourBooking.aggregate([
    { $match: { tourId: { $in: ids }, bookingStatus: { $ne: 'cancelled' } } },
    { $group: { _id: '$tourId', seats: { $sum: '$numberOfPassengers' } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.seats || 0]));
};

// capacity 0 means unlimited, which is how every package behaved before the
// field existed, so `availableSlots: null` reads as "no cap".
const withAvailability = (tour, bookedSeats = 0) => {
  const serialized = serializeTour(tour);
  const capacity = serialized.capacity;

  return {
    ...serialized,
    bookedSeats,
    availableSlots: capacity > 0 ? Math.max(0, capacity - bookedSeats) : null,
  };
};

export const getUserTours = asyncHandler(async (req, res) => {
  const category = String(req.query.category || '').trim().toLowerCase();
  const query = { status: 'active' };
  if (['yatra', 'trek'].includes(category)) {
    query.category = category;
  }

  const tours = await Tour.find(query).sort({ createdAt: -1 }).lean();
  const booked = await countBookedSeats(tours.map((tour) => tour._id));

  return ok(
    res,
    tours.map((tour) => withAvailability(tour, booked.get(String(tour._id)) || 0)),
    'Tours fetched successfully',
  );
});

export const getUserTourById = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id).lean();
  if (!tour || tour.status !== 'active') {
    throw new ApiError(404, 'Tour package not found or unavailable');
  }

  const booked = await countBookedSeats([tour._id]);
  return ok(res, withAvailability(tour, booked.get(String(tour._id)) || 0), 'Tour details fetched successfully');
});

export const createUserTourBooking = asyncHandler(async (req, res) => {
  const {
    tourId,
    customerName,
    customerPhone,
    customerEmail,
    numberOfPassengers,
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

  const passengers = Math.max(1, Math.floor(toNumber(numberOfPassengers, 1)));

  if (Number(tour.maxGroupSize) > 0 && passengers > Number(tour.maxGroupSize)) {
    throw new ApiError(400, `This package takes at most ${tour.maxGroupSize} people per booking`);
  }

  // ponytail: read-then-write, so two simultaneous bookings can both pass this
  // and overshoot the cap by one group. Move to a findOneAndUpdate with a
  // $inc'd counter on the tour if departures ever sell out fast enough to care.
  if (Number(tour.capacity) > 0) {
    const booked = await countBookedSeats([tour._id]);
    const remaining = Number(tour.capacity) - (booked.get(String(tour._id)) || 0);

    if (passengers > remaining) {
      throw new ApiError(
        409,
        remaining > 0
          ? `Only ${remaining} spot${remaining === 1 ? '' : 's'} left on this package`
          : 'This package is fully booked',
      );
    }
  }

  const { total } = calculateTourFare(tour, passengers);

  const booking = await TourBooking.create({
    bookingCode,
    userId,
    tourId,
    tourName: tour.name,
    customerName,
    customerPhone: customerPhone || '',
    customerEmail: customerEmail || '',
    numberOfPassengers: passengers,
    totalFare: total,
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
