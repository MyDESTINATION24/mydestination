import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import Admin from '../modules/admin/models/Admin.js';

/**
 * Creates the superadmin if it is missing. It used to hardcode "admin123" and
 * write that hash unconditionally, so every run silently reset the live
 * superadmin's password to a guessable default -- which is how production
 * ended up on it. The password now comes from ADMIN_SEED_PASSWORD, and an
 * existing admin's credentials are never touched.
 */
const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      console.error('❌ MONGODB_URL is not set.');
      process.exit(1);
    }

    const email = process.env.ADMIN_SEED_EMAIL || 'admin@mydestination.com';

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`✅ Admin ${email} already exists — leaving it untouched.`);
      console.log('   Change the password from Admin Settings, not from this script.');
      return;
    }

    const password = process.env.ADMIN_SEED_PASSWORD;
    if (!password || password.length < 12) {
      console.error('❌ Set ADMIN_SEED_PASSWORD (12+ characters) to create the admin.');
      console.error('   Example: ADMIN_SEED_PASSWORD=... node scripts/force_seed_admin.js');
      process.exitCode = 1;
      return;
    }

    const admin = await Admin.create({
      name: 'Super Admin',
      email,
      phone: process.env.ADMIN_SEED_PHONE || '',
      password: await bcrypt.hash(password, 10),
      role: 'superadmin',
      isActive: true,
    });

    console.log('✅ Admin account created.');
    console.log(`   Email: ${admin.email}`);
    console.log('   Password: the ADMIN_SEED_PASSWORD you supplied (not printed).');
  } catch (err) {
    console.error('❌ Error setting up admin user:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

runSeed();
