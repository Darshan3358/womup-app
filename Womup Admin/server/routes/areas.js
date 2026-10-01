const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= AREAS =================
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { cityId } = req.query;

    const query = {};
    if (cityId) {
      if (ObjectId.isValid(cityId)) {
        query.$or = [{ cityId: new ObjectId(cityId) }, { cityId: cityId.toString() }];
      } else {
        query.cityId = cityId;
      }
    }

    const areas = await db.collection('areas').find(query).sort({ sortOrder: 1, name: 1 }).toArray();

    // Enrich each area with assigned store info and city info
    const enriched = await Promise.all(
      areas.map(async (area) => {
        const areaId = area._id;
        const assignedStore = await db.collection('stores').findOne({
          $or: [{ areaId }, { areaId: areaId.toString() }],
          isActive: true,
        });

        // Resolve city name if cityId exists
        let resolvedCityName = area.cityName || area.city || 'Ahmedabad';
        if (area.cityId && ObjectId.isValid(area.cityId)) {
          const cityDoc = await db.collection('cities').findOne({ _id: new ObjectId(area.cityId.toString()) });
          if (cityDoc) resolvedCityName = cityDoc.name;
        }

        return {
          id: area._id.toString(),
          _id: area._id,
          name: area.name,
          code: area.code,
          darkStore: area.darkStore,
          address: area.address,
          city: resolvedCityName,
          cityName: resolvedCityName,
          cityId: area.cityId ? area.cityId.toString() : null,
          pincodes: area.pincodes || [],
          centerLat: area.centerLat,
          centerLng: area.centerLng,
          radiusKm: area.radiusKm || 4.5,
          defaultDeliveryMinutes: area.defaultDeliveryMinutes || 9,
          sortOrder: area.sortOrder || 0,
          isActive: area.isActive !== false,
          hasActiveStore: Boolean(assignedStore),
          assignedStore: assignedStore
            ? {
                id: assignedStore._id.toString(),
                _id: assignedStore._id,
                name: assignedStore.name,
                code: assignedStore.code,
                loginId: assignedStore.loginId,
                address: assignedStore.address,
              }
            : null,
          createdAt: area.createdAt,
          updatedAt: area.updatedAt,
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
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
      cityId,
      city,
      darkStore,
      address,
      pincodes,
      centerLat,
      centerLng,
      radiusKm,
      defaultDeliveryMinutes,
      sortOrder,
      isActive,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Area Name is required' });
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
      return res.status(400).json({ success: false, error: 'Area Code is required' });
    }

    // Resolve City document
    let targetCity = null;
    if (cityId) {
      if (ObjectId.isValid(cityId)) {
        targetCity = await db.collection('cities').findOne({ _id: new ObjectId(cityId) });
      } else {
        targetCity = await db.collection('cities').findOne({ code: cityId.toUpperCase() });
      }
    }
    if (!targetCity && city) {
      targetCity = await db.collection('cities').findOne({
        name: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
      });
    }
    if (!targetCity) {
      // Default to first active city (Ahmedabad)
      targetCity = (await db.collection('cities').findOne({ status: 'Active' })) || {
        _id: new ObjectId(),
        name: 'Ahmedabad',
        code: 'AHM',
      };
    }

    // Check duplicate area name within the SAME city
    const existingName = await db.collection('areas').findOne({
      $or: [{ cityId: targetCity._id }, { cityId: targetCity._id.toString() }, { cityName: targetCity.name }],
      name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: `An area with the name "${trimmedName}" already exists in ${targetCity.name}.`,
      });
    }

    const existingCode = await db.collection('areas').findOne({ code: formattedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: `An area with code "${formattedCode}" already exists.`,
      });
    }

    const trimmedDarkStore =
      darkStore && typeof darkStore === 'string' && darkStore.trim()
        ? darkStore.trim()
        : `Wom Up ${trimmedName} Dark Store`;

    const trimmedCity = targetCity.name;
    const trimmedAddress =
      address && typeof address === 'string' && address.trim()
        ? address.trim()
        : `${trimmedName}, ${trimmedCity}`;

    if (sortOrder === undefined) {
      const count = await db.collection('areas').countDocuments({});
      sortOrder = count + 1;
    }

    const newArea = {
      name: trimmedName,
      code: formattedCode,
      cityId: targetCity._id,
      cityName: targetCity.name,
      city: targetCity.name,
      darkStore: trimmedDarkStore,
      address: trimmedAddress,
      pincodes: Array.isArray(pincodes) ? pincodes : pincodes ? [String(pincodes)] : ['380015'],
      centerLat: centerLat !== undefined && !isNaN(Number(centerLat)) ? Number(centerLat) : 23.0225,
      centerLng: centerLng !== undefined && !isNaN(Number(centerLng)) ? Number(centerLng) : 72.5714,
      radiusKm: Number(radiusKm) || 4.5,
      defaultDeliveryMinutes: Number(defaultDeliveryMinutes) || 9,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('areas').insertOne(newArea);
    newArea._id = result.insertedId;
    newArea.id = result.insertedId.toString();

    res.status(201).json({
      success: true,
      id: result.insertedId.toString(),
      data: {
        ...newArea,
        hasActiveStore: false,
        assignedStore: null,
      },
      message: `Area "${trimmedName}" created successfully under ${targetCity.name}`,
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

    if (body.cityId && ObjectId.isValid(body.cityId)) {
      const cityDoc = await db.collection('cities').findOne({ _id: new ObjectId(body.cityId) });
      if (cityDoc) {
        body.cityId = cityDoc._id;
        body.cityName = cityDoc.name;
        body.city = cityDoc.name;
      }
    }

    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await db.collection('areas').updateOne(filter, { $set: body });

    // Also update associated store if darkStore/address/name/city changed
    if (body.darkStore || body.name || body.address || body.isActive !== undefined || body.cityName) {
      const storeUpdate = { updatedAt: new Date() };
      if (body.darkStore) storeUpdate.name = body.darkStore;
      if (body.name) storeUpdate.areaName = body.name;
      if (body.address) storeUpdate.address = body.address;
      if (body.cityName) {
        storeUpdate.city = body.cityName;
        storeUpdate.cityName = body.cityName;
      }
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

    // Prevent deletion if an active store is assigned
    const activeStore = await db.collection('stores').findOne({
      $or: [
        { areaId: ObjectId.isValid(id) ? new ObjectId(id) : id },
        { areaId: id.toString() },
      ],
      isActive: true,
    });

    if (activeStore) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete this area because active store "${activeStore.name}" is assigned to it. Reassign or delete the store first.`,
      });
    }

    await db.collection('areas').deleteOne(filter);
    res.json({ success: true, message: 'Area removed successfully' });
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
