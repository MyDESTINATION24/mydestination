// Gives each seeded airway route its own cover image.
//
// Without these every Popular Sectors card fell back to the same bundled
// Kedarnath asset, so all three read as identical.
//
// Photos are from Pexels (commercial use, no attribution required), uploaded
// to our own Cloudinary rather than hotlinked. Two are reused from the trek
// seed, since the same Himalayan scenery serves both.
//
// Skips any route that already has an image, so it never overwrites an
// admin upload.
//
// Run: node seedAirwayRouteImages.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cloudinary from './config/cloudinary.js';
import { AirwayRoute } from './modules/taxi/admin/models/AirwayRoute.js';

dotenv.config({ path: './.env' });

const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

const COVERS = [
  {
    flightNumber: 'KHS101', // Kedarnath Yatra
    photoId: 27501430,
    why: 'aerial ridge view shot from a helicopter',
  },
  {
    flightNumber: 'HMW202', // Valley of Flowers
    photoId: 15428852,
    why: 'alpine wildflower meadow below snow patches',
  },
  {
    flightNumber: 'DVB303', // Do Dham Express
    photoId: 31014178,
    why: 'snow range seen across a forested ridge',
  },
  {
    flightNumber: 'KHS102', // Gangotri Darshan
    photoId: 31306743,
    why: 'deep snow valley, high-altitude sector',
  },
  {
    flightNumber: 'KHS103', // Yamunotri Shuttle
    photoId: 9334618,
    why: 'helicopter tracking along a rock face',
  },
];

const seedAirwayRouteImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    for (const cover of COVERS) {
      const route = await AirwayRoute.findOne({ flightNumber: cover.flightNumber });

      if (!route) {
        console.log(`⏭️  ${cover.flightNumber} — route not found, skipping`);
        continue;
      }

      if (route.image) {
        console.log(`⏭️  ${cover.flightNumber} — already has an image, left alone`);
        continue;
      }

      const upload = await cloudinary.uploader.upload(pexels(cover.photoId), {
        folder: 'taxi/airways',
        public_id: `sector-${cover.photoId}`,
        overwrite: true,
        transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      });

      route.image = upload.secure_url;
      await route.save();

      console.log(`🖼️  ${cover.flightNumber}  ${route.routeName}`);
      console.log(`     ${cover.why}`);
      console.log(`     ${upload.secure_url}\n`);
    }

    const withImage = await AirwayRoute.countDocuments({ image: { $ne: '' } });
    const total = await AirwayRoute.countDocuments();
    console.log(`🎉 ${withImage}/${total} airway routes have a cover image`);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAirwayRouteImages();
