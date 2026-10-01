const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup?retryWrites=true&w=majority&appName=Cluster0';

async function setupIndex() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const storesCol = db.collection('stores');

  // Check existing indexes
  const existingIndexes = await storesCol.indexes();
  console.log('Existing indexes on stores:', existingIndexes.map(idx => idx.name));

  // Check if any duplicate active stores exist for the same areaId
  const activeStores = await storesCol.find({ isActive: true, areaId: { $exists: true, $ne: null } }).toArray();
  const areaCounts = {};
  for (const s of activeStores) {
    const key = s.areaId.toString();
    if (!areaCounts[key]) areaCounts[key] = [];
    areaCounts[key].push({ id: s._id, name: s.name, code: s.code });
  }

  let hasDuplicates = false;
  for (const [areaId, list] of Object.entries(areaCounts)) {
    if (list.length > 1) {
      console.warn(`Duplicate active stores in area ${areaId}:`, list);
      hasDuplicates = true;
    }
  }

  if (hasDuplicates) {
    console.log('Fixing duplicates by setting older duplicates to isActive: false...');
    for (const [areaId, list] of Object.entries(areaCounts)) {
      if (list.length > 1) {
        // Keep the latest, deactivate older ones
        for (let i = 0; i < list.length - 1; i++) {
          await storesCol.updateOne({ _id: list[i].id }, { $set: { isActive: false } });
          console.log(`Deactivated older duplicate store: ${list[i].name} (${list[i].id})`);
        }
      }
    }
  }

  // Create partial unique index
  try {
    const res = await storesCol.createIndex(
      { areaId: 1, isActive: 1 },
      {
        unique: true,
        partialFilterExpression: { isActive: true },
        name: 'unique_active_store_per_area',
      }
    );
    console.log('Index created successfully:', res);
  } catch (err) {
    console.error('Error creating index:', err.message);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

setupIndex().catch(err => {
  console.error(err);
  process.exit(1);
});
