import mongoose from 'mongoose';
import { Airway } from '../models/Airway.js';
import { AirwayRoute } from '../models/AirwayRoute.js';
import { AirwayBooking } from '../models/AirwayBooking.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

const createId = (prefix = 'item') =>
  `${prefix}-${new mongoose.Types.ObjectId().toString().slice(-12)}`;

const toText = (value = '') => String(value || '').trim();
const toUpper = (value = '') => toText(value).toUpperCase();
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildSeatClasses = (payload = {}, existing = null) => {
  const existingSeatClasses = Array.isArray(existing?.seatClasses) ? existing.seatClasses : [];
  const payloadSeatClasses = Array.isArray(payload?.seatClasses) ? payload.seatClasses : [];
  const seatCapacity = Math.max(0, toNumber(payload.seatCapacity, existing?.seatCapacity || 0));
  const basePrice = Math.max(0, toNumber(payload.basePrice, existing?.basePrice || 0));
  const source = payloadSeatClasses.length > 0 ? payloadSeatClasses : existingSeatClasses;

  if (source.length > 0) {
    return source.map((item, index) => ({
      id: toText(item.id) || createId(`seat-class-${index + 1}`),
      cabin: toText(item.cabin) || 'Helicopter Cabin',
      seatCode: toText(item.seatCode) || 'HELI',
      seatCount: Math.max(0, toNumber(item.seatCount, seatCapacity)),
      fare: Math.max(0, toNumber(item.fare, basePrice)),
    }));
  }

  return [
    {
      id: createId('seat-class'),
      cabin: 'Helicopter Cabin',
      seatCode: 'HELI',
      seatCount: seatCapacity,
      fare: basePrice,
    },
  ];
};

const normalizeAirwayPayload = (payload = {}, existing = null) => {
  const seatCapacity = Math.max(0, toNumber(payload.seatCapacity, existing?.seatCapacity || 0));
  const basePrice = Math.max(0, toNumber(payload.basePrice, existing?.basePrice || 0));
  const serviceTaxPercent = Math.max(0, toNumber(payload.serviceTaxPercent, existing?.serviceTaxPercent || 0));

  return {
    airlineName: toText(payload.airlineName || existing?.airlineName),
    airlineCode: toUpper(payload.airlineCode || existing?.airlineCode),
    aircraftModel: toText(payload.aircraftModel || existing?.aircraftModel || 'Helicopter') || 'Helicopter',
    registrationCode: toUpper(payload.registrationCode || existing?.registrationCode),
    baseAirport: toUpper(payload.baseAirport || existing?.baseAirport),
    pilotName: toText(payload.pilotName || existing?.pilotName),
    pilotPhone: toText(payload.pilotPhone || existing?.pilotPhone),
    seatCapacity,
    basePrice,
    serviceTaxPercent,
    status: ['draft', 'active', 'paused'].includes(toText(payload.status || existing?.status).toLowerCase())
      ? toText(payload.status || existing?.status).toLowerCase()
      : 'active',
    notes: toText(payload.notes || existing?.notes),
    seatClasses: buildSeatClasses({ ...payload, seatCapacity, basePrice }, existing),
    image: toText(payload.image || existing?.image),
    gallery: Array.isArray(payload.gallery) ? payload.gallery.map(item => toText(item)).filter(Boolean) : (Array.isArray(existing?.gallery) ? existing.gallery : []),
  };
};

const normalizeSeatInventory = (input = {}, fallbackSeatCapacity = 0) => {
  const entries = Object.entries(input || {}).map(([key, value]) => [toText(key), Math.max(0, toNumber(value, 0))]);
  if (entries.length > 0) {
    return Object.fromEntries(entries.filter(([key]) => key));
  }
  return {
    'Helicopter Cabin': Math.max(0, toNumber(fallbackSeatCapacity, 0)),
  };
};

