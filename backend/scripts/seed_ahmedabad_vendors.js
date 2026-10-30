const mongoose = require('mongoose');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('vendors');

  await col.updateOne(
    { vendorCode: 'WOMUP01' },
    {
      $set: {
        storeName: 'Womup Express Store',
        address: 'Near Prahlad Nagar Garden, Ahmedabad',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.518, 23.0195] },
        latitude: 23.0195,
        longitude: 72.518,
        isActive: true,
        isOpenNow: true,
        isOnline: true,
        isVerified: true,
      },
    },
  );
  console.log('Updated WOMUP01');

  const list = [
    {
      vendorCode: 'VND001',
      storeName: 'Gokul Vegetables',
      ownerName: 'Ramesh Patel',
      ownerPhone: '+91 98250 12345',
      categoryName: 'Vegetables',
      address: 'Near Anandnagar Cross Road, Prahlad Nagar, Ahmedabad',
      city: 'Ahmedabad',
      pincode: '380015',
      coordinates: { type: 'Point', coordinates: [72.515, 23.016] },
      latitude: 23.016,
      longitude: 72.515,
      shoppingCoinPercent: 18,
      minCoinPercent: 2,
      maxCoinPercent: 25,
      openingTime: '08:00 AM',
      closingTime: '09:00 PM',
      isOpenNow: true,
      isOnline: true,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
      rating: 4.8,
      totalReviews: 128,
      upiId: 'gokulveg@okaxis',
      isActive: true,
      isVerified: true,
      platformCommissionPercent: 2,
    },
    {
      vendorCode: 'VND002',
      storeName: 'Shree Kirana Store',
      ownerName: 'Jayesh Shah',
      ownerPhone: '+91 98251 23456',
      categoryName: 'Grocery',
      address: 'Prahlad Nagar Trade Center, Ahmedabad',
      city: 'Ahmedabad',
      pincode: '380015',
      coordinates: { type: 'Point', coordinates: [72.5195, 23.021] },
      latitude: 23.021,
      longitude: 72.5195,
      shoppingCoinPercent: 6,
      minCoinPercent: 2,
      maxCoinPercent: 25,
      openingTime: '07:30 AM',
      closingTime: '10:00 PM',
      isOpenNow: true,
      isOnline: true,
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80',
      rating: 4.6,
      totalReviews: 84,
      upiId: 'shreekirana@oksbi',
      isActive: true,
      isVerified: true,
      platformCommissionPercent: 2,
    },
    {
      vendorCode: 'VND003',
      storeName: 'Jay Medical Store',
      ownerName: 'Dr. Suresh Varma',
      ownerPhone: '+91 98252 34567',
      categoryName: 'Medical',
      address: 'Satellite Road, Ahmedabad',
      city: 'Ahmedabad',
      pincode: '380015',
      coordinates: { type: 'Point', coordinates: [72.524, 23.025] },
      latitude: 23.025,
      longitude: 72.524,
      shoppingCoinPercent: 10,
      minCoinPercent: 2,
      maxCoinPercent: 25,
      openingTime: '08:00 AM',
      closingTime: '11:00 PM',
      isOpenNow: true,
      isOnline: true,
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
      rating: 4.9,
      totalReviews: 210,
      upiId: 'jaymedical@okicici',
      isActive: true,
      isVerified: true,
      platformCommissionPercent: 2,
    },
    {
      vendorCode: 'VND004',
      storeName: "Royal Men's Salon",
      ownerName: 'Haresh Barot',
      ownerPhone: '+91 98253 45678',
      categoryName: 'Salon',
      address: 'SG Highway, Opp. Rajpath Club, Ahmedabad',
      city: 'Ahmedabad',
      pincode: '380015',
      coordinates: { type: 'Point', coordinates: [72.508, 23.022] },
      latitude: 23.022,
      longitude: 72.508,
      shoppingCoinPercent: 12,
      minCoinPercent: 2,
      maxCoinPercent: 25,
      openingTime: '09:00 AM',
      closingTime: '09:30 PM',
      isOpenNow: true,
      isOnline: true,
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      rating: 4.7,
      totalReviews: 95,
      upiId: 'royalsalon@okhdfcbank',
      isActive: true,
      isVerified: true,
      platformCommissionPercent: 2,
    },
    {
      vendorCode: 'VND005',
      storeName: 'Fashion Hub Garments',
      ownerName: 'Manoj Prajapati',
      ownerPhone: '+91 98254 56789',
      categoryName: 'Garments',
      address: 'Vastrapur Lake Road, Ahmedabad',
      city: 'Ahmedabad',
      pincode: '380015',
      coordinates: { type: 'Point', coordinates: [72.531, 23.018] },
      latitude: 23.018,
      longitude: 72.531,
      shoppingCoinPercent: 8,
      minCoinPercent: 2,
      maxCoinPercent: 25,
      openingTime: '10:00 AM',
      closingTime: '09:00 PM',
      isOpenNow: true,
      isOnline: true,
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
      rating: 4.5,
      totalReviews: 67,
      upiId: 'fashionhub@okaxis',
      isActive: true,
      isVerified: true,
      platformCommissionPercent: 2,
    },
  ];

  for (const v of list) {
    await col.updateOne({ vendorCode: v.vendorCode }, { $set: v }, { upsert: true });
    console.log('Upserted:', v.vendorCode, v.storeName);
  }

  // Ensure 2dsphere index exists on coordinates
  try {
    await col.createIndex({ coordinates: '2dsphere' });
    console.log('Created 2dsphere index on coordinates');
  } catch (e) {
    console.warn('Index notice:', e.message);
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
