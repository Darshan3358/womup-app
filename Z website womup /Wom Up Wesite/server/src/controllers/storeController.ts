import { Request, Response } from 'express';
import { StoreModel } from '../models/Store.js';
import { inMemoryStore, isMongoConnected } from '../config/db.js';

export const getStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, popular } = req.query;

    if (isMongoConnected) {
      let query: any = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      if (popular === 'true') {
        query.isPopular = true;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { category: { $regex: search as string, $options: 'i' } },
        ];
      }
      const stores = await StoreModel.find(query);
      res.json({ success: true, count: stores.length, data: stores });
      return;
    }

    // In-memory fallback
    let filtered = [...inMemoryStore.stores];
    if (category && category !== 'All') {
      filtered = filtered.filter((s) => s.category.toLowerCase().includes((category as string).toLowerCase()));
    }
    if (popular === 'true') {
      filtered = filtered.filter((s) => s.isPopular);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const store = await StoreModel.findById(id);
      if (!store) {
        res.status(404).json({ success: false, message: 'Store not found' });
        return;
      }
      res.json({ success: true, data: store });
      return;
    }

    const store = inMemoryStore.stores.find((s) => s.id === id);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' });
      return;
    }

    res.json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
