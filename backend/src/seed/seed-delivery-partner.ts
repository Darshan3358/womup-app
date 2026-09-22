import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';

const UserSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,
    name: String,
    role: { type: String, default: 'DELIVERY_PARTNER' },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'users', timestamps: true },
);

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    partnerCode: String,
    fullName: String,
    phoneNumber: String,
    email: String,
    city: String,
    hubName: String,
    status: { type: String, default: 'APPROVED' },
    verificationStatus: { type: String, default: 'VERIFIED' },
    isOnline: { type: Boolean, default: true },
    vehicleType: { type: String, default: 'EV_SCOOTER' },
    vehicleNumber: String,
    rating: { type: Number, default: 4.88 },
    totalDeliveries: { type: Number, default: 428 },
    completedDeliveries: { type: Number, default: 428 },
    cancelledDeliveries: { type: Number, default: 3 },
    acceptanceRate: { type: Number, default: 94.0 },
    completionRate: { type: Number, default: 99.0 },
    avgDeliveryMinutes: { type: Number, default: 11.4 },
    onTimeRate: { type: Number, default: 97.2 },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    currentLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [72.5298, 23.0245] },
    },
    isAvailable: { type: Boolean, default: true },
  },
  { collection: 'delivery_partners', timestamps: true },
);

const DeliveryAssignmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    status: { type: String, default: 'GOING_TO_STORE' },
    payoutAmount: { type: Number, default: 48 },
    distanceKm: { type: Number, default: 1.8 },
    etaMinutes: { type: Number, default: 11 },
    assignedAt: { type: Date, default: Date.now },
  },
  { collection: 'delivery_assignments', timestamps: true },
);

const RiderSettlementSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    orderNumber: String,
    basePay: Number,
    incentive: Number,
    tip: Number,
    adjustment: Number,
    total: Number,
    status: { type: String, default: 'SETTLED' },
    period: { type: String, default: 'TODAY' },
    settledAt: { type: Date, default: Date.now },
  },
  { collection: 'rider_settlements', timestamps: true },
);

const RiderBankAccountSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    bankName: String,
    accountHolderName: String,
    maskedAccount: String,
    ifsc: String,
    verificationStatus: { type: String, default: 'VERIFIED' },
    verifiedAt: { type: Date, default: Date.now },
  },
  { collection: 'rider_bank_accounts', timestamps: true },
);

const RiderDutySessionSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    startedAt: Date,
    endedAt: Date,
    onlineDurationMinutes: Number,
    ordersCompleted: Number,
    city: String,
    isActive: Boolean,
  },
  { collection: 'rider_duty_sessions', timestamps: true },
);

const DeliveryPartnerDocumentSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    type: String,
    title: String,
    documentNumberMasked: String,
    status: { type: String, default: 'VERIFIED' },
    issuedAt: String,
    expiresAt: String,
  },
  { collection: 'delivery_partner_documents', timestamps: true },
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: String,
    status: String,
    finalAmount: Number,
    paymentMethod: String,
    deliveryAddress: Object,
    items: Array,
  },
  { collection: 'orders', timestamps: true },
);

