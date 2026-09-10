const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= BANNERS =================
router.get('/banners', async (req, res) => {
  try {
    const db = getDB();
    const banners = await db.collection('banners').find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ success: true, count: banners.length, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/banners', async (req, res) => {
  try {
    const db = getDB();
    const { title, imageUrl, videoUrl, placement, targetType, targetId, sortOrder } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, error: 'Title and imageUrl are required' });
    }

    const newBanner = {
      title,
      imageUrl,
      videoUrl: videoUrl || null,
      placement: placement || 'HOME_HERO',
      targetType: targetType || 'CATEGORY',
      targetId: targetId || '',
      sortOrder: Number(sortOrder) || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('banners').insertOne(newBanner);
    res.status(201).json({ success: true, id: result.insertedId, data: newBanner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const body = req.body;
    delete body._id;
    body.updatedAt = new Date();

    await db.collection('banners').updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ success: true, message: 'Banner updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= COUPONS =================
router.get('/coupons', async (req, res) => {
  try {
    const db = getDB();
    const coupons = await db.collection('coupons').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const db = getDB();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      validFrom,
      validUntil,
      perUserLimit,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, error: 'Code, discountType and discountValue are required' });
    }

    const newCoupon = {
      code: code.toUpperCase().trim(),
      description: description || '',
      discountType: discountType.toUpperCase(),
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      isActive: true,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      perUserLimit: Number(perUserLimit) || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('coupons').insertOne(newCoupon);
    res.status(201).json({ success: true, id: result.insertedId, data: newCoupon });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const body = req.body;
    delete body._id;
    body.updatedAt = new Date();

    await db.collection('coupons').updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ success: true, message: 'Coupon updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
