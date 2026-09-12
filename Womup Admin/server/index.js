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
    const users = await db.collection('users').find({}).toArray();
    const orders = await db.collection('orders').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const categories = await db.collection('categories').find({}).toArray();
    const areas = await db.collection('areas').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();
    const inventory = await db.collection('inventory').find({}).toArray();
    const coinTransactions = await db.collection('coin_transactions').find({}).toArray();
    const coupons = await db.collection('coupons').find({}).toArray();
    const orderHistory = await db.collection('order_status_history').find({}).toArray();
    const addresses = await db.collection('addresses').find({}).toArray();
    const printOrders = await db.collection('print_orders').find({}).toArray();
    const productVariants = await db.collection('product_variants').find({}).toArray();
    const areaPricing = await db.collection('area_pricing').find({}).toArray();
    const banners = await db.collection('banners').find({}).toArray();

    res.json({
      users,
      orders,
      products,
      productVariants,
      areaPricing,
      categories,
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

// Mount Admin Management Modules
app.use('/api/admin/dashboard', dashboardRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/catalog', catalogRouter);
app.use('/api/admin/areas', areasRouter);
app.use('/api/admin/stores', storesRouter);
app.use('/api/admin/orders', ordersRouter);
app.use('/api/admin/print-orders', printOrdersRouter);
app.use('/api/admin/marketing', marketingRouter);
app.use('/api/admin/finance', financeRouter);
app.use('/api/admin/security', securityRouter);

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