async function seedRider() {
  console.log('Connecting to MongoDB Atlas at:', MONGODB_URI.split('@')[1] || 'Atlas');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas!');

  const User = mongoose.model('User', UserSchema);
  const DeliveryPartner = mongoose.model('DeliveryPartner', DeliveryPartnerSchema);
  const DeliveryAssignment = mongoose.model('DeliveryAssignment', DeliveryAssignmentSchema);
  const RiderSettlement = mongoose.model('RiderSettlement', RiderSettlementSchema);
  const RiderBankAccount = mongoose.model('RiderBankAccount', RiderBankAccountSchema);
  const RiderDutySession = mongoose.model('RiderDutySession', RiderDutySessionSchema);
  const DeliveryPartnerDoc = mongoose.model('DeliveryPartnerDocument', DeliveryPartnerDocumentSchema);
  const Order = mongoose.model('Order', OrderSchema);

  // 1. Create or Find User
  let user = await User.findOne({ phone: '9876543210' });
  if (!user) {
    user = await User.create({
      phone: '9876543210',
      email: 'rajesh.rider@wormup.in',
      name: 'Rajesh Sharma',
      role: 'DELIVERY_PARTNER',
      isActive: true,
    });
    console.log('Created Rider User: Rajesh Sharma');
  }

  // 2. Create or Update Delivery Partner
  let partner = await DeliveryPartner.findOne({ phoneNumber: '9876543210' });
  if (!partner) {
    partner = await DeliveryPartner.create({
      userId: user._id,
      partnerCode: 'RDR-9021',
      fullName: 'Rajesh Sharma',
      phoneNumber: '9876543210',
      email: 'rajesh.rider@wormup.in',
      city: 'Ahmedabad (Satellite Hub)',
      hubName: 'Satellite Hub Dark Store',
      status: 'APPROVED',
      verificationStatus: 'VERIFIED',
      isOnline: true,
      vehicleType: 'EV_SCOOTER',
      vehicleNumber: 'GJ-01-ET-4829',
      rating: 4.88,
      totalDeliveries: 428,
      completedDeliveries: 428,
      cancelledDeliveries: 3,
      acceptanceRate: 94.0,
      completionRate: 99.0,
      avgDeliveryMinutes: 11.4,
      onTimeRate: 97.2,
      isAvailable: true,
    });
    console.log('Created Delivery Partner: RDR-9021');
  }

  // 3. Bank Account
  await RiderBankAccount.deleteMany({ riderId: partner._id });
  await RiderBankAccount.create({
    riderId: partner._id,
    bankName: 'HDFC Bank Ltd',
    accountHolderName: 'Rajesh Sharma',
    maskedAccount: '********4829',
    ifsc: 'HDFC0000182',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
  });
  console.log('Seeded Bank Account: HDFC Bank ****4829');

  // 4. KYC Documents
  await DeliveryPartnerDoc.deleteMany({ riderId: partner._id });
  await DeliveryPartnerDoc.insertMany([
    {
      riderId: partner._id,
      type: 'DRIVING_LICENSE',
      title: 'Commercial Driving License',
      documentNumberMasked: 'GJ01-2019-0034****',
      status: 'VERIFIED',
      issuedAt: '12 Jan 2021',
      expiresAt: '11 Jan 2031',
    },
    {
      riderId: partner._id,
      type: 'VEHICLE_RC',
      title: 'Vehicle Registration Certificate (RC)',
      documentNumberMasked: 'GJ-01-ET-****',
      status: 'VERIFIED',
      issuedAt: '04 Mar 2022',
      expiresAt: '03 Mar 2037',
    },
    {
      riderId: partner._id,
      type: 'INSURANCE',
      title: 'Two-Wheeler Comprehensive Insurance',
      documentNumberMasked: 'POL-ICICI-9938****',
      status: 'VERIFIED',
      issuedAt: '15 Oct 2025',
      expiresAt: '14 Oct 2026',
    },
    {
      riderId: partner._id,
      type: 'AADHAAR_PAN',
      title: 'National Identity Proof (Aadhaar)',
      documentNumberMasked: 'XXXX-XXXX-8921',
      status: 'VERIFIED',
    },
  ]);
  console.log('Seeded 4 Verified KYC Documents');

  // 5. Duty Sessions
  await RiderDutySession.deleteMany({ riderId: partner._id });
  await RiderDutySession.insertMany([
    {
      riderId: partner._id,
      startedAt: new Date(Date.now() - 5 * 3600000),
      onlineDurationMinutes: 300,
      ordersCompleted: 11,
      city: 'Ahmedabad',
      isActive: true,
    },
    {
      riderId: partner._id,
      startedAt: new Date(Date.now() - 28 * 3600000),
      endedAt: new Date(Date.now() - 18 * 3600000),
      onlineDurationMinutes: 600,
      ordersCompleted: 19,
      city: 'Ahmedabad',
      isActive: false,
    },
    {
      riderId: partner._id,
      startedAt: new Date(Date.now() - 52 * 3600000),
      endedAt: new Date(Date.now() - 42 * 3600000),
      onlineDurationMinutes: 585,
      ordersCompleted: 17,
      city: 'Ahmedabad',
      isActive: false,
    },
  ]);
  console.log('Seeded Duty Sessions');

  // 6. Settlements
  await RiderSettlement.deleteMany({ riderId: partner._id });
  await RiderSettlement.insertMany([
    {
      riderId: partner._id,
      orderNumber: '#WUP-84918',
      basePay: 48,
      incentive: 15,
      tip: 20,
      adjustment: 0,
      total: 83,
      status: 'SETTLED',
      period: 'TODAY',
      settledAt: new Date(Date.now() - 2 * 3600000),
    },
    {
      riderId: partner._id,
      orderNumber: '#WUP-84912',
      basePay: 42,
      incentive: 10,
      tip: 0,
      adjustment: 0,
      total: 52,
      status: 'SETTLED',
      period: 'TODAY',
      settledAt: new Date(Date.now() - 3.5 * 3600000),
    },
    {
      riderId: partner._id,
      orderNumber: '#WUP-84904',
      basePay: 55,
      incentive: 15,
      tip: 10,
      adjustment: 0,
      total: 80,
      status: 'SETTLED',
      period: 'TODAY',
      settledAt: new Date(Date.now() - 5 * 3600000),
    },
    {
      riderId: partner._id,
      orderNumber: '#WUP-84880',
      basePay: 50,
      incentive: 20,
      tip: 30,
      adjustment: 0,
      total: 100,
      status: 'SETTLED',
      period: 'YESTERDAY',
      settledAt: new Date(Date.now() - 26 * 3600000),
    },
    {
      riderId: partner._id,
      orderNumber: '#WUP-84729',
      basePay: 45,
      incentive: 10,
      tip: 0,
      adjustment: 0,
      total: 55,
      status: 'SETTLED',
      period: 'PREVIOUS',
      settledAt: new Date(Date.now() - 50 * 3600000),
    },
  ]);
  console.log('Seeded Settlements');

  // 7. Active Order & Assignment
  let activeOrder = await Order.findOne({ orderNumber: '#WUP-84920' });
  if (!activeOrder) {
    activeOrder = await Order.create({
      orderNumber: '#WUP-84920',
      status: 'OUT_FOR_DELIVERY',
      finalAmount: 348,
      paymentMethod: 'ONLINE_PAID',
      deliveryAddress: {
        name: 'Aayushi Thanki',
        phone: '+91 98980 12345',
        addressLine1: 'Flat B-402, Shivalik Parkview',
        city: 'Satellite, Ahmedabad',
        location: {
          type: 'Point',
          coordinates: [72.5342, 23.0312],
        },
      },
      items: [
        { name: 'Amul Taaza Milk (500ml)', quantity: 2, price: 56 },
        { name: 'Farm Fresh Tomatoes (500g)', quantity: 1, price: 28 },
        { name: 'A4 Color Document Print', quantity: 1, price: 24 },
      ],
    });
  }

  await DeliveryAssignment.deleteMany({ partnerId: partner._id });
  const assignment = await DeliveryAssignment.create({
    orderId: activeOrder._id,
    partnerId: partner._id,
    status: 'GOING_TO_STORE',
    payoutAmount: 48,
    distanceKm: 1.8,
    etaMinutes: 11,
    assignedAt: new Date(),
  });

  partner.currentOrderId = activeOrder._id;
  await partner.save();

  console.log('Seeded Active Assignment for Order #WUP-84920');
  console.log('✅ MongoDB Delivery Partner Seeding Complete!');

  await mongoose.disconnect();
}

seedRider().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
