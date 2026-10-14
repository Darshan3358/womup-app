import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function main() {
  console.log(`Connecting to MongoDB Atlas...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully.\n');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection instance not found.');
  }

  // Target collections to clean up
  const collectionsToClean = [
    { name: 'users', label: 'Users' },
    { name: 'orders', label: 'Customer Orders' },
    { name: 'delivery_partners', label: 'Delivery Boys / Riders' },
    { name: 'delivery_assignments', label: 'Delivery Assignments' },
    { name: 'delivery_locations', label: 'Delivery Locations' },
    { name: 'rider_settlements', label: 'Rider Settlements' },
    { name: 'rider_duty_sessions', label: 'Rider Duty Sessions' },
    { name: 'rider_bank_accounts', label: 'Rider Bank Accounts' },
    { name: 'rider_location_logs', label: 'Rider Location Logs' },
    { name: 'delivery_partner_documents', label: 'Rider Documents' },
    { name: 'order_status_histories', label: 'Order Status Histories' },
    { name: 'income_transactions', label: 'User Income Transactions' },
    { name: 'razorpay_orders', label: 'Razorpay Orders' },
    { name: 'cart', label: 'User Carts' },
    { name: 'carts', label: 'User Carts (Plural)' },
  ];

  console.log('📊 Current Collection Counts:');
  const countsBefore: Record<string, number> = {};

  for (const item of collectionsToClean) {
    try {
      const count = await db.collection(item.name).countDocuments();
      countsBefore[item.name] = count;
      console.log(`  - ${item.label} (${item.name}): ${count} documents`);
    } catch {
      countsBefore[item.name] = 0;
    }
  }

  console.log('\n🗑️  Cleaning / Deleting requested records...');
  for (const item of collectionsToClean) {
    try {
      const result = await db.collection(item.name).deleteMany({});
      console.log(`  ✓ Cleared ${item.label} (${item.name}): ${result.deletedCount} deleted`);
    } catch (err: any) {
      console.log(`  ⚠️ Could not clean ${item.name}: ${err?.message}`);
    }
  }

  console.log('\n🎉 Clean-up completed successfully!');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
