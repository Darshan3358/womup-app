const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

// Center between Chandlodiya, Gota & Tragad
const STORE_DETAILS = {
  name: 'Wom Up Chandlodiya - Tragad Dark Store',
  code: 'STORE-CHANDLODIYA_TRAGAD',
  address: 'Shop 10-14, Ground Floor, Shukan Hub, Near Chandlodiya Railway Crossing & Tragad Road',
  city: 'Ahmedabad',
  pincode: '382481',
  lng: 72.5410,
  lat: 23.0950,
  radiusKm: 4.5,
  estimatedDeliveryMinutes: 9,
  openingTime: '06:00',
  closingTime: '02:00',
  phoneNumber: '+91 98765 43220',
  managerName: 'Suresh Patel',
  managerPhone: '+91 98765 43220',
};

function createNeighborhoodPolygon(lng, lat, radiusKm = 4.5) {
  const deltaLat = (radiusKm / 111) * 0.95;
  const deltaLng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * 0.95;

  const minLng = Number((lng - deltaLng).toFixed(4));
  const maxLng = Number((lng + deltaLng).toFixed(4));
  const minLat = Number((lat - deltaLat).toFixed(4));
  const maxLat = Number((lat + deltaLat).toFixed(4));

  return {
    type: 'Polygon',
    coordinates: [[
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ]],
  };
}

