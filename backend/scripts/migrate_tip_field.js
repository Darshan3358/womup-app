const mongoose = require('mongoose');
require('dotenv').config();

async function migrateTipField() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Ensure all orders have tip field (default 0 if missing)
  const orderResult = await db.collection('orders').updateMany(
    { tip: { $exists: false } },
    { $set: { tip: 0 } },
  );
  console.log(`✅ Updated ${orderResult.modifiedCount} orders with tip: 0`);

  // 2. Fix rider settlements to match real order tip and recalculate total
  const settlements = await db.collection('rider_settlements').find({}).toArray();
  let settleCount = 0;
  for (const s of settlements) {
    let realOrderTip = 0;
    if (s.orderId) {
      const order = await db.collection('orders').findOne({ _id: s.orderId });
      if (order && typeof order.tip === 'number') {
        realOrderTip = order.tip;
      }
    }
    const realTotal = (s.basePay || 0) + (s.incentive || 0) + realOrderTip;
    if (s.tip !== realOrderTip || s.total !== realTotal) {
      await db.collection('rider_settlements').updateOne(
        { _id: s._id },
        { $set: { tip: realOrderTip, total: realTotal } },
      );
      settleCount++;
    }
  }
  console.log(`✅ Synchronized ${settleCount} settlements to genuine customer tip`);

  await mongoose.disconnect();
  console.log('Migration completed.');
}

migrateTipField().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
