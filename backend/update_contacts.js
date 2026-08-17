import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to DB');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collNames = collections.map(c => c.name);

  if (collNames.includes('cms')) {
    const cmsCollection = mongoose.connection.db.collection('cms');
    await cmsCollection.updateMany({}, {
      $set: {
        'footer.phone': '+91 80 06 787878',
        'footer.email': 'care@mydestination.in',
        'footer.whatsapp': '+91 80 06 787878',
        'contact.phone': '+91 80 06 787878',
        'contact.email': 'care@mydestination.in',
        'contact.whatsapp': '+91 80 06 787878'
      }
    });
    console.log('Updated CMS contacts');
  }

  console.log('Done');
  process.exit(0);
}).catch(console.error);