async function addStore() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('wormup');

  console.log('\n--- 1. Creating or Updating Store in "stores" Collection ---');
  let store = await db.collection('stores').findOne({ code: STORE_DETAILS.code });

  const storeData = {
    name: STORE_DETAILS.name,
    code: STORE_DETAILS.code,
    address: STORE_DETAILS.address,
    city: STORE_DETAILS.city,
    pincode: STORE_DETAILS.pincode,
    location: {
      type: 'Point',
      coordinates: [STORE_DETAILS.lng, STORE_DETAILS.lat],
    },
    serviceRadiusKm: STORE_DETAILS.radiusKm,
    estimatedDeliveryMinutes: STORE_DETAILS.estimatedDeliveryMinutes,
    openingTime: STORE_DETAILS.openingTime,
    closingTime: STORE_DETAILS.closingTime,
    phoneNumber: STORE_DETAILS.phoneNumber,
    managerName: STORE_DETAILS.managerName,
    managerPhone: STORE_DETAILS.managerPhone,
    isActive: true,
    updatedAt: new Date(),
  };

  if (!store) {
    storeData.createdAt = new Date();
    const result = await db.collection('stores').insertOne(storeData);
    store = { _id: result.insertedId, ...storeData };
    console.log(`✅ Created new Dark Store: ${store.name} (ID: ${store._id})`);
  } else {
    await db.collection('stores').updateOne({ _id: store._id }, { $set: storeData });
    console.log(`✅ Updated existing Dark Store: ${store.name} (ID: ${store._id})`);
  }

  console.log('\n--- 2. Creating or Updating Area in "areas" Collection ---');
  const polygon = createNeighborhoodPolygon(STORE_DETAILS.lng, STORE_DETAILS.lat, STORE_DETAILS.radiusKm);

  let area = await db.collection('areas').findOne({ code: 'AREA-CHANDLODIYA_TRAGAD' });
  if (!area) {
    area = await db.collection('areas').findOne({ name: /Chandlodiya/i });
  }

  const areaData = {
    name: 'Chandlodiya - Tragad',
    code: 'AREA-CHANDLODIYA_TRAGAD',
    city: 'Ahmedabad',
    pincodes: ['382481', '382480', '380061', '382470'],
    centerLat: STORE_DETAILS.lat,
    centerLng: STORE_DETAILS.lng,
    radiusKm: STORE_DETAILS.radiusKm,
    defaultDeliveryMinutes: STORE_DETAILS.estimatedDeliveryMinutes,
    polygon: polygon,
    hubStoreId: store._id,
    isActive: true,
    updatedAt: new Date(),
  };

  if (!area) {
    areaData.createdAt = new Date();
    const result = await db.collection('areas').insertOne(areaData);
    area = { _id: result.insertedId, ...areaData };
    console.log(`✅ Created new Area: ${area.name} (ID: ${area._id})`);
  } else {
    await db.collection('areas').updateOne({ _id: area._id }, { $set: areaData });
    console.log(`✅ Updated Area: ${area.name} (ID: ${area._id})`);
  }

  // Link area back to store
  await db.collection('stores').updateOne(
    { _id: store._id },
    { $set: { areaId: area._id, areaName: area.name } }
  );

  console.log('\n--- 3. Seeding Store Inventory from Master Catalog ---');
  // Grab sample inventory from Ghatlodia store
  const ghatlodiaStore = await db.collection('stores').findOne({ code: 'STORE-GHATLODIA' });
  let masterInventory = [];
  if (ghatlodiaStore) {
    masterInventory = await db.collection('inventory').find({ storeId: ghatlodiaStore._id }).toArray();
  }
  if (!masterInventory || masterInventory.length === 0) {
    masterInventory = await db.collection('inventory').find({}).limit(50).toArray();
  }

  console.log(`Found ${masterInventory.length} master inventory items to clone...`);
  let seededCount = 0;
  for (const item of masterInventory) {
    await db.collection('inventory').updateOne(
      { storeId: store._id, productId: item.productId },
      {
        $setOnInsert: {
          storeId: store._id,
          productId: item.productId,
          sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          availableQty: 95,
          reservedQty: 0,
          soldQty: 0,
          lowStockThreshold: 10,
          aisle: item.aisle || 'A1',
          rack: item.rack || 'R2',
          shelf: item.shelf || 'S3',
          bin: item.bin || 'B04',
          zone: 'GROCERY',
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );
    seededCount++;
  }
  console.log(`✅ Seeded ${seededCount} inventory lines for ${store.name}`);

  console.log('\n--- 4. Creating Store Staff Account ---');
  const staffEmail = 'staff.chandlodiya@wormup.com';
  let staff = await db.collection('storestaff').findOne({ email: staffEmail });
  if (!staff) {
    await db.collection('storestaff').insertOne({
      fullName: 'Vikram Joshi (Chandlodiya Hub)',
      email: staffEmail,
      phoneNumber: '9876543220',
      role: 'PICKER',
      shift: 'MORNING',
      isOnShift: true,
      storeId: store._id,
      storeName: store.name,
      employeeCode: 'STF-CHAND-01',
      totalOrdersPicked: 0,
      accuracy: 100,
      avgPickTimeSeconds: 0,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Created staff account: ${staffEmail} -> ${store.name}`);
  } else {
    await db.collection('storestaff').updateOne(
      { _id: staff._id },
      { $set: { storeId: store._id, storeName: store.name, isOnShift: true } }
    );
    console.log(`✅ Reassigned staff account: ${staffEmail} -> ${store.name}`);
  }

  // Check 2dsphere indexes
  await db.collection('stores').createIndex({ location: '2dsphere' });
  await db.collection('areas').createIndex({ polygon: '2dsphere' });

  console.log('\n=============================================================');
  console.log('  🎉 CHANDLODIYA / TRAGAD DARK STORE SUCCESSFULLY CREATED!    ');
  console.log(`  Store Name:   ${store.name}`);
  console.log(`  Store Code:   ${store.code}`);
  console.log(`  Coordinates:  [${STORE_DETAILS.lng}, ${STORE_DETAILS.lat}]`);
  console.log(`  Radius:       ${STORE_DETAILS.radiusKm} km`);
  console.log(`  ETA:          ${STORE_DETAILS.estimatedDeliveryMinutes} minutes`);
  console.log(`  Coverage:     Chandlodiya, Gota, Tragad, Godrej Garden City`);
  console.log('=============================================================');

  await client.close();
}

addStore().catch(err => {
  console.error('❌ Error adding store:', err);
  process.exit(1);
});
