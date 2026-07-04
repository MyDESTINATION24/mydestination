import { EVStation } from '../models/EVStation.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

const toText = (value = '') => String(value || '').trim();
const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const serializeEVStation = (item = {}) => {
  const coords = item.location?.coordinates || [0, 0];
  return {
    id: String(item._id || item.id || ''),
    name: item.name || '',
    address: item.address || '',
    longitude: Number(coords[0]),
    latitude: Number(coords[1]),
    stallsTotal: Number(item.stallsTotal ?? 8),
    stallsAvailable: Number(item.stallsAvailable ?? 8),
    powerKW: Number(item.powerKW ?? 150),
    pricing: item.pricing || '₹15/kWh',
    connectorTypes: Array.isArray(item.connectorTypes) ? item.connectorTypes : ['CCS2', 'Type 2'],
    status: item.status || 'active',
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
};

export const getEVStations = asyncHandler(async (_req, res) => {
  const stations = await EVStation.find().sort({ createdAt: -1 }).lean();
  return ok(res, stations.map(serializeEVStation), 'EV stations fetched successfully');
});

export const createEVStation = asyncHandler(async (req, res) => {
  const { name, address, latitude, longitude, stallsTotal, stallsAvailable, powerKW, pricing, connectorTypes, status } = req.body;

  if (!toText(name) || !toText(address) || latitude === undefined || longitude === undefined) {
    throw new ApiError(400, 'Station name, address, latitude, and longitude are required');
  }

  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  const station = await EVStation.create({
    name: toText(name),
    address: toText(address),
    location: {
      type: 'Point',
      coordinates: [lng, lat], // [longitude, latitude]
    },
    stallsTotal: toNumber(stallsTotal, 8),
    stallsAvailable: toNumber(stallsAvailable, stallsTotal ?? 8),
    powerKW: toNumber(powerKW, 150),
    pricing: toText(pricing || '₹15/kWh'),
    connectorTypes: Array.isArray(connectorTypes) ? connectorTypes.map(toText).filter(Boolean) : ['CCS2', 'Type 2'],
    status: ['active', 'maintenance', 'coming_soon'].includes(toText(status)) ? toText(status) : 'active',
  });

  return created(res, serializeEVStation(station), 'EV station created successfully');
});

export const updateEVStation = asyncHandler(async (req, res) => {
  const station = await EVStation.findById(req.params.id);
  if (!station) {
    throw new ApiError(404, 'EV station not found');
  }

  const { name, address, latitude, longitude, stallsTotal, stallsAvailable, powerKW, pricing, connectorTypes, status } = req.body;

  if (name !== undefined) station.name = toText(name);
  if (address !== undefined) station.address = toText(address);
  if (latitude !== undefined || longitude !== undefined) {
    const coords = station.location?.coordinates || [0, 0];
    const lng = longitude !== undefined ? toNumber(longitude) : coords[0];
    const lat = latitude !== undefined ? toNumber(latitude) : coords[1];
    station.location = {
      type: 'Point',
      coordinates: [lng, lat],
    };
  }
  if (stallsTotal !== undefined) station.stallsTotal = toNumber(stallsTotal, station.stallsTotal);
  if (stallsAvailable !== undefined) station.stallsAvailable = toNumber(stallsAvailable, station.stallsAvailable);
  if (powerKW !== undefined) station.powerKW = toNumber(powerKW, station.powerKW);
  if (pricing !== undefined) station.pricing = toText(pricing);
  if (connectorTypes !== undefined) station.connectorTypes = Array.isArray(connectorTypes) ? connectorTypes.map(toText).filter(Boolean) : station.connectorTypes;
  if (status !== undefined) {
    station.status = ['active', 'maintenance', 'coming_soon'].includes(toText(status)) ? toText(status) : station.status;
  }

  await station.save();
  return ok(res, serializeEVStation(station), 'EV station updated successfully');
});

export const deleteEVStation = asyncHandler(async (req, res) => {
  const station = await EVStation.findByIdAndDelete(req.params.id);
  if (!station) {
    throw new ApiError(404, 'EV station not found');
  }

  return ok(res, null, 'EV station deleted successfully');
});
