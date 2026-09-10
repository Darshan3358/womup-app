const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= AREAS =================
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const areas = await db.collection('areas').find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ success: true, count: areas.length, data: areas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDB();
    let {
      name,
      code,
      darkStore,
      address,
      city,
      pincodes,
      centerLat,
      centerLng,
      radiusKm,
      defaultDeliveryMinutes,
      sortOrder,
      isActive,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Zone Name is required' });
    }

    const trimmedName = name.trim();
    const formattedCode = (
      code && typeof code === 'string' && code.trim()
        ? code.trim()
        : trimmedName.toUpperCase().replace(/\s+/g, '_')
    )
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '');

    if (!formattedCode) {
      return res.status(400).json({ success: false, error: 'Zone Code is required' });
    }

    // 1. Check for duplicates: name (case-insensitive) or code
    const existingName = await db.collection('areas').findOne({
      name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: `A zone with the name "${trimmedName}" already exists.`,
      });
    }

    const existingCode = await db.collection('areas').findOne({ code: formattedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: `A zone with code "${formattedCode}" already exists.`,
      });
    }

    const trimmedDarkStore =
      darkStore && typeof darkStore === 'string' && darkStore.trim()
        ? darkStore.trim()
        : `Wom Up ${trimmedName} Dark Store`;

    const trimmedCity = city && typeof city === 'string' && city.trim() ? city.trim() : 'Ahmedabad';
    const trimmedAddress =
      address && typeof address === 'string' && address.trim()
        ? address.trim()
        : `${trimmedName}, ${trimmedCity}`;

    if (sortOrder === undefined) {
      const count = await db.collection('areas').countDocuments({});
      sortOrder = count;
    }

    const newArea = {
      name: trimmedName,
      code: formattedCode,
      darkStore: trimmedDarkStore,
      address: trimmedAddress,
      city: trimmedCity,
      pincodes: Array.isArray(pincodes) ? pincodes : pincodes ? [String(pincodes)] : ['380015'],
      centerLat: centerLat !== undefined && !isNaN(Number(centerLat)) ? Number(centerLat) : 23.0225,
      centerLng: centerLng !== undefined && !isNaN(Number(centerLng)) ? Number(centerLng) : 72.5714,
      radiusKm: Number(radiusKm) || 4.5,
      defaultDeliveryMinutes: Number(defaultDeliveryMinutes) || 10,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('areas').insertOne(newArea);
    newArea._id = result.insertedId;

    // Connect and upsert dark store in stores collection
    await db.collection('stores').updateOne(
      { areaId: result.insertedId },
      {
        $set: {
          name: trimmedDarkStore,
          code: `STORE-${formattedCode}`,
          address: trimmedAddress,
          city: trimmedCity,
          areaId: result.insertedId,
          areaName: trimmedName,
          isActive: newArea.isActive,
          serviceRadiusKm: newArea.radiusKm,
          estimatedDeliveryMinutes: newArea.defaultDeliveryMinutes,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      id: result.insertedId,
      data: newArea,
      message: 'Operational zone created successfully',
    });
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

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await db.collection('areas').updateOne(filter, { $set: body });

    // Also update associated store if darkStore/address/isActive changed
    if (body.darkStore || body.name || body.address || body.isActive !== undefined) {
      const storeUpdate = { updatedAt: new Date() };
      if (body.darkStore) storeUpdate.name = body.darkStore;
      if (body.name) storeUpdate.areaName = body.name;
      if (body.address) storeUpdate.address = body.address;
      if (body.isActive !== undefined) storeUpdate.isActive = body.isActive;

      await db.collection('stores').updateOne(
        { areaId: ObjectId.isValid(id) ? new ObjectId(id) : id },
        { $set: storeUpdate }
      );
    }

    res.json({ success: true, message: 'Area updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

    await db.collection('areas').deleteOne(filter);
    await db.collection('stores').deleteOne({ areaId: ObjectId.isValid(id) ? new ObjectId(id) : id });

    res.json({ success: true, message: 'Area and associated store removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= AREA PRICING =================
router.get('/pricing', async (req, res) => {
  try {
    const db = getDB();
    const { areaId, productId, variantId } = req.query;

    const query = {};
    if (areaId) query.areaId = ObjectId.isValid(areaId) ? new ObjectId(areaId) : areaId;
    if (productId) query.productId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
    if (variantId) query.variantId = ObjectId.isValid(variantId) ? new ObjectId(variantId) : variantId;

    const pricing = await db.collection('area_pricing').find(query).toArray();
    res.json({ success: true, count: pricing.length, data: pricing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pricing', async (req, res) => {
  try {
    const db = getDB();
    const { productId, variantId, areaId, price, mrp, stock, isAvailable } = req.body;

    if (!productId || !variantId || !areaId) {
      return res.status(400).json({
        success: false,
        error: 'productId, variantId, and areaId are required',
      });
    }

    const actualPrice = Number(price);
    if (isNaN(actualPrice) || actualPrice < 0) {
      return res.status(400).json({ success: false, error: 'price must be a valid number >= 0' });
    }

    const actualMrp = mrp !== undefined ? Number(mrp) : actualPrice;
    if (actualPrice > actualMrp) {
      return res.status(400).json({
        success: false,
        error: `Selling price (₹${actualPrice}) cannot be greater than MRP (₹${actualMrp})`,
      });
    }

    const discountPercent = actualMrp > 0 ? Math.round(((actualMrp - actualPrice) / actualMrp) * 100) : 0;

    const pObjId = ObjectId.isValid(productId) ? new ObjectId(productId) : productId;
    const vObjId = ObjectId.isValid(variantId) ? new ObjectId(variantId) : variantId;
    const aObjId = ObjectId.isValid(areaId) ? new ObjectId(areaId) : areaId;

    // Filter matches unique (areaId, variantId) combination
    const filter = {
      $and: [
        { $or: [{ variantId: vObjId }, { variantId: variantId.toString() }] },
        { $or: [{ areaId: aObjId }, { areaId: areaId.toString() }] },
      ],
    };

    const updateDoc = {
      $set: {
        productId: pObjId,
        variantId: vObjId,
        areaId: aObjId,
        price: actualPrice,
        mrp: actualMrp,
        discountPercent,
        stock: stock !== undefined ? Number(stock) : 100,
        isAvailable: isAvailable !== false,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    const result = await db.collection('area_pricing').updateOne(filter, updateDoc, { upsert: true });

    // CRITICAL: We do NOT modify product_variants.sellingPrice or products.sellingPrice.
    // area_pricing is the sole source of truth for zone-specific selling price.

    res.json({
      success: true,
      message: 'Area pricing saved successfully',
      data: {
        productId: pObjId,
        variantId: vObjId,
        areaId: aObjId,
        price: actualPrice,
        mrp: actualMrp,
        discountPercent,
        stock: stock !== undefined ? Number(stock) : 100,
        isAvailable: isAvailable !== false,
      },
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/pricing/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { price, mrp, stock, isAvailable } = req.body;

    const actualPrice = Number(price);
    if (isNaN(actualPrice) || actualPrice < 0) {
      return res.status(400).json({ success: false, error: 'price must be a valid number >= 0' });
    }

    const existing = await db.collection('area_pricing').findOne({
      $or: [{ _id: ObjectId.isValid(id) ? new ObjectId(id) : id }, { _id: id }],
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Area pricing record not found' });
    }

    const actualMrp = mrp !== undefined ? Number(mrp) : existing.mrp || actualPrice;
    if (actualPrice > actualMrp) {
      return res.status(400).json({
        success: false,
        error: `Selling price (₹${actualPrice}) cannot be greater than MRP (₹${actualMrp})`,
      });
    }

    const discountPercent = actualMrp > 0 ? Math.round(((actualMrp - actualPrice) / actualMrp) * 100) : 0;

    await db.collection('area_pricing').updateOne(
      { _id: existing._id },
      {
        $set: {
          price: actualPrice,
          mrp: actualMrp,
          discountPercent,
          ...(stock !== undefined ? { stock: Number(stock) } : {}),
          ...(isAvailable !== undefined ? { isAvailable: !!isAvailable } : {}),
          updatedAt: new Date(),
        },
      }
    );

    res.json({ success: true, message: 'Area pricing updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk update area pricing
router.put('/pricing/bulk', async (req, res) => {
  try {
    const db = getDB();
    const { areaId, categoryId, percentChange, type } = req.body;
    // type: 'increase' | 'decrease'
    const factor = type === 'increase' ? (1 + percentChange / 100) : (1 - percentChange / 100);

    const filter = {};
    if (areaId) filter.areaId = new ObjectId(areaId);

    const items = await db.collection('area_pricing').find(filter).toArray();
    for (const item of items) {
      const newPrice = Math.round(item.price * factor);
      await db.collection('area_pricing').updateOne(
        { _id: item._id },
        { $set: { price: newPrice, updatedAt: new Date() } }
      );
    }

    res.json({ success: true, message: `Bulk adjusted ${items.length} pricing records by ${percentChange}%` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
