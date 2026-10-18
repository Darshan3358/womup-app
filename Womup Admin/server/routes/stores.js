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
    const stores = await db.collection('stores').find({
      deletedAt: { $exists: false },
      isActive: { $ne: false },
    }).sort({ createdAt: -1 }).toArray();

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

      // Live staff on-shift calculation
      const staffTotal = await db.collection('store_staff').countDocuments({
        $or: [{ storeId: sId }, { storeId: sId.toString() }],
        status: { $ne: 'INACTIVE' },
      });

      const staffOnShift = await db.collection('store_staff').countDocuments({
        $or: [{ storeId: sId }, { storeId: sId.toString() }],
        isOnShift: true,
      });

      const effectiveStaffOnShift = staffOnShift > 0
        ? staffOnShift
        : (store.isOnShift === true ? 1 : 0);
      const effectiveStaffTotal = Math.max(staffTotal, effectiveStaffOnShift, 1);
      const isOnline = (store.isActive !== false) && (effectiveStaffOnShift > 0);

      return {
        id: store._id.toString(),
        _id: store._id,
        code: store.code,
        name: store.name,
        loginId: store.loginId || `womup_${(store.code || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        address: store.address,
        city: store.cityName || store.city,
        cityName: store.cityName || store.city,
        cityId: store.cityId ? store.cityId.toString() : null,
        areaId: store.areaId ? store.areaId.toString() : null,
        areaName: store.areaName || null,
        pincode: store.pincode,
        location: store.location,
        coordinates: store.location?.coordinates || [72.5606, 23.0827],
        serviceRadiusKm: store.serviceRadiusKm || 4.5,
        estimatedDeliveryMinutes: store.estimatedDeliveryMinutes || 9,
        isActive: store.isActive !== false,
        isOnShift: effectiveStaffOnShift > 0,
        isOnline,
        staffOnShift: effectiveStaffOnShift,
        staffTotal: effectiveStaffTotal,
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
      cityId,
      areaId,
      pincode,
      coordinates,
      latitude,
      longitude,
      serviceRadiusKm,
      estimatedDeliveryMinutes,
      loginId,
      password,
    } = req.body;

    if (!name || !code || !address) {
      return res.status(400).json({ success: false, error: 'Name, code, and address are required' });
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

    // Resolve Area & City with strict 1-store-per-area constraint
    let resolvedArea = null;
    let resolvedCity = null;

    if (areaId) {
      const areaQuery = ObjectId.isValid(areaId)
        ? { _id: new ObjectId(areaId) }
        : { code: areaId.toUpperCase() };
      resolvedArea = await db.collection('areas').findOne(areaQuery);

      if (!resolvedArea) {
        return res.status(400).json({ success: false, error: 'Selected area does not exist' });
      }

      // MULTI-STORE CAPACITY VALIDATION:
      const activeStoresInArea = await db.collection('stores').countDocuments({
        $or: [{ areaId: resolvedArea._id }, { areaId: resolvedArea._id.toString() }],
        isActive: true,
      });
      const maxStores = Number(resolvedArea.maxStores) || 1;

      if (activeStoresInArea >= maxStores) {
        return res.status(409).json({
          success: false,
          error: `Area "${resolvedArea.name}" has reached maximum capacity (${activeStoresInArea}/${maxStores} stores). Increase the area limit in Location Management or choose another area.`,
        });
      }

      if (resolvedArea.cityId) {
        resolvedCity = await db.collection('cities').findOne({
          $or: [{ _id: resolvedArea.cityId }, { _id: new ObjectId(resolvedArea.cityId.toString()) }],
        });
      }
    }

    if (!resolvedCity && cityId) {
      const cityQuery = ObjectId.isValid(cityId)
        ? { _id: new ObjectId(cityId) }
        : { code: cityId.toUpperCase() };
      resolvedCity = await db.collection('cities').findOne(cityQuery);
    }

    const finalCityName = resolvedCity?.name || resolvedArea?.cityName || (typeof city === 'string' && city.trim()) || 'Ahmedabad';
    const finalCityId = resolvedCity?._id || resolvedArea?.cityId || null;

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const resolvedCoords = coordinates || [
      Number(longitude) || resolvedArea?.centerLng || 72.5606,
      Number(latitude) || resolvedArea?.centerLat || 23.0827,
    ];

    const newStore = {
      name: name.trim(),
      code: cleanCode,
      address: address.trim(),
      city: finalCityName,
      cityName: finalCityName,
      cityId: finalCityId,
      areaId: resolvedArea ? resolvedArea._id : null,
      areaName: resolvedArea ? resolvedArea.name : null,
      pincode: pincode || resolvedArea?.pincodes?.[0] || '380015',
      location: {
        type: 'Point',
        coordinates: resolvedCoords,
      },
      serviceRadiusKm: Number(serviceRadiusKm) || resolvedArea?.radiusKm || 4.5,
      estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes) || resolvedArea?.defaultDeliveryMinutes || 9,
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
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Store ID' });
    }
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

    // Permanently remove from stores collection, plus inventory and staff
    await db.collection('stores').deleteOne({ _id: storeId });
    await db.collection('inventory').deleteMany({
      $or: [{ storeId }, { storeId: id }],
    });
    await db.collection('store_staff').deleteMany({
      $or: [{ storeId }, { storeId: id }],
    });

    res.json({ success: true, message: 'Store deleted successfully from MongoDB' });
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

    const storeId = ObjectId.isValid(id) ? new ObjectId(id) : id;

    // Sanitize and handle coordinates
    if (body.latitude !== undefined && body.longitude !== undefined) {
      const lat = parseFloat(body.latitude);
      const lng = parseFloat(body.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        body.location = { type: 'Point', coordinates: [lng, lat] };
        body.coordinates = [lng, lat];
        body.latitude = lat;
        body.longitude = lng;
      }
    } else if (body.coordinates && Array.isArray(body.coordinates) && body.coordinates.length === 2) {
      const lng = parseFloat(body.coordinates[0]);
      const lat = parseFloat(body.coordinates[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        body.location = { type: 'Point', coordinates: [lng, lat] };
        body.coordinates = [lng, lat];
        body.latitude = lat;
        body.longitude = lng;
      }
    }

    // Sanitize numbers
    if (body.serviceRadiusKm !== undefined) {
      body.serviceRadiusKm = Number(body.serviceRadiusKm) || 4.5;
    }
    if (body.estimatedDeliveryMinutes !== undefined) {
      body.estimatedDeliveryMinutes = Number(body.estimatedDeliveryMinutes) || 9;
    }

    // Check duplicate code or loginId against other stores
    if (body.code || body.loginId) {
      const orClauses = [];
      if (body.code) {
        body.code = String(body.code).trim().toUpperCase();
        orClauses.push({ code: body.code });
      }
      if (body.loginId) {
        body.loginId = String(body.loginId).trim();
        orClauses.push({ loginId: { $regex: new RegExp(`^${body.loginId}$`, 'i') } });
      }

      const duplicate = await db.collection('stores').findOne({
        _id: { $ne: storeId },
        deletedAt: { $exists: false },
        $or: orClauses,
      });

      if (duplicate) {
        const isCodeDuplicate = body.code && duplicate.code === body.code;
        return res.status(409).json({
          success: false,
          error: isCodeDuplicate
            ? `Store code "${body.code}" is already in use by another dark store (${duplicate.name}).`
            : `Login ID "${body.loginId}" is already taken by another store.`,
        });
      }
    }

    // If updating areaId, enforce 1-store-per-area rule!
    if (body.areaId) {
      const areaQuery = ObjectId.isValid(body.areaId)
        ? { _id: new ObjectId(body.areaId) }
        : { code: body.areaId.toUpperCase() };
      const resolvedArea = await db.collection('areas').findOne(areaQuery);

      if (!resolvedArea) {
        return res.status(400).json({ success: false, error: 'Selected area does not exist' });
      }

      // MULTI-STORE CAPACITY VALIDATION: Check if another store has this area and if area is full
      const existingOtherStoresCount = await db.collection('stores').countDocuments({
        _id: { $ne: storeId },
        $or: [{ areaId: resolvedArea._id }, { areaId: resolvedArea._id.toString() }],
        isActive: true,
      });
      const maxStores = Number(resolvedArea.maxStores) || 1;

      if (existingOtherStoresCount >= maxStores) {
        return res.status(409).json({
          success: false,
          error: `Area "${resolvedArea.name}" has reached maximum capacity (${existingOtherStoresCount}/${maxStores} stores). Increase the area limit in Location Management or choose another area.`,
        });
      }

      body.areaId = resolvedArea._id;
      body.areaName = resolvedArea.name;
      body.cityId = resolvedArea.cityId || body.cityId;
      body.cityName = resolvedArea.cityName || resolvedArea.city || body.city;
      body.city = resolvedArea.cityName || resolvedArea.city || body.city;
    }

    const storeQuery = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: String(id) }, { id: String(id) }] }
      : { $or: [{ _id: String(id) }, { id: String(id) }] };

    await db.collection('stores').updateOne(storeQuery, { $set: body });
    const updated = await db.collection('stores').findOne(storeQuery);
    res.json({ success: true, message: 'Store updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dedicated endpoint to assign/reassign store to city & area
router.post('/:id/assign-area', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { areaId, cityId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid store ID' });
    }
    const storeId = new ObjectId(id);

    const store = await db.collection('stores').findOne({ _id: storeId });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    if (!areaId) {
      return res.status(400).json({ success: false, error: 'areaId is required' });
    }

    const areaQuery = ObjectId.isValid(areaId)
      ? { _id: new ObjectId(areaId) }
      : { code: areaId.toUpperCase() };
    const targetArea = await db.collection('areas').findOne(areaQuery);

    if (!targetArea) {
      return res.status(404).json({ success: false, error: 'Area not found' });
    }

    // Verify 1 store per area: ensure no OTHER active store is in targetArea
    const conflictingStore = await db.collection('stores').findOne({
      _id: { $ne: storeId },
      $or: [{ areaId: targetArea._id }, { areaId: targetArea._id.toString() }],
      isActive: true,
    });

    if (conflictingStore) {
      return res.status(409).json({
        success: false,
        error: `Area "${targetArea.name}" already has an active store assigned ("${conflictingStore.name}"). Cannot assign multiple stores to the same area.`,
      });
    }

    // Resolve city
    let targetCity = null;
    if (targetArea.cityId) {
      targetCity = await db.collection('cities').findOne({
        $or: [{ _id: targetArea.cityId }, { _id: new ObjectId(targetArea.cityId.toString()) }],
      });
    }
    if (!targetCity && cityId) {
      targetCity = await db.collection('cities').findOne({
        $or: [{ _id: new ObjectId(cityId) }, { code: cityId.toUpperCase() }],
      });
    }

    const updates = {
      areaId: targetArea._id,
      areaName: targetArea.name,
      cityId: targetCity ? targetCity._id : targetArea.cityId || null,
      cityName: targetCity ? targetCity.name : targetArea.cityName || targetArea.city,
      city: targetCity ? targetCity.name : targetArea.cityName || targetArea.city,
      updatedAt: new Date(),
    };

    await db.collection('stores').updateOne({ _id: storeId }, { $set: updates });

    res.json({
      success: true,
      message: `Store "${store.name}" successfully assigned to ${targetArea.name}, ${updates.cityName}`,
      data: {
        storeId: store._id.toString(),
        storeName: store.name,
        areaId: targetArea._id.toString(),
        areaName: targetArea.name,
        cityId: updates.cityId ? updates.cityId.toString() : null,
        cityName: updates.cityName,
      },
    });
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
    if (storeId) {
      const sId = ObjectId.isValid(storeId) ? new ObjectId(storeId) : storeId;
      query.storeId = { $in: [sId, storeId.toString()] };
    }
    if (productId) {
      const pId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
      query.productId = { $in: [pId, productId.toString()] };
    }

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
        shelfLocation: inv.shelfLocation || prod.shelfLocation || 'Not set',
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

// Update Shelf Location in Dark Store Inventory
router.post('/inventory/shelf', async (req, res) => {
  try {
    const db = getDB();
    const { inventoryId, storeId, productId, shelfLocation } = req.body;
    const cleanShelf = (shelfLocation || '').trim().toUpperCase();

    let filter = {};
    if (inventoryId && ObjectId.isValid(inventoryId)) {
      filter = { _id: new ObjectId(inventoryId) };
    } else if (storeId && productId) {
      const sId = ObjectId.isValid(storeId) ? new ObjectId(storeId) : storeId;
      const pId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
      filter = {
        storeId: { $in: [sId, storeId.toString()] },
        productId: { $in: [pId, productId.toString()] },
      };
    } else {
      return res.status(400).json({ success: false, error: 'inventoryId or (storeId and productId) required' });
    }

    await db.collection('inventory').updateOne(filter, {
      $set: { shelfLocation: cleanShelf, updatedAt: new Date() }
    });

    if (productId) {
      const pId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
      await db.collection('products').updateOne(
        { _id: pId },
        { $set: { shelfLocation: cleanShelf } }
      ).catch(() => {});
    }

    res.json({ success: true, shelfLocation: cleanShelf, message: `Shelf location assigned to ${cleanShelf}` });
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
    if (inventoryId && ObjectId.isValid(inventoryId)) {
      filter = { _id: new ObjectId(inventoryId) };
    } else if (storeId && productId) {
      const sId = ObjectId.isValid(storeId) ? new ObjectId(storeId) : storeId;
      const pId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
      filter = {
        storeId: { $in: [sId, storeId.toString()] },
        productId: { $in: [pId, productId.toString()] },
      };
    } else {
      return res.status(400).json({ success: false, error: 'inventoryId or (storeId and productId) required' });
    }

    const delta = Number(deltaQty) || 0;
    let inv = await db.collection('inventory').findOne(filter);
    
    // If not found but storeId and productId are present, initialize record for this store
    if (!inv && storeId && productId) {
      const sId = ObjectId.isValid(storeId) ? new ObjectId(storeId) : storeId;
      const pId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
      const newDoc = {
        storeId: sId,
        productId: pId,
        availableQty: Math.max(0, 50 + delta),
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const insertRes = await db.collection('inventory').insertOne(newDoc);
      inv = { ...newDoc, _id: insertRes.insertedId };
    }

    if (!inv) return res.status(404).json({ success: false, error: 'Inventory record not found' });

    const newAvailable = Math.max(0, (inv.availableQty || 0) + delta);
    await db.collection('inventory').updateOne({ _id: inv._id }, {
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
