import { v2 as cloudinary } from 'cloudinary';
import LandingPageConfig from './modules/cms/models/LandingPageConfig.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const seedVideo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const videoPath = 'd:\\companyfolder\\My_DESTINATION\\frontend\\public\\istockphoto-1466423824-640_adpp_is.mp4';
        
        console.log('Uploading video to Cloudinary...');
        const result = await cloudinary.uploader.upload(videoPath, {
            folder: 'rukkoin/landing_page_video',
            resource_type: 'video'
        });
        
        console.log('Video uploaded successfully:', result.secure_url);

        let config = await LandingPageConfig.findOne();
        if (!config) {
            config = new LandingPageConfig();
        }

        if (!config.introVideoAndFacilities) {
            config.introVideoAndFacilities = {};
        }

        config.introVideoAndFacilities.videoLink = result.secure_url;
        await config.save();

        console.log('Backend config updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding video:', error);
        process.exit(1);
    }
};

seedVideo();
