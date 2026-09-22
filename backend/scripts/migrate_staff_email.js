const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const staffColl = mongoose.connection.collection('store_staff');

  // Check indexes
  const indexes = await staffColl.indexes();
  console.log('Current store_staff indexes:', indexes.map(i => i.name));

  for (const idx of indexes) {
    if (idx.name === 'phoneNumber_1' && idx.unique) {
      console.log('Dropping unique index phoneNumber_1...');
      try {
        await staffColl.dropIndex('phoneNumber_1');
        console.log('Successfully dropped phoneNumber_1 index');
      } catch (err) {
        console.warn('Could not drop index:', err.message);
      }
    }
  }

  // Find staff without email
  const missingEmail = await staffColl.find({ email: { $exists: false } }).toArray();
  console.log(`Found ${missingEmail.length} staff records missing email`);

  for (const staff of missingEmail) {
    const fallbackEmail = staff.phoneNumber
      ? `staff.${staff.phoneNumber.replace('+', '')}@wormup.com`
      : `staff.${staff._id.toString()}@wormup.com`;
    await staffColl.updateOne(
      { _id: staff._id },
      { $set: { email: fallbackEmail.toLowerCase() } }
    );
    console.log(`Updated staff ${staff.fullName} (${staff.employeeCode}) with email ${fallbackEmail}`);
  }

  // Ensure index on email
  try {
    await staffColl.createIndex({ email: 1 }, { unique: true });
    console.log('Ensured unique index on email_1');
  } catch (err) {
    console.log('Email index notice:', err.message);
  }

  await mongoose.disconnect();
  console.log('Migration complete!');
}

migrate().catch(console.error);
