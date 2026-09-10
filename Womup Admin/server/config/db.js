const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 15000,
    });
    await client.connect();
    db = client.db('wormup');
    console.log("✅ [MongoDB] Connected successfully to 'wormup' database on cluster0!");
    return db;
  } catch (err) {
    console.error("❌ [MongoDB] Connection error:", err.message);
    throw err;
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

module.exports = {
  connectDB,
  getDB,
  MONGO_URI,
};
