import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WeddingDestination from '../backend/modules/wedding/models/WeddingDestination.js';
import Property from '../backend/modules/hotel/models/Property.js';
import RoomType from '../backend/modules/hotel/models/RoomType.js';

dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('MongoDB connected');
  
  const dests = await WeddingDestination.find({});
  console.log('DESTINATIONS COUNT:', dests.length);
  dests.forEach(d => console.log(`  - ${d.name}: starting=${d.startingPrice}, original=${d.originalStartingPrice}`));

  const props = await Property.find({ status: 'approved', isLive: true }).limit(10);
  console.log('LIVE PROPERTIES COUNT:', props.length);
  for (const p of props) {
    const rooms = await RoomType.find({ propertyId: p._id });
    console.log(`  - Property: "${p.propertyName}" (prop.originalPrice=${p.originalPrice})`);
    rooms.forEach(r => console.log(`      Room: "${r.name}" price=${r.pricePerNight} originalPrice=${r.originalPrice}`));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
