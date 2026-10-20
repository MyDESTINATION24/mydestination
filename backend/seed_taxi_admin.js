import mongoose from 'mongoose';
import { Admin } from './modules/taxi/admin/models/Admin.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

// Password comes from ADMIN_SEED_PASSWORD; it used to be the public default
// 'admin123'.
const seedTaxiAdmin = async () => {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 12) {
    console.error('❌ Set ADMIN_SEED_PASSWORD (at least 12 characters) to seed the taxi admin.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    const email = (process.env.ADMIN_SEED_EMAIL || 'admin@mydestination.com').trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      console.log('ℹ️ TaxiAdmin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({
      name: 'My Destination Taxi Admin',
      email,
      phone: '9999999999',
      password: hashedPassword,
      role: 'superadmin',
      admin_type: 'superadmin',
      active: true,
      status: 'active'
    });

    console.log('✅ TaxiAdmin seeded successfully!');
    console.log(`Admin: ${email} (password from ADMIN_SEED_PASSWORD)`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedTaxiAdmin();
