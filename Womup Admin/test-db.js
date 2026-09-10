const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

async function testConnection() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB!");
    const db = client.db('wormup');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(` - ${col.name}: ${count} documents`);
    }
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.close();
  }
}

testConnection();
