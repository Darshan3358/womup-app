const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// 1. List all print orders
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    const printOrders = await db.collection('print_orders').find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: printOrders.length, data: printOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. View print order details
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { printOrderNumber: id }] };
    } else {
      filter = { printOrderNumber: id };
    }

    const printOrder = await db.collection('print_orders').findOne(filter);
    if (!printOrder) return res.status(404).json({ success: false, error: 'Print order not found' });

    res.json({ success: true, data: printOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update print order status
router.put('/:id/status', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { printOrderNumber: id }] };
    } else {
      filter = { printOrderNumber: id };
    }

    const updateFields = {
      status: status.toUpperCase(),
      updatedAt: new Date(),
    };
    if (status.toUpperCase() === 'DELIVERED') {
      updateFields.deliveredAt = new Date();
    }

    await db.collection('print_orders').updateOne(filter, { $set: updateFields });
    res.json({ success: true, message: `Print order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Purge document file for privacy compliance
router.post('/:id/purge', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { printOrderNumber: id }] };
    } else {
      filter = { printOrderNumber: id };
    }

    await db.collection('print_orders').updateOne(filter, {
      $set: {
        isDocumentPurged: true,
        purgedAt: new Date(),
        status: 'PURGED',
        updatedAt: new Date(),
      }
    });

    res.json({ success: true, message: 'Document purged and marked compliant with privacy policy' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
