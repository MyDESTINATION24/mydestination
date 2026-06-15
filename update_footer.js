import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mydestination';

mongoose.connect(uri)
  .then(async () => {
    const configSchema = new mongoose.Schema({}, { strict: false });
    const Config = mongoose.model('LandingPageConfig', configSchema, 'landingpageconfigs');
    
    await Config.updateOne({}, { $set: { 'footer.companyDescription': 'My DESTINATION - Wed in India | Event Planners' } });
    console.log('Database footer updated successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
