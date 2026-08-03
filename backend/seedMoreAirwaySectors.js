// Adds two more helicopter sectors and features every route that has cover
// art, so Popular Sectors has enough cards to scroll through.
//
// Upsert-only on flightNumber. Never overwrites an existing image.
//
// Run: node seedMoreAirwaySectors.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cloudinary from './config/cloudinary.js';
import { Airway } from './modules/taxi/admin/models/Airway.js';
import { AirwayRoute } from './modules/taxi/admin/models/AirwayRoute.js';

dotenv.config({ path: './.env' });

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

const ROUTES = [
  {
    operator: 'HMW',
    routeName: 'Hemkund Sahib Darshan',
    flightNumber: 'HMW203',
    originAirport: 'GOVINDGHAT',
    destinationAirport: 'HEMKUND SAHIB',
    distanceKm: 21,
    durationMinutes: 15,
    departureTime: '07:30',
    arrivalTime: '07:45',
    notes: 'Seasonal sector to the gurudwara, operating June to October.',
    photoId: 2437291,
    why: 'high alpine meadow below the peaks',
  },
  {
    operator: 'DVB',
    routeName: 'Kedarnath Early Darshan',
    flightNumber: 'DVB304',
    originAirport: 'SAHASTRADHARA',
    destinationAirport: 'KEDARNATH',
    distanceKm: 98,
    durationMinutes: 40,
    departureTime: '05:15',
    arrivalTime: '05:55',
    notes: 'First slot of the day from the Sahastradhara helipad.',
    photoId: 1624496,
    why: 'pre-dawn sky over the range, matching the first slot',
  },
];

const seedMoreAirwaySectors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    for (const route of ROUTES) {
      const airway = await Airway.findOne({ airlineCode: route.operator });
      if (!airway) {
        console.log(`⏭️  ${route.flightNumber} — operator ${route.operator} missing, skipping`);
        continue;
      }

      const existing = await AirwayRoute.findOne({ flightNumber: route.flightNumber });
      let imageUrl = existing?.image || '';

      if (!imageUrl) {
        const upload = await cloudinary.uploader.upload(pexels(route.photoId), {
          folder: 'taxi/airways',
          public_id: `sector-${route.photoId}`,
          overwrite: true,
          transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });
        imageUrl = upload.secure_url;
      }

      const { operator, photoId, why, ...fields } = route;

      await AirwayRoute.findOneAndUpdate(
        { flightNumber: route.flightNumber },
        {
          $set: {
            ...fields,
            airwayId: airway._id,
            airwayIds: [airway._id],
            operatingDays: ALL_DAYS,
            seatInventory: { 'Helicopter Cabin': airway.seatCapacity },
            routeStatus: 'scheduled',
            isFeatured: true,
            image: imageUrl,
          },
        },
        { new: true, upsert: true },
      );

      console.log(`${existing ? '↻' : '＋'} ${route.originAirport} → ${route.destinationAirport}  (${why})`);
    }

    // anything with cover art is worth showing in the strip
    const promoted = await AirwayRoute.updateMany(
      // only real uploaded covers -- some legacy routes carry a base64 stub
      { image: { $regex: /^https?:\/\// }, isFeatured: { $ne: true } },
      { $set: { isFeatured: true } },
    );
    if (promoted.modifiedCount) {
      console.log(`\n⭐ Featured ${promoted.modifiedCount} existing route(s) that already had art`);
    }

    const featured = await AirwayRoute.countDocuments({ isFeatured: true, routeStatus: 'scheduled' });
    console.log(`\n🎉 ${featured} featured sectors`);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedMoreAirwaySectors();
