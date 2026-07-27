// Seeds trek packages (category: 'trek') into the same TaxiTour collection the
// Char Dham yatras use. Upsert-only, matched on name -- re-running updates in
// place and never deletes, so it is safe against a live database.
//
// Run: node seedTreks.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tour } from './modules/taxi/admin/models/Tour.js';

dotenv.config({ path: './.env' });

const TREKS = [
  {
    name: 'Kedarkantha Summit Trek',
    overview:
      'The classic Uttarakhand winter summit. Four days through pine forest and open snow meadows to a 12,500 ft ridge with a full sweep of the Swargarohini, Bandarpoonch and Black Peak ranges. Suitable as a first Himalayan summit.',
    duration: '04 Days / 03 Nights',
    durationDays: 4,
    category: 'trek',
    difficulty: 'moderate',
    maxAltitudeM: 3810,
    trailDistanceKm: 20,
    bestMonths: ['December', 'January', 'February', 'March', 'April'],
    baseCamp: 'Sankri',
    startPoint: 'Dehradun',
    endPoint: 'Dehradun',
    destinations: ['Sankri', 'Juda Ka Talab', 'Kedarkantha Base', 'Kedarkantha Summit'],
    meals: 'All meals from Day 1 dinner to Day 4 breakfast (vegetarian)',
    packageType: 'Group Departure',
    price: 8500,
    priceType: 'total',
    capacity: 60,
    minGroupSize: 4,
    maxGroupSize: 12,
    fitnessNote:
      'Be able to cover 5 km in 40 minutes on flat ground before departure. Snow underfoot for most of the ascent.',
    gearProvided: ['Sleeping bag', 'Insulated tent', 'Microspikes', 'Gaiters', 'Trekking pole', 'Shared dining tent'],
    gearToCarry: [
      'Waterproof trekking shoes with ankle support',
      'Down or synthetic jacket rated to -10C',
      'Thermal base layers (2 sets)',
      'Sun cap, woollen cap and balaclava',
      'UV sunglasses',
      'Water bottles (2 litres total)',
      'Personal medication and ID proof',
    ],
    permitsRequired: ['Govind Wildlife Sanctuary entry permit', 'Photo ID (Aadhaar / Passport)'],
    itinerary: [
      { day: 'Day 1', title: 'Dehradun to Sankri', description: 'Road transfer of about 200 km along the Tons river. Overnight in a guesthouse at Sankri.' },
      { day: 'Day 2', title: 'Sankri to Juda Ka Talab', description: '4 km ascent through pine and oak to a frozen lake at 9,100 ft. First night under canvas.' },
      { day: 'Day 3', title: 'Juda Ka Talab to Base Camp', description: '4 km climb to the open meadow base camp at 11,250 ft with an evening acclimatisation walk.' },
      { day: 'Day 4', title: 'Summit and descent to Sankri', description: 'Pre-dawn summit push to 12,500 ft, then a long descent back to Sankri and transfer to Dehradun.' },
    ],
    inclusions: [
      'Certified trek leader and support staff',
      'All camping equipment and permits',
      'All meals on trek',
      'Dehradun to Sankri return transfer',
      'First aid, oxygen cylinder and oximeter',
    ],
    exclusions: ['Personal trekking gear', 'Travel insurance', 'Anything not listed under inclusions', 'Offloading charges'],
    guide: {
      name: 'Pushkar Rana',
      phone: '+91 90000 00001',
      experienceYears: 11,
      languages: ['Hindi', 'English', 'Garhwali'],
      certifications: ['NIM Basic Mountaineering', 'Wilderness First Responder'],
      bio: 'Grew up in Sankri and has led over 200 Kedarkantha departures. Specialises in winter snowcraft and first-time summiteers.',
    },
    status: 'active',
  },
  {
    name: 'Valley of Flowers Trek',
    overview:
      'A UNESCO World Heritage site that blooms for roughly ten weeks a year. Six days combining the flower valley itself with the Hemkund Sahib gurudwara at 15,200 ft. The gentlest of our Himalayan itineraries.',
    duration: '06 Days / 05 Nights',
    durationDays: 6,
    category: 'trek',
    difficulty: 'easy',
    maxAltitudeM: 4633,
    trailDistanceKm: 47,
    bestMonths: ['July', 'August', 'September'],
    baseCamp: 'Govindghat',
    startPoint: 'Rishikesh',
    endPoint: 'Rishikesh',
    destinations: ['Govindghat', 'Ghangaria', 'Valley of Flowers', 'Hemkund Sahib'],
    meals: 'All meals from Day 1 dinner to Day 6 breakfast (vegetarian)',
    packageType: 'Group Departure',
    price: 12500,
    priceType: 'total',
    capacity: 40,
    minGroupSize: 4,
    maxGroupSize: 15,
    fitnessNote: 'Steady 6 to 9 km walking days on a stone-paved trail. Rain is near-certain; monsoon is the only season it blooms.',
    gearProvided: ['Guesthouse accommodation at Ghangaria', 'Trekking pole', 'Shared dining arrangement'],
    gearToCarry: [
      'Full rain gear (poncho and rain cover)',
      'Quick-dry trekking trousers',
      'Waterproof shoes with good grip',
      'Light fleece and a warm layer for Hemkund',
      'Water bottles (2 litres total)',
      'Personal medication and ID proof',
    ],
    permitsRequired: ['Nanda Devi Biosphere Reserve permit', 'Photo ID (Aadhaar / Passport)'],
    itinerary: [
      { day: 'Day 1', title: 'Rishikesh to Govindghat', description: 'Long road day of about 275 km along the Alaknanda. Overnight at Govindghat.' },
      { day: 'Day 2', title: 'Govindghat to Ghangaria', description: '9 km on a paved trail beside the Pushpawati river. Guesthouse stay at Ghangaria.' },
      { day: 'Day 3', title: 'Valley of Flowers day walk', description: '3.5 km each way into the valley itself. Return to Ghangaria by evening.' },
      { day: 'Day 4', title: 'Hemkund Sahib', description: '6 km steep ascent to the glacial lake and gurudwara at 15,200 ft, then back down.' },
      { day: 'Day 5', title: 'Ghangaria to Govindghat', description: 'Descend the 9 km trail and transfer to Joshimath for the night.' },
      { day: 'Day 6', title: 'Return to Rishikesh', description: 'Road transfer back, arriving late evening.' },
    ],
    inclusions: [
      'Certified trek leader and support staff',
      'Accommodation on twin/triple sharing',
      'All meals on trek',
      'Rishikesh to Govindghat return transfer',
      'All permits and forest fees',
      'First aid, oxygen cylinder and oximeter',
    ],
    exclusions: ['Personal trekking gear', 'Pony or porter charges', 'Helicopter transfer to Ghangaria', 'Travel insurance'],
    guide: {
      name: 'Anjali Bisht',
      phone: '+91 90000 00002',
      experienceYears: 8,
      languages: ['Hindi', 'English'],
      certifications: ['NIM Advance Mountaineering', 'Wilderness First Aid'],
      bio: 'Botany graduate turned trek leader. Can name most of what is flowering on the trail and keeps a running bloom log each season.',
    },
    status: 'active',
  },
  {
    name: 'Brahmatal Ridge Trek',
    overview:
      'A winter ridge walk with the most direct view of Trishul and Nanda Ghunti anywhere in Uttarakhand. Five days over frozen lakes and oak forest, quieter than Kedarkantha at the same difficulty.',
    duration: '05 Days / 04 Nights',
    durationDays: 5,
    category: 'trek',
    difficulty: 'moderate',
    maxAltitudeM: 3810,
    trailDistanceKm: 22,
    bestMonths: ['December', 'January', 'February', 'March'],
    baseCamp: 'Lohajung',
    startPoint: 'Kathgodam',
    endPoint: 'Kathgodam',
    destinations: ['Lohajung', 'Bekaltal', 'Brahmatal', 'Brahmatal Top'],
    meals: 'All meals from Day 1 dinner to Day 5 breakfast (vegetarian)',
    packageType: 'Group Departure',
    price: 9500,
    priceType: 'total',
    capacity: 45,
    minGroupSize: 4,
    maxGroupSize: 12,
    fitnessNote: 'Sustained snow walking with a long summit day. Prior trekking experience helps but is not required.',
    gearProvided: ['Sleeping bag', 'Insulated tent', 'Microspikes', 'Gaiters', 'Trekking pole'],
    gearToCarry: [
      'Waterproof trekking shoes with ankle support',
      'Down or synthetic jacket rated to -10C',
      'Thermal base layers (2 sets)',
      'Woollen cap, balaclava and two pairs of gloves',
      'UV sunglasses',
      'Water bottles (2 litres total)',
      'Personal medication and ID proof',
    ],
    permitsRequired: ['Forest department trail permit', 'Photo ID (Aadhaar / Passport)'],
    itinerary: [
      { day: 'Day 1', title: 'Kathgodam to Lohajung', description: 'Road transfer of about 210 km through Almora and Gwaldam. Guesthouse at Lohajung.' },
      { day: 'Day 2', title: 'Lohajung to Bekaltal', description: '6 km through dense oak and rhododendron to a camp beside the lake at 9,700 ft.' },
      { day: 'Day 3', title: 'Bekaltal to Brahmatal', description: '7 km along the ridge with Trishul in view for most of the walk.' },
      { day: 'Day 4', title: 'Brahmatal Top and descent', description: 'Summit at 12,500 ft, then a long descent to Lohajung.' },
      { day: 'Day 5', title: 'Return to Kathgodam', description: 'Road transfer back, arriving by evening.' },
    ],
    inclusions: [
      'Certified trek leader and support staff',
      'All camping equipment and permits',
      'All meals on trek',
      'Kathgodam to Lohajung return transfer',
      'First aid, oxygen cylinder and oximeter',
    ],
    exclusions: ['Personal trekking gear', 'Travel insurance', 'Offloading charges', 'Anything not listed under inclusions'],
    guide: {
      name: 'Devendra Negi',
      phone: '+91 90000 00003',
      experienceYears: 14,
      languages: ['Hindi', 'English', 'Kumaoni'],
      certifications: ['NIM Advance Mountaineering', 'Search and Rescue', 'Wilderness First Responder'],
      bio: 'Fourteen winters on the Brahmatal ridge. Leads the high-altitude rescue refresher for our other guides each October.',
    },
    status: 'active',
  },
  {
    name: 'Nag Tibba Weekend Trek',
    overview:
      'The shortest way to a real Himalayan summit view. Two days from Dehradun to the highest point of the Nag Tibba range, doable over a weekend and open all year except peak monsoon.',
    duration: '02 Days / 01 Night',
    durationDays: 2,
    category: 'trek',
    difficulty: 'easy',
    maxAltitudeM: 3022,
    trailDistanceKm: 16,
    bestMonths: ['October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'],
    baseCamp: 'Pantwari',
    startPoint: 'Dehradun',
    endPoint: 'Dehradun',
    destinations: ['Pantwari', 'Nag Tibba Base', 'Nag Tibba Summit'],
    meals: 'All meals from Day 1 lunch to Day 2 lunch (vegetarian)',
    packageType: 'Weekend Departure',
    price: 3500,
    priceType: 'total',
    capacity: 50,
    minGroupSize: 2,
    maxGroupSize: 20,
    fitnessNote: 'Beginner friendly. One steady 4 km climb on Day 1 and an early summit push on Day 2.',
    gearProvided: ['Sleeping bag', 'Tent', 'Trekking pole', 'Shared dining tent'],
    gearToCarry: [
      'Trekking or sports shoes with grip',
      'Warm jacket',
      'Sun cap and sunscreen',
      'Water bottles (2 litres total)',
      'Personal medication and ID proof',
    ],
    permitsRequired: ['Photo ID (Aadhaar / Passport)'],
    itinerary: [
      { day: 'Day 1', title: 'Dehradun to Nag Tibba Base', description: 'Morning drive to Pantwari, then a 4 km climb to the base camp. Evening bonfire.' },
      { day: 'Day 2', title: 'Summit and return', description: 'Early ascent to the 9,915 ft summit for the Bandarpoonch view, descend to Pantwari and drive back to Dehradun.' },
    ],
    inclusions: [
      'Trek leader and support staff',
      'Camping equipment',
      'All meals on trek',
      'Dehradun to Pantwari return transfer',
      'First aid kit and oximeter',
    ],
    exclusions: ['Personal trekking gear', 'Travel insurance', 'Anything not listed under inclusions'],
    guide: {
      name: 'Sunil Panwar',
      phone: '+91 90000 00004',
      experienceYears: 6,
      languages: ['Hindi', 'English', 'Garhwali'],
      certifications: ['Wilderness First Aid'],
      bio: 'Runs the weekend departures and handles most of our first-time trekker groups. Patient with slow pacing.',
    },
    status: 'active',
  },
];

const seedTreks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Schema defaults only apply to new documents, so tours created before
    // `category` existed have no value and would drop out of the Yatra tab.
    const backfilled = await Tour.updateMany(
      { category: { $exists: false } },
      { $set: { category: 'yatra' } },
    );
    if (backfilled.modifiedCount) {
      console.log(`↻ Tagged ${backfilled.modifiedCount} existing tour(s) as category "yatra"\n`);
    }

    for (const trek of TREKS) {
      const existing = await Tour.findOne({ name: trek.name });
      await Tour.findOneAndUpdate({ name: trek.name }, { $set: trek }, { new: true, upsert: true });
      console.log(
        `${existing ? '↻' : '＋'} ${trek.name} — ${trek.difficulty}, ${trek.durationDays}d, ` +
          `₹${trek.price.toLocaleString('en-IN')}, ${trek.capacity} spots, guide ${trek.guide.name}`,
      );
    }

    const treks = await Tour.countDocuments({ category: 'trek', status: 'active' });
    const yatras = await Tour.countDocuments({ category: 'yatra', status: 'active' });
    console.log(`\n🎉 ${treks} active treks, ${yatras} active yatras`);
    console.log('   Images are left blank on purpose — upload them from the admin panel.');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedTreks();
