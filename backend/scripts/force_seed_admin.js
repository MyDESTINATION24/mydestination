import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import Admin from '../modules/admin/models/Admin.js';

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/rukkoo';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@mydestination.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedAdmin = await Admin.findOneAndUpdate(
      { email },
      {
        name: 'Super Admin',
        email,
        phone: '9999999999',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin Account Ready!');
    console.log('-----------------------------------');
    console.log(`Email:    ${updatedAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${updatedAdmin.role}`);
    console.log('-----------------------------------');

  } catch (err) {
    console.error('❌ Error setting up admin user:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runSeed();
