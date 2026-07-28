// Backfills Tour.durationDays for tours created before the field existed.
//
// Deliberately writes whatever the tour is billing RIGHT NOW, so running this
// never changes a live price. Where the duration text implies a different
// number, it prints a warning instead of guessing -- picking 6 over 1 on a
// per_day package silently multiplies its price by six.
//
// Run: node backfillTourDurationDays.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Tour, getTourDurationDays, calculateTourFare } from './modules/taxi/admin/models/Tour.js';

dotenv.config({ path: './.env' });

// Any leading number in the text, e.g. "06/05" -> 6. Only used to spot
// disagreements worth a human look, never to set a value.
const hintFromText = (text = '') => {
  const match = String(text).match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    const tours = await Tour.find().lean();
    const warnings = [];
    let updated = 0;

    for (const tour of tours) {
      if (Number(tour.durationDays) > 0) {
        console.log(`⏭️  ${tour.name} — already set to ${tour.durationDays}`);
        continue;
      }

      const current = getTourDurationDays(tour);
      await Tour.updateOne({ _id: tour._id }, { $set: { durationDays: current } });
      updated += 1;
      console.log(`✔️  ${tour.name} — durationDays = ${current} (unchanged billing)`);

      const hint = hintFromText(tour.duration);
      if (tour.priceType === 'per_day' && hint && hint !== current) {
        const now = calculateTourFare({ ...tour, durationDays: current }, 1).total;
        const alt = calculateTourFare({ ...tour, durationDays: hint }, 1).total;
        warnings.push(
          `   "${tour.name}"\n` +
            `     duration text "${tour.duration}" looks like ${hint} days, but it bills ${current}.\n` +
            `     ₹${now} per passenger now; ₹${alt} if you set Billable Days to ${hint}.`,
        );
      }
    }

    console.log(`\n🎉 Backfilled ${updated} tour(s), ${tours.length - updated} already set`);

    if (warnings.length) {
      console.log('\n⚠️  Needs a decision in the admin panel — no price was changed:\n');
      warnings.forEach((line) => console.log(line + '\n'));
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

backfill();
