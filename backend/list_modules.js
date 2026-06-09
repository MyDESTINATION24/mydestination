import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const listModules = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    const schema = new mongoose.Schema({}, { strict: false });
    const AppModule = mongoose.model('TaxiAppModule', schema, 'taxiappmodules');

    const modules = await AppModule.find({});
    console.log('--- Registered App Modules ---');
    console.log(JSON.stringify(modules, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

listModules();
