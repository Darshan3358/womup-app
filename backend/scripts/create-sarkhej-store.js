const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const lat = 22.986131;
  const lng = 72.495389;
  const ahmCityId = new mongoose.Types.ObjectId('6abcefe75a521a988d799c02');

  // 1. Create or update Sarkhej Dark Store
  const storeId = new mongoose.Types.ObjectId();
  const passwordHash = await bcrypt.hash('Womup@123', 10);

  const sarkhejStore = {
    _id: storeId,
    name: 'Wom Up Sarkhej Dark Store',
    code: 'SARKHEJ_DS_01',
    address: 'Sarkhej, S.G. Highway, Ahmedabad, Gujarat 382210',
    city: 'Ahmedabad',
    cityName: 'Ahmedabad',
    cityId: ahmCityId,
    pincode: '382210',
    latitude: lat,
    longitude: lng,
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    serviceRadiusKm: 6.0,
    estimatedDeliveryMinutes: 9,
    isActive: true,
    isOnShift: true,
    isOnline: true,
    staffOnShift: 1,
    staffTotal: 2,
    status: 'ACTIVE',
    loginId: 'sarkhej.store',
    loginPassword: 'Womup@123',
    loginPasswordHash: passwordHash,
    openingTime: '07:00',
    closingTime: '23:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('stores').updateOne(
    { code: 'SARKHEJ_DS_01' },
    { $set: sarkhejStore },
    { upsert: true }
  );

  const savedStore = await db.collection('stores').findOne({ code: 'SARKHEJ_DS_01' });
  const finalStoreId = savedStore._id;

  // 2. Create or update Sarkhej Area in 'areas'
  const areaId = new mongoose.Types.ObjectId();
  const minLng = 72.460, maxLng = 72.530;
  const minLat = 22.951, maxLat = 23.021;
  const polygon = {
    type: 'Polygon',
    coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]]
  };

  const sarkhejArea = {
    name: 'Sarkhej',
    code: 'SARKHEJ',
    city: 'Ahmedabad',
    cityName: 'Ahmedabad',
    cityId: ahmCityId,
    pincodes: ['382210', '380055'],
    centerLat: lat,
    centerLng: lng,
    latitude: lat,
    longitude: lng,
    radiusKm: 5.0,
    defaultDeliveryMinutes: 9,
    sortOrder: 20,
    isActive: true,
    address: 'Sarkhej, Ahmedabad',
    darkStore: 'Wom Up Sarkhej Dark Store',
    hubStoreId: finalStoreId,
    currentStoreCount: 1,
    maxStores: 1,
    storeRoutingStrategy: 'NEAREST',
    polygon: polygon,
    updatedAt: new Date(),
  };

  await db.collection('areas').updateOne(
    { name: 'Sarkhej' },
    { $set: sarkhejArea, $setOnInsert: { _id: areaId, createdAt: new Date() } },
    { upsert: true }
  );

  const savedArea = await db.collection('areas').findOne({ name: 'Sarkhej' });
  const finalAreaId = savedArea._id;

  // Update store with areaId and areaName
  await db.collection('stores').updateOne(
    { _id: finalStoreId },
    { $set: { areaId: finalAreaId, areaName: 'Sarkhej' } }
  );

  // 3. Ensure approved_pincodes for Sarkhej
  await db.collection('approved_pincodes').updateOne(
    { pincode: '382210' },
    {
      $set: {
        pincode: '382210',
        areaName: 'Sarkhej (સરખેજ)',
        cityName: 'Ahmedabad',
        isDeliveryAllowed: true,
        isIncomeEnabled: true,
        isRegistrationAllowed: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  await db.collection('approved_pincodes').updateOne(
    { pincode: '380055' },
    {
      $set: {
        pincode: '380055',
        areaName: 'Sarkhej Road (સરખેજ રોડ)',
        cityName: 'Ahmedabad',
        isDeliveryAllowed: true,
        isIncomeEnabled: true,
        isRegistrationAllowed: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  // 4. Seed area_pricing for Sarkhej for all 34 products & variants
  const satelliteArea = await db.collection('areas').findOne({ name: 'Satellite' });
  const samplePricing = await db.collection('area_pricing').find({ areaId: satelliteArea._id }).toArray();
  console.log('Satellite pricing records count to replicate:', samplePricing.length);

  let insertedPricing = 0;
  for (const ap of samplePricing) {
    await db.collection('area_pricing').updateOne(
      { productId: ap.productId, variantId: ap.variantId, areaId: finalAreaId },
      {
        $set: {
          productId: ap.productId,
          variantId: ap.variantId,
          areaId: finalAreaId,
          price: ap.price,
          mrp: ap.mrp,
          discountPercent: ap.discountPercent,
          stock: ap.stock || 100,
          isAvailable: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    insertedPricing++;
  }

  // 5. Populate stores collection for existing areas so Admin Stores tab shows real stores!
  const allAreas = await db.collection('areas').find({}).toArray();
  for (const a of allAreas) {
    if (a.name === 'Sarkhej') continue;
    const sId = a.hubStoreId || new mongoose.Types.ObjectId();
    const sCode = (a.code || a.name).toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_DS';
    const storeDoc = {
      _id: sId,
      name: a.darkStore || `Wom Up ${a.name} Dark Store`,
      code: sCode,
      address: a.address || `${a.name}, Ahmedabad, Gujarat`,
      city: a.city || 'Ahmedabad',
      cityName: a.cityName || a.city || 'Ahmedabad',
      cityId: a.cityId || ahmCityId,
      areaId: a._id,
      areaName: a.name,
      pincode: (a.pincodes && a.pincodes[0]) || '380015',
      latitude: a.centerLat || a.latitude || 23.0225,
      longitude: a.centerLng || a.longitude || 72.5714,
      location: {
        type: 'Point',
        coordinates: [a.centerLng || a.longitude || 72.5714, a.centerLat || a.latitude || 23.0225],
      },
      serviceRadiusKm: a.radiusKm || 5.0,
      estimatedDeliveryMinutes: a.defaultDeliveryMinutes || 9,
      isActive: a.isActive !== false,
      isOnShift: true,
      isOnline: true,
      staffOnShift: 1,
      staffTotal: 2,
      status: 'ACTIVE',
      loginId: (a.code || a.name).toLowerCase().replace(/[^a-z0-9]+/g, '.') + '.store',
      loginPassword: 'Womup@123',
      loginPasswordHash: passwordHash,
      openingTime: '07:00',
      closingTime: '23:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('stores').updateOne(
      { _id: sId },
      { $set: storeDoc },
      { upsert: true }
    );

    // Ensure area has hubStoreId
    if (!a.hubStoreId) {
      await db.collection('areas').updateOne(
        { _id: a._id },
        { $set: { hubStoreId: sId, darkStore: storeDoc.name } }
      );
    }
  }

  const allStoresCount = await db.collection('stores').countDocuments();
  const allAreasCount = await db.collection('areas').countDocuments();
  console.log('✅ Dark Store Sarkhej created successfully!');
  console.log('Store ID:', finalStoreId);
  console.log('Area ID:', finalAreaId);
  console.log('Area Pricing seeded:', insertedPricing);
  console.log('Total stores in DB now:', allStoresCount);
  console.log('Total areas in DB now:', allAreasCount);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
