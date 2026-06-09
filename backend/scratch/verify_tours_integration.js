import mongoose from 'mongoose';
import { Tour } from '../modules/taxi/admin/models/Tour.js';
import { TourBooking } from '../modules/taxi/admin/models/TourBooking.js';
import 'dotenv/config';

const runTest = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL environment variable is missing from .env');
    }
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Clean up any previous test instances
    await Tour.deleteMany({ name: 'TEST_CHARDHAM_YATRA_HELI' });
    await TourBooking.deleteMany({ customerName: 'TEST_PILGRIM' });

    // 2. Create Tour Package
    console.log('🔄 Creating a test Pilgrim Tour Package...');
    const testTour = new Tour({
      name: 'TEST_CHARDHAM_YATRA_HELI',
      overview: 'Premium 6 Days Char Dham pilgrimage by helicopter.',
      duration: '06 Days / 05 Nights',
      meals: 'Breakfast, Lunch, Dinner',
      helicopterType: 'Bell 407',
      startPoint: 'Dehradun',
      endPoint: 'Dehradun',
      destinations: ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'],
      packageType: 'All Inclusive',
      itinerary: [
        { day: '1st Day', title: 'Arrival', description: 'Arrive at Dehradun, transfer to hotel.' },
        { day: '2nd Day', title: 'Yamunotri', description: 'Fly to Kharsali, trek or doli to Yamunotri.' }
      ],
      inclusions: ['Helicopter tickets', 'VIP Darshan passes', '5-star hotel stays'],
      exclusions: ['Personal puja charges', 'Tips'],
      hotels: [
        { destination: 'Kharsali', name: 'Yamunotri Cottages', mealPlan: 'All Meals' }
      ],
      price: 150000,
      priceType: 'total',
      status: 'active',
      image: 'https://example.com/test-map.jpg',
      gallery: ['https://example.com/gallery1.jpg']
    });

    const savedTour = await testTour.save();
    console.log(`✅ Test Tour Package created successfully. ID: ${savedTour._id}`);

    // Assert tour fields
    if (savedTour.name !== 'TEST_CHARDHAM_YATRA_HELI' || savedTour.price !== 150000) {
      throw new Error('Tour package field mismatch after save');
    }
    console.log('⭐ Tour package fields verification: PASSED');

    // 3. Create Tour Booking
    console.log('🔄 Creating a test Pilgrim Booking...');
    const bookingCode = `TR-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
    const testBooking = new TourBooking({
      bookingCode,
      tourId: savedTour._id,
      tourName: savedTour.name,
      customerName: 'TEST_PILGRIM',
      customerPhone: '1234567890',
      customerEmail: 'testuser@rukkoo.in',
      numberOfPassengers: 2,
      totalFare: 300000, // 2 pax * 150000
      travelDate: new Date('2026-06-10'),
      paymentMethod: 'reserve',
      paymentStatus: 'pending',
      bookingStatus: 'confirmed',
      notes: 'Need wheelchair assistance for passenger #2',
      passengerNames: ['Test Pilgrim A', 'Test Pilgrim B']
    });

    const savedBooking = await testBooking.save();
    console.log(`✅ Test Booking created successfully. Code: ${savedBooking.bookingCode}`);

    // 4. Verification and Retrieval
    const retrievedBooking = await TourBooking.findById(savedBooking._id)
      .populate('tourId')
      .lean();

    if (!retrievedBooking) {
      throw new Error('Failed to retrieve saved booking from database');
    }

    console.log('⭐ Booking retrieval and population verification:');
    console.log(`  - Customer Name: ${retrievedBooking.customerName}`);
    console.log(`  - Booked Tour: ${retrievedBooking.tourId?.name}`);
    console.log(`  - Passenger Count: ${retrievedBooking.numberOfPassengers}`);
    console.log(`  - Total Fare Charged: Rs. ${retrievedBooking.totalFare}`);
    console.log(`  - Roster: ${retrievedBooking.passengerNames.join(', ')}`);

    if (retrievedBooking.tourId?.price !== 150000) {
      throw new Error('Populated tour pricing verification failed');
    }
    if (retrievedBooking.totalFare !== 300000) {
      throw new Error('Total fare validation failed');
    }
    console.log('⭐ DB Integration Assertions: ALL PASSED');

    // 5. Clean up
    console.log('🔄 Cleaning up test records...');
    await Tour.findByIdAndDelete(savedTour._id);
    await TourBooking.findByIdAndDelete(savedBooking._id);
    console.log('✅ Clean up complete.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Integration Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runTest();
