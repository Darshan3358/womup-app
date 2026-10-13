import { Request, Response } from 'express';
import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { inMemoryStore, isMongoConnected } from '../config/db.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      storeId,
      storeName,
      items,
      subtotal,
      deliveryFee,
      total,
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least 1 item' });
      return;
    }

    // 1. Stock Validation
    if (isMongoConnected) {
      for (const item of items) {
        if (item.productId) {
          const product = await ProductModel.findById(item.productId);
          if (product && typeof product.stock === 'number' && product.stock < item.quantity) {
            res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.name || product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            });
            return;
          }
        }
      }
    }

    const orderNumber = `WOM-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderNumber,
      storeId,
      storeName,
      items,
      subtotal,
      deliveryFee: deliveryFee || 0,
      total,
      status: 'confirmed',
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '9876543210',
      deliveryAddress: deliveryAddress || '101, Sunshine Heights, Main Road',
      paymentMethod: paymentMethod || 'cash_on_delivery',
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      const order = await OrderModel.create(orderData);

      // 2. Atomic Stock Deduction
      for (const item of items) {
        if (item.productId) {
          await ProductModel.updateOne(
            { _id: item.productId },
            { $inc: { stock: -Number(item.quantity) } }
          );
        }
      }

      res.status(201).json({ success: true, message: 'Order placed successfully!', data: order });
      return;
    }

    // In-memory store
    inMemoryStore.orders.unshift(orderData);
    res.status(201).json({ success: true, message: 'Order placed successfully!', data: orderData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = String(id);

    if (isMongoConnected) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);
      const order = await OrderModel.findOne({
        $or: [{ _id: isObjectId ? idStr : null }, { orderNumber: idStr }],
      });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }
      res.json({ success: true, data: order });
      return;
    }

    const order = inMemoryStore.orders.find((o) => o.orderNumber === idStr || o.id === idStr);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isMongoConnected) {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.json({ success: true, count: orders.length, data: orders });
      return;
    }
    res.json({ success: true, count: inMemoryStore.orders.length, data: inMemoryStore.orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
