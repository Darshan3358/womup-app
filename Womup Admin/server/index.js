const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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

// Mobile App Realtime Snapshot compatibility route
app.get('/api/realtime-data', async (req, res) => {
  try {
    const db = getDB();
    const rawDeliveryPartners = await db.collection('delivery_partners').find({}).toArray();
    const partnerUserIds = rawDeliveryPartners.map(p => p.userId?.toString()).filter(Boolean);

    // Only genuine customers (exclude delivery partners and admins)
    const users = await db.collection('users').find({
      role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
      _id: {
        $nin: partnerUserIds
          .map(id => {
            try { return new ObjectId(id); } catch { return null; }
          })
          .filter(Boolean),
      },
    }).toArray();
    const orders = await db.collection('orders').find({}).toArray();

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
    const products = await db.collection('products').find({}).toArray();
    const categories = await db.collection('categories').find({}).toArray();
    const rawAreas = await db.collection('areas').find({}).toArray();
    const rawStores = await db.collection('stores').find({
      deletedAt: { $exists: false },
      isActive: { $ne: false },
    }).toArray();
    const storeStaffList = await db.collection('store_staff').find({}).toArray();

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
        })),
        assignedStore: areaStores[0] || null,
      };
    });

    const inventory = await db.collection('inventory').find({}).toArray();
    const coinTransactions = await db.collection('coin_transactions').find({}).toArray();
    const coupons = await db.collection('coupons').find({}).toArray();
    const orderHistory = await db.collection('order_status_history').find({}).toArray();
    const addresses = await db.collection('addresses').find({}).toArray();
    const printOrders = await db.collection('print_orders').find({}).toArray();
    const productVariants = await db.collection('product_variants').find({}).toArray();
    const areaPricing = await db.collection('area_pricing').find({}).toArray();
    const cities = await db.collection('cities').find({}).sort({ sortOrder: 1, name: 1 }).toArray();
    const banners = await db.collection('banners').find({}).sort({ sortOrder: 1 }).toArray();

    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { ObjectId } = require('mongodb');

// Explicit Customers vs Delivery Partners endpoints
app.get('/api/admin/customers', async (req, res) => {
  try {
    const db = getDB();
    const deliveryPartners = await db.collection('delivery_partners').find({}).toArray();
    const partnerUserIds = deliveryPartners.map(p => p.userId?.toString()).filter(Boolean);

    const customers = await db.collection('users').find({
      role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
      _id: {
        $nin: partnerUserIds
          .map(id => {
            try { return new ObjectId(id); } catch { return null; }
          })
          .filter(Boolean),
      },
    }).toArray();
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/riders', async (req, res) => {
  try {
    const db = getDB();
    const riders = await db.collection('delivery_partners').find({}).toArray();
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
    if (rider.userId) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(rider.userId.toString()) });
      if (user) {
        email = user.email || '';
      }
    }

    let bankAccount = null;
    const bankDoc = await db.collection('rider_bank_accounts').findOne({
      $or: [{ riderId: rider._id }, { userId: rider.userId }]
    });
    if (bankDoc) {
      bankAccount = {
        accountNumber: bankDoc.accountNumber,
        ifscCode: bankDoc.ifscCode,
        bankName: bankDoc.bankName,
        accountHolderName: bankDoc.accountHolderName,
        isVerified: bankDoc.isVerified,
      };
    }

    res.json({
      success: true,
      data: {
        ...rider,
        email,
        bankAccount,
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
app.use('/api/finance', financeRouter);

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
