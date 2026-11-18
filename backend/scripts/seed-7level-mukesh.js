const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed7LevelMukesh() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const usersColl = db.collection('users');
  const ordersColl = db.collection('orders');
  const vendorTxColl = db.collection('vendor_transactions');

  // 1. Locate Mukesh Thanki
  const mukesh = await usersColl.findOne({ email: 'mukeshthanki10@gmail.com' });
  if (!mukesh) {
    console.error('❌ User mukeshthanki10@gmail.com not found!');
    process.exit(1);
  }

  console.log(`Found Mukesh Thanki (ID: ${mukesh._id}, Code: ${mukesh.referralCode})`);

  // Update Mukesh to KYC Verified & Active with ₹2000 monthly purchase
  const mukeshVeg = 1150;
  const mukeshOther = 850;
  await usersColl.updateOne(
    { _id: mukesh._id },
    {
      $set: {
        verificationStatus: 'VERIFIED',
        customerKycStatus: 2,
        kycStatus: 'Verified',
        customerIsVerify: 1,
        aadhaarVerified: true,
        isActive: true,
        monthlyPurchaseValue: 2000,
        monthlyVegetablePurchase: mukeshVeg,
        monthlyOtherPurchase: mukeshOther,
        updatedAt: new Date(),
      },
    }
  );

  // Seed Mukesh's orders if not already present
  const existingMukeshOrder = await ordersColl.findOne({ userId: mukesh._id });
  if (!existingMukeshOrder) {
    await ordersColl.insertOne({
      orderNumber: `ORD${Date.now().toString().slice(-6)}M1`,
      userId: mukesh._id,
      status: 'DELIVERED',
      itemSubtotal: mukeshVeg,
      totalAmount: mukeshVeg,
      coinsUsed: 50,
      coinsDiscount: 50,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      updatedAt: new Date(),
    });
    await vendorTxColl.insertOne({
      orderNumber: `OFF${Date.now().toString().slice(-6)}M2`,
      customerId: mukesh._id,
      customerPhone: mukesh.phone,
      vendorName: 'Shreeji Supermarket (Local Partner)',
      billAmount: mukeshOther,
      coinsUsed: 25,
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      updatedAt: new Date(),
    });
  }
  console.log('✅ Mukesh Thanki updated with KYC Verified, Active, and ₹2,000 purchase (Veg: ₹1150, Other: ₹850)');

  // 2. Define 7 Levels structure
  // Level 1: 5 users (Direct referrals of Mukesh)
  // Level 2: 3 users
  // Level 3: 2 users
  // Level 4: 2 users
  // Level 5: 2 users
  // Level 6: 2 users
  // Level 7: 2 users
  const levelDefinitions = [
    {
      level: 1,
      users: [
        { name: 'Aarav Patel', phone: '9825100001', email: 'aarav.patel@womup.com', code: 'WOMMK101' },
        { name: 'Pooja Shah', phone: '9825100002', email: 'pooja.shah@womup.com', code: 'WOMMK102' },
        { name: 'Rohan Mehta', phone: '9825100003', email: 'rohan.mehta@womup.com', code: 'WOMMK103' },
        { name: 'Neha Joshi', phone: '9825100004', email: 'neha.joshi@womup.com', code: 'WOMMK104' },
        { name: 'Vikram Rathod', phone: '9825100005', email: 'vikram.rathod@womup.com', code: 'WOMMK105' },
      ],
    },
    {
      level: 2,
      users: [
        { name: 'Karan Desai', phone: '9825200001', email: 'karan.desai@womup.com', code: 'WOMMK201' },
        { name: 'Ananya Verma', phone: '9825200002', email: 'ananya.verma@womup.com', code: 'WOMMK202' },
        { name: 'Siddharth Trivedi', phone: '9825200003', email: 'siddharth.trivedi@womup.com', code: 'WOMMK203' },
      ],
    },
    {
      level: 3,
      users: [
        { name: 'Divya Pandya', phone: '9825300001', email: 'divya.pandya@womup.com', code: 'WOMMK301' },
        { name: 'Amit Chawla', phone: '9825300002', email: 'amit.chawla@womup.com', code: 'WOMMK302' },
      ],
    },
    {
      level: 4,
      users: [
        { name: 'Ritu Nair', phone: '9825400001', email: 'ritu.nair@womup.com', code: 'WOMMK401' },
        { name: 'Suresh Iyer', phone: '9825400002', email: 'suresh.iyer@womup.com', code: 'WOMMK402' },
      ],
    },
    {
      level: 5,
      users: [
        { name: 'Manish Solanki', phone: '9825500001', email: 'manish.solanki@womup.com', code: 'WOMMK501' },
        { name: 'Kavita Dave', phone: '9825500002', email: 'kavita.dave@womup.com', code: 'WOMMK502' },
      ],
    },
    {
      level: 6,
      users: [
        { name: 'Harshil Bhatt', phone: '9825600001', email: 'harshil.bhatt@womup.com', code: 'WOMMK601' },
        { name: 'Deepika Roy', phone: '9825600002', email: 'deepika.roy@womup.com', code: 'WOMMK602' },
      ],
    },
    {
      level: 7,
      users: [
        { name: 'Rajesh Goswami', phone: '9825700001', email: 'rajesh.goswami@womup.com', code: 'WOMMK701' },
        { name: 'Bhavna Barot', phone: '9825700002', email: 'bhavna.barot@womup.com', code: 'WOMMK702' },
      ],
    },
  ];

  let currentParentId = mukesh._id;
  let currentParentCode = mukesh.referralCode || 'WOM41314';
  let currentParentName = mukesh.name || 'Mukesh Thanki';

  const createdByLevel = {};

  for (const lvlDef of levelDefinitions) {
    const lvlNum = lvlDef.level;
    createdByLevel[lvlNum] = [];

    console.log(`\n--- Processing Level ${lvlNum} (${lvlDef.users.length} members) ---`);

    for (let i = 0; i < lvlDef.users.length; i++) {
      const uInfo = lvlDef.users[i];

      // Random split of ₹2,000 between Veg and Other
      // e.g. Veg between 800 and 1300 in steps of 50
      const vegSplit = 800 + Math.floor(Math.random() * 11) * 50; // 800 to 1300
      const otherSplit = 2000 - vegSplit; // 700 to 1200

      const userData = {
        name: uInfo.name,
        fullName: uInfo.name,
        fullNameAsPerAadhaar: uInfo.name,
        email: uInfo.email,
        phone: uInfo.phone,
        phoneNumber: `+91${uInfo.phone}`,
        phoneVerified: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        authProvider: 'MOBILE',
        role: 'CUSTOMER',
        referralCode: uInfo.code,
        customerCode: uInfo.code,
        sponsorId: currentParentId,
        sponsorCode: currentParentCode,
        sponsorName: currentParentName,
        referredBy: currentParentId,
        parentId: currentParentId,
        level: lvlNum,
        city: 'Ahmedabad',
        registrationCity: 'Ahmedabad',
        registrationPincode: '380059',
        verificationStatus: 'VERIFIED',
        customerKycStatus: 2,
        kycStatus: 'Verified',
        customerIsVerify: 1,
        aadhaarVerified: true,
        isActive: true,
        isIncomeEligible: true,
        monthlyPurchaseValue: 2000,
        monthlyVegetablePurchase: vegSplit,
        monthlyOtherPurchase: otherSplit,
        shoppingCoins: 2000,
        walletBalance: 0,
        appDownloadIncome: 0,
        pendingIncome: 0,
        availableIncome: 0,
        directReferrals: [],
        referredUsersCount: 0,
        verifiedReferralsCount: 0,
        updatedAt: new Date(),
      };

      let existing = await usersColl.findOne({
        $or: [{ phone: uInfo.phone }, { email: uInfo.email }, { referralCode: uInfo.code }],
      });

      let userId;
      if (existing) {
        await usersColl.updateOne({ _id: existing._id }, { $set: userData });
        userId = existing._id;
      } else {
        userData.createdAt = new Date(Date.now() - (8 - lvlNum) * 24 * 3600 * 1000);
        const ins = await usersColl.insertOne(userData);
        userId = ins.insertedId;
      }

      createdByLevel[lvlNum].push({ id: userId, code: uInfo.code, name: uInfo.name, phone: uInfo.phone });
      console.log(`  + Member: ${uInfo.name} (${uInfo.code}) | Veg: ₹${vegSplit}, Other: ₹${otherSplit} | Sponsor: ${currentParentCode}`);

      // Seed Home Delivery and Offline Store orders for this user
      // 1. Home Delivery order (Delivered)
      const existingHomeOrder = await ordersColl.findOne({ userId, orderType: 'HOME_DELIVERY' });
      if (!existingHomeOrder) {
        await ordersColl.insertOne({
          orderNumber: `ORD${Date.now().toString().slice(-6)}${lvlNum}${i}H`,
          userId,
          status: 'DELIVERED',
          orderType: 'HOME_DELIVERY',
          itemSubtotal: vegSplit,
          totalAmount: vegSplit,
          coinsUsed: Math.floor(Math.random() * 5) * 10 + 10, // 10 to 50 coins
          coinsDiscount: 30,
          paymentMethod: 'COD',
          paymentStatus: 'PAID',
          createdAt: new Date(Date.now() - (7 - lvlNum) * 24 * 3600 * 1000),
          updatedAt: new Date(),
        });
      }

      // 2. Offline Store transaction (Completed/Success)
      const existingOfflineOrder = await vendorTxColl.findOne({ customerId: userId });
      if (!existingOfflineOrder) {
        await vendorTxColl.insertOne({
          orderNumber: `OFF${Date.now().toString().slice(-6)}${lvlNum}${i}S`,
          customerId: userId,
          customerPhone: uInfo.phone,
          vendorName: i % 2 === 0 ? 'Wom Up Mart Partner (Thaltej)' : 'Ambica Kirana & Fresh (Ahmedabad)',
          billAmount: otherSplit,
          coinsUsed: Math.floor(Math.random() * 4) * 10 + 10, // 10 to 40 coins
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - (7 - lvlNum) * 24 * 3600 * 1000 + 3600000),
          updatedAt: new Date(),
        });
      }
    }

    // Next level's parent becomes the first member of this level (tree chain)
    currentParentId = createdByLevel[lvlNum][0].id;
    currentParentCode = createdByLevel[lvlNum][0].code;
    currentParentName = createdByLevel[lvlNum][0].name;
  }

  // 3. Update directReferrals arrays on parent users
  // Level 1 members belong to Mukesh
  const l1Ids = createdByLevel[1].map((u) => u.id);
  await usersColl.updateOne(
    { _id: mukesh._id },
    {
      $set: {
        directReferrals: l1Ids,
        referredUsersCount: l1Ids.length,
        verifiedReferralsCount: l1Ids.length,
        teamSize: Object.values(createdByLevel).reduce((sum, list) => sum + list.length, 0),
        direct5ActiveCount: l1Ids.length,
      },
    }
  );

  // Update directReferrals for Level 1 to 6 first members who sponsor the next levels
  for (let lvl = 1; lvl <= 6; lvl++) {
    const parent = createdByLevel[lvl][0];
    const childIds = createdByLevel[lvl + 1].map((u) => u.id);
    await usersColl.updateOne(
      { _id: parent.id },
      {
        $set: {
          directReferrals: childIds,
          referredUsersCount: childIds.length,
          verifiedReferralsCount: childIds.length,
        },
      }
    );
  }

  console.log('\n======================================================');
  console.log('🎉 7-LEVEL DOWNLINE & ACTIVE SEEDING COMPLETE FOR:');
  console.log(`User: Mukesh Thanki (${mukesh.email})`);
  console.log(`Referral Code: ${mukesh.referralCode}`);
  console.log(`Total Downline Members: ${Object.values(createdByLevel).reduce((sum, list) => sum + list.length, 0)} across 7 Levels`);
  console.log('Every single user: KYC Approved (Verified) + ₹2,000 Purchase (Veg + Other) + Real Orders & Points');
  console.log('======================================================\n');

  process.exit(0);
}

seed7LevelMukesh().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

