const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const eligibleLocations = [
  { pincode: '384001', cityName: 'Mahesana', areaName: 'Mahesana (મહેસાણા)' },
  { pincode: '384002', cityName: 'Mahesana', areaName: 'Mahesana East (મહેસાણા)' },
  { pincode: '384151', cityName: 'Siddhpur', areaName: 'Siddhpur (સિદ્ધપુર)' },
  { pincode: '383001', cityName: 'Himmatnagar', areaName: 'Himmatnagar (હિંમતનગર)' },
  { pincode: '391440', cityName: 'Padra', areaName: 'Padra (પાદરા)' },
  { pincode: '390011', cityName: 'Vadodara', areaName: 'Manjalpur (માંજલપુર)' },
  { pincode: '390012', cityName: 'Vadodara', areaName: 'Atladra (અટલાદરા)' },
  { pincode: '382421', cityName: 'Gandhinagar', areaName: 'Sargasan (સરગાસણ)' },
  { pincode: '382481', cityName: 'Ahmedabad', areaName: 'Gota (ગોતા)' },
  { pincode: '380004', cityName: 'Ahmedabad', areaName: 'Shahibaug (શાહીબાગ)' },
  { pincode: '382225', cityName: 'Dholka', areaName: 'Dholka (ધોળકા)' },
  { pincode: '363421', cityName: 'Limdi', areaName: 'Limdi (લીમડી)' },
  { pincode: '388001', cityName: 'Anand', areaName: 'Anand (આણંદ)' },
  { pincode: '388325', cityName: 'Anand', areaName: 'Karamsad (કરમસદ)' },
];

async function runSeed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected successfully!');

  const approvedPincodesColl = mongoose.connection.collection('approved_pincodes');
  const usersColl = mongoose.connection.collection('users');

  console.log(`\nUpserting ${eligibleLocations.length} Income Eligible PIN codes...`);
  const allEligiblePins = [];

  for (const loc of eligibleLocations) {
    allEligiblePins.push(loc.pincode);
    await approvedPincodesColl.updateOne(
      { pincode: loc.pincode },
      {
        $set: {
          pincode: loc.pincode,
          cityName: loc.cityName,
          areaName: loc.areaName,
          isRegistrationAllowed: true,
          isDeliveryAllowed: true,
          isIncomeEnabled: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`✅ [ELIGIBLE PIN] ${loc.pincode} - ${loc.cityName} (${loc.areaName})`);
  }

  // Sync existing users registered with these pincodes
  const updateResult = await usersColl.updateMany(
    {
      $or: [
        { registrationPincode: { $in: allEligiblePins } },
        { pincode: { $in: allEligiblePins } },
      ],
    },
    {
      $set: {
        isIncomeEligible: true,
      },
    }
  );

  console.log(`\n🎉 Synchronized existing users: ${updateResult.modifiedCount} users updated to isIncomeEligible = true`);

  await mongoose.disconnect();
  console.log('Disconnected. Done!');
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
