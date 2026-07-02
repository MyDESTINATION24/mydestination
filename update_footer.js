import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydestination';

mongoose.connect(uri)
  .then(async () => {
    const configSchema = new mongoose.Schema({}, { strict: false });
    const Config = mongoose.model('LandingPageConfig', configSchema, 'landingpageconfigs');
    
    await Config.updateOne({}, { 
      $set: { 
        'footer.phone': '+91 80 06 787878',
        'footer.whatsapp': '+91 80 06 787878'
      } 
    });
    console.log('Database footer phone numbers updated successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
