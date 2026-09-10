const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= STORES (DARK STORES) =================
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const stores = await db.collection('stores').find({}).toArray();
    res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { name, code, address, city, pincode, coordinates, serviceRadiusKm, estimatedDeliveryMinutes, openingTime, closingTime } = req.body;

    if (!name || !code || !address || !city) {
      return res.status(400).json({ success: false, error: 'Name, code, address, and city are required' });
    }

    const newStore = {
      name,
      code,
      address,
      city,
      pincode: pincode || '',
      location: {
        type: 'Point',
        coordinates: coordinates || [72.5074, 23.0138],
      },
      serviceRadiusKm: Number(serviceRadiusKm) || 5,
      estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes) || 9,
      openingTime: openingTime || '07:00',
      closingTime: closingTime || '23:00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('stores').insertOne(newStore);
    res.status(201).json({ success: true, id: result.insertedId, data: newStore });
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
