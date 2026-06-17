import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LandingPageConfig from './modules/cms/models/LandingPageConfig.js';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/mydestination';

const seedStaffMembers = [
  {
    name: 'Manoj Kumar',
    role: 'MANAGER',
    description: 'Expert in providing personalized travel solutions and ensuring customer satisfaction.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    email: 'manoj@mydestination.com'
  },
  {
    name: 'Elly Spitch',
    role: 'CUSTOMER CARE',
    description: 'Dedicated to resolving customer queries and delivering a seamless support experience.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400',
    email: 'elly@mydestination.com'
  },
  {
    name: 'Hannah Zafron',
    role: 'TRAVEL SPECIALIST',
    description: 'Specialized in crafting customized itineraries tailored to your unique travel preferences.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400',
    email: 'hannah@mydestination.com'
  },
  {
    name: 'Adam Johnson',
    role: 'PRESIDENT',
    description: 'Driving the company\'s mission to provide unparalleled hospitality experiences worldwide.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
    email: 'adam@mydestination.com'
  }
];

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

    // Set staff fields
    config.staff.sectionSubtitle = 'Tourism members';
    config.staff.sectionTitle = 'OUR STAFF';
    config.staff.description = 'Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable.';
    config.staff.buttonText = 'JOIN NOW';
    config.staff.items = seedStaffMembers;

    // Mark modifications for nested items array
    config.markModified('staff');

    await config.save();
    console.log('✅ Staff section examples seeded successfully!');
    console.log(JSON.stringify(config.staff.items, null, 2));

  } catch (error) {
    console.error('❌ Staff seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

run();
