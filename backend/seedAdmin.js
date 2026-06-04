import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './modules/admin/models/Admin.js';

dotenv.config({ path: './.env' });

const EMAIL = 'admin@mydestination.com';
const PASSWORD = 'admin123';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Remove old/stale admin records (cleanup)
    await Admin.deleteMany({});
    console.log('🗑️  Old admin records cleared');

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    await Admin.create({
      name: 'My Destination Admin',
      email: EMAIL,
      phone: '9999999999',
      password: hashedPassword,
      role: 'superadmin',
      permissions: ['read', 'write', 'update', 'delete'],
      isActive: true,
    });

    console.log('✅ Admin seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email    : admin@mydestination.com');
    console.log('   Password : admin123');
    console.log('   Role     : superadmin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Works for: Main Admin, Wedding Admin panels');

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
