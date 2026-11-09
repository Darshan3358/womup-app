const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

async function seedTestRider() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const partnersColl = db.collection('delivery_partners');
  const storesColl = db.collection('stores');

  // Find a store in Ahmedabad to link hub
  const store = await storesColl.findOne({ city: 'Ahmedabad' });
  const hubId = store ? store._id : null;
  const hubName = store ? (store.name || 'Satellite Hub Dark Store') : 'Satellite Hub Dark Store';

  const testEmail = 'testrider@womup.com';
  const testPhone = '9898001122';
  const testPassword = 'rider123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Check or create User
  let user = await usersColl.findOne({ email: testEmail });
  if (!user) {
    const userRes = await usersColl.insertOne({
      name: 'Test Rider',
      email: testEmail,
      phone: `+91${testPhone}`,
      role: 'DELIVERY_PARTNER',
      password: hashedPassword,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    user = { _id: userRes.insertedId };
    console.log('Created User record:', user._id);
  } else {
    await usersColl.updateOne(
      { _id: user._id },
      {
        $set: {
          name: 'Test Rider',
          role: 'DELIVERY_PARTNER',
          password: hashedPassword,
          isActive: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log('Updated existing User record:', user._id);
  }

  // Check or create Delivery Partner
  const partnerData = {
    userId: user._id,
    partnerCode: 'RDR777',
    riderCode: 'RDR777',
    fullName: 'Test Rider',
    phoneNumber: testPhone,
    mobile: testPhone,
    email: testEmail,
    emailVerified: true,
    passwordHash: hashedPassword,
    city: 'Ahmedabad',
    cityName: 'Ahmedabad',
    hubId: hubId,
    hubName: hubName,
    status: 'APPROVED',
    verificationStatus: 'VERIFIED',
    isActive: true,
    isOnline: false,
    isAvailable: true,
    isBlocked: false,
    isSuspended: false,
    vehicleType: 'BIKE',
    vehicleNumber: 'GJ 01 TR 7777',
    drivingLicense: 'GJ0120240007777',
    dlImageUrl: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793960509/wormup/rider/kyc/sfrkp6okptl0ekixptcc.png',
    rating: 5.0,
    averageRating: 5.0,
    totalReviews: 24,
    ratingBreakdown: { five: 22, four: 2, three: 0, two: 0, one: 0 },
    totalDeliveries: 18,
    completedDeliveries: 18,
    cancelledDeliveries: 0,
    acceptanceRate: 98,
    completionRate: 100,
    avgDeliveryMinutes: 11.2,
    onTimeRate: 99.0,
    currentLocation: {
      type: 'Point',
      coordinates: [72.5298, 23.0245],
    },
    locationUpdatedAt: new Date(),
    approvedAt: new Date(),
    approvedBy: 'Admin Root',
    totalEarnings: 1850,
    outstandingCashLimit: 5000,
    currentOutstandingCash: 0,
    totalCodCollected: 0,
    totalOnlineEarnings: 1850,
    isOrderBlocked: false,
    aadharNumber: '998877665544',
    aadharFrontUrl: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793960484/wormup/rider/kyc/tqnioqgpy7casxo6iu15.png',
    aadharBackUrl: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793960496/wormup/rider/kyc/zsfjyxsbpxd4wjslexvs.png',
    rcNumber: 'GJ01TR7777',
    rcImageUrl: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793960509/wormup/rider/kyc/sfrkp6okptl0ekixptcc.png',
    vehicleInsuranceUrl: 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1793960516/wormup/rider/kyc/xltbcwuex1k9fyjamxt4.png',
    vehicleModelYear: '2024',
    shiftPreference: 'FLEXIBLE',
    emergencyContact: '9898001100',
    bankName: 'HDFC Bank',
    accountHolderName: 'Test Rider',
    accountNumber: '50100012345678',
    ifscCode: 'HDFC0001234',
    upiId: 'testrider@upi',
    updatedAt: new Date(),
  };

  const existingPartner = await partnersColl.findOne({
    $or: [{ email: testEmail }, { phoneNumber: testPhone }, { partnerCode: 'RDR777' }],
  });

  if (existingPartner) {
    await partnersColl.updateOne({ _id: existingPartner._id }, { $set: partnerData });
    console.log('Updated existing DeliveryPartner record:', existingPartner._id);
  } else {
    partnerData.registeredAt = new Date();
    partnerData.createdAt = new Date();
    const partnerRes = await partnersColl.insertOne(partnerData);
    console.log('Created new DeliveryPartner record:', partnerRes.insertedId);
  }

  // Also approve existing rider darshanthanki077@gmail.com if present
  await partnersColl.updateOne(
    { email: 'darshanthanki077@gmail.com' },
    {
      $set: {
        status: 'APPROVED',
        verificationStatus: 'VERIFIED',
        isActive: true,
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    }
  );
  console.log('Approved darshanthanki077@gmail.com rider account as well.');

  console.log('\n=========================================');
  console.log('TEST RIDER ACCOUNT READY:');
  console.log('Email:    testrider@womup.com');
  console.log('Phone:    9898001122');
  console.log('Password: rider123 (or wormup123)');
  console.log('Status:   APPROVED & ACTIVE');
  console.log('=========================================\n');

  process.exit(0);
}

seedTestRider().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

