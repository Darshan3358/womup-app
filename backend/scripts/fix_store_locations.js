const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const STORE_CONFIG = {
  'STORE-GHATLODIA': { lng: 72.5430, lat: 23.0600, pincode: '380061', radiusKm: 3.5 },
  'STORE-BOPAL': { lng: 72.4750, lat: 23.0350, pincode: '380058', radiusKm: 4.0 },
  'STORE-SG_HIGHWAY': { lng: 72.5050, lat: 23.0300, pincode: '380054', radiusKm: 4.0 },
  'STORE-THALTEJ': { lng: 72.5100, lat: 23.0500, pincode: '380059', radiusKm: 3.5 },
  'STORE-VASTRAPUR': { lng: 72.5290, lat: 23.0350, pincode: '380015', radiusKm: 4.5 },
  'STORE-PRAHLAD_NAGAR': { lng: 72.5067, lat: 23.0141, pincode: '380015', radiusKm: 3.5 },
  'STORE-SATELLITE': { lng: 72.5074, lat: 23.0267, pincode: '380015', radiusKm: 3.0 },
  'STORE-NAVRANGPURA': { lng: 72.5603, lat: 23.0395, pincode: '380009', radiusKm: 3.0 },
  'STORE-CHANDLODIYA_TRAGAD': { lng: 72.5450, lat: 23.1150, pincode: '382481', radiusKm: 4.5 },
};

