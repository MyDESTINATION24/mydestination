import mongoose from 'mongoose';
import { EVStation } from './modules/taxi/admin/models/EVStation.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const seedEVStations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Clean up existing stations if any (or keep them)
    // For seeding, let's delete existing ones first to have a clean, reproducible state
    const deleteCount = await EVStation.deleteMany({});
    console.log(`🧹 Deleted ${deleteCount.deletedCount} existing EV stations`);

    const defaults = [
      {
        name: 'Delhi Connaught Place Supercharger',
        address: 'Radial Road Number 6, Connaught Place, New Delhi, Delhi 110001',
        lng: 77.2197,
        lat: 28.6304,
        stallsTotal: 12,
        stallsAvailable: 7,
        powerKW: 250,
        pricing: '₹18/kWh',
        connectorTypes: ['Supercharger', 'CCS2'],
      },
      {
        name: 'Indore Vijay Nagar Charger',
        address: 'Vijay Nagar Square, Near C21 Mall, Indore, MP 452010',
        lng: 75.8975,
        lat: 22.7533,
        stallsTotal: 8,
        stallsAvailable: 4,
        powerKW: 120,
        pricing: '₹14/kWh',
        connectorTypes: ['CCS2', 'Type 2'],
      },
      {
        name: 'Mumbai Bandra Kurla Complex Station',
        address: 'G Block BKC, Bandra East, Mumbai, Maharashtra 400051',
        lng: 72.8643,
        lat: 19.0607,
        stallsTotal: 16,
        stallsAvailable: 11,
        powerKW: 150,
        pricing: '₹16/kWh',
        connectorTypes: ['CCS2', 'CHAdeMO'],
      },
      {
        name: 'Indore Rajwada Palace Point',
        address: 'Rajwada, Indore, Madhya Pradesh 452002',
        lng: 75.8577,
        lat: 22.7196,
        stallsTotal: 6,
        stallsAvailable: 2,
        powerKW: 50,
        pricing: '₹12/kWh',
        connectorTypes: ['Type 2', 'CCS2'],
      },
      {
        name: 'Bangalore Electronic City Supercharger',
        address: 'Phase 1, Electronic City, Bangalore, Karnataka 560100',
        lng: 77.6625,
        lat: 12.8452,
        stallsTotal: 20,
        stallsAvailable: 15,
        powerKW: 250,
        pricing: '₹20/kWh',
        connectorTypes: ['Supercharger', 'CCS2'],
      }
    ];

    for (const item of defaults) {
      await EVStation.create({
        name: item.name,
        address: item.address,
        location: {
          type: 'Point',
          coordinates: [item.lng, item.lat],
        },
        stallsTotal: item.stallsTotal,
        stallsAvailable: item.stallsAvailable,
        powerKW: item.powerKW,
        pricing: item.pricing,
        connectorTypes: item.connectorTypes,
        status: 'active',
      });
    }

    console.log('✅ EV Stations seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedEVStations();
