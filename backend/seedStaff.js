import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LandingPageConfig from './modules/cms/models/LandingPageConfig.js';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/mydestination';

/**
 * Bootstraps the labels around the staff section. It deliberately does not
 * seed staff members: it used to ship four invented people with stock photos
 * and assign them over staff.items, which both published fake colleagues and
 * destroyed whatever real team the admin had entered. Real members are added
 * through CMS Admin -> Staff.
 *
 * Existing values are left untouched, so this is safe to re-run.
 */
const SECTION_DEFAULTS = {
  sectionSubtitle: 'Tourism members',
  sectionTitle: 'OUR STAFF',
  description: 'Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable.',
  buttonText: 'JOIN NOW',
};

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let config = await LandingPageConfig.findOne();
    if (!config) {
      console.log('Creating a new LandingPageConfig document...');
      config = new LandingPageConfig();
    }

    if (!config.staff) {
      config.staff = {};
    }

    const filled = [];
    for (const [field, value] of Object.entries(SECTION_DEFAULTS)) {
      if (!String(config.staff[field] || '').trim()) {
        config.staff[field] = value;
        filled.push(field);
      }
    }

    if (!Array.isArray(config.staff.items)) {
      config.staff.items = [];
    }

    config.markModified('staff');
    await config.save();

    console.log(filled.length
      ? `✅ Set missing staff section fields: ${filled.join(', ')}`
      : '✅ Staff section already configured; nothing to change.');
    console.log(`ℹ️  ${config.staff.items.length} staff member(s) present. Add or edit them in CMS Admin -> Staff.`);
  } catch (error) {
    console.error('❌ Staff seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

run();
