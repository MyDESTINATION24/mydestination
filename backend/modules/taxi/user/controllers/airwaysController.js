import mongoose from 'mongoose';
import { Airway } from '../../admin/models/Airway.js';
import { AirwayRoute } from '../../admin/models/AirwayRoute.js';
import { AirwayBooking } from '../../admin/models/AirwayBooking.js';
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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toText = (value = '') => String(value || '').trim();
const toLower = (value = '') => toText(value).toLowerCase();
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTravelDayToken = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return '';
  }
  return DAY_LABELS[parsed.getDay()] || '';
};

const getSeatInventoryObject = (seatInventory) =>
  seatInventory instanceof Map
    ? Object.fromEntries(seatInventory.entries())
    : seatInventory && typeof seatInventory === 'object'
      ? Object.fromEntries(Object.entries(seatInventory))
      : {};

const getAvailableSeatCount = (route = {}) =>
  Math.max(0, toNumber(getSeatInventoryObject(route.seatInventory)['Helicopter Cabin'], 0));

const serializeAirway = (item = {}) => ({
  id: String(item._id || item.id || ''),
  airlineName: item.airlineName || '',
  airlineCode: item.airlineCode || '',
  aircraftModel: item.aircraftModel || 'Helicopter',
  registrationCode: item.registrationCode || '',
  baseAirport: item.baseAirport || '',
  pilotName: item.pilotName || '',
  pilotPhone: item.pilotPhone || '',
  seatCapacity: toNumber(item.seatCapacity, 0),
  basePrice: toNumber(item.basePrice, 0),
  serviceTaxPercent: toNumber(item.serviceTaxPercent, 0),
  status: item.status || 'active',
  notes: item.notes || '',
  image: item.image || '',
  gallery: Array.isArray(item.gallery) ? item.gallery : [],
});

const serializeRoute = (route = {}, airway = null) => {
  const serializedAirway = airway ? serializeAirway(airway) : null;
  const airwayIds = Array.isArray(route.airwayIds) && route.airwayIds.length > 0
    ? route.airwayIds.map((entry) => String(entry?._id || entry || '')).filter(Boolean)
    : serializedAirway?.id
      ? [serializedAirway.id]
      : [];
  const airways = Array.isArray(route.airwayIds) && route.airwayIds.length > 0
    ? route.airwayIds
      .map((entry) => (entry && typeof entry === 'object' ? serializeAirway(entry) : null))
      .filter(Boolean)
    : serializedAirway
      ? [serializedAirway]
      : [];
  const baseFare = toNumber(serializedAirway?.basePrice, 0);
  const serviceTaxPercent = toNumber(serializedAirway?.serviceTaxPercent, 0);
  const serviceTaxAmount = (baseFare * serviceTaxPercent) / 100;

  return {
    id: String(route._id || route.id || ''),
    airwayId: String(route.airwayId?._id || route.airwayId || serializedAirway?.id || ''),
    airwayIds,
    routeName: route.routeName || '',
    flightNumber: route.flightNumber || '',
    originAirport: route.originAirport || '',
    destinationAirport: route.destinationAirport || '',
    distanceKm: toNumber(route.distanceKm, 0),
    durationMinutes: toNumber(route.durationMinutes, 0),
    departureTime: route.departureTime || '',
    arrivalTime: route.arrivalTime || '',
    operatingDays: Array.isArray(route.operatingDays) ? route.operatingDays : [],
    seatInventory: getSeatInventoryObject(route.seatInventory),
    routeStatus: route.routeStatus || 'scheduled',
    isFeatured: Boolean(route.isFeatured),
    notes: route.notes || '',
    image: route.image || '',
    gallery: Array.isArray(route.gallery) ? route.gallery : [],
    airway: serializedAirway,
    airways,
    availableSeats: getAvailableSeatCount(route),
    baseFare,
    serviceTaxPercent,
    serviceTaxAmount,
    totalFare: baseFare + serviceTaxAmount,
    createdAt: route.createdAt || null,
    updatedAt: route.updatedAt || null,
  };
};

