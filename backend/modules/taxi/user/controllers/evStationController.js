import { EVStation } from '../../admin/models/EVStation.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });

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
  };
};

// Generates default mock stations if none exist in the database
const seedDefaultStations = async (userLat, userLng) => {
  const defaults = [
    {
      name: 'Delhi Connaught Place Supercharger',
      address: 'Radial Road Number 6, Connaught Place, New Delhi, Delhi 110001',
      lng: 77.2197,
      lat: 28.6304,
      stallsTotal: 12,
      stallsAvailable: 7,
      powerKW: 250,
      pricing: '₹18/kWh',
      connectorTypes: ['Supercharger', 'CCS2'],
    },
    {
      name: 'Indore Vijay Nagar Charger',
      address: 'Vijay Nagar Square, Near C21 Mall, Indore, MP 452010',
      lng: 75.8975,
      lat: 22.7533,
      stallsTotal: 8,
      stallsAvailable: 4,
      powerKW: 120,
      pricing: '₹14/kWh',
      connectorTypes: ['CCS2', 'Type 2'],
    },
    {
      name: 'Mumbai Bandra Kurla Complex Station',
      address: 'G Block BKC, Bandra East, Mumbai, Maharashtra 400051',
      lng: 72.8643,
      lat: 19.0607,
      stallsTotal: 16,
      stallsAvailable: 11,
      powerKW: 150,
      pricing: '₹16/kWh',
      connectorTypes: ['CCS2', 'CHAdeMO'],
    },
  ];

  // If user location is valid, add two nearby chargers to make it immediately testable anywhere
  if (userLat && userLng) {
    defaults.push({
      name: 'Ultra Supercharger - Nearest Station',
      address: 'Premium EV Charging Hub, 1.2km from your location',
      lng: Number(userLng) + 0.0095, // approx 1 km east
      lat: Number(userLat) + 0.0055, // approx 600m north
      stallsTotal: 10,
      stallsAvailable: 6,
      powerKW: 250,
      pricing: '₹15/kWh',
      connectorTypes: ['Supercharger', 'CCS2'],
    }, {
      name: 'EV Destination Charging Point',
      address: 'City Shopping Center Parking Level 2, 3.4km away',
      lng: Number(userLng) - 0.0154,
      lat: Number(userLat) - 0.0125,
      stallsTotal: 6,
      stallsAvailable: 2,
      powerKW: 50,
      pricing: '₹12/kWh',
      connectorTypes: ['Type 2', 'CCS2'],
    });
  }

  const created = [];
  for (const item of defaults) {
    const station = await EVStation.create({
      name: item.name,
      address: item.address,
      location: {
        type: 'Point',
        coordinates: [item.lng, item.lat],
      },
      stallsTotal: item.stallsTotal,
      stallsAvailable: item.stallsAvailable,
      powerKW: item.powerKW,
      pricing: item.pricing,
      connectorTypes: item.connectorTypes,
      status: 'active',
    });
    created.push(station);
  }
  return created;
};

export const getClosestEVStations = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 50000 } = req.query;

  if (!lat || !lng) {
    throw new ApiError(400, 'Latitude (lat) and Longitude (lng) query parameters are required');
  }

  const userLat = Number(lat);
  const userLng = Number(lng);

  // Check if DB is empty
  let count = await EVStation.countDocuments();
  if (count === 0) {
    await seedDefaultStations(userLat, userLng);
  }

  // Find stations near coordinates
  const stations = await EVStation.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [userLng, userLat],
        },
        $maxDistance: Number(radius),
      },
    },
  }).limit(10).lean();

  // If no stations found near user, return all stations in the database so the list isn't blank
  if (stations.length === 0) {
    const allStations = await EVStation.find().limit(10).lean();
    return ok(res, allStations.map(serializeEVStation), 'No stations near you. Showing other stations.');
  }

  return ok(res, stations.map(serializeEVStation), 'Closest EV stations fetched successfully');
});
