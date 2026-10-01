const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function seedCitiesAndLinkAreas() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('wormup');

  try {
    // 1. Ensure cities collection and indexes
    const citiesCol = db.collection('cities');
    const areasCol = db.collection('areas');
    const storesCol = db.collection('stores');

    await citiesCol.createIndex({ code: 1 }, { unique: true });
    await citiesCol.createIndex({ name: 1 }, { unique: true });

    // 2. Default Cities
    const defaultCities = [
      {
        name: 'Ahmedabad',
        code: 'AHM',
        state: 'Gujarat',
        status: 'Active',
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Surat',
        code: 'SUR',
        state: 'Gujarat',
        status: 'Active',
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Vadodara',
        code: 'BDQ',
        state: 'Gujarat',
        status: 'Active',
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Rajkot',
        code: 'RAJ',
        state: 'Gujarat',
        status: 'Active',
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Gandhinagar',
        code: 'GNR',
        state: 'Gujarat',
        status: 'Active',
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const city of defaultCities) {
      await citiesCol.updateOne(
        { code: city.code },
        {
          $setOnInsert: {
            name: city.name,
            code: city.code,
            state: city.state,
            status: city.status,
            sortOrder: city.sortOrder,
            createdAt: city.createdAt,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
    console.log('✅ Default cities seeded/verified.');

    // Fetch the Ahmedabad city doc
    const ahmedabad = await citiesCol.findOne({ code: 'AHM' });
    if (!ahmedabad) throw new Error('Ahmedabad city not found after upsert');

    // 3. Link all existing areas with cityId
    const areas = await areasCol.find({}).toArray();
    console.log(`Linking ${areas.length} existing areas to City...`);

    for (const area of areas) {
      let targetCity = ahmedabad;
      if (area.city && area.city.toLowerCase() !== 'ahmedabad') {
        const found = await citiesCol.findOne({
          name: { $regex: new RegExp(`^${area.city}$`, 'i') },
        });
        if (found) targetCity = found;
      }

      await areasCol.updateOne(
        { _id: area._id },
        {
          $set: {
            cityId: targetCity._id,
            cityName: targetCity.name,
            city: targetCity.name,
            updatedAt: new Date(),
          },
        }
      );
    }
    console.log('✅ Areas linked to City.');

    // 4. Link existing stores with cityId and area details
    const stores = await storesCol.find({}).toArray();
    console.log(`Checking ${stores.length} existing stores...`);

    for (const store of stores) {
      let matchedArea = null;
      if (store.areaId) {
        matchedArea = await areasCol.findOne({ _id: new ObjectId(store.areaId.toString()) });
      } else {
        // Try matching area by name keywords
        for (const area of areas) {
          if (store.name.toLowerCase().includes(area.name.toLowerCase())) {
            matchedArea = area;
            break;
          }
        }
      }

      const updates = {
        cityId: ahmedabad._id,
        cityName: ahmedabad.name,
        updatedAt: new Date(),
      };

      if (matchedArea) {
        updates.areaId = matchedArea._id;
        updates.areaName = matchedArea.name;
      }

      await storesCol.updateOne({ _id: store._id }, { $set: updates });
    }
    console.log('✅ Stores updated with cityId and area linkage.');

    // 5. Verification summary
    const totalCities = await citiesCol.countDocuments({});
    const totalAreas = await areasCol.countDocuments({});
    const totalStores = await storesCol.countDocuments({});
    const areasWithCity = await areasCol.countDocuments({ cityId: { $exists: true } });
    const storesWithArea = await storesCol.countDocuments({ areaId: { $exists: true } });

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Total Cities in DB: ${totalCities}`);
    console.log(`Total Areas in DB: ${totalAreas} (Linked to City: ${areasWithCity})`);
    console.log(`Total Stores in DB: ${totalStores} (Linked to Area: ${storesWithArea})`);
    console.log('----------------------------\n');
  } finally {
    await client.close();
  }
}

seedCitiesAndLinkAreas().catch(console.error);
