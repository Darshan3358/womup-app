const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function seedAdminCustomerUser() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const addressesColl = db.collection('addresses');

  const rootAdmin = await usersColl.findOne({
    $or: [{ isCompanyAccount: true }, { referralCode: 'WORMUP001' }, { role: 'ADMIN' }]
  });

  if (!rootAdmin) {
    console.error('Root admin account not found!');
    process.exit(1);
  }

  const adminCustomerData = {
    name: 'Womup Admin',
    firstName: 'Womup',
    surname: 'Admin',
    email: 'admin@wormup.com',
    phone: '9999999999',
    authProvider: 'MOBILE',
    role: 'CUSTOMER',
    sponsorId: rootAdmin._id,
    sponsorCode: rootAdmin.referralCode || 'WORMUP001',
    sponsorName: rootAdmin.name || 'WormUp Company Root',
    referralCode: 'WORMADMIN',
    customerCode: 'WORMADMIN',
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
    isPhoneVerified: true,
    isEmailVerified: true,
    shoppingCoins: 2000,
    walletBalance: 2000,
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
    $or: [{ email: 'admin@wormup.com' }, { phone: '9999999999' }, { referralCode: 'WORMADMIN' }]
  });

  let userId;
  if (existing) {
    await usersColl.updateOne(
      { _id: existing._id },
      { $set: adminCustomerData }
    );
    userId = existing._id;
  } else {
    adminCustomerData.createdAt = new Date();
    const insertRes = await usersColl.insertOne(adminCustomerData);
    userId = insertRes.insertedId;
  }

  await usersColl.updateOne(
    { _id: rootAdmin._id },
    {
      $addToSet: { directReferrals: userId },
      $inc: { referredUsersCount: existing ? 0 : 1, leftChildCount: existing ? 0 : 1 }
    }
  );

  const existingAddress = await addressesColl.findOne({ userId });
  if (!existingAddress) {
    await addressesColl.insertOne({
      userId,
      label: 'Office / Admin HQ',
      houseNumber: 'Office 101, Womup HQ',
      street: 'Chandlodia Main Road',
      landmark: 'Chandlodia',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382481',
      location: {
        type: 'Point',
        coordinates: [72.5507, 23.1288]
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log('✅ Admin Customer User successfully configured with ID:', userId);
  process.exit(0);
}

seedAdminCustomerUser().catch(e => { console.error(e); process.exit(1); });
