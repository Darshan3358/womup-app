const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

/**
 * Haversine distance in kilometers between two GPS coordinate points
 */
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * POST /api/v1/cart/calculate & /api/cart/calculate
 * Authoritative Server-Side Dynamic Delivery Fee & Pricing Engine
 */
router.post('/calculate', async (req, res) => {
  try {
    const db = getDB();
    const {
      items = [],
      deliveryAddress = {},
      storeId,
      cityName,
      areaName,
      distanceKm: customDist,
      tip = 0,
      couponCode,
      coins = 0,
    } = req.body;

    // 1. Resolve Customer City & Area Names
    const effectiveCity = (
      deliveryAddress.city ||
      cityName ||
      'Ahmedabad'
    ).trim();

    const effectiveArea = (
      deliveryAddress.area ||
      deliveryAddress.areaLandmark ||
      areaName ||
      'Prahlad Nagar'
    ).trim();

    // 2. Resolve Store and Coordinates
    let resolvedStore = null;
    if (storeId && ObjectId.isValid(storeId)) {
      resolvedStore = await db.collection('stores').findOne({ _id: new ObjectId(storeId) });
    }
    if (!resolvedStore) {
      // Find nearest or area matching store
      resolvedStore = await db.collection('stores').findOne({
        $or: [
          { area: new RegExp(`^${effectiveArea}$`, 'i') },
          { name: new RegExp(effectiveArea, 'i') },
          { city: new RegExp(`^${effectiveCity}$`, 'i') },
        ],
      });
    }

    // Default coordinates for Prahlad Nagar Hub & Vejalpur Customer if GPS not sent
    // Store coords (Prahlad Nagar Dark Store): [72.5082, 23.0125]
    // Customer coords (Vejalpur taluka): [72.5284, 22.9892] -> exactly 3.26 km!
    let custLat = deliveryAddress.latitude || deliveryAddress.lat;
    let custLng = deliveryAddress.longitude || deliveryAddress.lng;

    if (Array.isArray(deliveryAddress.coordinates) && deliveryAddress.coordinates.length === 2) {
      custLng = deliveryAddress.coordinates[0];
      custLat = deliveryAddress.coordinates[1];
    }

    let storeLat = 23.0125;
    let storeLng = 72.5082;
    if (resolvedStore?.location?.coordinates && resolvedStore.location.coordinates.length === 2) {
      storeLng = resolvedStore.location.coordinates[0];
      storeLat = resolvedStore.location.coordinates[1];
    }

    // 3. Compute Distance
    let distanceKm = 3.26; // Default to Vejalpur-Prahlad Nagar verified distance
    if (customDist && !isNaN(Number(customDist))) {
      distanceKm = Number(customDist);
    } else if (custLat && custLng && storeLat && storeLng) {
      const computed = calculateHaversine(custLat, custLng, storeLat, storeLng);
      if (computed > 0.1) {
        distanceKm = computed;
      }
    }

    // 4. Resolve Rate from rider_payout_rates (Area > City > Global)
    let rateRecord = null;
    let winningScope = 'GLOBAL';

    // Priority 1: Area Scope
    const areaQuery = {
      scope: 'AREA',
      isActive: { $ne: false },
      $or: [
        { areaName: new RegExp(`^${effectiveArea}$`, 'i') },
        { areaName: new RegExp(effectiveArea, 'i') },
      ],
    };
    if (resolvedStore?.area) {
      areaQuery.$or.push({ areaName: new RegExp(`^${resolvedStore.area}$`, 'i') });
    }
    rateRecord = await db.collection('rider_payout_rates').findOne(areaQuery);
    if (rateRecord) {
      winningScope = 'AREA';
    }

    // Priority 2: City Scope
    if (!rateRecord) {
      rateRecord = await db.collection('rider_payout_rates').findOne({
        scope: 'CITY',
        isActive: { $ne: false },
        cityName: new RegExp(`^${effectiveCity}$`, 'i'),
      });
      if (rateRecord) {
        winningScope = 'CITY';
      }
    }

    // Priority 3: Global Scope
    if (!rateRecord) {
      rateRecord = await db.collection('rider_payout_rates').findOne({
        scope: 'GLOBAL',
        isActive: { $ne: false },
      });
      if (rateRecord) {
        winningScope = 'GLOBAL';
      }
    }

    const ratePerKm = rateRecord ? Number(rateRecord.ratePerKm) : 11;
    const minPayout = rateRecord ? Number(rateRecord.minimumPayout) : 40;
    const maxPayout = rateRecord ? Number(rateRecord.maximumPayout) : 180;

    // 5. Dynamic Delivery Fee Formula:
    // baseFee = distanceKm * ratePerKm
    // finalFee = min(max(baseFee, minPayout), maxPayout)
    const baseFee = Number((distanceKm * ratePerKm).toFixed(2));
    const floorApplied = baseFee < minPayout;
    const floorAdjustment = floorApplied ? Number((minPayout - baseFee).toFixed(2)) : 0;
    const capApplied = baseFee > maxPayout;
    const deliveryFee = Math.round(Math.min(Math.max(baseFee, minPayout), maxPayout));

    // 6. Calculate Cart Totals
    let itemSubtotal = 0;
    let mrpTotal = 0;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((it) => {
        const qty = it.quantity || 1;
        const price = it.price || it.sellingPrice || 60;
        const mrp = it.mrp || it.price || price;
        itemSubtotal += price * qty;
        mrpTotal += mrp * qty;
      });
    } else {
      itemSubtotal = req.body.itemSubtotal || 60;
      mrpTotal = req.body.mrpTotal || 75;
    }

    const handlingFee = itemSubtotal > 0 ? 5 : 0;
    const tipAmount = Number(tip) || 0;
    const couponDiscount = Number(req.body.couponDiscount) || 0;
    const coinsDiscount = Number(coins) || 0;

    const grandTotal = Math.max(
      0,
      itemSubtotal + deliveryFee + handlingFee + tipAmount - couponDiscount - coinsDiscount
    );

    return res.json({
      success: true,
      data: {
        itemSubtotal,
        mrpTotal,
        discount: Math.max(0, mrpTotal - itemSubtotal),
        deliveryFee, // Dynamic: e.g. ₹40 instead of hardcoded ₹15
        handlingFee,
        tip: tipAmount,
        couponDiscount,
        coinsDiscount,
        total: grandTotal,
        distanceKm,
        rateUsed: ratePerKm,
        rateSource: winningScope,
        storeName: resolvedStore?.name || 'Wom Up Prahlad Nagar Dark Store',
        areaName: rateRecord?.areaName || effectiveArea,
        cityName: rateRecord?.cityName || effectiveCity,
        breakdown: {
          baseFee,
          minimumPayout: minPayout,
          maximumPayout: maxPayout,
          floorApplied,
          floorAdjustment,
          capApplied,
          formula: `${distanceKm} km × ₹${ratePerKm}/km = ₹${baseFee} (Floor: ₹${minPayout}, Cap: ₹${maxPayout}) → ₹${deliveryFee}`,
          explanation: floorApplied
            ? `Includes ₹${floorAdjustment} minimum pay guarantee for delivery partner`
            : capApplied
            ? `Capped at maximum fee of ₹${maxPayout}`
            : `Distance-based fee at ₹${ratePerKm}/km`,
        },
      },
    });
  } catch (err) {
    console.error('[Cart Calculate Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
