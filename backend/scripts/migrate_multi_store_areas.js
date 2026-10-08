const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  console.log('🚀 Starting Multi-Store Per Area Database Migration...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('wormup');
    console.log('✅ Connected to MongoDB Atlas cluster0 wormup database.');

    // 1. Drop existing unique index on stores (areaId_1_isActive_1)
    console.log('\n--- 1. Checking and updating indexes on "stores" collection ---');
    const storeIndexes = await db.collection('stores').indexes();
    console.log('Current store indexes:', storeIndexes.map((i) => i.name));

    const uniqueIndex = storeIndexes.find(
      (idx) => idx.name === 'areaId_1_isActive_1' && idx.unique === true
    );

    if (uniqueIndex) {
      console.log('⚠️ Found unique index "areaId_1_isActive_1". Dropping it to allow multi-stores per area...');
      await db.collection('stores').dropIndex('areaId_1_isActive_1');
      console.log('✅ Dropped unique index "areaId_1_isActive_1".');
    } else {
      console.log('ℹ️ No unique index "areaId_1_isActive_1" found (or already dropped).');
    }

    // Create non-unique compound index on areaId + isActive for fast querying
    console.log('Creating non-unique index { areaId: 1, isActive: 1 }...');
    await db.collection('stores').createIndex(
      { areaId: 1, isActive: 1 },
      { name: 'areaId_1_isActive_1_non_unique' }
    );
    console.log('✅ Created non-unique index on stores.');

    // 2. Update areas collection: Ensure maxStores and currentStoreCount
    console.log('\n--- 2. Updating "areas" collection with maxStores & currentStoreCount ---');
    const areas = await db.collection('areas').find({}).toArray();
    console.log(`Found ${areas.length} areas to update.`);

    for (const area of areas) {
      const areaId = area._id;
      // Count active stores assigned to this area
      const activeStores = await db.collection('stores').find({
        $or: [{ areaId }, { areaId: areaId.toString() }],
        isActive: true,
      }).toArray();

      const storeCount = activeStores.length;
      let targetMaxStores = area.maxStores || 1;

      // Provide realistic high-demand capacities for known central hubs
      if (area.name.toLowerCase().includes('prahlad nagar')) {
        targetMaxStores = Math.max(targetMaxStores, 3);
      } else if (area.name.toLowerCase().includes('chandlodiya')) {
        targetMaxStores = Math.max(targetMaxStores, 5);
      } else if (area.name.toLowerCase().includes('satellite')) {
        targetMaxStores = Math.max(targetMaxStores, 2);
      } else if (area.name.toLowerCase().includes('ghatlodia')) {
        targetMaxStores = Math.max(targetMaxStores, 3);
      } else if (storeCount > targetMaxStores) {
        targetMaxStores = storeCount;
      }

      await db.collection('areas').updateOne(
        { _id: areaId },
        {
          $set: {
            maxStores: targetMaxStores,
            currentStoreCount: storeCount,
            storeRoutingStrategy: area.storeRoutingStrategy || 'NEAREST',
            updatedAt: new Date(),
          },
        }
      );

      console.log(`📍 Area "${area.name}": maxStores = ${targetMaxStores}, currentStores = ${storeCount} (${storeCount}/${targetMaxStores} capacity)`);
    }

    // 3. Verification Summary
    console.log('\n--- 3. Verification Summary ---');
    const updatedAreas = await db.collection('areas').find({}, { projection: { name: 1, maxStores: 1, currentStoreCount: 1 } }).toArray();
    console.log('Updated Area Capacities:');
    console.table(updatedAreas.map((a) => ({
      ID: a._id.toString().slice(-6),
      Name: a.name,
      'Active Stores': a.currentStoreCount,
      'Max Capacity': a.maxStores,
      'Slots Left': Math.max(0, a.maxStores - a.currentStoreCount),
    })));

    console.log('\n🎉 Multi-Store Database Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
