/**
 * Safe Database Migration Script: WORM/WOMUP -> WOM
 * 
 * 1. Root / Super Admin: WOM001 (was WORMUP001 / WOMUP001)
 * 2. Downline users of Root: sponsorCode -> WOM001
 * 3. Users: referralCode & customerCode starting with WORM -> WOM
 * 4. Preserves MLM tree integrity (sponsorId ObjectIds are untouched)
 */
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function migrate() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Update Company Root
  const r1 = await db.collection('users').updateOne(
    { email: 'root@wormup.com' },
    { $set: { referralCode: 'WOM001', customerCode: 'WOM001', sponsorCode: 'WOM001' } }
  );
  console.log('Updated root@wormup.com to WOM001:', r1.modifiedCount);

  // 2. Update users whose sponsorCode is WOMUP001 or WORMUP001
  const r2 = await db.collection('users').updateMany(
    { sponsorCode: { $in: ['WOMUP001', 'WORMUP001'] } },
    { $set: { sponsorCode: 'WOM001' } }
  );
  console.log('Updated downline users with sponsorCode WOM001:', r2.modifiedCount);

  // 3. Migrate any remaining WORM* codes
  const users = await db.collection('users').find({}).toArray();
  for (const user of users) {
    const updates = {};
    if (user.referralCode && user.referralCode.startsWith('WORM')) {
      updates.referralCode = user.referralCode.replace(/^WORM/, 'WOM');
    }
    if (user.customerCode && user.customerCode.startsWith('WORM')) {
      updates.customerCode = user.customerCode.replace(/^WORM/, 'WOM');
    }
    if (user.sponsorCode && user.sponsorCode.startsWith('WORM')) {
      updates.sponsorCode = user.sponsorCode.replace(/^WORM/, 'WOM');
    }
    if (Object.keys(updates).length > 0) {
      console.log(`➡️ Updating user ${user.name} (${user.email}):`, updates);
      await db.collection('users').updateOne({ _id: user._id }, { $set: updates });
    }
  }

  // 4. Verify MLM tree integrity
  console.log('\n🌳 Current Verified Users in MongoDB Atlas:');
  const verifiedUsers = await db.collection('users').find({}).toArray();
  for (const u of verifiedUsers) {
    console.log(`User: ${u.name} | Ref: ${u.referralCode} | Cust: ${u.customerCode} | SponsorCode: ${u.sponsorCode} | SponsorId: ${u.sponsorId || 'None (ROOT)'}`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 Migration & Verification Completed Successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
