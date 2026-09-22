const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const STORE_CONFIGS = [
  {
    codePatterns: ['STORE-CHANDLODIYA_TRAGAD', 'STORE-CHANDLODIYA', 'STORE-TRAGAD', 'CHANDLODIYA'],
    nameKeyword: 'Chandlodiya',
    loginId: 'womupTragad',
    password: 'Tragad@2026',
  },
  {
    codePatterns: ['STORE-GHATLODIA', 'STORE-GHATLODIYA', 'GHATLODIA'],
    nameKeyword: 'Ghatlodia',
    loginId: 'womupGhatlodia',
    password: 'Ghatlodia@2026',
  },
  {
    codePatterns: ['STORE-BOPAL', 'BOPAL'],
    nameKeyword: 'Bopal',
    loginId: 'womupBopal',
    password: 'Bopal@2026',
  },
  {
    codePatterns: ['STORE-SG_HIGHWAY', 'SG_HIGHWAY', 'SG HIGHWAY'],
    nameKeyword: 'SG Highway',
    loginId: 'womupSGHighway',
    password: 'SGHighway@2026',
  },
  {
    codePatterns: ['STORE-THALTEJ', 'THALTEJ'],
    nameKeyword: 'Thaltej',
    loginId: 'womupThaltej',
    password: 'Thaltej@2026',
  },
  {
    codePatterns: ['STORE-VASTRAPUR', 'VASTRAPUR'],
    nameKeyword: 'Vastrapur',
    loginId: 'womupVastrapur',
    password: 'Vastrapur@2026',
  },
  {
    codePatterns: ['STORE-PRAHLAD_NAGAR', 'PRAHLAD_NAGAR', 'PRAHLAD NAGAR'],
    nameKeyword: 'Prahlad Nagar',
    loginId: 'womupPrahladNagar',
    password: 'Prahlad@2026',
  },
  {
    codePatterns: ['STORE-SATELLITE', 'SATELLITE'],
    nameKeyword: 'Satellite',
    loginId: 'womupSatellite',
    password: 'Satellite@2026',
  },
  {
    codePatterns: ['STORE-NAVRANGPURA', 'NAVRANGPURA'],
    nameKeyword: 'Navrangpura',
    loginId: 'womupNavrangpura',
    password: 'Navrangpura@2026',
  },
];

async function generateLogins() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';
  const client = await MongoClient.connect(uri);
  const db = client.db('wormup');

  console.log('Connected to MongoDB. Generating store logins...\n');

  const allStores = await db.collection('stores').find({}).toArray();
  console.log(`Found ${allStores.length} total stores in database:\n`);

  for (const store of allStores) {
    // Match configuration
    const config = STORE_CONFIGS.find(c => 
      c.codePatterns.some(p => store.code && store.code.toUpperCase().includes(p.toUpperCase())) ||
      (store.name && store.name.toLowerCase().includes(c.nameKeyword.toLowerCase()))
    );

    const loginId = config ? config.loginId : `womup_${(store.code || store.name).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const password = config ? config.password : 'Store@2026';

    const hash = await bcrypt.hash(password, 10);

    await db.collection('stores').updateOne(
      { _id: store._id },
      {
        $set: {
          loginId: loginId.trim(),
          loginPasswordHash: hash,
          passwordUpdatedAt: new Date(),
        }
      }
    );

    console.log(`✅ [${store.code || 'NO_CODE'}] ${store.name}`);
    console.log(`   ID: ${loginId}`);
    console.log(`   Password: ${password}\n`);
  }

  // Create unique index on loginId
  try {
    await db.collection('stores').createIndex({ loginId: 1 }, { unique: true, sparse: true });
    console.log('✅ Unique index on stores.loginId created successfully.');
  } catch (idxErr) {
    console.warn('Index notice:', idxErr.message);
  }

  await client.close();
  console.log('🎉 Store logins generated successfully!');
}

generateLogins().catch(err => {
  console.error('Error generating store logins:', err);
  process.exit(1);
});
