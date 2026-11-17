const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function seedTestCustomer() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const addressesColl = db.collection('addresses');
  const walletsColl = db.collection('wallets');

  const rootAdmin = await usersColl.findOne({
    $or: [{ isCompanyAccount: true }, { referralCode: 'WORMUP001' }, { role: 'ADMIN' }]
  });

  const testPhone = '9876543210';
  const testEmail = 'test.customer@womup.com';

  const testCustomerData = {
    name: 'Test Customer',
    firstName: 'Test',
    surname: 'Customer',
    email: testEmail,
    phone: testPhone,
    phoneNumber: `+91${testPhone}`,
    authProvider: 'MOBILE',
    role: 'CUSTOMER',
    sponsorId: rootAdmin ? rootAdmin._id : null,
    sponsorCode: rootAdmin ? (rootAdmin.referralCode || 'WORMUP001') : 'WORMUP001',
    sponsorName: rootAdmin ? (rootAdmin.name || 'WormUp Company') : 'WormUp Company',
    referralCode: 'WOMTEST01',
    customerCode: 'WOMTEST01',
    customerPincode: '382481',
    customerPin: '382481',
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
    walletBalance: 500,
    availableIncome: 500,
    pendingIncome: 0,
    appDownloadIncome: 100,
    level: 1,
    leftChildCount: 0,
    rightChildCount: 0,
    directReferrals: [],
    referredUsersCount: 0,
    verifiedReferralsCount: 0,
    wishlist: [],
    notificationPrefs: {
      orderUpdates: true,
      promotions: true,
      whatsappInvoices: true,
      emailReceipts: true,
      dndEnabled: false
    },
    updatedAt: new Date()
  };

  const existing = await usersColl.findOne({
    $or: [{ phone: testPhone }, { phoneNumber: `+91${testPhone}` }, { email: testEmail }]
  });

  let userId;
  if (existing) {
    await usersColl.updateOne(
      { _id: existing._id },
      { $set: testCustomerData }
    );
    userId = existing._id;
    console.log(`Updated existing test customer user: ${userId}`);
  } else {
    testCustomerData.createdAt = new Date();
    const insertRes = await usersColl.insertOne(testCustomerData);
    userId = insertRes.insertedId;
    console.log(`Created new test customer user: ${userId}`);
  }

  // Ensure wallet document exists
  await walletsColl.updateOne(
    { userId },
    {
      $set: {
        userId,
        balance: 500,
        shoppingCoins: 2000,
        availableIncome: 500,
        pendingIncome: 0,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  // Ensure default address exists
  const existingAddress = await addressesColl.findOne({ userId });
  if (!existingAddress) {
    await addressesColl.insertOne({
      userId,
      label: 'Home',
      type: 'HOME',
      houseFlat: 'Flat 402, Block B',
      street: 'Shagun Residency, SG Highway',
      area: 'Tragad',
      landmark: 'Near Nirma University',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382481',
      latitude: 23.1250,
      longitude: 72.5400,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created default test address in Tragad / Ahmedabad.');
  }

  console.log('\n=========================================');
  console.log('✅ TEST CUSTOMER USER READY:');
  console.log(`- Name: ${testCustomerData.name}`);
  console.log(`- Phone: ${testCustomerData.phone}`);
  console.log(`- Verification Code (OTP): 123456`);
  console.log(`- Shopping Coins: ${testCustomerData.shoppingCoins} SC`);
  console.log(`- Wallet Balance: ₹${testCustomerData.walletBalance}`);
  console.log(`- Referral Code: ${testCustomerData.referralCode}`);
  console.log(`- KYC Status: ${testCustomerData.kycStatus}`);
  console.log('=========================================\n');

  await mongoose.disconnect();
}

seedTestCustomer().catch(err => {
  console.error('Failed to seed test customer:', err);
  process.exit(1);
});

