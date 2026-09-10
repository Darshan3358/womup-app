const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// 1. List all orders with filters
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status, storeId, search } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (storeId) {
      query.storeId = new ObjectId(storeId);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.street': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const formatted = orders.map(o => {
      const user = userMap[o.userId ? o.userId.toString() : ''] || {};
      return {
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        userId: o.userId,
        customerName: user.name || 'WormUp Customer',
        customerPhone: user.phone || '',
        customerEmail: user.email || '',
        storeId: o.storeId,
        itemsCount: (o.items || []).length,
        items: o.items || [],
        itemSubtotal: o.itemSubtotal,
        deliveryFee: o.deliveryFee || 0,
        discount: o.discount || 0,
        couponDiscount: o.couponDiscount || 0,
        coinsDiscount: o.coinsDiscount || 0,
        tip: o.tip || 0,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.status,
        deliverySlot: o.deliverySlot,
        deliveryAddress: o.deliveryAddress,
        estimatedArrival: o.estimatedArrival,
        createdAt: o.createdAt,
        deliveredAt: o.deliveredAt,
        cancelledAt: o.cancelledAt,
        cancellationReason: o.cancellationReason,
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Order details
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] };
    } else {
      filter = { orderNumber: id };
    }

    const order = await db.collection('orders').findOne(filter);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const user = order.userId ? await db.collection('users').findOne({ _id: order.userId }) : null;
    const store = order.storeId ? await db.collection('stores').findOne({ _id: order.storeId }) : null;

    const timeline = await db.collection('order_status_history').find({
      $or: [{ orderId: order._id }, { orderId: order.orderNumber }]
    }).sort({ createdAt: 1 }).toArray();

    res.json({
      success: true,
      data: {
        ...order,
        customer: user ? {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          email: user.email,
        } : null,
        store: store ? {
          id: store._id.toString(),
          name: store.name,
          address: store.address,
        } : null,
        timeline,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update Order Status (Controlled transition + order_status_history audit log)
router.put('/:id/status', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { status, notes, adminName } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] };
    } else {
      filter = { orderNumber: id };
    }

    const order = await db.collection('orders').findOne(filter);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const previousStatus = order.status || 'PLACED';
    const newStatus = status.toUpperCase();

    const updateFields = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (newStatus === 'DELIVERED') {
      updateFields.deliveredAt = new Date();
      updateFields.paymentStatus = 'COMPLETED';
    }

    await db.collection('orders').updateOne(filter, { $set: updateFields });

    // Insert into order_status_history
    const historyEntry = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      changedByRole: 'ADMIN',
      notes: notes || `Admin (${adminName || 'Admin'}) updated status to ${newStatus}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('order_status_history').insertOne(historyEntry);

    res.json({
      success: true,
      message: `Order transitioned from ${previousStatus} to ${newStatus}`,
      historyEntry,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Cancel Order
router.post('/:id/cancel', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { reason, refundAmount } = req.body;

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] };
    } else {
      filter = { orderNumber: id };
    }

    const order = await db.collection('orders').findOne(filter);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    await db.collection('orders').updateOne(filter, {
      $set: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Admin cancelled order',
        updatedAt: new Date(),
      }
    });

    // Record in history
    await db.collection('order_status_history').insertOne({
      orderId: order._id,
      orderNumber: order.orderNumber,
      previousStatus: order.status,
      newStatus: 'CANCELLED',
      changedByRole: 'ADMIN',
      notes: `Order cancelled. Reason: ${reason || 'Admin Intervention'}. Refund: ${refundAmount ? '₹' + refundAmount : 'None'}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Order Audit Timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const timeline = await db.collection('order_status_history').find({
      $or: [{ orderId: new ObjectId(id) }, { orderId: id }, { orderNumber: id }]
    }).sort({ createdAt: 1 }).toArray();

    res.json({ success: true, count: timeline.length, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
