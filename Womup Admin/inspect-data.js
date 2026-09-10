const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

async function inspectData() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('wormup');
    
    const collectionsToInspect = [
      'users',
      'orders',
      'products',
      'areas',
      'area_pricing',
      'stores',
      'inventory',
      'coupons',
      'coin_transactions',
      'banners',
      'print_orders'
    ];

    for (const colName of collectionsToInspect) {
      const sample = await db.collection(colName).find({}).limit(2).toArray();
      console.log(`\n=== Collection: ${colName} (${sample.length} sample docs) ===`);
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (err) {
    console.error("Inspect error:", err.message);
  } finally {
    await client.close();
  }
}

inspectData();
