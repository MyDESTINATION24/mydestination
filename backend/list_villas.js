
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String, address: Object });
const Property = mongoose.model('Property', propertySchema);

async function listAll() {
  const mongoUrl = process.env.MONGODB_URL;
  await mongoose.connect(mongoUrl);
  const villas = await Property.find({ propertyName: /Villa/i });
  console.log(`Found ${villas.length} properties with "Villa" in name:`);
  villas.forEach(v => {
    console.log(`- ${v.propertyName} (ID: ${v._id}, Address: ${v.address?.fullAddress})`);
  });
  await mongoose.disconnect();
}
listAll();
