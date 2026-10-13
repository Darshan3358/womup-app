import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initialStores, initialProducts, MockStore, MockProduct } from '../seed/mockData.js';

dotenv.config();

export let isMongoConnected = false;

// Hybrid in-memory store for instant fallback / local dev without Mongo daemon
export const inMemoryStore = {
  stores: [...initialStores] as MockStore[],
  products: [...initialProducts] as MockProduct[],
  orders: [] as any[],
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/womup_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection note: ${error.message}`);
    console.log(`🚀 Operating in High-Speed In-Memory & Hybrid Storage Mode (Full CRUD active)`);
  }
};
