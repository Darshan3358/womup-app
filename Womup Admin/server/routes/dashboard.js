const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const db = getDB();

    // 1. Users
    const totalUsers = await db.collection('users').countDocuments({});
    const activeUsers = await db.collection('users').countDocuments({ isActive: { $ne: false } });

    // 2. Orders
    const allOrders = await db.collection('orders').find({}).toArray();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfToday);
    const activeOrders = allOrders.filter(o => o.status && !['DELIVERED', 'CANCELLED'].includes(o.status.toUpperCase()));
    const deliveredOrders = allOrders.filter(o => (o.status || '').toUpperCase() === 'DELIVERED');
    const cancelledOrders = allOrders.filter(o => (o.status || '').toUpperCase() === 'CANCELLED');

    const totalRevenue = allOrders
      .filter(o => (o.paymentStatus || '').toUpperCase() === 'COMPLETED' || (o.status || '').toUpperCase() === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayRevenue = todayOrders
      .filter(o => (o.paymentStatus || '').toUpperCase() === 'COMPLETED' || (o.status || '').toUpperCase() === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // 3. Print Orders
    const totalPrintOrders = await db.collection('print_orders').countDocuments({});
    const pendingPrintOrders = await db.collection('print_orders').countDocuments({
      status: { $in: ['UPLOADED', 'PROCESSING', 'PRINTING'] }
    });

    // 4. Products & Inventory
    const totalProducts = await db.collection('products').countDocuments({ isActive: { $ne: false } });
    const inventoryItems = await db.collection('inventory').find({}).toArray();
    const lowStockItems = inventoryItems.filter(i => (i.availableQty || 0) <= (i.lowStockThreshold || 10));

    // 5. Stores & Areas
    const activeStores = await db.collection('stores').countDocuments({ isActive: { $ne: false } });
    const activeAreas = await db.collection('areas').countDocuments({ isActive: { $ne: false } });

    // 6. Financial & Coins
    const totalWalletTxs = await db.collection('wallet_transactions').countDocuments({});
    const coinLedger = await db.collection('coin_transactions').find({}).toArray();
    const totalCoinsIssued = coinLedger
      .filter(c => ['BONUS', 'EARN'].includes((c.type || '').toUpperCase()))
      .reduce((sum, c) => sum + (c.coins || 0), 0);

    // Operational Widgets
    // A. Live Orders Breakdown
    const liveOrdersByStage = {
      PLACED: allOrders.filter(o => (o.status || '').toUpperCase() === 'PLACED').length,
      CONFIRMED: allOrders.filter(o => (o.status || '').toUpperCase() === 'CONFIRMED').length,
      PACKING: allOrders.filter(o => (o.status || '').toUpperCase() === 'PACKING').length,
      OUT_FOR_DELIVERY: allOrders.filter(o => (o.status || '').toUpperCase() === 'OUT_FOR_DELIVERY').length,
      DELIVERED: deliveredOrders.length,
      CANCELLED: cancelledOrders.length,
    };

    // B. Low Stock alerts with product names
    const products = await db.collection('products').find({}).toArray();
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p.name; });

    const lowStockAlerts = lowStockItems.slice(0, 10).map(i => ({
      id: i._id.toString(),
      productId: i.productId ? i.productId.toString() : '',
      name: productMap[i.productId ? i.productId.toString() : ''] || 'Grocery Product',
      availableQty: i.availableQty || 0,
      lowStockThreshold: i.lowStockThreshold || 10,
    }));

    // C. Area Performance
    const areas = await db.collection('areas').find({}).toArray();
    const areaPerformance = areas.map(a => {
      const areaOrders = allOrders.filter(o => {
        const addr = (o.deliveryAddress && (o.deliveryAddress.street || o.deliveryAddress.city)) || '';
        return addr.toLowerCase().includes(a.name.toLowerCase());
      });
      const areaRevenue = areaOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        id: a._id.toString(),
        name: a.name,
        ordersCount: areaOrders.length,
        revenue: areaRevenue,
        deliveryETA: `${a.defaultDeliveryMinutes || 9} mins`,
      };
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalCustomers: totalUsers,
          activeCustomers: activeUsers,
          todayOrders: todayOrders.length,
          activeOrders: activeOrders.length,
          deliveredOrders: deliveredOrders.length,
          cancelledOrders: cancelledOrders.length,
          todayRevenue,
          totalRevenue,
          printOrders: totalPrintOrders,
          pendingPrintOrders,
          totalProducts,
          lowStockCount: lowStockItems.length,
          activeStores,
          activeAreas,
          walletTransactionsCount: totalWalletTxs,
          shoppingCoinsIssued: totalCoinsIssued,
        },
        widgets: {
          liveOrdersByStage,
          lowStockAlerts,
          areaPerformance,
          recentOrders: allOrders.slice(-5).reverse().map(o => ({
            id: o._id.toString(),
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt,
          })),
        }
      }
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
