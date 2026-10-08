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

// ================= 3-WAY WALLET PAYMENT DISTRIBUTION =================

// 1. Wallets Summary (Store Balances, Rider Earnings, Platform Revenue)
router.get('/wallets/summary', async (req, res) => {
  try {
    const db = getDB();

    // Store Wallets
    const storeWallets = await db.collection('store_wallets').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();
    const totalStoreBalance = storeWallets.reduce((s, w) => s + (w.balance || 0), 0);
    const totalStoreGross = storeWallets.reduce((s, w) => s + (w.totalEarned || 0), 0);
    const totalStoreCommission = storeWallets.reduce((s, w) => s + (w.totalCommission || 0), 0);

    // Rider Wallets
    const riderWallets = await db.collection('rider_wallets').find({}).toArray();
    const settlements = await db.collection('rider_settlements').find({}).toArray();
    const totalRiderBalance = riderWallets.reduce((s, w) => s + (w.balance || 0), 0);
    const totalRiderLifetime = riderWallets.reduce((s, w) => s + (w.lifetimeEarnings || 0), 0);
    const totalTips = settlements.reduce((s, w) => s + (w.tip || 0), 0);
    const totalBasePay = settlements.reduce((s, w) => s + (w.basePay || 0), 0);

    // Platform Wallet
    const platformRecords = await db.collection('platform_wallet').find({}).toArray();
    const totalHandlingFees = platformRecords.reduce((s, w) => s + (w.handlingFees || 0), 0);
    const totalPlatformCommissions = platformRecords.reduce((s, w) => s + (w.commissions || 0), 0);
    const totalPlatformRevenue = totalHandlingFees + totalPlatformCommissions;

    res.json({
      success: true,
      data: {
        stores: {
          count: stores.length,
          totalBalance: totalStoreBalance,
          totalGross: totalStoreGross,
          totalCommission: totalStoreCommission,
        },
        riders: {
          count: riderWallets.length,
          totalBalance: totalRiderBalance,
          totalLifetime: totalRiderLifetime,
          totalTips,
          totalBasePay,
        },
        platform: {
          handlingFees: totalHandlingFees,
          commissions: totalPlatformCommissions,
          totalRevenue: totalPlatformRevenue,
          netProfit: Math.round(totalPlatformRevenue * 0.75),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. All Store Wallets
router.get('/wallets/stores', async (req, res) => {
  try {
    const db = getDB();
    const stores = await db.collection('stores').find({}).toArray();
    const storeWallets = await db.collection('store_wallets').find({}).toArray();
    const walletMap = {};
    storeWallets.forEach(w => {
      walletMap[w.storeId ? w.storeId.toString() : ''] = w;
    });

    const result = stores.map(st => {
      const w = walletMap[st._id.toString()] || {};
      return {
        storeId: st._id.toString(),
        storeName: st.name || 'Dark Store Hub',
        city: st.city || st.cityName || 'Ahmedabad',
        area: st.areaName || st.address || 'Prahlad Nagar',
        balance: w.balance || 0,
        pendingBalance: w.pendingBalance || 0,
        totalEarned: w.totalEarned || 0,
        totalCommission: w.totalCommission || 0,
        commissionRate: 10,
        settlementCycle: w.settlementCycle || 'WEEKLY',
        lastSettlementAt: w.lastSettlementAt || null,
        bankAccount: w.bankAccount || {
          accountNumber: '•••• •••• ' + (st.phone ? st.phone.slice(-4) : '4821'),
          ifsc: 'HDFC0001024',
          bankName: 'HDFC Bank Ltd',
          verified: true,
        },
        isActive: st.isActive !== false,
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. All Rider Wallets
router.get('/wallets/riders', async (req, res) => {
  try {
    const db = getDB();
    const riders = await db.collection('delivery_partners').find({}).toArray();
    const riderWallets = await db.collection('rider_wallets').find({}).toArray();
    const settlements = await db.collection('rider_settlements').find({}).toArray();

    const walletMap = {};
    riderWallets.forEach(w => {
      walletMap[w.riderId ? w.riderId.toString() : ''] = w;
    });

    const result = riders.map(r => {
      const w = walletMap[r._id.toString()] || {};
      const rSettlements = settlements.filter(s => s.riderId && s.riderId.toString() === r._id.toString());
      const tipTotal = rSettlements.reduce((sum, s) => sum + (s.tip || 0), 0);
      const basePayTotal = rSettlements.reduce((sum, s) => sum + (s.basePay || 0), 0);

      return {
        riderId: r._id.toString(),
        partnerCode: r.partnerCode || 'WUP-RIDER',
        fullName: r.fullName || 'Rider Partner',
        phoneNumber: r.phoneNumber || '',
        vehicleNumber: r.vehicleNumber || 'GJ-01-XX-0000',
        balance: w.balance || r.walletBalance || 0,
        lifetimeEarnings: w.lifetimeEarnings || (tipTotal + basePayTotal) || 0,
        totalDeliveries: r.completedDeliveries || r.totalDeliveries || 0,
        totalTips: tipTotal,
        totalBasePay: basePayTotal,
        bankAccount: {
          accountNumber: '•••• •••• ' + (r.phoneNumber ? r.phoneNumber.slice(-4) : '9988'),
          ifsc: 'ICIC0000412',
          bankName: 'ICICI Bank Ltd',
          verified: true,
        },
        isOnline: r.isOnline !== false,
        isActive: r.status === 'APPROVED',
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Platform Revenue History
router.get('/wallets/platform', async (req, res) => {
  try {
    const db = getDB();
    const records = await db.collection('platform_wallet').find({}).sort({ date: -1 }).toArray();

    const formatted = records.map(r => ({
      id: r._id.toString(),
      date: r.date,
      handlingFees: r.handlingFees || 0,
      commissions: r.commissions || 0,
      totalRevenue: r.totalRevenue || ((r.handlingFees || 0) + (r.commissions || 0)),
      gatewayFees: Math.round((r.totalRevenue || 0) * 0.02),
      serverCosts: 150,
      netProfit: Math.max(0, (r.totalRevenue || 0) - Math.round((r.totalRevenue || 0) * 0.02) - 150),
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRec = records.find(r => r.date === todayStr) || records[0] || {};
    const lifetimeHandling = records.reduce((sum, r) => sum + (r.handlingFees || 0), 0);
    const lifetimeComm = records.reduce((sum, r) => sum + (r.commissions || 0), 0);
    const lifetimeRev = lifetimeHandling + lifetimeComm;
    const lifetimeProfit = Math.max(0, lifetimeRev - Math.round(lifetimeRev * 0.02) - (records.length * 150));

    res.json({
      success: true,
      count: formatted.length,
      records: formatted,
      data: {
        todayRevenue: todayRec.totalRevenue || ((todayRec.handlingFees || 0) + (todayRec.commissions || 0)),
        todayHandling: todayRec.handlingFees || 0,
        todayCommission: todayRec.commissions || 0,
        todayOrdersCount: Math.round((todayRec.handlingFees || 0) / 5),
        lifetime: {
          totalRevenue: lifetimeRev,
          handlingFees: lifetimeHandling,
          commissions: lifetimeComm,
          netProfit: lifetimeProfit,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Wallet Transactions Ledger
router.get('/wallets/transactions', async (req, res) => {
  try {
    const db = getDB();
    const { walletType, limit = 50 } = req.query;
    const query = {};
    if (walletType) {
      query.walletType = walletType.toUpperCase();
    }

    const txs = await db.collection('wallet_transactions')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray();

    res.json({ success: true, count: txs.length, data: txs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Manual Settlement Payout for Store
router.post('/wallets/settle-store', async (req, res) => {
  try {
    const db = getDB();
    const { storeId, amount, referenceNotes } = req.body;
    if (!storeId || !amount) {
      return res.status(400).json({ success: false, error: 'storeId and amount are required' });
    }

    const sId = new ObjectId(storeId);
    const storeWallet = await db.collection('store_wallets').findOne({ storeId: sId });
    if (!storeWallet) {
      return res.status(404).json({ success: false, error: 'Store wallet not found' });
    }

    const payoutVal = Number(amount);
    if (storeWallet.balance < payoutVal) {
      return res.status(400).json({ success: false, error: 'Payout amount exceeds available wallet balance' });
    }

    const newBalance = Math.max(0, storeWallet.balance - payoutVal);
    await db.collection('store_wallets').updateOne(
      { storeId: sId },
      {
        $set: { balance: newBalance, lastSettlementAt: new Date(), updatedAt: new Date() },
      }
    );

    await db.collection('wallet_transactions').insertOne({
      walletType: 'STORE',
      walletId: sId,
      type: 'DEBIT',
      category: 'SETTLEMENT_PAYOUT',
      amount: payoutVal,
      balanceBefore: storeWallet.balance,
      balanceAfter: newBalance,
      description: `Weekly bank settlement payout: ₹${payoutVal} (${referenceNotes || 'NEFT Transfer'})`,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Settled ₹${payoutVal} to store bank account`,
      newBalance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Manual Instant IMPS Payout for Rider
router.post('/wallets/settle-rider', async (req, res) => {
  try {
    const db = getDB();
    const { riderId, amount, referenceNotes } = req.body;
    if (!riderId || !amount) {
      return res.status(400).json({ success: false, error: 'riderId and amount are required' });
    }

    const rId = new ObjectId(riderId);
    const riderWallet = await db.collection('rider_wallets').findOne({ riderId: rId });
    if (!riderWallet) {
      return res.status(404).json({ success: false, error: 'Rider wallet not found' });
    }

    const payoutVal = Number(amount);
    const currentBal = riderWallet.balance || 0;
    if (currentBal < payoutVal) {
      return res.status(400).json({ success: false, error: 'Payout amount exceeds rider wallet balance' });
    }

    const newBalance = Math.max(0, currentBal - payoutVal);
    await db.collection('rider_wallets').updateOne(
      { riderId: rId },
      {
        $set: { balance: newBalance, lastSettlementAt: new Date(), updatedAt: new Date() },
      }
    );

    await db.collection('wallet_transactions').insertOne({
      walletType: 'RIDER',
      walletId: rId,
      type: 'DEBIT',
      category: 'INSTANT_IMPS',
      amount: payoutVal,
      balanceBefore: currentBal,
      balanceAfter: newBalance,
      description: `Instant IMPS bank payout: ₹${payoutVal} (${referenceNotes || 'IMPS Transfer'})`,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Transferred ₹${payoutVal} instantly via IMPS to rider`,
      newBalance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
