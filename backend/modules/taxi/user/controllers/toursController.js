import mongoose from 'mongoose';
import { Tour, calculateTourFare, serializeTour } from '../../admin/models/Tour.js';
import { TourBanner, serializeTourBanner } from '../../admin/models/TourBanner.js';
import { TourBooking } from '../../admin/models/TourBooking.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { getActivePaymentGateway, resolveConfiguredGatewayCredentials } from '../../services/paymentGatewayService.js';
import {
  getCurrentUserId,
  getFrontendBaseUrl,
  phonePeRequest,
  razorpayRequest,
  verifyRazorpaySignature,
} from '../../services/paymentClients.js';

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
  paymentMethodLabel: item.paymentMethodLabel || '',
  gatewaySlug: item.gatewaySlug || '',
  gatewayOrderId: item.gatewayOrderId || '',
  gatewayPaymentId: item.gatewayPaymentId || '',
  gatewayTransactionId: item.gatewayTransactionId || '',
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

export const getUserTourBanner = asyncHandler(async (req, res) => {
  const category = ['yatra', 'trek'].includes(String(req.query.category || '').toLowerCase())
    ? String(req.query.category).toLowerCase()
    : 'yatra';

  const banner = await TourBanner.findOne({ category, isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return ok(res, banner ? serializeTourBanner(banner) : null, 'Tour banner fetched successfully');
});

export const getUserTourById = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id).lean();
  if (!tour || tour.status !== 'active') {
    throw new ApiError(404, 'Tour package not found or unavailable');
  }

  const booked = await countBookedSeats([tour._id]);
  return ok(res, withAvailability(tour, booked.get(String(tour._id)) || 0), 'Tour details fetched successfully');
});

// Validates the request and recomputes everything that decides money or
// availability. Every booking path -- reserve, order, verify -- goes through
// this, so the amount charged can never come from the client.
const resolveTourBookingDraft = async (payload = {}, userId = '') => {
  if (!userId) {
    throw new ApiError(401, 'User authentication is required');
  }

  const { tourId, customerName, travelDate } = payload;
  if (!tourId || !customerName || !travelDate) {
    throw new ApiError(400, 'Tour, customer name, and travel date are required');
  }

  const tour = await Tour.findById(tourId).lean();
  if (!tour || tour.status !== 'active') {
    throw new ApiError(404, 'Tour package not found or unavailable');
  }

  const passengers = Math.max(1, Math.floor(toNumber(payload.numberOfPassengers, 1)));

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

  const { subtotal, tax, total } = calculateTourFare(tour, passengers);

  return {
    tour,
    userId,
    passengers,
    subtotal,
    tax,
    total,
    customerName: String(customerName).trim(),
    customerPhone: String(payload.customerPhone || '').trim(),
    customerEmail: String(payload.customerEmail || '').trim(),
    travelDate: new Date(travelDate),
    notes: String(payload.notes || '').trim(),
    passengerNames: Array.isArray(payload.passengerNames) ? payload.passengerNames : [],
  };
};

