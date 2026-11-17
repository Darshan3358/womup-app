const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function seed3LevelUsers() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const walletsColl = db.collection('wallets');
  const addressesColl = db.collection('addresses');
  const incomeTxColl = db.collection('incometransactions');
  const coinTxColl = db.collection('cointransactions');

  // Find root admin as top sponsor for Level 1 user
  const rootAdmin = await usersColl.findOne({
    $or: [{ isCompanyAccount: true }, { referralCode: 'WORMUP001' }, { role: 'ADMIN' }]
  });

  const rootAdminId = rootAdmin ? rootAdmin._id : null;
  const rootAdminCode = rootAdmin ? (rootAdmin.referralCode || 'WORMUP001') : 'WORMUP001';

  // Level 1 User definition
  const u1Data = {
    name: 'Test User Level 1',
    firstName: 'User',
    surname: 'Level 1',
    email: 'user.level1@womup.com',
    phone: '9876500001',
    phoneNumber: '+919876500001',
    authProvider: 'MOBILE',
    role: 'CUSTOMER',
    sponsorId: rootAdminId,
    sponsorCode: rootAdminCode,
    sponsorName: 'WomUp Root',
    referredBy: rootAdminId,
    referralCode: 'WOMLEVEL1',
    customerCode: 'WOMLEVEL1',
    customerPincode: '382481',
    city: 'Ahmedabad',
    state: 'Gujarat',
    countryId: 'IN',
    isIncomeEligible: true,
    isActive: true,
    customerKycStatus: 2,
    kycStatus: 'Verified',
    customerIsVerify: 1,
    verificationStatus: 'VERIFIED',
    aadhaarVerified: true,
    phoneVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    shoppingCoins: 2000,
    walletBalance: 0,
    availableIncome: 0,
    pendingIncome: 0,
    appDownloadIncome: 0,
    level: 1,
    leftChildCount: 0,
    rightChildCount: 0,
    directReferrals: [],
    referredUsersCount: 0,
    verifiedReferralsCount: 0,
    updatedAt: new Date()
  };

  // 1. Upsert User 1
  let u1 = await usersColl.findOne({ phone: u1Data.phone });
  let u1Id;
  if (u1) {
    await usersColl.updateOne({ _id: u1._id }, { $set: u1Data });
    u1Id = u1._id;
  } else {
    u1Data.createdAt = new Date();
    const r1 = await usersColl.insertOne(u1Data);
    u1Id = r1.insertedId;
  }
  console.log(`✅ Level 1 User Ready (Phone: ${u1Data.phone}, ID: ${u1Id})`);

  // Level 2 User definition (referred by User 1)
  const u2Data = {
    name: 'Test User Level 2',
    firstName: 'User',
    surname: 'Level 2',
    email: 'user.level2@womup.com',
    phone: '9876500002',
    phoneNumber: '+919876500002',
    authProvider: 'MOBILE',
    role: 'CUSTOMER',
    sponsorId: u1Id,
    sponsorCode: 'WOMLEVEL1',
    sponsorName: 'Test User Level 1',
    referredBy: u1Id,
    referralCode: 'WOMLEVEL2',
    customerCode: 'WOMLEVEL2',
    customerPincode: '382481',
    city: 'Ahmedabad',
    state: 'Gujarat',
    countryId: 'IN',
    isIncomeEligible: true,
    isActive: true,
    customerKycStatus: 2,
    kycStatus: 'Verified',
    customerIsVerify: 1,
    verificationStatus: 'VERIFIED',
    aadhaarVerified: true,
    phoneVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    shoppingCoins: 2000,
    walletBalance: 0,
    availableIncome: 0,
    pendingIncome: 0,
    appDownloadIncome: 0,
    level: 2,
    leftChildCount: 0,
    rightChildCount: 0,
    directReferrals: [],
    referredUsersCount: 0,
    verifiedReferralsCount: 0,
    updatedAt: new Date()
  };

  // 2. Upsert User 2
  let u2 = await usersColl.findOne({ phone: u2Data.phone });
  let u2Id;
  if (u2) {
    await usersColl.updateOne({ _id: u2._id }, { $set: u2Data });
    u2Id = u2._id;
  } else {
    u2Data.createdAt = new Date();
    const r2 = await usersColl.insertOne(u2Data);
    u2Id = r2.insertedId;
  }
  console.log(`✅ Level 2 User Ready (Phone: ${u2Data.phone}, ID: ${u2Id})`);

  // Level 3 User definition (referred by User 2)
  const u3Data = {
    name: 'Test User Level 3',
    firstName: 'User',
    surname: 'Level 3',
    email: 'user.level3@womup.com',
    phone: '9876500003',
    phoneNumber: '+919876500003',
    authProvider: 'MOBILE',
    role: 'CUSTOMER',
    sponsorId: u2Id,
    sponsorCode: 'WOMLEVEL2',
    sponsorName: 'Test User Level 2',
    referredBy: u2Id,
    referralCode: 'WOMLEVEL3',
    customerCode: 'WOMLEVEL3',
    customerPincode: '382481',
    city: 'Ahmedabad',
    state: 'Gujarat',
    countryId: 'IN',
    isIncomeEligible: true,
    isActive: true,
    customerKycStatus: 2,
    kycStatus: 'Verified',
    customerIsVerify: 1,
    verificationStatus: 'VERIFIED',
    aadhaarVerified: true,
    phoneVerified: true,
    isPhoneVerified: true,
    isEmailVerified: true,
    shoppingCoins: 2000,
    walletBalance: 0,
    availableIncome: 0,
    pendingIncome: 0,
    appDownloadIncome: 0,
    level: 3,
    leftChildCount: 0,
    rightChildCount: 0,
    directReferrals: [],
    referredUsersCount: 0,
    verifiedReferralsCount: 0,
    updatedAt: new Date()
  };

  // 3. Upsert User 3
  let u3 = await usersColl.findOne({ phone: u3Data.phone });
  let u3Id;
  if (u3) {
    await usersColl.updateOne({ _id: u3._id }, { $set: u3Data });
    u3Id = u3._id;
  } else {
    u3Data.createdAt = new Date();
    const r3 = await usersColl.insertOne(u3Data);
    u3Id = r3.insertedId;
  }
  console.log(`✅ Level 3 User Ready (Phone: ${u3Data.phone}, ID: ${u3Id})`);

  // Update direct referral links & counts in parent users
  await usersColl.updateOne(
    { _id: u1Id },
    {
      $addToSet: { directReferrals: u2Id },
      $set: { referredUsersCount: 1, verifiedReferralsCount: 1 }
    }
  );

  await usersColl.updateOne(
    { _id: u2Id },
    {
      $addToSet: { directReferrals: u3Id },
      $set: { referredUsersCount: 1, verifiedReferralsCount: 1 }
    }
  );

  // Clean old test transactions for these 3 test users to provide a fresh state
  const testIds = [u1Id, u2Id, u3Id];
  await incomeTxColl.deleteMany({ userId: { $in: testIds } });
  await coinTxColl.deleteMany({ userId: { $in: testIds } });

  // ── Setup MLM Rewards according to the matrix:
  // Level 1 reward: ₹20 + 400 coins
  // Level 2 reward: ₹10 + 300 coins
  // Level 3 reward: ₹5  + 200 coins

  // 1. User 1 gets Level 1 rewards from User 2 (₹20 pending + 400 coins instant)
  await incomeTxColl.insertOne({
    userId: u1Id,
    type: 'APP_DOWNLOAD',
    amount: 20,
    status: 'PENDING',
    isUsable: false,
    sourceUserId: u2Id,
    level: 1,
    description: 'Level 1 App Download KYC Income from Test User Level 2 (Queued for 12:00 AM Cron)',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await coinTxColl.insertOne({
    userId: u1Id,
    amount: 400,
    type: 'CREDIT',
    description: 'Level 1 Referral Coin Reward from Test User Level 2',
    createdAt: new Date()
  });

  // 2. User 1 gets Level 2 rewards from User 3 (₹10 pending + 300 coins instant)
  await incomeTxColl.insertOne({
    userId: u1Id,
    type: 'APP_DOWNLOAD',
    amount: 10,
    status: 'PENDING',
    isUsable: false,
    sourceUserId: u3Id,
    level: 2,
    description: 'Level 2 App Download KYC Income from Test User Level 3 (Queued for 12:00 AM Cron)',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await coinTxColl.insertOne({
    userId: u1Id,
    amount: 300,
    type: 'CREDIT',
    description: 'Level 2 Referral Coin Reward from Test User Level 3',
    createdAt: new Date()
  });

  // 3. User 2 gets Level 1 rewards from User 3 (₹20 pending + 400 coins instant)
  await incomeTxColl.insertOne({
    userId: u2Id,
    type: 'APP_DOWNLOAD',
    amount: 20,
    status: 'PENDING',
    isUsable: false,
    sourceUserId: u3Id,
    level: 1,
    description: 'Level 1 App Download KYC Income from Test User Level 3 (Queued for 12:00 AM Cron)',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await coinTxColl.insertOne({
    userId: u2Id,
    amount: 400,
    type: 'CREDIT',
    description: 'Level 1 Referral Coin Reward from Test User Level 3',
    createdAt: new Date()
  });

  // Update user balances:
  // User 1: Pending Income = ₹30 (₹20 + ₹10), Shopping Coins = 2000 (Welcome) + 400 + 300 = 2700 SC
  await usersColl.updateOne(
    { _id: u1Id },
    { $set: { pendingIncome: 30, availableIncome: 0, walletBalance: 0, shoppingCoins: 2700 } }
  );

  // User 2: Pending Income = ₹20, Shopping Coins = 2000 (Welcome) + 400 = 2400 SC
  await usersColl.updateOne(
    { _id: u2Id },
    { $set: { pendingIncome: 20, availableIncome: 0, walletBalance: 0, shoppingCoins: 2400 } }
  );

  // User 3: Pending Income = 0, Shopping Coins = 2000 SC
  await usersColl.updateOne(
    { _id: u3Id },
    { $set: { pendingIncome: 0, availableIncome: 0, walletBalance: 0, shoppingCoins: 2000 } }
  );

  // Ensure wallet collection documents are updated
  await walletsColl.updateOne(
    { userId: u1Id },
    { $set: { userId: u1Id, pendingIncome: 30, balance: 0, shoppingCoins: 2700, updatedAt: new Date() } },
    { upsert: true }
  );
  await walletsColl.updateOne(
    { userId: u2Id },
    { $set: { userId: u2Id, pendingIncome: 20, balance: 0, shoppingCoins: 2400, updatedAt: new Date() } },
    { upsert: true }
  );
  await walletsColl.updateOne(
    { userId: u3Id },
    { $set: { userId: u3Id, pendingIncome: 0, balance: 0, shoppingCoins: 2000, updatedAt: new Date() } },
    { upsert: true }
  );

  // Add default saved addresses for all 3 users
  const addresses = [
    {
      userId: u1Id,
      label: 'Home - Level 1',
      houseFlat: 'Flat 101, Block A',
      street: 'Shagun Heights, SG Highway',
      area: 'Tragad',
      landmark: 'Near Nirma University',
      city: 'Ahmedabad',
      pincode: '382481'
    },
    {
      userId: u2Id,
      label: 'Home - Level 2',
      houseFlat: 'Flat 202, Block B',
      street: 'Shagun Green, SG Highway',
      area: 'Tragad',
      landmark: 'Opposite Dark Store',
      city: 'Ahmedabad',
      pincode: '382481'
    },
    {
      userId: u3Id,
      label: 'Home - Level 3',
      houseFlat: 'Flat 303, Block C',
      street: 'Shagun Residency, SG Highway',
      area: 'Tragad',
      landmark: 'Near SG Highway Cross',
      city: 'Ahmedabad',
      pincode: '382481'
    }
  ];

  for (const addr of addresses) {
    await addressesColl.updateOne(
      { userId: addr.userId },
      {
        $set: {
          ...addr,
          type: 'HOME',
          state: 'Gujarat',
          latitude: 23.1250,
          longitude: 72.5400,
          isDefault: true,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }

  console.log('\n============================================================');
  console.log('🎉 3-LEVEL REFERRAL TEST USERS CREATED & LINKED SUCCESSFULLY');
  console.log('============================================================');
  console.log('📌 USER 1 (Top / Parent):');
  console.log('   - Name: Test User Level 1');
  console.log('   - Phone: 9876500001 (OTP: 123456)');
  console.log('   - Referral Code: WOMLEVEL1');
  console.log('   - Shopping Coins: 2,700 SC (2000 welcome + 400 L1 + 300 L2)');
  console.log('   - Pending Income: ₹30 (₹20 L1 from User 2 + ₹10 L2 from User 3)');
  console.log('------------------------------------------------------------');
  console.log('📌 USER 2 (Middle / Child of User 1):');
  console.log('   - Name: Test User Level 2');
  console.log('   - Phone: 9876500002 (OTP: 123456)');
  console.log('   - Referral Code: WOMLEVEL2 (Sponsor: WOMLEVEL1)');
  console.log('   - Shopping Coins: 2,400 SC (2000 welcome + 400 L1 from User 3)');
  console.log('   - Pending Income: ₹20 (₹20 L1 from User 3)');
  console.log('------------------------------------------------------------');
  console.log('📌 USER 3 (Bottom / Child of User 2):');
  console.log('   - Name: Test User Level 3');
  console.log('   - Phone: 9876500003 (OTP: 123456)');
  console.log('   - Referral Code: WOMLEVEL3 (Sponsor: WOMLEVEL2)');
  console.log('   - Shopping Coins: 2,000 SC (Welcome bonus)');
  console.log('   - Pending Income: ₹0');
  console.log('============================================================\n');

  await mongoose.disconnect();
}

seed3LevelUsers().catch(err => {
  console.error('Failed to seed 3-level users:', err);
  process.exit(1);
});
