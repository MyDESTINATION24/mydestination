import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './modules/admin/models/Admin.js';

dotenv.config({ path: './.env' });

// This used to delete EVERY admin and recreate admin@mydestination.com with
// the password 'admin123' -- one accidental run on production reset the
// superadmin to a public default. It now only creates the admin if missing,
// with a password you supply:
//   ADMIN_SEED_EMAIL=you@example.com ADMIN_SEED_PASSWORD='long-random-pass' npm run seed:admin
const EMAIL = (process.env.ADMIN_SEED_EMAIL || 'admin@mydestination.com').trim().toLowerCase();
const PASSWORD = process.env.ADMIN_SEED_PASSWORD;

const seedAdmin = async () => {
  if (!PASSWORD || PASSWORD.length < 12) {
    console.error('❌ Set ADMIN_SEED_PASSWORD (at least 12 characters) to seed the admin.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    if (await Admin.findOne({ email: EMAIL })) {
      console.log(`ℹ️  Admin ${EMAIL} already exists — leaving it untouched.`);
      return;
    }

    await Admin.create({
      name: 'My Destination Admin',
      email: EMAIL,
      phone: '9999999999',
      password: await bcrypt.hash(PASSWORD, 10),
      role: 'superadmin',
      permissions: ['read', 'write', 'update', 'delete'],
      isActive: true,
    });

    console.log(`✅ Admin ${EMAIL} created (superadmin). Works for the Main and Wedding admin panels.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
