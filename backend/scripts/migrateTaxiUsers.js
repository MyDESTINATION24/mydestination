import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../modules/user/models/User.js';

// Important: We need the schemas defined to interact with the database collections directly.
// To avoid strict schema validation errors during migration, we use the connection.collection method.

const migrateData = async () => {
  try {
    const mongoOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    };
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL, mongoOptions);
    console.log('Connected.');

    const db = mongoose.connection;
    const taxiUsersCollection = db.collection('taxiusers');
    const usersCollection = db.collection('users');

    const taxiUsers = await taxiUsersCollection.find({}).toArray();
    console.log(`Found ${taxiUsers.length} TaxiUsers to migrate.`);

    for (const taxiUser of taxiUsers) {
      // Find if user already exists in main User collection by phone
      let existingUser = await usersCollection.findOne({ phone: taxiUser.phone });

      let finalUserId;

      if (existingUser) {
        console.log(`User with phone ${taxiUser.phone} already exists. Merging data...`);
        finalUserId = existingUser._id;
        
        // Merge taxi specific fields into existing user
        await usersCollection.updateOne(
          { _id: existingUser._id },
          {
            $set: {
              countryCode: taxiUser.countryCode || '+91',
              dateOfBirth: taxiUser.dateOfBirth,
              anniversary: taxiUser.anniversary,
              gender: taxiUser.gender,
              referralCode: taxiUser.referralCode,
              referredBy: taxiUser.referredBy,
              referralCount: taxiUser.referralCount || 0,
              referredRideCompletionCount: taxiUser.referredRideCompletionCount || 0,
              referralRewardGrantedAt: taxiUser.referralRewardGrantedAt,
              isActive: taxiUser.isActive !== undefined ? taxiUser.isActive : true,
              active: taxiUser.active !== undefined ? taxiUser.active : true,
              deletedAt: taxiUser.deletedAt,
              deletion_reason: taxiUser.deletion_reason,
              deletionRequest: taxiUser.deletionRequest,
              currentRideId: taxiUser.currentRideId,
              addresses: taxiUser.addresses || []
            }
          }
        );
      } else {
        console.log(`Migrating TaxiUser ${taxiUser.phone} as new User.`);
        // We insert the TaxiUser into the users collection, preserving the _id
        // This ensures any refs pointing to this _id will still work!
        const newUser = {
          ...taxiUser,
          role: 'user', // Ensure role matches what's expected
          password: taxiUser.password || 'no-password', // Main user expects password
        };
        await usersCollection.insertOne(newUser);
        finalUserId = taxiUser._id;
      }

      // If the _id has changed (meaning we merged into an existing user),
      // we must update all references in taxi collections from old TaxiUser._id to finalUserId.
      if (finalUserId.toString() !== taxiUser._id.toString()) {
        console.log(`Updating references for ${taxiUser.phone}: ${taxiUser._id} -> ${finalUserId}`);
        
        const collectionsToUpdate = [
          { name: 'userwallets', field: 'userId' },
          { name: 'usersubscriptions', field: 'userId' },
          { name: 'rides', field: 'userId' },
          { name: 'ridebids', field: 'userId' },
          { name: 'deliveries', field: 'userId' },
          { name: 'busbookings', field: 'userId' },
          { name: 'busseatholds', field: 'userId' },
          { name: 'safetyalerts', field: 'userId' },
          { name: 'promoredemptions', field: 'userId' },
          { name: 'promousercounters', field: 'userId' },
          { name: 'users', field: 'referredBy' } // Update referredBy in users collection
        ];

        for (const collInfo of collectionsToUpdate) {
          const coll = db.collection(collInfo.name);
          const filter = { [collInfo.field]: taxiUser._id };
          const update = { $set: { [collInfo.field]: finalUserId } };
          const result = await coll.updateMany(filter, update);
          if (result.modifiedCount > 0) {
            console.log(`  Updated ${result.modifiedCount} documents in ${collInfo.name}`);
          }
        }
      }
    }

    console.log('Migration complete!');
    console.log('IMPORTANT: Run `db.taxiusers.drop()` manually after verifying data integrity.');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
