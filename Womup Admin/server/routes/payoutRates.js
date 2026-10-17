const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= RIDER PER-KM PAYOUT RATES =================

// 1. GET /api/admin/payout-rates — List all rates with statistics
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const rates = await db
      .collection('rider_payout_rates')
      .find({})
      .sort({ scope: 1, cityName: 1, areaName: 1, createdAt: -1 })
      .toArray();

    // Map to normalized items
    const normalized = rates.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      scope: r.scope, // 'GLOBAL' | 'CITY' | 'AREA'
      cityId: r.cityId ? r.cityId.toString() : null,
      cityName: r.cityName || null,
      areaId: r.areaId ? r.areaId.toString() : null,
      areaName: r.areaName || null,
      ratePerKm: Number(r.ratePerKm) || 10,
      minimumPayout: Number(r.minimumPayout) || 30,
      maximumPayout: Number(r.maximumPayout) || 150,
      isActive: r.isActive !== false,
      effectiveFrom: r.effectiveFrom || r.createdAt,
      effectiveUntil: r.effectiveUntil || null,
      description: r.description || '',
      createdAt: r.createdAt || new Date(),
      updatedAt: r.updatedAt || new Date(),
    }));

    const globalRate = normalized.find((r) => r.scope === 'GLOBAL') || {
      id: 'default_global',
      scope: 'GLOBAL',
      ratePerKm: 10,
      minimumPayout: 30,
      maximumPayout: 150,
      isActive: true,
      description: 'Default Global Rate (fallback)',
    };

    const activeOverrides = normalized.filter((r) => r.scope !== 'GLOBAL' && r.isActive);
    const allRatesNums = normalized.map((r) => r.ratePerKm).filter((n) => !isNaN(n));
    const minRate = allRatesNums.length > 0 ? Math.min(...allRatesNums) : 10;
    const maxRate = allRatesNums.length > 0 ? Math.max(...allRatesNums) : 18;

    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
      globalRate,
      stats: {
        totalRates: normalized.length,
        activeOverridesCount: activeOverrides.length,
        globalRatePerKm: globalRate.ratePerKm,
        rateRangeText: `₹${minRate} - ₹${maxRate}`,
        minRate,
        maxRate,
      },
    });
  } catch (err) {
    console.error('[PayoutRates GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/admin/payout-rates/resolve — Resolve effective rate for specific city/area
router.get('/resolve', async (req, res) => {
  try {
    const { cityId, areaId, cityName, areaName, distanceKm } = req.query;
    const db = getDB();

    const dist = parseFloat(distanceKm) || 5.0;

    // Priority 1: Area-level override
    let resolvedRate = null;
    let winningScope = 'GLOBAL';

    if (areaId || areaName) {
      const areaQuery = { scope: 'AREA', isActive: { $ne: false } };
      if (areaId && ObjectId.isValid(areaId)) {
        areaQuery.$or = [{ areaId: new ObjectId(areaId) }, { areaId: areaId.toString() }];
      } else if (areaName) {
        areaQuery.areaName = new RegExp(`^${areaName.trim()}$`, 'i');
      }

      resolvedRate = await db.collection('rider_payout_rates').findOne(areaQuery);
      if (resolvedRate) winningScope = 'AREA';
    }

    // Priority 2: City-level override
    if (!resolvedRate && (cityId || cityName)) {
      const cityQuery = { scope: 'CITY', isActive: { $ne: false } };
      if (cityId && ObjectId.isValid(cityId)) {
        cityQuery.$or = [{ cityId: new ObjectId(cityId) }, { cityId: cityId.toString() }];
      } else if (cityName) {
        cityQuery.cityName = new RegExp(`^${cityName.trim()}$`, 'i');
      }

      resolvedRate = await db.collection('rider_payout_rates').findOne(cityQuery);
      if (resolvedRate) winningScope = 'CITY';
    }

    // Priority 3: Global rate
    if (!resolvedRate) {
      resolvedRate = await db.collection('rider_payout_rates').findOne({ scope: 'GLOBAL', isActive: { $ne: false } });
      if (resolvedRate) winningScope = 'GLOBAL';
    }

    // Fallback if not configured in DB
    const finalRatePerKm = resolvedRate ? Number(resolvedRate.ratePerKm) : 10;
    const minPayout = resolvedRate ? Number(resolvedRate.minimumPayout) : 30;
    const maxPayout = resolvedRate ? Number(resolvedRate.maximumPayout) : 150;

    const rawCalculated = dist * finalRatePerKm;
    const clampedPayout = Math.min(maxPayout, Math.max(minPayout, Math.round(rawCalculated)));

    return res.json({
      success: true,
      winningScope,
      resolvedRate: {
        id: resolvedRate?._id?.toString() || 'fallback',
        scope: winningScope,
        ratePerKm: finalRatePerKm,
        minimumPayout: minPayout,
        maximumPayout: maxPayout,
        cityName: resolvedRate?.cityName || cityName || null,
        areaName: resolvedRate?.areaName || areaName || null,
        description: resolvedRate?.description || 'Rate applied',
      },
      calculation: {
        distanceKm: dist,
        ratePerKm: finalRatePerKm,
        rawPayout: Math.round(rawCalculated * 100) / 100,
        minimumFloorApplied: rawCalculated < minPayout,
        maximumCapApplied: rawCalculated > maxPayout,
        finalPayout: clampedPayout,
      },
    });
  } catch (err) {
    console.error('[PayoutRates RESOLVE Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/admin/payout-rates — Create a new rate
router.post('/', async (req, res) => {
  try {
    const {
      scope,
      cityId,
      cityName,
      areaId,
      areaName,
      ratePerKm,
      minimumPayout,
      maximumPayout,
      description,
      effectiveFrom,
    } = req.body;

    if (!scope || !['GLOBAL', 'CITY', 'AREA'].includes(scope.toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Scope must be GLOBAL, CITY, or AREA' });
    }

    const cleanScope = scope.toUpperCase();
    const rate = Number(ratePerKm);
    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({ success: false, error: 'Valid rate per km (greater than 0) is required' });
    }

    const minPay = Number(minimumPayout) || 30;
    const maxPay = Number(maximumPayout) || Math.max(minPay * 3, 150);

    if (maxPay < minPay) {
      return res.status(400).json({ success: false, error: 'Maximum payout must be greater than or equal to minimum payout' });
    }

    const db = getDB();

    // Check duplicate
    if (cleanScope === 'GLOBAL') {
      const existingGlobal = await db.collection('rider_payout_rates').findOne({ scope: 'GLOBAL' });
      if (existingGlobal) {
        // Update existing global rate instead of duplicating
        await db.collection('rider_payout_rates').updateOne(
          { _id: existingGlobal._id },
          {
            $set: {
              ratePerKm: rate,
              minimumPayout: minPay,
              maximumPayout: maxPay,
              description: description || existingGlobal.description,
              updatedAt: new Date(),
            },
          }
        );
        return res.json({ success: true, message: 'Global default rate updated successfully', id: existingGlobal._id });
      }
    } else if (cleanScope === 'CITY') {
      if (!cityId && !cityName) {
        return res.status(400).json({ success: false, error: 'City is required for CITY scope' });
      }
      const existingCity = await db.collection('rider_payout_rates').findOne({
        scope: 'CITY',
        $or: [
          cityId && ObjectId.isValid(cityId) ? { cityId: new ObjectId(cityId) } : null,
          cityName ? { cityName: cityName.trim() } : null,
        ].filter(Boolean),
      });
      if (existingCity) {
        return res.status(409).json({ success: false, error: `A city-wide rate for ${cityName} already exists` });
      }
    } else if (cleanScope === 'AREA') {
      if ((!areaId && !areaName) || (!cityId && !cityName)) {
        return res.status(400).json({ success: false, error: 'Both City and Area are required for AREA scope' });
      }
      const existingArea = await db.collection('rider_payout_rates').findOne({
        scope: 'AREA',
        $or: [
          areaId && ObjectId.isValid(areaId) ? { areaId: new ObjectId(areaId) } : null,
          areaName ? { areaName: areaName.trim() } : null,
        ].filter(Boolean),
      });
      if (existingArea) {
        return res.status(409).json({ success: false, error: `An area override for ${areaName} already exists` });
      }
    }

    const newDoc = {
      scope: cleanScope,
      cityId: cityId && ObjectId.isValid(cityId) ? new ObjectId(cityId) : null,
      cityName: cityName ? cityName.trim() : null,
      areaId: areaId && ObjectId.isValid(areaId) ? new ObjectId(areaId) : null,
      areaName: areaName ? areaName.trim() : null,
      ratePerKm: rate,
      minimumPayout: minPay,
      maximumPayout: maxPay,
      isActive: true,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      description: description ? description.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('rider_payout_rates').insertOne(newDoc);
    return res.status(201).json({
      success: true,
      message: 'Payout rate created successfully',
      id: result.insertedId.toString(),
      data: { ...newDoc, id: result.insertedId.toString() },
    });
  } catch (err) {
    console.error('[PayoutRates POST Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT / PATCH /api/admin/payout-rates/:id — Update rate
const updateRateHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const updates = {};
    if (req.body.ratePerKm !== undefined) updates.ratePerKm = Number(req.body.ratePerKm);
    if (req.body.minimumPayout !== undefined) updates.minimumPayout = Number(req.body.minimumPayout);
    if (req.body.maximumPayout !== undefined) updates.maximumPayout = Number(req.body.maximumPayout);
    if (req.body.description !== undefined) updates.description = req.body.description.trim();
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    updates.updatedAt = new Date();

    let query;
    if (id === 'global_default' || req.body.scope === 'GLOBAL') {
      query = { scope: 'GLOBAL' };
    } else {
      query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    }

    const result = await db.collection('rider_payout_rates').updateOne(query, { $set: updates });

    if (result.matchedCount === 0) {
      // If global_default not matched by id, try updating by scope
      const globalRes = await db.collection('rider_payout_rates').updateOne({ scope: 'GLOBAL' }, { $set: updates });
      if (globalRes.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Payout rate not found' });
      }
    }

    return res.json({ success: true, message: 'Payout rate updated successfully' });
  } catch (err) {
    console.error('[PayoutRates UPDATE Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.patch('/:id', updateRateHandler);
router.put('/:id', updateRateHandler);

// 5. PATCH /api/admin/payout-rates/:id/toggle — Toggle active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const current = await db.collection('rider_payout_rates').findOne(query);

    if (!current) {
      return res.status(404).json({ success: false, error: 'Payout rate not found' });
    }

    const nextState = !current.isActive;
    await db.collection('rider_payout_rates').updateOne(query, {
      $set: { isActive: nextState, updatedAt: new Date() },
    });

    return res.json({ success: true, isActive: nextState, message: `Payout rate ${nextState ? 'activated' : 'paused'}` });
  } catch (err) {
    console.error('[PayoutRates TOGGLE Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE /api/admin/payout-rates/:id — Delete rate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const rate = await db.collection('rider_payout_rates').findOne(query);

    if (!rate) {
      return res.status(404).json({ success: false, error: 'Payout rate not found' });
    }

    if (rate.scope === 'GLOBAL') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the Global default payout rate. You can edit its values instead.',
      });
    }

    await db.collection('rider_payout_rates').deleteOne(query);
    return res.json({ success: true, message: 'Payout rate deleted successfully' });
  } catch (err) {
    console.error('[PayoutRates DELETE Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
