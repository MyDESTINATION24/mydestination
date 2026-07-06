import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../modules/marketing/models/Article.js';
import Blog from '../modules/marketing/models/Blog.js';

dotenv.config({ path: './.env' });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URL is not defined in .env');
    }

    console.log(`Connecting to: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Seed Articles
    console.log('Clearing existing articles...');
    await Article.deleteMany({});
    
    console.log('Seeding new articles...');
    await Article.insertMany([
      {
        title: 'Top Travel Essentials for Your Summer Packing List',
        image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80',
        excerpt: "Everything you need to pack for a hassle-free summer getaway. Don't leave home without these curated travel gear pieces.",
        content: 'Summer travel is all about exploring new places, basking in the sun, and creating unforgettable memories. However, packing for a summer vacation can sometimes be a challenge. To help you prepare, we\'ve compiled a list of top travel essentials you should include in your summer packing list. From skin protection and travel gear to smart apparel choices, these items will ensure a comfortable and stress-free adventure.',
        date: 'June 2026',
        isActive: true
      },
      {
        title: 'Mastering the Art of Budget Hotel Bookings',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Secrets to finding the cheapest luxury stays. Our experts share booking hacks that save you hundreds on family trips.',
        content: 'Finding a high-quality stay within your budget doesn\'t have to be a mystery. In this guide, we dive deep into the timing of hotel bookings, using off-peak travel slots, matching wallet credit redemptions, and leverage points. By using these simple habits, you can book premium stays without the premium price tag.',
        date: 'May 2026',
        isActive: true
      },
      {
        title: 'The Ultimate Guide to Exploring Offbeat Himalayan Villages',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Ditch the crowds. Here is your roadmap to remote hamlets, scenic views, and local homestays in North India.',
        content: 'The Himalayas hold hidden villages that remain untouched by commercial tourism. This guide takes you off the beaten track to discover peaceful, remote hamlets where you can experience authentic mountain culture, stay in local homestays, and enjoy pristine natural beauty away from the crowds.',
        date: 'April 2026',
        isActive: true
      }
    ]);
    console.log('✅ Articles seeded successfully!');

    // 2. Seed Blogs
    console.log('Clearing existing blogs...');
    await Blog.deleteMany({});

    console.log('Seeding new blogs...');
    await Blog.insertMany([
      {
        title: 'Escape the City: 7 Hidden Hill Stations Near You',
        category: 'Travel Guides',
        readTime: '6 min read',
        badge: 'TRENDING',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Weekend escapes that are closer than you think — curated hill stations, handpicked stays, and routes that actually work.',
        content: 'If the city heat and noise are getting to you, it is time for a mountain getaway. We have mapped out 7 lesser-known hill stations that offer tranquil weather, stunning views, and minimal tourist crowds, all within a few hours\' drive.',
        date: 'March 2026',
        isActive: true
      },
      {
        title: 'Couple-Friendly Stays: What To Check Before You Book',
        category: 'Stay Tips',
        readTime: '4 min read',
        badge: "EDITOR'S PICK",
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'From ID policies to neighbourhood vibes — a simple checklist to make sure your next couple stay is calm, safe and drama-free.',
        content: 'Booking stays as a couple requires checking a few basic items beforehand. Learn about local ID rules, policy terms for unmarried couples, security features, and check-in support guidelines to guarantee a smooth and comfortable experience.',
        date: 'March 2026',
        isActive: true
      },
      {
        title: 'How To Get Real Discounts (Beyond Flash Sales)',
        category: 'Smart Booking',
        readTime: '5 min read',
        badge: 'SAVE MORE',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Learn how wallet credits, off-peak dates and flexible policies can actually beat random promo codes.',
        content: 'Promo codes look attractive on banners, but loyalty perks, off-season booking adjustments, direct owner negotiations, and wallet cashbacks are where the real savings hide. We break down the math for you.',
        date: 'February 2026',
        isActive: true
      }
    ]);
    console.log('✅ Blogs seeded successfully!');

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedData();