const serializeBooking = (item = {}) => ({
  id: String(item._id || item.id || ''),
  bookingCode: item.bookingCode || '',
  airwayId: String(item.airwayId?._id || item.airwayId || ''),
  airwayName: item.airwayName || item.airwayId?.airlineName || '',
  routeId: String(item.routeId?._id || item.routeId || ''),
  routeName: item.routeName || item.routeId?.routeName || '',
  flightNumber: item.flightNumber || item.routeId?.flightNumber || '',
  customerName: item.customerName || '',
  customerPhone: item.customerPhone || '',
  customerEmail: item.customerEmail || '',
  seatClass: item.seatClass || 'Helicopter Cabin',
  seatCount: toNumber(item.seatCount, 0),
  subtotalFare: toNumber(item.subtotalFare, 0),
  serviceTaxAmount: toNumber(item.serviceTaxAmount, 0),
  serviceTaxPercent: toNumber(item.serviceTaxPercent, 0),
  totalFare: toNumber(item.totalFare, 0),
  travelDate: item.travelDate || null,
  paymentMethod: item.paymentMethod || 'reserve',
  paymentMethodLabel: item.paymentMethodLabel || '',
  paymentStatus: item.paymentStatus || 'pending',
  bookingStatus: item.bookingStatus || 'confirmed',
  notes: item.notes || '',
  passengerNames: Array.isArray(item.passengerNames) ? item.passengerNames : [],
  gatewaySlug: item.gatewaySlug || '',
  gatewayOrderId: item.gatewayOrderId || '',
  gatewayPaymentId: item.gatewayPaymentId || '',
  gatewayTransactionId: item.gatewayTransactionId || '',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

const buildBookingCode = () =>
  `HL-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;

const resolveBookingDraft = async (payload = {}, userId = '') => {
  if (!userId) {
    throw new ApiError(401, 'User authentication is required');
  }

  const route = await AirwayRoute.findById(payload?.routeId).populate('airwayId').populate('airwayIds');
  if (!route || !route.airwayId) {
    throw new ApiError(404, 'Selected helicopter route is no longer available');
  }
  const routeAirways = Array.isArray(route.airwayIds) && route.airwayIds.length > 0
    ? route.airwayIds
    : route.airwayId
      ? [route.airwayId]
      : [];
  const requestedAirwayId = toText(payload?.selectedAirwayId);
  const selectedAirway = requestedAirwayId
    ? routeAirways.find((item) => String(item?._id || item?.id || '') === requestedAirwayId)
    : route.airwayId;

  if (!selectedAirway) {
    throw new ApiError(400, 'Selected airline is not available on this route');
  }
  if (toLower(selectedAirway.status) !== 'active' || toLower(route.routeStatus) !== 'scheduled') {
    throw new ApiError(400, 'Selected helicopter route is not available right now');
  }

  const customerName = toText(payload?.customerName);
  const customerPhone = toText(payload?.customerPhone);
  if (!customerName || !customerPhone) {
    throw new ApiError(400, 'Passenger contact name and phone are required');
  }

  const seatCount = Math.max(1, toNumber(payload?.seatCount, 1));
  const availableSeats = getAvailableSeatCount(route);
  if (seatCount > availableSeats) {
    throw new ApiError(400, `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} left on this route`);
  }

  const passengerNames = Array.isArray(payload?.passengerNames)
    ? payload.passengerNames.map((item) => toText(item)).filter(Boolean)
    : [];
  if (passengerNames.length !== seatCount) {
    throw new ApiError(400, 'Please enter every passenger name before booking');
  }

  // SECURITY: these four used to fall back to the client's own numbers, so a
  // crafted request booked a 12,000-rupee helicopter seat for 1 rupee -- only
  // Razorpay's minimum-amount rule stopped a zero. The route and airline
  // already carry the price, so recompute from them and ignore the payload.
  const basePrice = toNumber(selectedAirway.basePrice, 0);
  const subtotalFare = Math.max(0, basePrice * seatCount);
  const serviceTaxPercent = Math.max(0, toNumber(selectedAirway.serviceTaxPercent, 0));
  const serviceTaxAmount = (subtotalFare * serviceTaxPercent) / 100;
  const totalFare = subtotalFare + serviceTaxAmount;

  return {
    userId,
    route,
    selectedAirway,
    selectedAirwayId: String(selectedAirway._id || selectedAirway.id || ''),
    customerName,
    customerPhone,
    customerEmail: toText(payload?.customerEmail).toLowerCase(),
    seatCount,
    passengerNames,
    subtotalFare,
    serviceTaxPercent,
    serviceTaxAmount,
    totalFare,
    travelDate: payload?.travelDate ? new Date(payload.travelDate) : new Date(),
    notes: toText(payload?.notes),
  };
};

const finalizeBooking = async ({
  draft,
  paymentMethod = 'online',
  paymentMethodLabel = '',
  paymentStatus = 'paid',
  gatewaySlug = '',
  gatewayOrderId = '',
  gatewayPaymentId = '',
  gatewayTransactionId = '',
}) => {
  const existingBooking =
    gatewayPaymentId
      ? await AirwayBooking.findOne({
        userId: draft.userId,
        gatewayPaymentId,
      })
      : gatewayTransactionId
        ? await AirwayBooking.findOne({
          userId: draft.userId,
          gatewayTransactionId,
        })
        : null;

  if (existingBooking) {
    return existingBooking;
  }

  const availableSeats = getAvailableSeatCount(draft.route);
  if (draft.seatCount > availableSeats) {
    throw new ApiError(409, `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} left on this route`);
  }

  const booking = await AirwayBooking.create({
    bookingCode: buildBookingCode(),
    userId: draft.userId,
    airwayId: draft.selectedAirway._id,
    routeId: draft.route._id,
    airwayName: draft.selectedAirway.airlineName || '',
    routeName: draft.route.routeName || '',
    flightNumber: draft.route.flightNumber || '',
    customerName: draft.customerName,
    customerPhone: draft.customerPhone,
    customerEmail: draft.customerEmail,
    seatClass: 'Helicopter Cabin',
    seatCount: draft.seatCount,
    subtotalFare: draft.subtotalFare,
    serviceTaxAmount: draft.serviceTaxAmount,
    serviceTaxPercent: draft.serviceTaxPercent,
    totalFare: draft.totalFare,
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

  const currentInventory = getSeatInventoryObject(draft.route.seatInventory);
  draft.route.seatInventory = {
    ...currentInventory,
    'Helicopter Cabin': Math.max(0, availableSeats - draft.seatCount),
  };
  await draft.route.save();

  return booking;
};

export const searchAirwayRoutes = asyncHandler(async (req, res) => {
  const { origin = '', destination = '', query = '', travelDate = '' } = req.query;
  const routes = await AirwayRoute.find({
    routeStatus: 'scheduled',
    ...(origin ? { originAirport: { $regex: toText(origin), $options: 'i' } } : {}),
    ...(destination ? { destinationAirport: { $regex: toText(destination), $options: 'i' } } : {}),
  })
    .populate('airwayId')
    .populate('airwayIds')
    .sort({ createdAt: -1 })
    .lean();

  const dayToken = getTravelDayToken(travelDate);
  const queryToken = toLower(query);
  const results = routes
    .filter((route) => {
      const airway = route.airwayId;
      if (!airway || toLower(airway.status) !== 'active') {
        return false;
      }
      if (getAvailableSeatCount(route) <= 0) {
        return false;
      }
      if (dayToken && !(Array.isArray(route.operatingDays) ? route.operatingDays : []).includes(dayToken)) {
        return false;
      }
      if (!queryToken) {
        return true;
      }
      const haystack = [
        route.routeName,
        route.flightNumber,
        route.originAirport,
        route.destinationAirport,
        airway.airlineName,
        airway.airlineCode,
        airway.pilotName,
        airway.baseAirport,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(queryToken);
    })
    .map((route) => serializeRoute(route, route.airwayId));

  return ok(res, results, 'Airway routes fetched successfully');
});

export const getAirwayRouteDetails = asyncHandler(async (req, res) => {
  const route = await AirwayRoute.findById(req.params.id).populate('airwayId').populate('airwayIds').lean();
  if (!route || !route.airwayId) {
    throw new ApiError(404, 'Airway route not found');
  }
  if (toLower(route.airwayId.status) !== 'active' || toLower(route.routeStatus) !== 'scheduled') {
    throw new ApiError(404, 'Airway route is not available right now');
  }

  return ok(res, serializeRoute(route, route.airwayId), 'Airway route fetched successfully');
});

export const createAirwayBooking = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  const draft = await resolveBookingDraft(req.body, userId);
  const requestedPaymentMethod = toLower(req.body?.paymentMethod);
  const requestedPaymentStatus = toLower(req.body?.paymentStatus);

  if (requestedPaymentMethod === 'online' || requestedPaymentStatus === 'paid') {
    throw new ApiError(400, 'Use the airway payment verification flow for online bookings');
  }

  const booking = await finalizeBooking({
    draft,
    paymentMethod: 'reserve',
    paymentMethodLabel: toText(req.body?.paymentMethodLabel),
    paymentStatus: ['pending', 'failed', 'refunded'].includes(requestedPaymentStatus)
      ? requestedPaymentStatus
      : 'pending',
    gatewaySlug: toText(req.body?.gatewaySlug),
    gatewayOrderId: toText(req.body?.gatewayOrderId),
    gatewayPaymentId: toText(req.body?.gatewayPaymentId),
    gatewayTransactionId: toText(req.body?.gatewayTransactionId),
  });

  return created(res, serializeBooking(booking), 'Airway booking created successfully');
});

export const createAirwayBookingOrder = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  const draft = await resolveBookingDraft(req.body, userId);
  const activeGateway = await getActivePaymentGateway();

  if (!activeGateway) {
    throw new ApiError(400, 'No payment gateway is enabled in the admin panel right now.');
  }

  if (activeGateway.slug === 'razor_pay') {
    const { keyId, keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');
    const compactUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'usr';
    const order = await razorpayRequest({
      method: 'POST',
      path: '/orders',
      body: {
        amount: Math.round(draft.totalFare * 100),
        currency: 'INR',
        receipt: `air_${compactUserId}_${Date.now().toString(36)}`,
        notes: {
          userId,
          routeId: String(draft.route._id),
          seatCount: String(draft.seatCount),
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
    }, 'Airway payment order created successfully');
  }

  if (activeGateway.slug === 'phone_pay') {
    const { merchantId, saltKey, saltIndex, environment } = await resolveConfiguredGatewayCredentials('phone_pay');
    const compactUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'usr';
    const merchantTransactionId = `UAIR${Date.now()}${compactUserId}`.slice(0, 34);
    const frontendBaseUrl = getFrontendBaseUrl();
    const redirectUrl = `${frontendBaseUrl}/taxi/user/airways/routes/${encodeURIComponent(String(draft.route._id))}?phonepe_txn=${encodeURIComponent(merchantTransactionId)}`;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/v1/common/payment-gateway/phonepe/callback`;

    const payload = await phonePeRequest({
      method: 'POST',
      path: '/pg/v1/pay',
      body: {
        merchantId,
        merchantTransactionId,
        merchantUserId: compactUserId,
        amount: Math.round(draft.totalFare * 100),
        redirectUrl,
        redirectMode: 'GET',
        callbackUrl,
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
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
      amount: Math.round(draft.totalFare * 100),
      currency: 'INR',
      checkoutUrl,
      method: payload?.data?.instrumentResponse?.redirectInfo?.method || 'GET',
    }, 'Airway PhonePe session created successfully');
  }

  throw new ApiError(400, `${activeGateway.label} is enabled by admin, but airway checkout is not implemented for it yet.`);
});

