const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

const bcrypt = require('bcryptjs');

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = 'Womup@';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// ================= STORES (DARK STORES) =================
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const stores = await db.collection('stores').find({}).sort({ createdAt: -1 }).toArray();

    // Enrich with live operational metrics
    const enriched = await Promise.all(stores.map(async (store) => {
      const sId = store._id;
      const orderCount = await db.collection('orders').countDocuments({ storeId: sId });
      const pendingOrders = await db.collection('orders').countDocuments({
        storeId: sId,
        status: { $in: ['PLACED', 'PACKING'] },
      });
      const riderCount = await db.collection('delivery_partners').countDocuments({
        hubId: sId,
      });

      return {
        id: store._id.toString(),
        _id: store._id,
        code: store.code,
        name: store.name,
        loginId: store.loginId || `womup_${(store.code || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        address: store.address,
        city: store.city,
        pincode: store.pincode,
        location: store.location,
        coordinates: store.location?.coordinates || [72.5606, 23.0827],
        serviceRadiusKm: store.serviceRadiusKm || 4.5,
        estimatedDeliveryMinutes: store.estimatedDeliveryMinutes || 9,
        isActive: store.isActive !== false,
        lastLoginAt: store.lastLoginAt || null,
        orderCount,
        pendingOrders,
        riderCount,
        createdAt: store.createdAt,
      };
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      code,
      address,
      city,
      pincode,
      coordinates,
      latitude,
      longitude,
      serviceRadiusKm,
      estimatedDeliveryMinutes,
      loginId,
      password,
    } = req.body;

    if (!name || !code || !address || !city) {
      return res.status(400).json({ success: false, error: 'Name, code, address, and city are required' });
    }

    const cleanCode = code.toUpperCase().replace(/\s+/g, '_');
    const cleanLoginId = (loginId || `womup_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`).trim();
    const cleanPassword = password || generateRandomPassword();

    // Check duplicate code or loginId
    const existing = await db.collection('stores').findOne({
      $or: [
        { code: cleanCode },
        { loginId: { $regex: new RegExp(`^${cleanLoginId}$`, 'i') } },
      ],
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Store code or Login ID already exists' });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const resolvedCoords = coordinates || [
      Number(longitude) || 72.5606,
      Number(latitude) || 23.0827,
    ];

    const newStore = {
      name: name.trim(),
      code: cleanCode,
      address: address.trim(),
      city: city.trim(),
      pincode: pincode || '380015',
      location: {
        type: 'Point',
        coordinates: resolvedCoords,
      },
      serviceRadiusKm: Number(serviceRadiusKm) || 4.5,
      estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes) || 9,
      openingTime: '07:00',
      closingTime: '23:00',
      loginId: cleanLoginId,
      loginPasswordHash: passwordHash,
      passwordUpdatedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('stores').insertOne(newStore);

    // Provision baseline inventory for this new store
    try {
      const activeProducts = await db.collection('products').find({ isActive: { $ne: false } }).toArray();
      if (activeProducts.length > 0) {
        const inventoryDocs = activeProducts.map((p) => ({
          storeId: result.insertedId,
          productId: p._id,
          availableQty: 25,
          reservedQty: 0,
          soldQty: 0,
          lowStockThreshold: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await db.collection('inventory').insertMany(inventoryDocs);
      }
    } catch (invErr) {
      console.warn('Inventory bootstrap warning:', invErr.message);
    }

    res.status(201).json({
      success: true,
      id: result.insertedId,
      data: {
        ...newStore,
        plainPassword: cleanPassword, // Returned once for Admin to copy/share
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset store password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const newPassword = req.body.password || generateRandomPassword();
    const hash = await bcrypt.hash(newPassword, 10);

    const result = await db.collection('stores').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          loginPasswordHash: hash,
          passwordUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      newPassword,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete or deactivate store
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const storeId = new ObjectId(id);

    // Safety check: prevent deleting stores with active orders
    const activeOrders = await db.collection('orders').countDocuments({
      storeId,
      status: { $nin: ['DELIVERED', 'CANCELLED'] },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete store: ${activeOrders} orders are currently in fulfillment. Complete or cancel them first.`,
      });
    }

    await db.collection('stores').updateOne(
      { _id: storeId },
      { $set: { isActive: false, deletedAt: new Date() } }
    );

    res.json({ success: true, message: 'Store deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const body = req.body;
    delete body._id;
    body.updatedAt = new Date();

    await db.collection('stores').updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ success: true, message: 'Store updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= INVENTORY =================
router.get('/inventory', async (req, res) => {
  try {
    const db = getDB();
    const { storeId, productId, lowStockOnly } = req.query;

    const query = {};
    if (storeId) query.storeId = new ObjectId(storeId);
    if (productId) query.productId = new ObjectId(productId);

    const inventory = await db.collection('inventory').find(query).toArray();
    const products = await db.collection('products').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const storeMap = {};
    stores.forEach(s => { storeMap[s._id.toString()] = s; });

    let items = inventory.map(inv => {
      const prod = productMap[inv.productId ? inv.productId.toString() : ''] || {};
      const store = storeMap[inv.storeId ? inv.storeId.toString() : ''] || {};
      return {
        id: inv._id.toString(),
        storeId: inv.storeId,
        storeName: store.name || 'Main Dark Store',
        productId: inv.productId,
        productName: prod.name || 'Item',
        brand: prod.brand || 'Worm Up',
        category: prod.category || 'Grocery',
        availableQty: inv.availableQty || 0,
        reservedQty: inv.reservedQty || 0,
        soldQty: inv.soldQty || 0,
        lowStockThreshold: inv.lowStockThreshold || 5,
        isLowStock: (inv.availableQty || 0) <= (inv.lowStockThreshold || 5),
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      };
    });

    if (lowStockOnly === 'true') {
      items = items.filter(i => i.isLowStock);
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stock Adjustment (Add, Spoilage, Shrinkage, Correction)
router.post('/inventory/adjust', async (req, res) => {
  try {
    const db = getDB();
    const { inventoryId, storeId, productId, deltaQty, reason, adminName } = req.body;

    let filter = {};
    if (inventoryId) {
      filter = { _id: new ObjectId(inventoryId) };
    } else if (storeId && productId) {
      filter = { storeId: new ObjectId(storeId), productId: new ObjectId(productId) };
    } else {
      return res.status(400).json({ success: false, error: 'inventoryId or (storeId and productId) required' });
    }

    const delta = Number(deltaQty) || 0;
    const inv = await db.collection('inventory').findOne(filter);
    if (!inv) return res.status(404).json({ success: false, error: 'Inventory record not found' });

    const newAvailable = Math.max(0, (inv.availableQty || 0) + delta);
    await db.collection('inventory').updateOne(filter, {
      $set: { availableQty: newAvailable, updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      previousQty: inv.availableQty || 0,
      newAvailableQty: newAvailable,
      reason: reason || 'Inventory adjustment',
      adminName: adminName || 'Admin',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= INVENTORY RESERVATIONS =================
router.get('/reservations', async (req, res) => {
  try {
    const db = getDB();
    const reservations = await db.collection('inventory_reservations').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reservations/:id/release', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const resv = await db.collection('inventory_reservations').findOne({ _id: new ObjectId(id) });
    if (!resv) return res.status(404).json({ success: false, error: 'Reservation not found' });

    await db.collection('inventory_reservations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'RELEASED', updatedAt: new Date() } }
    );

    // Return items to inventory
    if (resv.items && Array.isArray(resv.items)) {
      for (const it of resv.items) {
        if (it.productId) {
          await db.collection('inventory').updateOne(
            { storeId: resv.storeId, productId: it.productId },
            { $inc: { reservedQty: -it.quantity, availableQty: it.quantity } }
          );
        }
      }
    }

    res.json({ success: true, message: 'Reservation released and stock returned to available inventory' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
