const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('./config/db');

// Route imports
const dashboardRouter = require('./routes/dashboard');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const areasRouter = require('./routes/areas');
const storesRouter = require('./routes/stores');
const ordersRouter = require('./routes/orders');
const printOrdersRouter = require('./routes/printOrders');
const marketingRouter = require('./routes/marketing');
const financeRouter = require('./routes/finance');
const securityRouter = require('./routes/security');
const citiesRouter = require('./routes/cities');
const categoriesRouter = require('./routes/categories');
const payoutRatesRouter = require('./routes/payoutRates');
const cartRouter = require('./routes/cart');

const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Large document field exclusions for high-speed list & realtime polling
const RIDER_LIST_PROJECTION = {
  dlImageUrl: 0,
  aadharFrontUrl: 0,
  aadharBackUrl: 0,
  rcImageUrl: 0,
  vehicleInsuranceUrl: 0,
};

// In-memory cache for ultra-fast telemetry & dashboard loads
let realtimeCache = {
  data: null,
  timestamp: 0,
  inFlight: null,
};

async function fetchRealtimeSnapshotData() {
  const db = getDB();

  // Run all 18 collection queries in parallel across the MongoDB pool
  const [
    rawDeliveryPartners,
    allUsers,
    orders,
    products,
    categories,
    rawAreas,
    rawStores,
    storeStaffList,
    inventory,
    coinTransactions,
    coupons,
    orderHistory,
    addresses,
    printOrders,
    productVariants,
    areaPricing,
    cities,
    banners,
  ] = await Promise.all([
    db.collection('delivery_partners').find({}, { projection: RIDER_LIST_PROJECTION }).toArray(),
    db.collection('users').find({
      role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
    }).toArray(),
    db.collection('orders').find({}).toArray(),
    db.collection('products').find({}).toArray(),
    db.collection('categories').find({}).toArray(),
    db.collection('areas').find({}).toArray(),
    db.collection('stores').find({
      deletedAt: { $exists: false },
      isActive: { $ne: false },
    }).toArray(),
    db.collection('store_staff').find({}).toArray(),
    db.collection('inventory').find({}).toArray(),
    db.collection('coin_transactions').find({}).sort({ createdAt: -1 }).limit(500).toArray(),
    db.collection('coupons').find({}).toArray(),
    db.collection('order_status_history').find({}).sort({ timestamp: -1, createdAt: -1 }).limit(500).toArray(),
    db.collection('addresses').find({}).toArray(),
    db.collection('print_orders').find({}).toArray(),
    db.collection('product_variants').find({}).toArray(),
    db.collection('area_pricing').find({}).toArray(),
    db.collection('cities').find({}).sort({ sortOrder: 1, name: 1 }).toArray(),
    db.collection('banners').find({}).sort({ sortOrder: 1 }).toArray(),
  ]);

  const partnerUserIds = new Set(rawDeliveryPartners.map(p => p.userId?.toString()).filter(Boolean));
  const users = allUsers.filter(u => !partnerUserIds.has(u._id?.toString()));

  // Enrich delivery partners with exact completed and active orders count
  const deliveryPartners = rawDeliveryPartners.map((p) => {
    const pIdStr = p._id.toString();
    const uIdStr = p.userId ? p.userId.toString() : '';

    const isOrderOfPartner = (o) => {
      const oPartnerId = (typeof o.deliveryPartnerId === 'object' ? o.deliveryPartnerId?._id : o.deliveryPartnerId)?.toString();
      const oRiderId = (typeof o.riderId === 'object' ? o.riderId?._id : o.riderId)?.toString();
      return oPartnerId === pIdStr || oRiderId === pIdStr || (uIdStr && (oPartnerId === uIdStr || oRiderId === uIdStr));
    };

    const deliveredOrdersCount = orders.filter((o) => isOrderOfPartner(o) && ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
    const activeOrdersCount = orders.filter((o) => isOrderOfPartner(o) && ['OUT_FOR_DELIVERY', 'PICKED_UP', 'REACHED_STORE', 'ASSIGNED'].includes(o.status)).length;
    const effectiveCompleted = Math.max(deliveredOrdersCount, Number(p.completedDeliveries) || Number(p.totalDeliveries) || 0);

    return {
      ...p,
      completedDeliveries: effectiveCompleted,
      totalDeliveries: effectiveCompleted,
      activeDeliveries: activeOrdersCount,
    };
  });

  const stores = rawStores.map((store) => {
    const sId = store._id.toString();
    const staffAtStore = storeStaffList.filter(
      st => st.storeId && (st.storeId.toString() === sId)
    );
    const staffOnShift = staffAtStore.filter(st => st.isOnShift === true).length;
    const effectiveStaffOnShift = staffOnShift > 0
      ? staffOnShift
      : (store.isOnShift === true ? 1 : 0);
    const effectiveStaffTotal = Math.max(staffAtStore.length, effectiveStaffOnShift, 1);
    const isOnline = (store.isActive !== false) && (effectiveStaffOnShift > 0);

    return {
      ...store,
      staffOnShift: effectiveStaffOnShift,
      staffTotal: effectiveStaffTotal,
      isOnShift: effectiveStaffOnShift > 0,
      isOnline,
    };
  });

  const areas = rawAreas.map((area) => {
    const aId = area._id.toString();
    const areaStores = rawStores.filter((s) => {
      if (s.isActive === false) return false;
      if (s.areaId && s.areaId.toString() === aId) return true;
      if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
      return false;
    });
    const maxStores = Math.max(1, Number(area.maxStores) || 1);
    const currentStoreCount = areaStores.length;
    const availableSlots = Math.max(0, maxStores - currentStoreCount);
    const isFull = currentStoreCount >= maxStores;

    return {
      ...area,
      id: aId,
      maxStores,
      currentStoreCount,
      availableSlots,
      isFull,
      storeRoutingStrategy: area.storeRoutingStrategy || 'NEAREST',
      hasActiveStore: currentStoreCount > 0,
      assignedStores: areaStores.map((s) => ({
        id: s._id.toString(),
        _id: s._id,
        name: s.name,
        code: s.code,
        loginId: s.loginId,
        address: s.address,
        phone: s.phone,
        email: s.email,
        location: s.location,
        coordinates: s.location?.coordinates || s.coordinates || (s.longitude && s.latitude ? [s.longitude, s.latitude] : undefined),
        latitude: s.location?.coordinates ? s.location.coordinates[1] : s.latitude,
        longitude: s.location?.coordinates ? s.location.coordinates[0] : s.longitude,
        serviceRadiusKm: s.serviceRadiusKm || 4.5,
        estimatedDeliveryMinutes: s.estimatedDeliveryMinutes || 9,
        isActive: s.isActive !== false,
      })),
      assignedStore: areaStores[0] || null,
    };
  });

  return {
    users,
    deliveryPartners,
    orders,
    products,
    productVariants,
    areaPricing,
    categories,
    cities,
    areas,
    stores,
    inventory,
    coinTransactions,
    coupons,
    banners,
    orderHistory,
    addresses,
    printOrders,
  };
}

// Handler for realtime snapshot with in-memory caching and coalescing
async function handleRealtimeData(req, res) {
  try {
    const now = Date.now();
    // Return cached data immediately if fresh within 3000ms
    if (realtimeCache.data && (now - realtimeCache.timestamp < 3000)) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(realtimeCache.data);
    }

    // Coalesce concurrent requests into a single promise
    if (!realtimeCache.inFlight) {
      realtimeCache.inFlight = fetchRealtimeSnapshotData()
        .then((payload) => {
          realtimeCache.data = payload;
          realtimeCache.timestamp = Date.now();
          realtimeCache.inFlight = null;
          return payload;
        })
        .catch((err) => {
          realtimeCache.inFlight = null;
          throw err;
        });
    }

    const data = await realtimeCache.inFlight;
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    console.error('Error fetching realtime data:', err);
    if (realtimeCache.data) {
      // Fallback to previous snapshot if available
      return res.json(realtimeCache.data);
    }
    res.status(500).json({ error: err.message });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Womup Admin Management Backend',
    database: 'wormup',
    cluster: 'cluster0.f8acy45.mongodb.net',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mobile App Realtime Snapshot compatibility routes
app.get('/api/realtime-data', handleRealtimeData);
app.get('/realtime-data', handleRealtimeData);
app.get('/api/v1/realtime-data', handleRealtimeData);

// Explicit Customers vs Delivery Partners endpoints
app.get('/api/admin/customers', async (req, res) => {
  try {
    const db = getDB();
    const deliveryPartners = await db.collection('delivery_partners').find({}, { projection: RIDER_LIST_PROJECTION }).toArray();
    const partnerUserIds = new Set(deliveryPartners.map(p => p.userId?.toString()).filter(Boolean));

    const allCustomers = await db.collection('users').find({
      role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
    }).toArray();
    const customers = allCustomers.filter(u => !partnerUserIds.has(u._id?.toString()));

    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/riders', async (req, res) => {
  try {
    const db = getDB();
    const riders = await db.collection('delivery_partners').find({}, { projection: RIDER_LIST_PROJECTION }).toArray();
    res.json({ success: true, count: riders.length, data: riders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/riders/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    let email = '';
    let userDoc = null;
    if (rider.userId) {
      try {
        userDoc = await db.collection('users').findOne({
          $or: [
            ...(ObjectId.isValid(rider.userId) ? [{ _id: new ObjectId(rider.userId.toString()) }] : []),
            { _id: rider.userId.toString() },
          ]
        });
      } catch (_) {}
      if (userDoc) {
        email = userDoc.email || '';
      }
    }

    let bankAccount = null;
    const bankDoc = await db.collection('rider_bank_accounts').findOne({
      $or: [
        { riderId: rider._id },
        { riderId: rider._id.toString() },
        ...(rider.userId ? [{ userId: rider.userId }, { userId: rider.userId.toString() }] : []),
      ]
    });
    if (bankDoc) {
      bankAccount = {
        accountNumber: bankDoc.accountNumberFull || bankDoc.accountNumber || bankDoc.maskedAccount || 'N/A',
        ifscCode: bankDoc.ifscCode || bankDoc.ifsc || 'N/A',
        bankName: bankDoc.bankName || 'N/A',
        accountHolderName: bankDoc.accountHolderName || rider.fullName || 'N/A',
        branchName: bankDoc.branchName || bankDoc.bankBranch || rider.bankBranch || '',
        upiId: bankDoc.upiId || rider.upiId || '',
        isVerified: bankDoc.isVerified || bankDoc.verificationStatus === 'VERIFIED' || rider.status === 'APPROVED',
      };
    } else if (rider.bankName || rider.accountNumber) {
      bankAccount = {
        accountNumber: rider.accountNumber || 'N/A',
        ifscCode: rider.ifscCode || 'N/A',
        bankName: rider.bankName || 'N/A',
        accountHolderName: rider.accountHolderName || rider.fullName || 'N/A',
        branchName: rider.bankBranch || '',
        upiId: rider.upiId || '',
        isVerified: rider.verificationStatus === 'VERIFIED' || rider.status === 'APPROVED',
      };
    } else if (userDoc && (userDoc.bankName || userDoc.accountNumber)) {
      bankAccount = {
        accountNumber: userDoc.accountNumber || 'N/A',
        ifscCode: userDoc.ifscCode || 'N/A',
        bankName: userDoc.bankName || 'N/A',
        accountHolderName: userDoc.accountHolderName || rider.fullName || userDoc.name || 'N/A',
        branchName: userDoc.branchName || '',
        upiId: userDoc.upiId || '',
        isVerified: userDoc.verificationStatus === 'VERIFIED' || rider.status === 'APPROVED',
      };
    }

    const documents = {
      dlFront: rider.dlImageUrl || rider.drivingLicenseUrl || userDoc?.dlFrontImage || (rider.documents && (rider.documents.dlFront || rider.documents.dlFrontUrl)) || null,
      dlFrontUrl: rider.dlImageUrl || rider.drivingLicenseUrl || userDoc?.dlFrontImage || (rider.documents && (rider.documents.dlFront || rider.documents.dlFrontUrl)) || null,
      dlBack: rider.dlBackUrl || userDoc?.dlBackImage || (rider.documents && (rider.documents.dlBack || rider.documents.dlBackUrl)) || null,
      dlBackUrl: rider.dlBackUrl || userDoc?.dlBackImage || (rider.documents && (rider.documents.dlBack || rider.documents.dlBackUrl)) || null,
      dlNumber: rider.drivingLicense || rider.drivingLicenseNumber || rider.dlNumber || userDoc?.dlNumber || (rider.documents && rider.documents.dlNumber) || null,
      rcFront: rider.rcImageUrl || userDoc?.rcFrontImage || (rider.documents && (rider.documents.rcFront || rider.documents.rcFrontUrl)) || null,
      rcFrontUrl: rider.rcImageUrl || userDoc?.rcFrontImage || (rider.documents && (rider.documents.rcFront || rider.documents.rcFrontUrl)) || null,
      rcBack: rider.rcBackUrl || (rider.documents && (rider.documents.rcBack || rider.documents.rcBackUrl)) || null,
      rcBackUrl: rider.rcBackUrl || (rider.documents && (rider.documents.rcBack || rider.documents.rcBackUrl)) || null,
      rcNumber: rider.rcNumber || userDoc?.rcNumber || (rider.documents && rider.documents.rcNumber) || null,
      insurance: rider.vehicleInsuranceUrl || (rider.documents && (rider.documents.insurance || rider.documents.insuranceUrl)) || null,
      insuranceUrl: rider.vehicleInsuranceUrl || (rider.documents && (rider.documents.insurance || rider.documents.insuranceUrl)) || null,
      aadhaarFront: rider.aadharFrontUrl || userDoc?.aadharFrontImage || userDoc?.customer_image_aadhar_front || (rider.documents && (rider.documents.aadhaarFront || rider.documents.aadhaarFrontUrl)) || null,
      aadhaarFrontUrl: rider.aadharFrontUrl || userDoc?.aadharFrontImage || userDoc?.customer_image_aadhar_front || (rider.documents && (rider.documents.aadhaarFront || rider.documents.aadhaarFrontUrl)) || null,
      aadhaarBack: rider.aadharBackUrl || userDoc?.aadharBackImage || userDoc?.customer_image_aadhar_back || (rider.documents && (rider.documents.aadhaarBack || rider.documents.aadhaarBackUrl)) || null,
      aadhaarBackUrl: rider.aadharBackUrl || userDoc?.aadharBackImage || userDoc?.customer_image_aadhar_back || (rider.documents && (rider.documents.aadhaarBack || rider.documents.aadhaarBackUrl)) || null,
      aadhaarNumber: rider.aadharNumber || userDoc?.aadhaarNumber || (rider.documents && rider.documents.aadhaarNumber) || null,
      profilePhoto: rider.profilePhotoUrl || userDoc?.avatar || (rider.documents && (rider.documents.profilePhoto || rider.documents.profilePhotoUrl)) || null,
      profilePhotoUrl: rider.profilePhotoUrl || userDoc?.avatar || (rider.documents && (rider.documents.profilePhoto || rider.documents.profilePhotoUrl)) || null,
    };

    res.json({
      success: true,
      data: {
        ...rider,
        email,
        bankAccount,
        bankDetails: bankAccount,
        documents,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const handleUpdateRider = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const fieldsToUpdate = {};
    if (updates.fullName !== undefined) fieldsToUpdate.fullName = updates.fullName;
    if (updates.name !== undefined) fieldsToUpdate.fullName = updates.name;
    if (updates.phoneNumber !== undefined) fieldsToUpdate.phoneNumber = updates.phoneNumber;
    if (updates.phone !== undefined) fieldsToUpdate.phoneNumber = updates.phone;
    if (updates.vehicleType !== undefined) fieldsToUpdate.vehicleType = updates.vehicleType;
    if (updates.vehicleNumber !== undefined) fieldsToUpdate.vehicleNumber = updates.vehicleNumber;
    if (updates.hubName !== undefined) fieldsToUpdate.hubName = updates.hubName;
    if (updates.hubId !== undefined) fieldsToUpdate.hubId = updates.hubId;
    if (updates.city !== undefined) fieldsToUpdate.city = updates.city;
    if (updates.status !== undefined) fieldsToUpdate.status = updates.status;
    if (updates.verificationStatus !== undefined) fieldsToUpdate.verificationStatus = updates.verificationStatus;
    if (updates.isOnline !== undefined) fieldsToUpdate.isOnline = Boolean(updates.isOnline);
    fieldsToUpdate.updatedAt = new Date();

    await db.collection('delivery_partners').updateOne({ _id: rider._id }, { $set: fieldsToUpdate });

    if (rider.userId && (fieldsToUpdate.fullName || fieldsToUpdate.phoneNumber)) {
      const userUpdate = {};
      if (fieldsToUpdate.fullName) userUpdate.name = fieldsToUpdate.fullName;
      if (fieldsToUpdate.phoneNumber) userUpdate.phone = fieldsToUpdate.phoneNumber;
      await db.collection('users').updateOne({ _id: new ObjectId(rider.userId.toString()) }, { $set: userUpdate });
    }

    const updatedRider = await db.collection('delivery_partners').findOne({ _id: rider._id });
    res.json({ success: true, message: 'Rider updated successfully', data: updatedRider });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.patch('/api/admin/riders/:id', handleUpdateRider);
app.put('/api/admin/riders/:id', handleUpdateRider);

app.delete('/api/admin/riders/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    // Delete from delivery_partners
    await db.collection('delivery_partners').deleteOne({ _id: rider._id });

    // Clean up bank accounts and wallets
    await db.collection('rider_bank_accounts').deleteMany({
      $or: [{ riderId: rider._id }, { riderId: rider._id.toString() }],
    });
    await db.collection('rider_wallets').deleteMany({
      $or: [{ riderId: rider._id }, { riderId: rider._id.toString() }],
    });

    if (rider.userId) {
      try {
        const uId = ObjectId.isValid(rider.userId) ? new ObjectId(rider.userId.toString()) : rider.userId;
        await db.collection('users').deleteOne({ _id: uId });
      } catch (_) {}
    }

    res.json({ success: true, message: 'Delivery partner deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias DELETE for customers
app.delete('/api/admin/customers/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let userObjId;
    try {
      userObjId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid customer ID' });
    }

    await db.collection('users').deleteOne({
      $or: [{ _id: userObjId }, { _id: id }],
    });

    await db.collection('addresses').deleteMany({
      $or: [{ userId: userObjId }, { userId: id }],
    });

    await db.collection('cart').deleteMany({
      $or: [{ userId: userObjId }, { userId: id }],
    });

    await db.collection('delivery_partners').deleteMany({
      $or: [{ userId: userObjId }, { userId: id }],
    });

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount Admin Management Modules
app.use('/api/admin/dashboard', dashboardRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/catalog', catalogRouter);
app.use('/api/admin/categories', categoriesRouter);
app.use('/api/admin/cities', citiesRouter);
app.use('/api/admin/areas', areasRouter);
app.use('/api/admin/stores', storesRouter);
app.use('/api/admin/orders', ordersRouter);
app.use('/api/admin/print-orders', printOrdersRouter);
app.use('/api/admin/marketing', marketingRouter);
app.use('/api/admin/finance', financeRouter);
app.use('/api/finance', financeRouter);
app.use('/api/admin/security', securityRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/cart', cartRouter);

// Direct /api/* aliases for portal & integrations
app.put('/api/products/price', async (req, res) => {
  try {
    const db = getDB();
    const { productName, sellingPrice, productId } = req.body;
    const sPrice = Number(sellingPrice);
    if (!productName && !productId) {
      return res.status(400).json({ success: false, error: 'Product name or ID is required' });
    }
    const filter = productId && ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : { name: productName };
    const prod = await db.collection('products').findOne(filter);
    if (prod) {
      await db.collection('products').updateOne(
        { _id: prod._id },
        {
          $set: { sellingPrice: sPrice, updatedAt: new Date() },
          $push: {
            priceHistory: {
              id: 'ph_' + Date.now(),
              oldSellingPrice: prod.sellingPrice,
              newSellingPrice: sPrice,
              changedBy: 'Admin Portal',
              changedAt: new Date(),
              notes: 'Inline price update from Admin Portal',
            },
          },
        }
      );
      await db.collection('product_variants').updateMany(
        { productId: prod._id },
        { $set: { sellingPrice: sPrice, updatedAt: new Date() } }
      );
    }
    res.json({ success: true, message: 'Price updated successfully in MongoDB Atlas' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/coins/adjust', async (req, res) => {
  try {
    const db = getDB();
    const { userId, amount, type, reason } = req.body;
    const numAmount = Number(amount);
    const filter = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };
    const user = await db.collection('users').findOne(filter);
    const current = (user && (user.shoppingCoins !== undefined ? user.shoppingCoins : user.coins)) || 0;
    const delta = type === 'Debit' ? -Math.abs(numAmount) : Math.abs(numAmount);
    const nextBalance = Math.max(0, current + delta);
    if (user) {
      await db.collection('users').updateOne(filter, {
        $set: {
          coins: nextBalance,
          shoppingCoins: nextBalance,
          updatedAt: new Date(),
        },
      });
      await db.collection('coin_transactions').insertOne({
        userId: user._id,
        amount: Math.abs(numAmount),
        type: type || 'Credit',
        reason: reason || 'Admin adjustment',
        balanceBefore: current,
        balanceAfter: nextBalance,
        createdAt: new Date(),
      });
    }
    res.json({ success: true, newBalance: nextBalance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api/stores', storesRouter);
app.use('/api/users', usersRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/areas', areasRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/print-orders', printOrdersRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/payout-rates', payoutRatesRouter);
app.use('/api/admin/payout-rates', payoutRatesRouter);
app.use('/api/admin/areas', areasRouter);
app.use('/api/admin/cities', citiesRouter);
app.use('/api/admin/stores', storesRouter);
app.use('/api/finance', financeRouter);

// Common portal & frontend aliases to guarantee zero 404s
app.use('/admin/areas', areasRouter);
app.use('/admin/cities', citiesRouter);
app.use('/admin/stores', storesRouter);
app.use('/areas', areasRouter);
app.use('/api/v1/areas', areasRouter);
app.use('/api/v1/location/areas', areasRouter);

// Static uploads serving with correct image MIME types
const path = require('path');
const uploadsDir = path.join(__dirname, '../../backend/uploads');
const staticUploadOptions = {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.jpeg') || lower.endsWith('.jpg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (lower.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (lower.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (lower.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
};
app.use('/uploads', express.static(uploadsDir, staticUploadOptions));
app.use('/api/v1/uploads/files', express.static(uploadsDir, staticUploadOptions));

// Image fallback: return 200 OK transparent PNG to prevent browser ORB (Opaque Response Blocking) errors
app.use(['/uploads', '/api/v1/uploads/files'], (req, res, next) => {
  const url = req.url || '';
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || req.headers.accept?.includes('image/')) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    return res.status(200).send(transparentPixel);
  }
  next();
});



// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Bootstrap server
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 WOMUP ADMIN MANAGEMENT BACKEND RUNNING ON PORT ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🗄️ MongoDB: cluster0.f8acy45.mongodb.net/wormup (All 21 collections)`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
}

start();
