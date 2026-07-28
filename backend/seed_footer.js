import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydestination';

mongoose.connect(uri)
  .then(async () => {
    const configSchema = new mongoose.Schema({}, { strict: false });
    const Config = mongoose.model('LandingPageConfig', configSchema, 'landingpageconfigs');
    
    const result = await Config.updateMany({}, { 
      $set: { 
        'footer.phone': '+91 80 06 787878',
        'footer.whatsapp': '+91 80 06 787878',
        'footer.email': 'care@mydestination.in'
      } 
    });
    console.log(`✅ Database footer phone numbers updated successfully! Modified count: ${result.modifiedCount}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  });
