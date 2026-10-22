const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const CORRECTED_AREAS = [
  {
    find: { $or: [{ name: /RAMOL/i }, { code: /RAMOL/i }] },
    update: {
      name: 'Ramol',
      code: 'RAMOL',
      city: 'Ahmedabad',
      pincodes: ['382449'],
    },
  },
  {
    find: { $or: [{ name: /VATVA/i }, { code: /VATVA/i }] },
    update: {
      name: 'Hathijan / Vatva side',
      code: 'HATHIJAN_VATVA',
      city: 'Ahmedabad',
      pincodes: ['382440'],
    },
  },
  {
    find: { $or: [{ name: /^LAMBHA$/i }, { code: /^LAMBHA$/i }] },
    update: {
      name: 'Lambha',
      code: 'LAMBHA',
      city: 'Ahmedabad',
      pincodes: ['382440'],
    },
  },
  {
    find: { $or: [{ name: /^ISANPUR$/i }, { code: /^ISANPUR$/i }] },
    update: {
      name: 'Isanpur',
      code: 'ISANPUR',
      city: 'Ahmedabad',
      pincodes: ['382443'],
    },
  },
  {
    find: { $or: [{ name: /^Thaltej$/i }, { code: /^THALTEJ$/i }] },
    update: {
      name: 'Thaltej',
      code: 'THALTEJ',
      city: 'Ahmedabad',
      pincodes: ['380059'],
    },
  },
  {
    find: { $or: [{ name: /Chandlodiya/i }, { code: /CHANDLODIYA/i }] },
    update: {
      name: 'Chandlodiya - Tragad',
      code: 'AREA-CHANDLODIYA_TRAGAD',
      city: 'Ahmedabad',
      pincodes: ['382481', '382470'],
    },
  },
  {
    find: { $or: [{ name: /^Prahlad Nagar$/i }, { code: /^PRAHLAD_NAGAR$/i }] },
    update: {
      pincodes: ['380015'],
    },
  },
  {
    find: { $or: [{ name: /^Satellite$/i }, { code: /^SATELLITE$/i }] },
    update: {
      pincodes: ['380015'],
    },
  },
  {
    find: { $or: [{ name: /^Navrangpura$/i }, { code: /^NAVRANGPURA$/i }] },
    update: {
      pincodes: ['380009'],
    },
  },
  {
    find: { $or: [{ name: /^Ghatlodia$/i }, { code: /^GHATLODIA$/i }] },
    update: {
      pincodes: ['380061'],
    },
  },
  {
    find: { $or: [{ name: /^Bopal$/i }, { code: /^BOPAL$/i }] },
    update: {
      pincodes: ['380058'],
    },
  },
  {
    find: { $or: [{ name: /^SG Highway$/i }, { code: /^SG_HIGHWAY$/i }] },
    update: {
      pincodes: ['380054'],
    },
  },
  {
    find: { $or: [{ name: /^Vastrapur$/i }, { code: /^VASTRAPUR$/i }] },
    update: {
      pincodes: ['380015'],
    },
  },
  {
    find: { $or: [{ name: /^Maninagar$/i }, { code: /^MANINAGAR$/i }] },
    update: {
      pincodes: ['380008'],
    },
  },
  {
    find: { $or: [{ name: /^Paldi$/i }, { code: /^PALDI$/i }] },
    update: {
      pincodes: ['380007'],
    },
  },
  {
    find: { $or: [{ name: /^Vesu$/i }, { code: /^VESU$/i }] },
    update: {
      pincodes: ['395007'],
    },
  },
  {
    find: { $or: [{ name: /^Adajan$/i }, { code: /^ADAJAN$/i }] },
    update: {
      pincodes: ['395009'],
    },
  },
];

async function updatePincodes() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('wormup');

  console.log('\n--- Updating Areas with Verified Real PIN Codes ---');
  for (const item of CORRECTED_AREAS) {
    const existing = await db.collection('areas').findOne(item.find);
    if (existing) {
      await db.collection('areas').updateOne(
        { _id: existing._id },
        { $set: { ...item.update, updatedAt: new Date() } }
      );
      console.log(`✅ Updated Area "${existing.name}" -> ${JSON.stringify(item.update.pincodes)} (Name: ${item.update.name || existing.name})`);
    } else {
      console.log(`⚠️ Area matching ${JSON.stringify(item.find)} not found`);
    }
  }

  // Also check if standalone Tragad area should be present
  let tragadArea = await db.collection('areas').findOne({ name: /^Tragad$/i });
  if (!tragadArea) {
    const ahmCity = await db.collection('cities').findOne({ name: /Ahmedabad/i });
    const newTragad = {
      name: 'Tragad',
      code: 'TRAGAD',
      city: 'Ahmedabad',
      cityId: ahmCity ? ahmCity._id : undefined,
      pincodes: ['382470'],
      centerLat: 23.1189,
      centerLng: 72.5630,
      radiusKm: 3.5,
      defaultDeliveryMinutes: 9,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection('areas').insertOne(newTragad);
    console.log(`🆕 Created standalone Tragad area -> ${res.insertedId} with PIN 382470`);
  }

  console.log('\n--- Final Verification of Areas in Database ---');
  const allAreas = await db.collection('areas').find({}).sort({ city: 1, name: 1 }).toArray();
  allAreas.forEach((a) => {
    console.log(`- ${a.name} (${a.city}) -> PIN: ${JSON.stringify(a.pincodes)} [ID: ${a._id}]`);
  });

  await client.close();
  console.log('\nDone!');
}

updatePincodes().catch(console.error);
