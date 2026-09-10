const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= OTP MONITORING =================
router.get('/otp', async (req, res) => {
  try {
    const db = getDB();
    const otps = await db.collection('otp_verifications').find({}).sort({ createdAt: -1 }).limit(50).toArray();

    // Mask phone numbers slightly for security, hide hashes
    const sanitized = otps.map(o => ({
      id: o._id.toString(),
      phone: o.phone ? o.phone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2') : 'N/A',
      status: o.status,
      verificationId: o.verificationId,
      attempts: o.attempts || 0,
      isVerified: !!o.isVerified,
      expiresAt: o.expiresAt,
      createdAt: o.createdAt,
    }));

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= REFRESH TOKENS & ACTIVE SESSIONS =================
router.get('/sessions', async (req, res) => {
  try {
    const db = getDB();
    const tokens = await db.collection('refresh_tokens').find({}).sort({ createdAt: -1 }).limit(50).toArray();
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });

    const sanitized = tokens.map(t => ({
      id: t._id.toString(),
      userId: t.userId,
      userName: userMap[t.userId ? t.userId.toString() : ''] || 'User',
      ipAddress: t.ipAddress || 'Unknown IP',
      userAgent: t.userAgent || 'Mobile App',
      isRevoked: !!t.isRevoked,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    }));

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revoke a session token
router.post('/sessions/:id/revoke', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    await db.collection('refresh_tokens').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRevoked: true, updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= CUSTOMER CARTS (VIEW/SUPPORT) =================
router.get('/carts', async (req, res) => {
  try {
    const db = getDB();
    const carts = await db.collection('carts').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });

    const formatted = carts.map(c => ({
      id: c._id.toString(),
      userId: c.userId,
      userName: userMap[c.userId ? c.userId.toString() : ''] || 'Customer',
      itemsCount: (c.items || []).length,
      items: c.items || [],
      appliedCoins: c.appliedCoins || 0,
      couponCode: c.couponCode || null,
      tip: c.tip || 0,
      deliveryInstructions: c.deliveryInstructions || '',
      updatedAt: c.updatedAt,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