const normalizeRoutePayload = (payload = {}, existing = null, airway = null) => ({
  airwayIds: (() => {
    const source = Array.isArray(payload.airwayIds)
      ? payload.airwayIds
      : Array.isArray(existing?.airwayIds) && existing.airwayIds.length > 0
        ? existing.airwayIds
        : [payload.airwayId || existing?.airwayId].filter(Boolean);

    return [...new Set(source.map((item) => String(item || '').trim()).filter(Boolean))];
  })(),
  airwayId: payload.airwayId || existing?.airwayId,
  routeName: toText(payload.routeName || existing?.routeName),
  flightNumber: toUpper(payload.flightNumber || existing?.flightNumber),
  originAirport: toUpper(payload.originAirport || existing?.originAirport),
  destinationAirport: toUpper(payload.destinationAirport || existing?.destinationAirport),
  distanceKm: Math.max(0, toNumber(payload.distanceKm, existing?.distanceKm || 0)),
  durationMinutes: Math.max(0, toNumber(payload.durationMinutes, existing?.durationMinutes || 0)),
  departureTime: toText(payload.departureTime || existing?.departureTime),
  arrivalTime: toText(payload.arrivalTime || existing?.arrivalTime),
  operatingDays: Array.isArray(payload.operatingDays)
    ? payload.operatingDays.map((item) => toText(item)).filter(Boolean)
    : Array.isArray(existing?.operatingDays)
      ? existing.operatingDays.map((item) => toText(item)).filter(Boolean)
      : [],
  seatInventory: normalizeSeatInventory(
    payload.seatInventory || existing?.seatInventory || {},
    airway?.seatCapacity || existing?.seatInventory?.['Helicopter Cabin'] || 0,
  ),
  routeStatus: ['scheduled', 'seasonal', 'paused'].includes(toText(payload.routeStatus || existing?.routeStatus).toLowerCase())
    ? toText(payload.routeStatus || existing?.routeStatus).toLowerCase()
    : 'scheduled',
  isFeatured: payload.isFeatured === undefined ? Boolean(existing?.isFeatured) : Boolean(payload.isFeatured),
  notes: toText(payload.notes || existing?.notes),
  image: toText(payload.image || existing?.image),
  gallery: Array.isArray(payload.gallery) ? payload.gallery.map(item => toText(item)).filter(Boolean) : (Array.isArray(existing?.gallery) ? existing.gallery : []),
});

const serializeAirway = (item = {}) => ({
  id: String(item._id || item.id || ''),
  airlineName: item.airlineName || '',
  airlineCode: item.airlineCode || '',
  aircraftModel: item.aircraftModel || 'Helicopter',
  registrationCode: item.registrationCode || '',
  baseAirport: item.baseAirport || '',
  pilotName: item.pilotName || '',
  pilotPhone: item.pilotPhone || '',
  seatCapacity: Number(item.seatCapacity || 0),
  basePrice: Number(item.basePrice || 0),
  serviceTaxPercent: Number(item.serviceTaxPercent || 0),
  status: item.status || 'active',
  notes: item.notes || '',
  seatClasses: Array.isArray(item.seatClasses)
    ? item.seatClasses.map((seatClass, index) => ({
        id: seatClass.id || createId(`seat-class-${index + 1}`),
        cabin: seatClass.cabin || 'Helicopter Cabin',
        seatCode: seatClass.seatCode || 'HELI',
        seatCount: Number(seatClass.seatCount || 0),
        fare: Number(seatClass.fare || 0),
      }))
    : [],
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
  image: item.image || '',
  gallery: Array.isArray(item.gallery) ? item.gallery : [],
});

