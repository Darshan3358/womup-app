const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= SHOPPING COINS =================
router.get('/coins/transactions', async (req, res) => {
  try {
    const db = getDB();
    const { userId, type } = req.query;

    const query = {};
    if (userId) query.userId = new ObjectId(userId);
    if (type) query.type = type.toUpperCase();

    const transactions = await db.collection('coin_transactions').find(query).sort({ createdAt: -1 }).toArray();
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });

    const formatted = transactions.map(t => ({
      id: t._id.toString(),
      userId: t.userId,
      userName: userMap[t.userId ? t.userId.toString() : ''] || 'Customer',
      type: t.type,
      coins: t.coins,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      description: t.description,
      createdAt: t.createdAt,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual Coin Adjustment with mandatory audit trail
router.post('/coins/adjust', async (req, res) => {
  try {
    const db = getDB();
    const { userId, type, coins, reason, adminName } = req.body;
    // type: 'BONUS' | 'SPEND' (Credit or Debit)

    if (!userId || !coins || !reason) {
      return res.status(400).json({ success: false, error: 'userId, coins, and reason are required' });
    }

    const userObjId = new ObjectId(userId);
    const user = await db.collection('users').findOne({ _id: userObjId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const coinCount = Number(coins);
    const balanceBefore = user.shoppingCoins || 0;
    const isCredit = type === 'BONUS' || type === 'EARN';
    const balanceAfter = isCredit ? balanceBefore + coinCount : Math.max(0, balanceBefore - coinCount);

    // Update user balance
    await db.collection('users').updateOne(
      { _id: userObjId },
      { $set: { shoppingCoins: balanceAfter, updatedAt: new Date() } }
    );

    // Create ledger transaction
    const ledgerEntry = {
      userId: userObjId,
      type: isCredit ? 'BONUS' : 'SPEND',
      coins: coinCount,
      balanceBefore,
      balanceAfter,
      referenceType: 'ADMIN_ADJUSTMENT',
      referenceId: adminName || 'ADMIN',
      description: `Admin manual adjustment: ${reason}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('coin_transactions').insertOne(ledgerEntry);

    res.json({
      success: true,
      message: `Adjusted ${coinCount} coins (${isCredit ? '+' : '-'}) for ${user.name}`,
      balanceBefore,
      balanceAfter,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= WALLET =================
router.get('/wallet/transactions', async (req, res) => {
  try {
    const db = getDB();
    const { userId, type } = req.query;

    const query = {};
    if (userId) query.userId = new ObjectId(userId);
    if (type) query.type = type.toUpperCase();

    const transactions = await db.collection('wallet_transactions').find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual Wallet Balance Adjustment with audit trail
router.post('/wallet/adjust', async (req, res) => {
  try {
    const db = getDB();
    const { userId, type, amount, reason, adminName } = req.body;
    // type: 'TOPUP' | 'DEBIT' | 'REFUND' | 'CASHBACK'

    if (!userId || !amount || !reason) {
      return res.status(400).json({ success: false, error: 'userId, amount, and reason are required' });
    }

    const userObjId = new ObjectId(userId);
    const user = await db.collection('users').findOne({ _id: userObjId });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const val = Number(amount);
    const balanceBefore = user.walletBalance || 0;
    const isAdd = ['TOPUP', 'REFUND', 'CASHBACK'].includes((type || 'TOPUP').toUpperCase());
    const balanceAfter = isAdd ? balanceBefore + val : Math.max(0, balanceBefore - val);

    await db.collection('users').updateOne(
      { _id: userObjId },
      { $set: { walletBalance: balanceAfter, updatedAt: new Date() } }
    );

    const tx = {
      userId: userObjId,
      type: (type || 'TOPUP').toUpperCase(),
      amount: val,
      balanceBefore,
      balanceAfter,
      referenceType: 'ADMIN_ADJUST',
      referenceId: adminName || 'ADMIN',
      status: 'SUCCESS',
      description: `Admin manual adjustment: ${reason}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('wallet_transactions').insertOne(tx);

    res.json({
      success: true,
      message: `Adjusted ₹${val} for ${user.name}`,
      balanceBefore,
      balanceAfter,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
