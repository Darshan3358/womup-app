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
        bankAccount: w.bankAccount || null,
        isActive: st.isActive !== false,
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. All Rider Settlements (Khata & Net Settlement)
router.get('/wallets/riders', async (req, res) => {
  try {
    const db = getDB();
    const riders = await db.collection('delivery_partners').find({}).toArray();
    const settlements = await db.collection('rider_settlements').find({}).toArray();

    const result = riders.map(r => {
      const rIdStr = r._id.toString();
      const rSettlements = settlements.filter(s => s.riderId && s.riderId.toString() === rIdStr);
      
      const tipTotal = rSettlements.reduce((sum, s) => sum + (s.tip || 0), 0);
      const basePayTotal = rSettlements.reduce((sum, s) => sum + (s.basePay || 0), 0);
      const totalEarn = rSettlements.length > 0
        ? rSettlements.reduce((sum, s) => sum + (s.total || s.riderEarning || 0), 0)
        : (r.totalEarnings || 0);

      const totalCod = rSettlements.length > 0
        ? rSettlements.filter(s => s.paymentMode === 'COD').reduce((sum, s) => sum + (s.totalAmount || 0), 0)
        : (r.totalCodCollected || 0);

      const codAdminShare = rSettlements.length > 0
        ? rSettlements.filter(s => s.paymentMode === 'COD').reduce((sum, s) => sum + (s.adminShare ?? Math.max(0, (s.totalAmount || 0) - (s.riderEarning || 0))), 0)
        : Math.max(0, totalCod - (totalEarn * 0.6));

      const onlineRiderShare = rSettlements.length > 0
        ? rSettlements.filter(s => s.paymentMode === 'ONLINE').reduce((sum, s) => sum + (s.riderEarning || s.total || 0), 0)
        : (r.totalOnlineEarnings || 0);

      // True Net Khata: COD Admin share (Rider owes Admin) - Online Rider share (Admin owes Rider)
      const netBalance = codAdminShare - onlineRiderShare; // > 0: Rider owes Admin, < 0: Admin owes Rider
      const cashLimit = r.outstandingCashLimit || 500;
      const isBlocked = Boolean(r.isOrderBlocked || netBalance >= cashLimit);

      return {
        riderId: rIdStr,
        partnerCode: r.partnerCode || 'WUP-RIDER',
        fullName: r.fullName || 'Rider Partner',
        riderName: r.fullName || 'Rider Partner',
        phoneNumber: r.phoneNumber || '',
        vehicleNumber: r.vehicleNumber || 'GJ-01-XX-0000',
        totalDeliveries: rSettlements.length > 0 ? rSettlements.length : (r.completedDeliveries || r.totalDeliveries || 0),
        completedDeliveries: rSettlements.length > 0 ? rSettlements.length : (r.completedDeliveries || r.totalDeliveries || 0),
        totalCodCollected: totalCod,
        totalEarnings: totalEarn,
        totalOnlineEarnings: onlineRiderShare,
        codAdminShare,
        netBalance,
        cashLimit,
        isBlocked,
        isOrderBlocked: isBlocked,
        riderOwesAdmin: Math.max(0, netBalance),
        adminOwesRider: Math.max(0, -netBalance),
        settlementType: netBalance >= 0 ? 'RIDER_OWES_ADMIN' : 'ADMIN_OWES_RIDER',
        balance: Math.abs(netBalance),
        lifetimeEarnings: totalEarn,
        totalTips: tipTotal,
        totalBasePay: basePayTotal,
        bankAccount: (r.bankName || r.accountNumber) ? {
          bankName: r.bankName || 'Not Provided',
          accountNumber: r.accountNumber ? '•••• •••• ' + r.accountNumber.slice(-4) : 'N/A',
          ifsc: r.ifscCode || 'N/A',
          verified: r.verificationStatus === 'APPROVED' || r.verificationStatus === 'VERIFIED',
        } : null,
        isOnline: Boolean(r.isOnline),
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

// 7. Settle Rider Khata (Collect Cash or Pay Rider, and Unblock)
router.post('/wallets/settle-rider', async (req, res) => {
  try {
    const db = getDB();
    const { riderId, amount, referenceNotes, actionType = 'COLLECT_FROM_RIDER' } = req.body;
    if (!riderId || amount === undefined) {
      return res.status(400).json({ success: false, error: 'riderId and amount are required' });
    }

    let rId;
    try {
      rId = new ObjectId(riderId);
    } catch {
      rId = riderId;
    }

    const partner = await db.collection('delivery_partners').findOne({
      $or: [{ _id: rId }, { _id: riderId }, { partnerCode: riderId }, { riderCode: riderId }],
    });

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Delivery partner not found' });
    }

    const settleAmt = Math.abs(Number(amount));
    const currentCod = partner.totalCodCollected || 0;
    const currentEarnings = partner.totalEarnings || 0;
    const previousNet = currentCod - currentEarnings;

    let updatedCod = currentCod;
    let updatedEarnings = currentEarnings;

    if (actionType === 'COLLECT_FROM_RIDER' || previousNet >= 0) {
      // Admin collected cash from rider -> reduce COD cash liability
      updatedCod = Math.max(0, currentCod - settleAmt);
    } else {
      // Admin paid rider -> record that rider has received payout
      updatedEarnings = Math.max(0, currentEarnings - settleAmt);
    }

    const newNet = updatedCod - updatedEarnings;

    await db.collection('delivery_partners').updateOne(
      { _id: partner._id },
      {
        $set: {
          totalCodCollected: updatedCod,
          totalEarnings: updatedEarnings,
          currentOutstandingCash: Math.max(0, newNet),
          isOrderBlocked: false, // Explicitly unblock rider
          lastSettledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Also mark pending settlements as SETTLED
    await db.collection('rider_settlements').updateMany(
      { riderId: partner._id, status: 'PENDING' },
      { $set: { status: 'SETTLED', settledAt: new Date() } }
    );

    // Record in wallet transactions ledger
    await db.collection('wallet_transactions').insertOne({
      walletType: 'RIDER',
      walletId: partner._id,
      type: actionType === 'COLLECT_FROM_RIDER' ? 'CREDIT' : 'DEBIT',
      category: 'NET_SETTLEMENT',
      amount: settleAmt,
      balanceBefore: previousNet,
      balanceAfter: newNet,
      description: `Rider Net Settlement: ₹${settleAmt} (${referenceNotes || 'Physical Cash / IMPS'}) - Rider Unblocked`,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Successfully settled ₹${settleAmt} with ${partner.fullName || 'Rider'}. Rider is now UNBLOCKED.`,
      newNetBalance: newNet,
      isBlocked: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Rider Order-by-Order Khata Ledger
router.get('/wallets/riders/:id/ledger', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    let rId;
    try {
      rId = new ObjectId(id);
    } catch {
      rId = id;
    }

    const partner = await db.collection('delivery_partners').findOne({
      $or: [{ _id: rId }, { _id: id }, { partnerCode: id }, { riderCode: id }],
    });

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const settlements = await db.collection('rider_settlements')
      .find({ riderId: partner._id })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = settlements.map(s => {
      const isCod = s.paymentMode === 'COD';
      const orderTotal = s.totalAmount || (s.basePay + (s.tip || 0));
      const riderEarn = s.riderEarning || s.total || (s.basePay + (s.tip || 0));
      const adminShare = s.adminShare ?? Math.max(0, orderTotal - riderEarn);

      return {
        id: s._id.toString(),
        orderId: s.orderNumber || s.orderId || '#WUP-84920',
        orderNumber: s.orderNumber || s.orderId || '#WUP-84920',
        date: s.settledAt ? new Date(s.settledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent',
        paymentMode: isCod ? 'COD' : 'ONLINE',
        totalAmount: orderTotal,
        riderEarning: riderEarn,
        adminShare,
        netImpact: isCod ? `Rider owes Admin: ₹${adminShare}` : `Admin owes Rider: ₹${riderEarn}`,
        status: s.status || 'SETTLED',
      };
    });

    const codAdminShare = settlements.filter(s => s.paymentMode === 'COD').reduce((sum, s) => sum + (s.adminShare ?? Math.max(0, (s.totalAmount || 0) - (s.riderEarning || 0))), 0);
    const onlineRiderShare = settlements.filter(s => s.paymentMode === 'ONLINE').reduce((sum, s) => sum + (s.riderEarning || s.total || 0), 0);
    const totalEarnings = settlements.reduce((sum, s) => sum + (s.riderEarning || s.total || 0), 0);
    const totalCod = settlements.filter(s => s.paymentMode === 'COD').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const netBalance = codAdminShare - onlineRiderShare;

    res.json({
      success: true,
      partner: {
        id: partner._id.toString(),
        name: partner.fullName,
        partnerCode: partner.partnerCode,
        totalCodCollected: totalCod,
        totalEarnings,
        totalOnlineEarnings: onlineRiderShare,
        codAdminShare,
        netBalance,
        isBlocked: Boolean(partner.isOrderBlocked || netBalance >= (partner.outstandingCashLimit || 500)),
        cashLimit: partner.outstandingCashLimit || 500,
      },
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Rider Settlement Requests (Online UPI Payment with UTR)
router.get('/settlements/requests', async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    const requests = await db.collection('rider_settlement_requests')
      .find(query)
      .sort({ requestedAt: -1 })
      .toArray();

    const formatted = requests.map(r => ({
      id: r._id.toString(),
      riderId: r.riderId ? r.riderId.toString() : '',
      riderName: r.riderName || 'Rider',
      riderPhone: r.riderPhone || '',
      amount: r.amount || 0,
      utrNumber: r.utrNumber || '',
      paymentMethod: r.paymentMethod || 'UPI',
      status: r.status || 'PENDING',
      adminRemarks: r.adminRemarks || '',
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
      rejectedAt: r.rejectedAt,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Settlement Request (Unblock Rider & Reset Balance)
router.post('/settlements/requests/:id/approve', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { adminRemarks } = req.body;

    let reqObjId;
    try {
      reqObjId = new ObjectId(id);
    } catch {
      reqObjId = id;
    }

    const request = await db.collection('rider_settlement_requests').findOne({ _id: reqObjId });
    if (!request) {
      return res.status(404).json({ success: false, error: 'Settlement request not found' });
    }
    if (request.status === 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Settlement request already approved' });
    }

    // 1. Update request status
    await db.collection('rider_settlement_requests').updateOne(
      { _id: reqObjId },
      {
        $set: {
          status: 'APPROVED',
          approvedAt: new Date(),
          adminRemarks: adminRemarks || 'Verified and approved via Admin Panel',
          updatedAt: new Date(),
        },
      }
    );

    // 2. Update delivery partner balance and unblock
    let partnerObjId;
    try {
      partnerObjId = new ObjectId(request.riderId);
    } catch {
      partnerObjId = request.riderId;
    }

    const partner = await db.collection('delivery_partners').findOne({
      $or: [{ _id: partnerObjId }, { _id: request.riderId }],
    });

    if (partner) {
      const settleAmt = Number(request.amount) || 0;
      const currentCod = partner.totalCodCollected || 0;
      const currentEarnings = partner.totalEarnings || 0;
      const updatedCod = Math.max(0, currentCod - settleAmt);
      const newNet = updatedCod - currentEarnings;

      await db.collection('delivery_partners').updateOne(
        { _id: partner._id },
        {
          $set: {
            totalCodCollected: updatedCod,
            currentOutstandingCash: Math.max(0, newNet),
            isOrderBlocked: false, // UNBLOCK RIDER!
            lastSettledAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // Mark pending rider settlements as SETTLED
      await db.collection('rider_settlements').updateMany(
        { riderId: partner._id, status: 'PENDING' },
        { $set: { status: 'SETTLED', settledAt: new Date() } }
      );

      // Record in wallet transactions ledger
      await db.collection('wallet_transactions').insertOne({
        walletType: 'RIDER',
        walletId: partner._id,
        type: 'CREDIT',
        category: 'UPI_ONLINE_SETTLEMENT',
        amount: settleAmt,
        balanceBefore: currentCod - currentEarnings,
        balanceAfter: newNet,
        description: `Online UPI Settlement: ₹${settleAmt} (UTR: ${request.utrNumber}) - Rider Unblocked`,
        createdAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: `Settlement request approved! ₹${request.amount} verified and rider ${request.riderName || ''} is now UNBLOCKED.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject Settlement Request
router.post('/settlements/requests/:id/reject', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { reason } = req.body;

    let reqObjId;
    try {
      reqObjId = new ObjectId(id);
    } catch {
      reqObjId = id;
    }

    const request = await db.collection('rider_settlement_requests').findOne({ _id: reqObjId });
    if (!request) {
      return res.status(404).json({ success: false, error: 'Settlement request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Cannot reject request with status ${request.status}` });
    }

    await db.collection('rider_settlement_requests').updateOne(
      { _id: reqObjId },
      {
        $set: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          adminRemarks: reason || 'Invalid UTR or transaction proof could not be verified',
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: 'Settlement request rejected',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Company UPI Settings
router.get('/settings/upi', async (req, res) => {
  try {
    const db = getDB();
    const config = await db.collection('admin_settings').findOne({ settingName: 'PAYMENT_CONFIG' });
    res.json({
      success: true,
      data: {
        adminUpiId: config?.adminUpiId || 'wormup@okicici',
        adminUpiName: config?.adminUpiName || 'WormUp Technologies Pvt Ltd',
        supportPhone: config?.supportPhone || '+91 98765 43210',
        qrCodeUrl: config?.qrCodeUrl || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/upi', async (req, res) => {
  try {
    const db = getDB();
    const { adminUpiId, adminUpiName, supportPhone, qrCodeUrl } = req.body;
    if (!adminUpiId || !adminUpiId.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid UPI ID required (e.g. username@bank)' });
    }

    await db.collection('admin_settings').updateOne(
      { settingName: 'PAYMENT_CONFIG' },
      {
        $set: {
          settingName: 'PAYMENT_CONFIG',
          adminUpiId: adminUpiId.trim(),
          adminUpiName: (adminUpiName || 'WormUp Technologies Pvt Ltd').trim(),
          supportPhone: (supportPhone || '+91 98765 43210').trim(),
          qrCodeUrl: (qrCodeUrl || '').trim(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Company UPI settings updated successfully',
      data: {
        adminUpiId: adminUpiId.trim(),
        adminUpiName: (adminUpiName || 'WormUp Technologies Pvt Ltd').trim(),
        supportPhone: (supportPhone || '+91 98765 43210').trim(),
        qrCodeUrl: (qrCodeUrl || '').trim(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
