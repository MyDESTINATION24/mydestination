import LandingPageConfig from './modules/cms/models/LandingPageConfig.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedTourImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        let config = await LandingPageConfig.findOne();
        if (!config) {
            config = new LandingPageConfig();
        }

        if (!config.latestTour) {
            config.latestTour = {};
        }

        // Seeding high-quality travel/destination images
        config.latestTour.backgroundImage = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"; // Beautiful landscape/lake
        config.latestTour.leftImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"; // Tropical beach
        config.latestTour.rightImage = "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1974&auto=format&fit=crop"; // Greece/Santorini

        await config.save();

        console.log('Latest Tour images seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding tour images:', error);
        process.exit(1);
    }
};

seedTourImages();
