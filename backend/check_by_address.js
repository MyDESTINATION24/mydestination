
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String, "address.fullAddress": String });
const Property = mongoose.model('Property', propertySchema);

async function checkAddress() {
  const mongoUrl = process.env.MONGODB_URL;
  await mongoose.connect(mongoUrl);
  
  const properties = await Property.find({ "address.fullAddress": /113 hare Krishna vihar/i });
  console.log(`Found ${properties.length} properties at this address:`);
  properties.forEach(p => {
    console.log(`- "${p.propertyName}" (ID: ${p._id}) Address: "${p.address.fullAddress}"`);
  });
  
  await mongoose.disconnect();
}
checkAddress();
