const mongoose = require('mongoose');

const uri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('--- Cleaning mock dark stores from database ---');

  // 1. In stores collection: keep ONLY Sarkhej Dark Store
  const delStoresRes = await db.collection('stores').deleteMany({
    code: { $ne: 'SARKHEJ_DS_01' }
  });
  console.log('Deleted mock stores:', delStoresRes.deletedCount);

  const remainingStores = await db.collection('stores').find({}).toArray();
  console.log('Remaining stores count:', remainingStores.length);
  remainingStores.forEach(s => console.log('STORE:', s._id, s.name, s.code, s.city, s.pincode, s.latitude, s.longitude));

  // 2. In areas collection:
  // Deactivate all areas except Sarkhej, or ensure only Sarkhej has active dark store
  const sarkhejArea = await db.collection('areas').findOne({ name: 'Sarkhej' });
  console.log('Sarkhej Area in DB:', sarkhejArea ? sarkhejArea._id : 'NOT FOUND');

  // Set all other areas to isActive: false
  const deactRes = await db.collection('areas').updateMany(
    { name: { $ne: 'Sarkhej' } },
    { $set: { isActive: false, hubStoreId: null, darkStore: null, currentStoreCount: 0 } }
  );
  console.log('Deactivated other mock areas:', deactRes.modifiedCount);

  // Ensure Sarkhej area is fully active with hubStoreId
  if (remainingStores.length > 0 && sarkhejArea) {
    await db.collection('areas').updateOne(
      { _id: sarkhejArea._id },
      {
        $set: {
          isActive: true,
          hubStoreId: remainingStores[0]._id,
          darkStore: remainingStores[0].name,
          currentStoreCount: 1,
          maxStores: 1,
        }
      }
    );
  }

  const activeAreas = await db.collection('areas').find({ isActive: true }).toArray();
  console.log('Active areas count in DB:', activeAreas.length);
  activeAreas.forEach(a => console.log('ACTIVE AREA:', a._id, a.name, a.cityName, a.darkStore, a.hubStoreId));

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
