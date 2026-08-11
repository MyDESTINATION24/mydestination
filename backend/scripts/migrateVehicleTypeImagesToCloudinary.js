// One-off: move base64 vehicle-type images out of Mongo and into Cloudinary.
//
// The admin form posted data: URIs, so 13 image/icon/map_icon fields held ~11MB
// of base64. The vehicle-type catalog had to ship all of it on every load, which
// is why /taxi/admin/pricing/vehicle-type crawled.
//
// Safe to re-run: documents whose fields are already URLs are skipped, and a
// failed upload leaves the original value untouched.
//
//   node scripts/migrateVehicleTypeImagesToCloudinary.js          # dry run
//   node scripts/migrateVehicleTypeImagesToCloudinary.js --apply  # write
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { uploadDataUrlToCloudinary } from '../utils/cloudinaryUpload.js';

dotenv.config();

const APPLY = process.argv.includes('--apply');
const IMAGE_FIELDS = ['image', 'icon', 'map_icon'];
const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL, { dbName: process.env.MONGODB_DB_NAME });
  const collection = mongoose.connection.db.collection('taxivehicles');
  const docs = await collection.find({}).toArray();

  let converted = 0;
  let failed = 0;
  let bytesSaved = 0;
  // The same file is usually set on image/icon/map_icon; upload it once.
  const uploadedByPayload = new Map();

  for (const doc of docs) {
    const update = {};

    for (const field of IMAGE_FIELDS) {
      const value = String(doc[field] || '');

      if (!value.startsWith('data:')) {
        continue;
      }

      if (uploadedByPayload.has(value)) {
        update[field] = uploadedByPayload.get(value);
        bytesSaved += value.length;
        converted += 1;
        continue;
      }

      if (!APPLY) {
        console.log(`  would upload ${doc.name}.${field} (${kb(value.length)})`);
        bytesSaved += value.length;
        converted += 1;
        continue;
      }

      try {
        const uploaded = await uploadDataUrlToCloudinary({
          dataUrl: value,
          publicIdPrefix: 'vehicle-type',
        });
        uploadedByPayload.set(value, uploaded.secureUrl);
        update[field] = uploaded.secureUrl;
        bytesSaved += value.length;
        converted += 1;
        console.log(`  ${doc.name}.${field} ${kb(value.length)} -> ${uploaded.secureUrl}`);
      } catch (error) {
        failed += 1;
        console.error(`  FAILED ${doc.name}.${field}: ${error.message} (left unchanged)`);
      }
    }

    if (APPLY && Object.keys(update).length) {
      await collection.updateOne({ _id: doc._id }, { $set: update });
    }
  }

  console.log(`\n${APPLY ? 'Converted' : 'Would convert'} ${converted} field(s), failed ${failed}, freeing ~${kb(bytesSaved)}`);
  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to write.');
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
