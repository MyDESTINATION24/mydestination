// Uploads cover photos for the seeded treks to Cloudinary and points each
// Tour at the resulting URL.
//
// Photos are from Pexels, whose licence allows commercial use with no
// attribution required. They are uploaded to our own Cloudinary rather than
// hotlinked, so the cards do not break if the source URL moves.
//
// Only fills in treks whose image is still blank -- it will never overwrite a
// photo an admin uploaded.
//
// Run: node seedTrekImages.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cloudinary from './config/cloudinary.js';
import { Tour } from './modules/taxi/admin/models/Tour.js';

dotenv.config({ path: './.env' });

const PEXELS = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

// Each photo was checked by eye against the trek it is standing in for.
const COVERS = [
  {
    tour: 'Kedarkantha Summit Trek',
    photoId: 2609459,
    credit: 'Pexels',
    why: 'guided group ascending toward snow peaks',
  },
  {
    tour: 'Valley of Flowers Trek',
    photoId: 15428852,
    credit: 'Pexels',
    why: 'alpine wildflower meadow below snow patches',
  },
  {
    tour: 'Brahmatal Ridge Trek',
    photoId: 31306743,
    credit: 'Pexels',
    why: 'deep snow ridge and valley, winter conditions',
  },
  {
    tour: 'Nag Tibba Weekend Trek',
    photoId: 31014178,
    credit: 'Pexels',
    why: 'forested foreground with a distant snow range, matching the summit viewpoint',
  },
];

const seedTrekImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    for (const cover of COVERS) {
      const tour = await Tour.findOne({ name: cover.tour });

      if (!tour) {
        console.log(`⏭️  ${cover.tour} — not found, skipping`);
        continue;
      }

      if (tour.image) {
        console.log(`⏭️  ${cover.tour} — already has an image, left alone`);
        continue;
      }

      const upload = await cloudinary.uploader.upload(PEXELS(cover.photoId), {
        folder: 'taxi/tours',
        public_id: `trek-${cover.photoId}`,
        overwrite: true,
        transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      });

      tour.image = upload.secure_url;
      await tour.save();

      console.log(`🖼️  ${cover.tour}`);
      console.log(`     ${cover.why}`);
      console.log(`     ${upload.secure_url}\n`);
    }

    const withImage = await Tour.countDocuments({ category: 'trek', image: { $ne: '' } });
    const total = await Tour.countDocuments({ category: 'trek' });
    console.log(`🎉 ${withImage}/${total} treks have a cover image`);
    console.log('   Replace any of these from the admin panel with your own photos.');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedTrekImages();