const serializeRoute = (item = {}, airwayMap = new Map()) => {
  const airwayId = String(item.airwayId?._id || item.airwayId || '');
  const airwayIds = Array.isArray(item.airwayIds) && item.airwayIds.length > 0
    ? item.airwayIds.map((entry) => String(entry?._id || entry || '')).filter(Boolean)
    : airwayId
      ? [airwayId]
      : [];
  const airway = airwayMap.get(airwayId) || item.airwayId || null;
  const airways = airwayIds
    .map((id) => airwayMap.get(id))
    .filter(Boolean);
  const seatInventoryObject =
    item.seatInventory instanceof Map
      ? Object.fromEntries(item.seatInventory.entries())
      : item.seatInventory && typeof item.seatInventory === 'object'
        ? Object.fromEntries(Object.entries(item.seatInventory))
        : {};

  return {
    id: String(item._id || item.id || ''),
    airwayId,
    airwayIds,
    routeName: item.routeName || '',
    flightNumber: item.flightNumber || '',
    originAirport: item.originAirport || '',
    destinationAirport: item.destinationAirport || '',
    distanceKm: Number(item.distanceKm || 0),
    durationMinutes: Number(item.durationMinutes || 0),
    departureTime: item.departureTime || '',
    arrivalTime: item.arrivalTime || '',
    operatingDays: Array.isArray(item.operatingDays) ? item.operatingDays : [],
    seatInventory: Object.fromEntries(
      Object.entries(seatInventoryObject).map(([key, value]) => [key, Number(value || 0)]),
    ),
    routeStatus: item.routeStatus || 'scheduled',
    isFeatured: Boolean(item.isFeatured),
    notes: item.notes || '',
    image: item.image || '',
    gallery: Array.isArray(item.gallery) ? item.gallery : [],
    airway: airway?._id ? serializeAirway(airway) : airwayMap.get(airwayId) || null,
    airways,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
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
  seatCount: Number(item.seatCount || 0),
  subtotalFare: Number(item.subtotalFare || 0),
  serviceTaxAmount: Number(item.serviceTaxAmount || 0),
  serviceTaxPercent: Number(item.serviceTaxPercent || 0),
  totalFare: Number(item.totalFare || 0),
  travelDate: item.travelDate || null,
  paymentMethod: item.paymentMethod || 'reserve',
  paymentMethodLabel: item.paymentMethodLabel || '',
  paymentStatus: item.paymentStatus || 'pending',
  bookingStatus: item.bookingStatus || 'confirmed',
  notes: item.notes || '',
  passengerNames: Array.isArray(item.passengerNames) ? item.passengerNames : [],
  gatewaySlug: item.gatewaySlug || '',
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

export const getAirways = asyncHandler(async (_req, res) => {
  const airways = await Airway.find().sort({ createdAt: -1 }).lean();
  return ok(res, airways.map(serializeAirway), 'Airways fetched successfully');
});

export const createAirway = asyncHandler(async (req, res) => {
  const normalized = normalizeAirwayPayload(req.body);
  if (!normalized.airlineName || !normalized.airlineCode) {
    throw new ApiError(400, 'Airline name and code are required');
  }

  const airway = await Airway.create(normalized);
  return created(res, serializeAirway(airway), 'Airway created successfully');
});

export const updateAirway = asyncHandler(async (req, res) => {
  const existing = await Airway.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Airway not found');
  }

  const normalized = normalizeAirwayPayload(req.body, existing.toObject());
  Object.assign(existing, normalized);
  await existing.save();

  return ok(res, serializeAirway(existing), 'Airway updated successfully');
});

export const deleteAirway = asyncHandler(async (req, res) => {
  const airway = await Airway.findByIdAndDelete(req.params.id);
  if (!airway) {
    throw new ApiError(404, 'Airway not found');
  }

  const routeIds = await AirwayRoute.find({
    $or: [{ airwayId: airway._id }, { airwayIds: airway._id }],
  }).distinct('_id');
  await AirwayRoute.deleteMany({ airwayId: airway._id });
  await AirwayRoute.updateMany(
    { airwayIds: airway._id },
    { $pull: { airwayIds: airway._id } },
  );
  await AirwayBooking.deleteMany({
    $or: [
      { airwayId: airway._id },
      { routeId: { $in: routeIds } },
    ],
  });

  return ok(res, null, 'Airway deleted successfully');
});

export const getAirwayRoutes = asyncHandler(async (_req, res) => {
  const [routes, airways] = await Promise.all([
    AirwayRoute.find().sort({ createdAt: -1 }).lean(),
    Airway.find().lean(),
  ]);
  const airwayMap = new Map(airways.map((item) => [String(item._id), serializeAirway(item)]));
  return ok(res, routes.map((item) => serializeRoute(item, airwayMap)), 'Airway routes fetched successfully');
});

export const createAirwayRoute = asyncHandler(async (req, res) => {
  const requestedAirwayIds = Array.isArray(req.body.airwayIds)
    ? [...new Set(req.body.airwayIds.map((item) => String(item || '').trim()).filter(Boolean))]
    : [String(req.body.airwayId || '').trim()].filter(Boolean);
  if (requestedAirwayIds.length === 0) {
    throw new ApiError(400, 'Please select at least one valid airway');
  }
  const airways = await Airway.find({ _id: { $in: requestedAirwayIds } }).lean();
  if (airways.length !== requestedAirwayIds.length) {
    throw new ApiError(400, 'Please select valid airway entries');
  }
  const primaryAirway = airways.find((item) => String(item._id) === requestedAirwayIds[0]) || airways[0];

  const normalized = normalizeRoutePayload(
    { ...req.body, airwayId: String(primaryAirway._id), airwayIds: requestedAirwayIds },
    null,
    primaryAirway,
  );
  if (!normalized.routeName || !normalized.flightNumber) {
    throw new ApiError(400, 'Route name and flight number are required');
  }

  const route = await AirwayRoute.create(normalized);
  const airwayMap = new Map(airways.map((item) => [String(item._id), serializeAirway(item)]));
  return created(res, serializeRoute(route.toObject(), airwayMap), 'Airway route created successfully');
});

export const updateAirwayRoute = asyncHandler(async (req, res) => {
  const existing = await AirwayRoute.findById(req.params.id).lean();
  if (!existing) {
    throw new ApiError(404, 'Airway route not found');
  }

  const requestedAirwayIds = Array.isArray(req.body.airwayIds)
    ? [...new Set(req.body.airwayIds.map((item) => String(item || '').trim()).filter(Boolean))]
    : Array.isArray(existing.airwayIds) && existing.airwayIds.length > 0
      ? existing.airwayIds.map((item) => String(item || '').trim()).filter(Boolean)
      : [String(req.body.airwayId || existing.airwayId || '').trim()].filter(Boolean);
  if (requestedAirwayIds.length === 0) {
    throw new ApiError(400, 'Please select at least one valid airway');
  }
  const airways = await Airway.find({ _id: { $in: requestedAirwayIds } }).lean();
  if (airways.length !== requestedAirwayIds.length) {
    throw new ApiError(400, 'Please select valid airway entries');
  }
  const primaryAirway = airways.find((item) => String(item._id) === requestedAirwayIds[0]) || airways[0];

  const normalized = normalizeRoutePayload(
    { ...req.body, airwayId: String(primaryAirway._id), airwayIds: requestedAirwayIds },
    existing,
    primaryAirway,
  );
  const route = await AirwayRoute.findByIdAndUpdate(req.params.id, normalized, { new: true, lean: true });
  const airwayMap = new Map(airways.map((item) => [String(item._id), serializeAirway(item)]));
  return ok(res, serializeRoute(route, airwayMap), 'Airway route updated successfully');
});

export const deleteAirwayRoute = asyncHandler(async (req, res) => {
  const route = await AirwayRoute.findByIdAndDelete(req.params.id);
  if (!route) {
    throw new ApiError(404, 'Airway route not found');
  }

  await AirwayBooking.deleteMany({ routeId: route._id });
  return ok(res, null, 'Airway route deleted successfully');
});

export const getAirwayBookings = asyncHandler(async (_req, res) => {
  const bookings = await AirwayBooking.find()
    .populate('airwayId', 'airlineName airlineCode')
    .populate('routeId', 'routeName flightNumber')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, bookings.map(serializeBooking), 'Airway bookings fetched successfully');
});

export const updateAirwayBookingStatus = asyncHandler(async (req, res) => {
  const nextStatus = toText(req.body?.status).toLowerCase();
  if (!['confirmed', 'checked_in', 'boarding', 'cancelled'].includes(nextStatus)) {
    throw new ApiError(400, 'Invalid airway booking status');
  }

  const booking = await AirwayBooking.findById(req.params.id);
  if (!booking) {
    throw new ApiError(404, 'Airway booking not found');
  }

  const wasCancelled = booking.bookingStatus === 'cancelled';
  booking.bookingStatus = nextStatus;
  await booking.save();

  if (!wasCancelled && nextStatus === 'cancelled') {
    const route = await AirwayRoute.findById(booking.routeId);
    if (route) {
      const currentInventory = route.seatInventory instanceof Map
        ? Object.fromEntries(route.seatInventory.entries())
        : {};
      const currentSeats = Math.max(0, toNumber(currentInventory['Helicopter Cabin'], 0));
      route.seatInventory = {
        ...currentInventory,
        'Helicopter Cabin': currentSeats + Math.max(1, toNumber(booking.seatCount, 1)),
      };
      await route.save();
    }
  }

  return ok(res, serializeBooking(booking), 'Airway booking status updated successfully');
});
