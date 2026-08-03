// Seeds shared pooling routes so /taxi/user/pooling has Popular Routes to show.
//
// Upsert-only, matched on routeCode -- re-running updates in place and never
// deletes, so it is safe against a live database.
//
// Stops carry latitude/longitude, which the schema has always declared and
// nothing was populating until the admin form got Places autocomplete.
//
// Run: node seedPoolingRoutes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PoolingRoute } from './modules/taxi/admin/models/PoolingRoute.js';

dotenv.config({ path: './.env' });

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const stop = (seq, name, address, landmark, lat, lng, stopType = 'stop', etaMinutes = 0) => ({
  id: `stop-${seq}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  address,
  landmark,
  stopType,
  sequence: seq,
  etaMinutes,
  latitude: lat,
  longitude: lng,
});

const ROUTES = [
  {
    routeCode: 'PL-IDR-VJN-AIR',
    routeName: 'Vijay Nagar to Indore Airport',
    originLabel: 'Vijay Nagar',
    destinationLabel: 'Devi Ahilyabai Holkar Airport',
    description: 'Morning airport shuttle down AB Road. Boarding closes 15 minutes before departure.',
    farePerSeat: 180,
    maxSeatsPerBooking: 3,
    pickupPoints: [
      stop(1, 'Vijay Nagar Square', 'Vijay Nagar Square, AB Road, Indore', 'Near C21 Mall', 22.7533, 75.8937, 'pickup'),
      stop(2, 'Radisson Square', 'Radisson Square, Indore', 'Radisson Blu', 22.7411, 75.8925, 'pickup', 8),
    ],
    stops: [
      stop(3, 'Geeta Bhawan', 'Geeta Bhawan Square, Indore', 'Geeta Bhawan Hospital', 22.7196, 75.8815, 'both', 18),
    ],
    dropPoints: [
      stop(4, 'Airport Terminal', 'Devi Ahilyabai Holkar Airport, Indore', 'Departures gate', 22.7218, 75.8011, 'drop', 40),
    ],
    schedules: [
      { id: 'sch-1', label: 'Early Morning', departureTime: '05:30', arrivalTime: '06:20', activeDays: ALL_DAYS, status: 'active' },
      { id: 'sch-2', label: 'Midday', departureTime: '13:00', arrivalTime: '13:50', activeDays: ALL_DAYS, status: 'active' },
    ],
  },
  {
    routeCode: 'PL-IDR-BHP',
    routeName: 'Indore to Bhopal Daily Pool',
    originLabel: 'Indore',
    destinationLabel: 'Bhopal',
    description: 'Intercity shared cab along the Agra-Bombay road. Luggage allowed.',
    farePerSeat: 650,
    maxSeatsPerBooking: 4,
    pickupPoints: [
      stop(1, 'Navlakha Bus Stand', 'Navlakha Square, Indore', 'Navlakha bus stand', 22.7042, 75.8790, 'pickup'),
    ],
    stops: [
      stop(2, 'Dewas Naka', 'Dewas Naka, Indore', 'Toll plaza side', 22.7671, 75.9089, 'pickup', 25),
      stop(3, 'Sehore', 'Sehore Bypass, Madhya Pradesh', 'Bypass chowk', 23.2020, 77.0857, 'both', 150),
    ],
    dropPoints: [
      stop(4, 'Habibganj', 'Habibganj, Bhopal', 'Railway station', 23.2334, 77.4344, 'drop', 210),
    ],
    schedules: [
      { id: 'sch-1', label: 'Morning', departureTime: '06:00', arrivalTime: '09:30', activeDays: ALL_DAYS, status: 'active' },
      { id: 'sch-2', label: 'Evening', departureTime: '16:30', arrivalTime: '20:00', activeDays: ALL_DAYS, status: 'active' },
    ],
  },
  {
    routeCode: 'PL-IDR-UJN',
    routeName: 'Indore to Ujjain Temple Pool',
    originLabel: 'Indore',
    destinationLabel: 'Ujjain',
    description: 'Shared runs to Mahakaleshwar. Extra departures on Mondays and festival days.',
    farePerSeat: 250,
    maxSeatsPerBooking: 4,
    pickupPoints: [
      stop(1, 'Rajwada', 'Rajwada Palace, Indore', 'Main gate', 22.7177, 75.8545, 'pickup'),
      stop(2, 'Bhawarkua Square', 'Bhawarkua Square, Indore', 'Near MGM college', 22.6890, 75.8657, 'pickup', 12),
    ],
    stops: [
      stop(3, 'Sanwer', 'Sanwer Road, Madhya Pradesh', 'Sanwer bus stop', 22.9760, 75.8261, 'both', 35),
    ],
    dropPoints: [
      stop(4, 'Mahakaleshwar Temple', 'Mahakaleshwar Jyotirlinga, Ujjain', 'Temple gate 4', 23.1828, 75.7683, 'drop', 75),
    ],
    schedules: [
      { id: 'sch-1', label: 'Early Darshan', departureTime: '04:30', arrivalTime: '06:00', activeDays: ALL_DAYS, status: 'active' },
      { id: 'sch-2', label: 'Afternoon', departureTime: '14:00', arrivalTime: '15:30', activeDays: ALL_DAYS, status: 'active' },
    ],
  },
  {
    routeCode: 'PL-IDR-PIT-OFF',
    routeName: 'Palasia to Pithampur Office Pool',
    originLabel: 'Palasia',
    destinationLabel: 'Pithampur Industrial Area',
    description: 'Weekday commute for the Pithampur industrial belt. Fixed seats, same co-riders.',
    farePerSeat: 140,
    maxSeatsPerBooking: 2,
    pickupPoints: [
      stop(1, 'Palasia Square', 'Palasia Square, Indore', 'Near Apollo hospital', 22.7244, 75.8839, 'pickup'),
    ],
    stops: [
      stop(2, 'Rajendra Nagar', 'Rajendra Nagar, Indore', 'Railway crossing', 22.6702, 75.8399, 'pickup', 20),
    ],
    dropPoints: [
      stop(3, 'Sector 1 Gate', 'Sector 1, Pithampur', 'Main industrial gate', 22.6013, 75.6890, 'drop', 55),
    ],
    schedules: [
      { id: 'sch-1', label: 'Morning Shift', departureTime: '07:30', arrivalTime: '08:25', activeDays: WEEKDAYS, status: 'active' },
      { id: 'sch-2', label: 'Evening Shift', departureTime: '18:00', arrivalTime: '18:55', activeDays: WEEKDAYS, status: 'active' },
    ],
  },
  {
    routeCode: 'PL-IDR-OMK',
    routeName: 'Indore to Omkareshwar Weekend Pool',
    originLabel: 'Indore',
    destinationLabel: 'Omkareshwar',
    description: 'Weekend pilgrimage pool to the Narmada ghats. Returns the same evening.',
    farePerSeat: 420,
    maxSeatsPerBooking: 4,
    pickupPoints: [
      stop(1, 'Bhawarkua Square', 'Bhawarkua Square, Indore', 'Near MGM college', 22.6890, 75.8657, 'pickup'),
    ],
    stops: [
      stop(2, 'Simrol', 'Simrol, Madhya Pradesh', 'IIT Indore turn', 22.5290, 75.9210, 'both', 40),
    ],
    dropPoints: [
      stop(3, 'Omkareshwar Ghat', 'Omkareshwar, Khandwa', 'Nagar ghat parking', 22.2436, 76.1508, 'drop', 110),
    ],
    schedules: [
      { id: 'sch-1', label: 'Weekend Morning', departureTime: '05:00', arrivalTime: '07:00', activeDays: ['Sat', 'Sun'], status: 'active' },
    ],
  },
  {
    routeCode: 'PL-IDR-MHW',
    routeName: 'Indore to Mhow Commuter Pool',
    originLabel: 'Indore',
    destinationLabel: 'Mhow',
    description: 'Short-hop shared rides down the Mhow Naka corridor, running all day.',
    farePerSeat: 90,
    maxSeatsPerBooking: 3,
    pickupPoints: [
      stop(1, 'Mhow Naka', 'Mhow Naka Square, Indore', 'Bus stop side', 22.7040, 75.8395, 'pickup'),
    ],
    stops: [
      stop(2, 'Rau Circle', 'Rau Circle, Indore', 'Bypass junction', 22.6427, 75.8035, 'both', 15),
    ],
    dropPoints: [
      stop(3, 'Mhow Cantt', 'Mhow Cantonment, Madhya Pradesh', 'Cantt bus stand', 22.5530, 75.7605, 'drop', 35),
    ],
    schedules: [
      { id: 'sch-1', label: 'All Day', departureTime: '08:00', arrivalTime: '08:35', activeDays: ALL_DAYS, status: 'active' },
    ],
  },
];

const seedPoolingRoutes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    for (const route of ROUTES) {
      const existing = await PoolingRoute.findOne({ routeCode: route.routeCode });

      await PoolingRoute.findOneAndUpdate(
        { routeCode: route.routeCode },
        {
          $set: {
            ...route,
            status: 'active',
            active: true,
            maxAdvanceBookingHours: 24,
            boardingBufferMinutes: 15,
            poolingRules: {
              allowInstantBooking: true,
              allowLuggage: true,
              womenOnly: false,
              autoAssignNearestPickup: true,
              maxDetourKm: 5,
            },
          },
        },
        { new: true, upsert: true },
      );

      const stops =
        route.pickupPoints.length + route.stops.length + route.dropPoints.length;
      console.log(
        `${existing ? '↻' : '＋'} ${route.originLabel} → ${route.destinationLabel}` +
          `  ₹${route.farePerSeat}/seat, ${stops} stops, ${route.schedules.length} schedule(s)`,
      );
    }

    const active = await PoolingRoute.countDocuments({ status: 'active', active: true });
    console.log(`\n🎉 ${active} active pooling routes`);
    console.log('   The Popular Routes list shows the first 6.');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedPoolingRoutes();