function createPolygonAroundPoint(lng, lat, radiusKm = 3.5) {
  // Approximate conversion: 1 deg lat ~ 111 km, 1 deg lng ~ 111 * cos(lat) ~ 102 km
  const deltaLat = (radiusKm / 111) * 0.9;
  const deltaLng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * 0.9;

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

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db();

  console.log('\n--- 1. Upserting Stores with GeoJSON Coordinates ---');
  let currentStores = await db.collection('stores').find({}).toArray();

  for (const [storeCode, config] of Object.entries(STORE_CONFIG)) {
    const existingStore = currentStores.find((s) => s.code === storeCode);

    const areaName = storeCode
      .replace('STORE-', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const storeData = {
      location: {
        type: 'Point',
        coordinates: [config.lng, config.lat],
      },
      pincode: config.pincode,
      serviceRadiusKm: config.radiusKm,
      managerName: existingStore?.managerName || 'Operations Manager',
      managerPhone: existingStore?.managerPhone || '+919876543210',
      operatingHours: { open: '06:00', close: '02:00' },
      isActive: true,
      updatedAt: new Date(),
    };

    if (existingStore) {
      await db.collection('stores').updateOne(
        { _id: existingStore._id },
        { $set: storeData }
      );
      console.log(`✅ Updated existing store ${storeCode} (${existingStore.name}) -> [${config.lng}, ${config.lat}]`);
    } else {
      // 🆕 UPSERT: Insert new store if it does not exist
      const newStore = {
        code: storeCode,
        name: `Wom Up ${areaName} Dark Store`,
        address: `${areaName}, Ahmedabad`,
        city: 'Ahmedabad',
        ...storeData,
        createdAt: new Date(),
      };
      const result = await db.collection('stores').insertOne(newStore);
      console.log(`🆕 Created new store ${storeCode} (${newStore.name}) -> ID: ${result.insertedId}`);
    }
  }

  // Update flagship central hub if present
  const flagship = currentStores.find((s) => s.code === 'DARK-STORE-01');
  if (flagship) {
    await db.collection('stores').updateOne(
      { _id: flagship._id },
      {
        $set: {
          location: { type: 'Point', coordinates: [72.5150, 23.0200] },
          pincode: '380015',
          serviceRadiusKm: 5.0,
          managerName: 'Central Hub Manager',
          managerPhone: '+919876543210',
          operatingHours: { open: '06:00', close: '02:00' },
          isActive: true,
        },
      }
    );
    console.log(`✅ Updated flagship store DARK-STORE-01 -> [72.5150, 23.0200]`);
  }

  console.log('\n--- 2. Creating 2dsphere Index on stores.location ---');
  await db.collection('stores').createIndex({ location: '2dsphere' });
  console.log('✅ stores.location 2dsphere index verified');

  // Re-query stores so we have all current documents and fresh IDs
  const stores = await db.collection('stores').find({}).toArray();

  console.log('\n--- 3. Ensuring and Linking Area Polygons ---');
  // Check if Chandlodiya area exists, create if missing
  const chandlodiyaStore = stores.find((s) => s.code === 'STORE-CHANDLODIYA_TRAGAD');
  let chandlodiyaArea = await db.collection('areas').findOne({
    $or: [{ code: 'AREA-CHANDLODIYA_TRAGAD' }, { name: /Chandlodiya/i }],
  });

  if (!chandlodiyaArea && chandlodiyaStore) {
    const newAreaDoc = {
      name: 'Chandlodiya - Tragad',
      code: 'AREA-CHANDLODIYA_TRAGAD',
      city: 'Ahmedabad',
      pincodes: ['382481', '380061', '382470'],
      centerLat: 23.1150,
      centerLng: 72.5450,
      radiusKm: 4.5,
      defaultDeliveryMinutes: 9,
      polygon: createPolygonAroundPoint(72.5450, 23.1150, 4.5),
      hubStoreId: chandlodiyaStore._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection('areas').insertOne(newAreaDoc);
    console.log(`🆕 Created Chandlodiya - Tragad Area polygon -> ID: ${res.insertedId}`);
  }

  const areas = await db.collection('areas').find({}).toArray();

  for (const area of areas) {
    const matchingStore =
      stores.find((s) => s.areaId && s.areaId.toString() === area._id.toString()) ||
      stores.find((s) => s.name.toLowerCase().includes(area.name.toLowerCase())) ||
      (area.name.toLowerCase().includes('chandlodiya') ? chandlodiyaStore : null);

    const lat = area.centerLat || (matchingStore ? matchingStore.location?.coordinates?.[1] : 23.03);
    const lng = area.centerLng || (matchingStore ? matchingStore.location?.coordinates?.[0] : 72.52);
    const radius = area.radiusKm || 3.5;

    const polygon = createPolygonAroundPoint(lng, lat, radius);

    const updateDoc = {
      polygon,
      isActive: true,
    };
    if (matchingStore) {
      updateDoc.hubStoreId = matchingStore._id;
      // Also link store back to area
      await db.collection('stores').updateOne(
        { _id: matchingStore._id },
        { $set: { areaId: area._id, areaName: area.name } }
      );
    }

    await db.collection('areas').updateOne({ _id: area._id }, { $set: updateDoc });
    console.log(`✅ Updated area "${area.name}" with polygon around [${lng}, ${lat}] -> Hub: ${matchingStore?.name || 'None'}`);
  }

  console.log('\n--- 4. Creating 2dsphere Index on areas.polygon ---');
  await db.collection('areas').createIndex({ polygon: '2dsphere' });
  console.log('✅ areas.polygon 2dsphere index verified');

  console.log('\n--- 5. Seeding Staff Accounts for Dark Stores ---');
  const STAFF_STORE_MAP = {
    'ayushithanki77@gmail.com': 'STORE-GHATLODIA',
    'picker@wormup.com': 'STORE-SATELLITE',
    'staff.9876543210@wormup.com': 'STORE-SATELLITE',
    'staff.chandlodiya@wormup.com': 'STORE-CHANDLODIYA_TRAGAD',
  };

  // Ensure Chandlodiya staff account exists in store_staff and storestaff
  if (chandlodiyaStore) {
    for (const colName of ['store_staff', 'storestaff']) {
      const existing = await db.collection(colName).findOne({ email: 'staff.chandlodiya@wormup.com' });
      if (!existing) {
        await db.collection(colName).insertOne({
          userId: new ObjectId(),
          storeId: chandlodiyaStore._id,
          employeeCode: 'STF-CHAND-01',
          fullName: 'Vikram Joshi (Chandlodiya Hub)',
          email: 'staff.chandlodiya@wormup.com',
          phoneNumber: '9876543220',
          role: 'PICKER',
          shift: 'MORNING',
          isOnShift: true,
          totalOrdersPicked: 0,
          avgPickTimeSeconds: 0,
          accuracy: 100,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`🆕 Created Chandlodiya staff in collection "${colName}"`);
      }
    }
  }

  // Reassign / sync existing staff to designated stores
  const staffCollections = ['store_staff', 'storestaff'];
  for (const colName of staffCollections) {
    const staffList = await db.collection(colName).find({}).toArray();
    for (const staff of staffList) {
      const storeCode = STAFF_STORE_MAP[staff.email] || (staff.storeId ? null : 'STORE-SATELLITE');
      if (!storeCode) {
        console.log(`ℹ️  [${colName}] Staff ${staff.fullName || staff.email} already has assigned store`);
        continue;
      }
      const targetStore = stores.find((s) => s.code === storeCode);
      if (!targetStore) {
        console.log(`⚠️  [${colName}] Target store ${storeCode} not found for ${staff.email}`);
        continue;
      }
      await db.collection(colName).updateOne(
        { _id: staff._id },
        {
          $set: {
            storeId: targetStore._id,
            isOnShift: true,
            status: 'ACTIVE',
          },
        }
      );
      console.log(`✅ [${colName}] Staff ${staff.fullName || staff.email} (${staff.email}) -> Reassigned to ${targetStore.name} (${targetStore.code})`);
    }
  }

  console.log('\n--- 6. Verifying Inventory Availability ---');
  for (const store of stores) {
    const count = await db.collection('inventory').countDocuments({ storeId: store._id });
    if (count === 0) {
      console.log(`⚠️  Store ${store.name} has 0 inventory items. Seeding from master products...`);
      const masterItems = await db.collection('inventory').find({}).limit(45).toArray();
      for (const item of masterItems) {
        await db.collection('inventory').insertOne({
          storeId: store._id,
          productId: item.productId,
          sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
          updatedAt: new Date(),
        });
      }
      console.log(`✅ Seeded 45 inventory lines for ${store.name}`);
    } else {
      console.log(`✅ Store ${store.name}: ${count} active inventory lines`);
    }
  }

  console.log('\n🎉 Multi-Store Serviceability Engine Data Setup Complete!');
  await client.close();
}

run().catch(console.error);