export const verifyAirwayBookingPayment = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  const draft = await resolveBookingDraft(req.body, userId);
  const gateway = toText(req.body?.gateway || req.body?.gatewaySlug).toLowerCase();

  if (gateway === 'razor_pay') {
    const orderId = toText(req.body?.razorpay_order_id);
    const paymentId = toText(req.body?.razorpay_payment_id);
    const signature = toText(req.body?.razorpay_signature);

    if (!orderId || !paymentId || !signature) {
      throw new ApiError(400, 'Payment verification fields are required');
    }

    const { keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');
    if (!verifyRazorpaySignature({ orderId, paymentId, signature, keySecret })) {
      throw new ApiError(400, 'Invalid payment signature');
    }

    const booking = await finalizeBooking({
      draft,
      paymentMethod: 'online',
      paymentMethodLabel: 'Razorpay',
      paymentStatus: 'paid',
      gatewaySlug: 'razor_pay',
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
    });

    return ok(res, serializeBooking(booking), 'Airway booking confirmed successfully');
  }

  if (gateway === 'phone_pay') {
    const merchantTransactionId = toText(req.body?.merchantTransactionId || req.body?.transactionId);
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
    const paymentId = toText(payload?.data?.transactionId || merchantTransactionId);

    if (paymentState === 'COMPLETED') {
      const booking = await finalizeBooking({
        draft,
        paymentMethod: 'online',
        paymentMethodLabel: 'PhonePe',
        paymentStatus: 'paid',
        gatewaySlug: 'phone_pay',
        gatewayTransactionId: merchantTransactionId,
        gatewayPaymentId: paymentId,
      });

      return ok(res, serializeBooking(booking), 'Airway booking confirmed successfully');
    }

    if (paymentState === 'PENDING') {
      return ok(res, {
        status: 'pending',
        gateway: 'phone_pay',
        merchantTransactionId,
        transactionId: paymentId,
      }, payload?.message || 'PhonePe payment is still pending');
    }

    return ok(res, {
      status: 'failed',
      gateway: 'phone_pay',
      merchantTransactionId,
      transactionId: paymentId,
      code: payload?.code || payload?.data?.responseCode || '',
    }, payload?.message || 'PhonePe payment was not completed');
  }

  throw new ApiError(400, 'Unsupported airway payment gateway');
});

export const getMyAirwayBooking = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  const booking = await AirwayBooking.findOne({
    _id: req.params.id,
    userId,
  }).lean();

  if (!booking) {
    throw new ApiError(404, 'Airway booking not found');
  }

  return ok(res, serializeBooking(booking), 'Airway booking fetched successfully');
});

export const listMyAirwayBookings = asyncHandler(async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    throw new ApiError(401, 'User authentication is required');
  }

  const page = Math.max(1, Number(req.query?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 10));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AirwayBooking.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AirwayBooking.countDocuments({ userId }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return ok(res, {
    results: items.map(serializeBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }, 'Airway bookings fetched successfully');
});
