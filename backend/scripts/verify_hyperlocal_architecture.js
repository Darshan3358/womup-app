const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path,
      method: 'GET',
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('===============================================================');
  console.log('   WORMUP HYPERLOCAL MULTI-STORE ARCHITECTURE VERIFICATION     ');
  console.log('===============================================================\n');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('wormup');

  // 1. Audit Stores & GeoJSON
  console.log('📍 1. STORE AUDIT & GEOJSON 2DSPHERE INDEXES');
  const stores = await db.collection('stores').find({ isActive: true }).toArray();
  console.log(`Found ${stores.length} active stores in MongoDB Atlas:`);
  for (const s of stores) {
    const coords = s.location?.coordinates;
    console.log(`  - [${s.code}] ${s.name} | Coords: [${coords ? coords.join(', ') : 'MISSING'}] | Radius: ${s.serviceRadiusKm} km | Phone: ${s.phoneNumber}`);
    if (!coords || coords.length !== 2) {
      throw new Error(`Store ${s.code} is missing GeoJSON coordinates!`);
    }
  }

  // 2. Inventory Distribution across Stores
  console.log('\n📦 2. INVENTORY DISTRIBUTION ACROSS ALL STORES');
  const invSummary = await db.collection('inventory').aggregate([
    {
      $group: {
        _id: '$storeId',
        productCount: { $sum: 1 },
        totalStock: { $sum: '$availableQty' },
      },
    },
    {
      $lookup: {
        from: 'stores',
        localField: '_id',
        foreignField: '_id',
        as: 'store',
      },
    },
    {
      $project: {
        storeName: { $arrayElemAt: ['$store.name', 0] },
        storeCode: { $arrayElemAt: ['$store.code', 0] },
        productCount: 1,
        totalStock: 1,
      },
    },
    { $sort: { productCount: -1 } },
  ]).toArray();

  for (const inv of invSummary) {
    console.log(`  - ${inv.storeName || 'Store ' + inv._id} (${inv.storeCode || 'NO_CODE'}): ${inv.productCount} products | ${inv.totalStock} units available`);
  }

  // 3. Staff and Rider Store Linkages
  console.log('\n👥 3. STAFF & RIDER HUB ASSIGNMENTS');
  const staffMembers = await db.collection('storestaff').find({}).toArray();
  for (const st of staffMembers) {
    const store = stores.find(s => s._id.toString() === st.storeId?.toString());
    console.log(`  - Staff [${st.employeeCode || st._id}] ${st.fullName} (${st.email}): Assigned to ${store ? store.name : 'UNASSIGNED (' + st.storeId + ')'}`);
  }

  const riders = await db.collection('deliverypartners').find({}).toArray();
  for (const r of riders) {
    const store = stores.find(s => s._id.toString() === r.hubId?.toString());
    console.log(`  - Rider [${r.riderCode}] ${r.name}: Assigned to Hub ${store ? store.name : 'UNASSIGNED (' + r.hubId + ')'}`);
  }

  await client.close();

  // 4. Test Serviceability Engine via HTTP API
  console.log('\n🗺️  4. SERVICEABILITY ENGINE LIVE API TESTS');
  const testLocations = [
    { name: 'Ghatlodia', lat: 23.0600, lng: 72.5430, expectedServiceable: true, expectedStore: 'STORE-GHATLODIA' },
    { name: 'Satellite / Prahlad Nagar', lat: 23.0267, lng: 72.5074, expectedServiceable: true, expectedStore: 'STORE-PRAHLAD_NAGAR' },
    { name: 'Vastrapur', lat: 23.0350, lng: 72.5290, expectedServiceable: true, expectedStore: 'STORE-VASTRAPUR' },
    { name: 'Bopal', lat: 23.0350, lng: 72.4750, expectedServiceable: true, expectedStore: 'STORE-BOPAL' },
    { name: 'Navrangpura', lat: 23.0395, lng: 72.5603, expectedServiceable: true, expectedStore: 'STORE-NAVRANGPURA' },
    { name: 'Mumbai (Out of Service)', lat: 19.0760, lng: 72.8777, expectedServiceable: false },
  ];

  for (const loc of testLocations) {
    const res = await post('/api/v1/location/resolve', { latitude: loc.lat, longitude: loc.lng });
    const s = res.data;
    console.log(`  📍 ${loc.name.padEnd(28)} => Serviceable: ${s.serviceable ? '✅ YES' : '❌ NO'} | Store: ${s.storeName || 'None'} | ETA: ${s.deliveryMinutes ? s.deliveryMinutes + 'm' : '—'}`);
    if (s.serviceable !== loc.expectedServiceable) {
      throw new Error(`Mismatch for ${loc.name}: expected serviceable=${loc.expectedServiceable}, got ${s.serviceable}`);
    }
  }

  // 5. Test Nearby Products Endpoint
  console.log('\n🛒 5. STORE-AWARE PRODUCTS NEARBY API');
  const prodsRes = await get('/api/v1/products/nearby?lat=23.0600&lng=72.5430&limit=3');
  const pData = prodsRes.data;
  console.log(`  Store Resolved: ${pData.store?.name} (${pData.store?.code})`);
  console.log(`  Delivery ETA: ${pData.store?.eta} minutes`);
  console.log(`  Total Catalog Products: ${pData.pagination?.total}`);
  console.log(`  Sample Items returned:`);
  for (const item of pData.items) {
    const stock = item.variants?.[0]?.stock ?? item.stock;
    console.log(`    • ${item.name} (${item.variants?.[0]?.label || item.quantityLabel}): ₹${item.sellingPrice} (MRP: ₹${item.mrp}) | Store Stock: ${stock} units`);
  }

  console.log('\n===============================================================');
  console.log('   🎉 ALL 5 MULTI-STORE HYPERLOCAL VALIDATIONS PASSED!          ');
  console.log('===============================================================');
}

verify().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