const finalizeTourBooking = async ({
  draft,
  paymentMethod = 'reserve',
  paymentMethodLabel = '',
  paymentStatus = 'pending',
  gatewaySlug = '',
  gatewayOrderId = '',
  gatewayPaymentId = '',
  gatewayTransactionId = '',
}) => {
  // A gateway retry must not mint a second booking for the same payment.
  if (gatewayPaymentId || gatewayTransactionId) {
    const existing = await TourBooking.findOne(
      gatewayPaymentId ? { gatewayPaymentId } : { gatewayTransactionId },
    ).lean();

    if (existing) {
      return existing;
    }
  }

  return TourBooking.create({
    bookingCode: `TR-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
    userId: draft.userId,
    tourId: draft.tour._id,
    tourName: draft.tour.name,
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    customerEmail: draft.customerEmail,
    numberOfPassengers: draft.passengers,
    totalFare: draft.total,
    travelDate: draft.travelDate,
    paymentMethod,
    paymentMethodLabel,
    paymentStatus,
    bookingStatus: 'confirmed',
    notes: draft.notes,
    passengerNames: draft.passengerNames,
    gatewaySlug,
    gatewayOrderId,
    gatewayPaymentId,
    gatewayTransactionId,
  });
};

export const createUserTourBooking = asyncHandler(async (req, res) => {
  const draft = await resolveTourBookingDraft(req.body, getCurrentUserId(req));

  // Online bookings must go through order + verify, or "pay online" would once
  // again create a confirmed booking that collected nothing.
  if (String(req.body?.paymentMethod || '').toLowerCase() === 'online') {
    throw new ApiError(400, 'Use the tour payment flow for online bookings');
  }

  const booking = await finalizeTourBooking({ draft, paymentMethod: 'reserve' });
  return created(res, serializeTourBooking(booking), 'Tour booking created successfully');
});

export const createUserTourBookingOrder = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  const draft = await resolveTourBookingDraft(req.body, userId);
  const activeGateway = await getActivePaymentGateway();

  if (!activeGateway) {
    throw new ApiError(400, 'No payment gateway is enabled in the admin panel right now.');
  }

  const compactUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'usr';

  if (activeGateway.slug === 'razor_pay') {
    const { keyId, keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');
    const order = await razorpayRequest({
      method: 'POST',
      path: '/orders',
      body: {
        amount: Math.round(draft.total * 100),
        currency: 'INR',
        receipt: `tour_${compactUserId}_${Date.now().toString(36)}`,
        notes: {
          userId,
          tourId: String(draft.tour._id),
          passengers: String(draft.passengers),
        },
      },
      keyId,
      keySecret,
    });

    return created(res, {
      gateway: 'razor_pay',
      label: activeGateway.label,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
    }, 'Tour payment order created successfully');
  }

  if (activeGateway.slug === 'phone_pay') {
    const { merchantId, saltKey, saltIndex, environment } = await resolveConfiguredGatewayCredentials('phone_pay');
    const merchantTransactionId = `UTOUR${Date.now()}${compactUserId}`.slice(0, 34);
    const redirectUrl = `${getFrontendBaseUrl()}/taxi/user/tours/book/${encodeURIComponent(String(draft.tour._id))}?phonepe_txn=${encodeURIComponent(merchantTransactionId)}`;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/v1/common/payment-gateway/phonepe/callback`;

    const payload = await phonePeRequest({
      method: 'POST',
      path: '/pg/v1/pay',
      body: {
        merchantId,
        merchantTransactionId,
        merchantUserId: compactUserId,
        amount: Math.round(draft.total * 100),
        redirectUrl,
        redirectMode: 'GET',
        callbackUrl,
        paymentInstrument: { type: 'PAY_PAGE' },
      },
      merchantId,
      saltKey,
      saltIndex,
      environment,
    });

    const checkoutUrl = payload?.data?.instrumentResponse?.redirectInfo?.url || '';
    if (!checkoutUrl) {
      throw new ApiError(502, 'PhonePe payment URL was not returned');
    }

    return created(res, {
      gateway: 'phone_pay',
      label: activeGateway.label,
      merchantTransactionId,
      amount: Math.round(draft.total * 100),
      currency: 'INR',
      checkoutUrl,
      method: payload?.data?.instrumentResponse?.redirectInfo?.method || 'GET',
    }, 'Tour PhonePe session created successfully');
  }

  throw new ApiError(400, `${activeGateway.label} is enabled by admin, but tour checkout is not implemented for it yet.`);
});

export const verifyUserTourBookingPayment = asyncHandler(async (req, res) => {
  const draft = await resolveTourBookingDraft(req.body, getCurrentUserId(req));
  const gateway = String(req.body?.gateway || req.body?.gatewaySlug || '').trim().toLowerCase();

  if (gateway === 'razor_pay') {
    const orderId = String(req.body?.razorpay_order_id || '').trim();
    const paymentId = String(req.body?.razorpay_payment_id || '').trim();
    const signature = String(req.body?.razorpay_signature || '').trim();

    if (!orderId || !paymentId || !signature) {
      throw new ApiError(400, 'Payment verification fields are required');
    }

    const { keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');
    if (!verifyRazorpaySignature({ orderId, paymentId, signature, keySecret })) {
      throw new ApiError(400, 'Invalid payment signature');
    }

    const booking = await finalizeTourBooking({
      draft,
      paymentMethod: 'online',
      paymentMethodLabel: 'Razorpay',
      paymentStatus: 'paid',
      gatewaySlug: 'razor_pay',
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
    });

    return ok(res, serializeTourBooking(booking), 'Tour booking confirmed successfully');
  }

  if (gateway === 'phone_pay') {
    const merchantTransactionId = String(req.body?.merchantTransactionId || req.body?.transactionId || '').trim();
    if (!merchantTransactionId) {
      throw new ApiError(400, 'merchantTransactionId is required');
    }

    const { merchantId, saltKey, saltIndex, environment } = await resolveConfiguredGatewayCredentials('phone_pay');
    const payload = await phonePeRequest({
      method: 'GET',
      path: `/pg/v1/status/${encodeURIComponent(merchantId)}/${encodeURIComponent(merchantTransactionId)}`,
      merchantId,
      saltKey,
      saltIndex,
      environment,
    });

    const paymentState = String(payload?.data?.state || payload?.data?.paymentState || '').trim().toUpperCase();
    const paymentId = String(payload?.data?.transactionId || merchantTransactionId).trim();

    if (paymentState === 'COMPLETED') {
      const booking = await finalizeTourBooking({
        draft,
        paymentMethod: 'online',
        paymentMethodLabel: 'PhonePe',
        paymentStatus: 'paid',
        gatewaySlug: 'phone_pay',
        gatewayTransactionId: merchantTransactionId,
        gatewayPaymentId: paymentId,
      });

      return ok(res, serializeTourBooking(booking), 'Tour booking confirmed successfully');
    }

    return ok(res, {
      status: paymentState === 'PENDING' ? 'pending' : 'failed',
      gateway: 'phone_pay',
      merchantTransactionId,
      transactionId: paymentId,
      code: payload?.code || payload?.data?.responseCode || '',
    }, payload?.message || (paymentState === 'PENDING' ? 'PhonePe payment is still pending' : 'PhonePe payment was not completed'));
  }

  throw new ApiError(400, 'Unsupported tour payment gateway');
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
