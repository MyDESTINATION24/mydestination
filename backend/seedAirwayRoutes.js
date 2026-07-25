import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Airway } from './modules/taxi/admin/models/Airway.js';
import { AirwayRoute } from './modules/taxi/admin/models/AirwayRoute.js';

dotenv.config({ path: './.env' });

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Fare lives on the Airway, not the route, so each price point needs its own
// operator record. Kept realistic: these are genuinely different operators.
const OPERATORS = [
  {
    airlineName: 'Kestrel Heli Services',
    airlineCode: 'KHS',
    aircraftModel: 'Airbus H125',
    registrationCode: 'VT-KHS',
    baseAirport: 'DEHRADUN',
    pilotName: 'Capt. R. Rawat',
    seatCapacity: 6,
    basePrice: 8095,
    serviceTaxPercent: 5,
    status: 'active',
  },
  {
    airlineName: 'Himalayan Wings',
    airlineCode: 'HMW',
    aircraftModel: 'Bell 407',
    registrationCode: 'VT-HMW',
    baseAirport: 'GOVINDGHAT',
    pilotName: 'Capt. S. Negi',
    seatCapacity: 6,
    basePrice: 3048,
    serviceTaxPercent: 5,
    status: 'active',
  },
  {
    airlineName: 'Devbhoomi Air',
    airlineCode: 'DVB',
    aircraftModel: 'Airbus H130',
    registrationCode: 'VT-DVB',
    baseAirport: 'DEHRADUN',
    pilotName: 'Capt. A. Bisht',
    seatCapacity: 7,
    basePrice: 11429,
    serviceTaxPercent: 5,
    status: 'active',
  },
];

const ROUTES = [
  {
    operator: 'KHS',
    routeName: 'Kedarnath Yatra',
    flightNumber: 'KHS101',
    originAirport: 'DEHRADUN',
    destinationAirport: 'KEDARNATH',
    distanceKm: 105,
    durationMinutes: 45,
    departureTime: '07:00',
    arrivalTime: '07:45',
    isFeatured: true,
    notes: 'Same-day darshan shuttle. Priority helipad slot at Kedarnath.',
  },
  {
    operator: 'HMW',
    routeName: 'Valley of Flowers',
    flightNumber: 'HMW202',
    originAirport: 'GOVINDGHAT',
    destinationAirport: 'GHANGARIA',
    distanceKm: 18,
    durationMinutes: 12,
    departureTime: '08:30',
    arrivalTime: '08:42',
    isFeatured: true,
    notes: 'Seasonal sector, operates July to September.',
  },
  {
    operator: 'DVB',
    routeName: 'Do Dham Express',
    flightNumber: 'DVB303',
    originAirport: 'DEHRADUN',
    destinationAirport: 'BADRINATH',
    distanceKm: 180,
    durationMinutes: 70,
    departureTime: '06:30',
    arrivalTime: '07:40',
    isFeatured: true,
    notes: 'Kedarnath and Badrinath in a single day.',
  },
  {
    operator: 'KHS',
    routeName: 'Gangotri Darshan',
    flightNumber: 'KHS102',
    originAirport: 'DEHRADUN',
    destinationAirport: 'HARSIL',
    distanceKm: 145,
    durationMinutes: 55,
    departureTime: '09:15',
    arrivalTime: '10:10',
    isFeatured: false,
    notes: 'Harsil helipad, road transfer to Gangotri temple.',
  },
  {
    operator: 'KHS',
    routeName: 'Yamunotri Shuttle',
    flightNumber: 'KHS103',
    originAirport: 'DEHRADUN',
    destinationAirport: 'KHARSALI',
    distanceKm: 120,
    durationMinutes: 50,
    departureTime: '11:00',
    arrivalTime: '11:50',
    isFeatured: false,
    notes: 'Kharsali helipad, short pony transfer to Yamunotri.',
  },
];

const seedAirwayRoutes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    const airwayByCode = new Map();
    for (const operator of OPERATORS) {
      // Upsert by code so re-running does not duplicate operators or orphan
      // the routes that already point at them.
      const airway = await Airway.findOneAndUpdate(
        { airlineCode: operator.airlineCode },
        { $set: operator },
        { new: true, upsert: true },
      );
      airwayByCode.set(operator.airlineCode, airway);
      console.log(`✈️  ${operator.airlineName} (${operator.airlineCode})`);
    }

    for (const route of ROUTES) {
      const airway = airwayByCode.get(route.operator);
      const { operator, ...routeFields } = route;

      await AirwayRoute.findOneAndUpdate(
        { flightNumber: routeFields.flightNumber },
        {
          $set: {
            ...routeFields,
            airwayId: airway._id,
            airwayIds: [airway._id],
            operatingDays: ALL_DAYS,
            seatInventory: { 'Helicopter Cabin': airway.seatCapacity },
            routeStatus: 'scheduled',
          },
        },
        { new: true, upsert: true },
      );

      const total = Math.round(airway.basePrice * (1 + airway.serviceTaxPercent / 100));
      const star = routeFields.isFeatured ? '⭐' : '  ';
      console.log(`${star} ${routeFields.flightNumber}  ${routeFields.routeName} — ₹${total}`);
    }

    const featured = await AirwayRoute.countDocuments({ isFeatured: true });
    console.log(`\n🎉 Seeded ${ROUTES.length} routes, ${featured} shown as Popular Sectors`);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAirwayRoutes();
