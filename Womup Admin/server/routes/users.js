const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// 1. List all customers
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { search, role, status } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status === 'Active') query.isActive = { $ne: false };
    if (status === 'Blocked') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await db.collection('users').find(query).toArray();
    const orders = await db.collection('orders').find({}).toArray();

    const userList = users.map(u => {
      const userOrders = orders.filter(o => o.userId && o.userId.toString() === u._id.toString());
      const totalSpend = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        id: u._id.toString(),
        name: u.name || 'WormUp Customer',
        phone: u.phone || '',
        email: u.email || '',
        role: u.role || 'CUSTOMER',
        walletBalance: u.walletBalance || 0,
        shoppingCoins: u.shoppingCoins || 0,
        referralCode: u.referralCode || null,
        isPhoneVerified: !!u.isPhoneVerified,
        isEmailVerified: !!u.isEmailVerified,
        isActive: u.isActive !== false,
        totalOrders: userOrders.length,
        totalSpend,
        createdAt: u.createdAt,
      };
    });

    res.json({ success: true, count: userList.length, data: userList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Customer profile details
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let userObjId;
    try {
      userObjId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const user = await db.collection('users').findOne({ _id: userObjId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const addresses = await db.collection('addresses').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).toArray();

    const orders = await db.collection('orders').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).sort({ createdAt: -1 }).toArray();

    const walletTxs = await db.collection('wallet_transactions').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).sort({ createdAt: -1 }).toArray();

    const coinTxs = await db.collection('coin_transactions').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).sort({ createdAt: -1 }).toArray();

    const printOrders = await db.collection('print_orders').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).sort({ createdAt: -1 }).toArray();

    const totalSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) +
                       printOrders.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        profile: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance || 0,
          shoppingCoins: user.shoppingCoins || 0,
          referralCode: user.referralCode,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          hideSensitiveItems: user.hideSensitiveItems,
          birthday: user.birthday,
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
        },
        stats: {
          totalOrders: orders.length + printOrders.length,
          totalGroceryOrders: orders.length,
          totalPrintOrders: printOrders.length,
          totalSpend,
        },
        addresses,
        orders,
        printOrders,
        walletTransactions: walletTxs,
        coinTransactions: coinTxs,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.5 Create new customer
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { name, phone, email, role, address, zoneName } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, error: 'Name and phone required' });

    const newUser = {
      name,
      phone,
      email: email || '',
      role: role || 'CUSTOMER',
      walletBalance: 0,
      shoppingCoins: 50,
      referralCode: 'WORM' + Math.floor(1000 + Math.random() * 9000),
      isPhoneVerified: false,
      isEmailVerified: false,
      hideSensitiveItems: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('users').insertOne(newUser);

    if (address) {
      await db.collection('addresses').insertOne({
        userId: result.insertedId,
        label: 'Home',
        houseNumber: '',
        street: address,
        city: zoneName || 'Ahmedabad',
        pincode: '380015',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res.status(201).json({ success: true, id: result.insertedId, data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Edit customer
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, phone, email, role, birthday, hideSensitiveItems, status, address, zoneName } = req.body;

    let userObjId;
    try {
      userObjId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const updateFields = { updatedAt: new Date() };
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (role !== undefined) updateFields.role = role;
    if (birthday !== undefined) updateFields.birthday = birthday;
    if (hideSensitiveItems !== undefined) updateFields.hideSensitiveItems = hideSensitiveItems;
    if (status !== undefined) updateFields.isActive = status === 'Active';

    await db.collection('users').updateOne({ _id: userObjId }, { $set: updateFields });

    // Update or insert primary address
    if (address !== undefined) {
      await db.collection('addresses').updateOne(
        { userId: userObjId, isDefault: true },
        {
          $set: {
            street: address,
            city: zoneName || 'Ahmedabad',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            userId: userObjId,
            label: 'Home',
            houseNumber: '',
            pincode: '380015',
            isDefault: true,
            createdAt: new Date(),
          }
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Block / Unblock customer
router.put('/:id/block', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { isBlocked } = req.body;

    const userObjId = new ObjectId(id);
    await db.collection('users').updateOne(
      { _id: userObjId },
      { $set: { isActive: !isBlocked, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isActive: !isBlocked,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get user addresses
router.get('/:id/addresses', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const userObjId = new ObjectId(id);

    const addresses = await db.collection('addresses').find({
      $or: [{ userId: userObjId }, { userId: id }]
    }).toArray();

    res.json({ success: true, count: addresses.length, data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
