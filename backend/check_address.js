
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String, address: Object });
const Property = mongoose.model('Property', propertySchema);

async function checkAddress() {
  const mongoUrl = process.env.MONGODB_URL;
  await mongoose.connect(mongoUrl);
  const villa = await Property.findOne({ propertyName: /S S Villa/i });
  if (villa) {
    console.log('Address:', JSON.stringify(villa.address, null, 2));
  } else {
    console.log('Not found');
  }
  await mongoose.disconnect();
}
checkAddress();
