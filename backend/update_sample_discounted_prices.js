import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WeddingDestination from './modules/wedding/models/WeddingDestination.js';
import Property from './modules/hotel/models/Property.js';
import RoomType from './modules/hotel/models/RoomType.js';

dotenv.config({ path: './.env' });

async function updateDiscountedPrices() {
  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) throw new Error('MONGODB_URL not found in .env');

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  // 1. Update Wedding Destinations
  console.log('\n--- Updating Wedding Destinations ---');
  const destinations = await WeddingDestination.find({});
  const destinationPriceMap = {
    'wed in udaipur': { starting: 1000000, original: 1250000 },
    'udaipur': { starting: 1000000, original: 1250000 },
    'goa': { starting: 500000, original: 650000 },
    'jaipur': { starting: 1500000, original: 1800000 },
    'shimla': { starting: 400000, original: 500000 },
    'kerala': { starting: 600000, original: 750000 },
    'triyuginarayan temple': { starting: 100000, original: 125000 },
    'wed in agra': { starting: 1500000, original: 1850000 },
    'wed in uttarakhand': { starting: 1500000, original: 1800000 }
  };

  for (const dest of destinations) {
    const key = dest.name.toLowerCase().trim();
    const preset = destinationPriceMap[key];

    let originalPrice = dest.originalStartingPrice;
    if (preset) {
      originalPrice = preset.original;
      if (preset.starting) dest.startingPrice = preset.starting;
    } else if (!originalPrice || originalPrice <= dest.startingPrice) {
      // Set ~25% discount markup rounded to nearest 50k
      const markup = Math.round((dest.startingPrice * 1.25) / 50000) * 50000;
      originalPrice = markup > dest.startingPrice ? markup : dest.startingPrice + 100000;
    }

    dest.originalStartingPrice = originalPrice;
    await dest.save();
    const discountPct = Math.round(((dest.originalStartingPrice - dest.startingPrice) / dest.originalStartingPrice) * 100);
    console.log(`  ✓ Destination: ${dest.name} -> Starting: ₹${dest.startingPrice}, Original: ₹${dest.originalStartingPrice} (${discountPct}% OFF)`);
  }

  // 2. Update Hotel Properties & Room Types
  console.log('\n--- Updating Hotels & Properties ---');
  const properties = await Property.find({ status: 'approved', isLive: true });
  console.log(`Found ${properties.length} live properties to update.`);

  for (const prop of properties) {
    const rooms = await RoomType.find({ propertyId: prop._id });
    let minRoomPrice = Infinity;
    let correspondingOrigPrice = null;

    for (const room of rooms) {
      const price = Number(room.pricePerNight);
      if (!price || isNaN(price)) continue;

      let origPrice = room.originalPrice;
      if (!origPrice || origPrice <= price) {
        // Compute realistic original price (25-40% markup, rounded nicely)
        if (price >= 10000) {
          origPrice = Math.round((price * 1.25) / 1000) * 1000;
        } else if (price >= 2000) {
          origPrice = Math.round((price * 1.35) / 500) * 500;
        } else if (price >= 500) {
          origPrice = Math.round((price * 1.4) / 100) * 100;
        } else {
          origPrice = Math.round(price * 1.3);
        }
        if (origPrice <= price) origPrice = price + 500;
      }

      room.originalPrice = origPrice;
      await room.save();

      const offPct = Math.round(((origPrice - price) / origPrice) * 100);
      console.log(`    Room "${room.name}" (${prop.propertyName}): Selling ₹${price}, Original ₹${origPrice} (${offPct}% OFF)`);

      if (price < minRoomPrice) {
        minRoomPrice = price;
        correspondingOrigPrice = origPrice;
      }
    }

    if (correspondingOrigPrice) {
      prop.originalPrice = correspondingOrigPrice;
      await prop.save();
    }
  }

  console.log('\n✅ All sample discounted prices updated successfully!');
  await mongoose.disconnect();
}

updateDiscountedPrices().catch(err => {
  console.error('❌ Error updating prices:', err);
  process.exit(1);
});
