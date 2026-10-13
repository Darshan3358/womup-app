import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductModel } from '../models/Product.js';
import { AreaModel } from '../models/Area.js';
import { isMongoConnected } from '../config/db.js';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { areaId, areaName, category, search } = req.query;

    if (isMongoConnected) {
      // 1. Resolve Target Area (Default to Satellite if not provided)
      let resolvedArea: any = null;
      if (areaId && mongoose.Types.ObjectId.isValid(areaId as string)) {
        resolvedArea = await AreaModel.findById(areaId);
      } else if (areaName) {
        resolvedArea = await AreaModel.findOne({ name: new RegExp(areaName as string, 'i'), isActive: true });
      }

      if (!resolvedArea) {
        resolvedArea = await AreaModel.findOne({ name: /Satellite/i, isActive: true });
      }

      const targetAreaId = resolvedArea ? resolvedArea._id : null;

      // 2. Build Query Filters
      const matchStage: any = { isActive: true };

      if (category && category !== 'all' && category !== 'All') {
        const catStr = category as string;
        matchStage.$or = [
          { category: { $regex: new RegExp(catStr, 'i') } },
          { slug: { $regex: new RegExp(catStr, 'i') } },
        ];
      }

      if (search) {
        const q = search as string;
        matchStage.$or = [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      }

      // 3. Aggregate with area_pricing lookup
      const pipeline: any[] = [{ $match: matchStage }];

      if (targetAreaId) {
        pipeline.push(
          {
            $lookup: {
              from: 'area_pricing',
              let: { prodId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$productId', '$$prodId'] },
                        { $eq: ['$areaId', targetAreaId] },
                        { $eq: ['$isAvailable', true] },
                      ],
                    },
                  },
                },
                { $sort: { price: 1 } },
                { $limit: 1 },
              ],
              as: 'matchedAreaPricing',
            },
          },
          {
            $addFields: {
              areaPricing: { $arrayElemAt: ['$matchedAreaPricing', 0] },
            },
          }
        );
      }

      const rawProducts = await ProductModel.aggregate(pipeline);

      // 4. Transform into unified response format
      const products = rawProducts.map((p) => {
        const areaOverride = p.areaPricing;
        const effectivePrice = areaOverride ? areaOverride.price : p.sellingPrice;
        const effectiveMrp = areaOverride ? areaOverride.mrp : p.mrp;
        const effectiveStock = areaOverride ? areaOverride.stock : (p.stock ?? 50);

        return {
          _id: p._id,
          id: p._id.toString(),
          name: p.name,
          slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          brand: p.brand || 'Womup Fresh',
          category: p.category || 'Groceries',
          categorySlug: (p.category || 'groceries').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          // Pricing (both exact DB fields and standard client aliases)
          sellingPrice: effectivePrice,
          mrp: effectiveMrp,
          price: effectivePrice,
          oldPrice: effectiveMrp,
          discount: effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0,
          discountPercent: p.discountPercent || (effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0),
          areaPrice: areaOverride ? areaOverride.price : null,
          areaMrp: areaOverride ? areaOverride.mrp : null,
          areaStock: areaOverride ? areaOverride.stock : null,
          hasAreaOverride: !!areaOverride,
          // Media & Inventory
          imageUrl: p.imageUrl,
          image: p.imageUrl,
          gallery: p.images && p.images.length > 0 ? p.images : [p.imageUrl],
          quantityLabel: p.quantityLabel || '1 unit',
          unit: p.quantityLabel || '1 unit',
          rating: p.rating || 4.8,
          reviewCount: p.reviewCount || 42,
          inStock: effectiveStock > 0,
          stockCount: effectiveStock,
          stock: effectiveStock,
          description: p.description || '',
          specifications: p.specifications || {},
          shelfLife: p.shelfLife || '3-5 days',
          deliveryMinutes: resolvedArea?.defaultDeliveryMinutes || 9,
          isPopular: !!p.isPopular,
          isDeal: !!p.isDeal,
        };
      });

      res.json({
        success: true,
        count: products.length,
        area: resolvedArea
          ? {
              id: resolvedArea._id,
              name: resolvedArea.name,
              city: resolvedArea.city,
              darkStore: resolvedArea.darkStore,
              deliveryMinutes: resolvedArea.defaultDeliveryMinutes,
            }
          : null,
        data: products,
      });
      return;
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { areaId, areaName } = req.query;

    if (isMongoConnected && id && mongoose.Types.ObjectId.isValid(id)) {
      let resolvedArea: any = null;
      if (areaId && mongoose.Types.ObjectId.isValid(areaId as string)) {
        resolvedArea = await AreaModel.findById(areaId);
      } else if (areaName) {
        resolvedArea = await AreaModel.findOne({ name: new RegExp(areaName as string, 'i'), isActive: true });
      }

      if (!resolvedArea) {
        resolvedArea = await AreaModel.findOne({ name: /Satellite/i, isActive: true });
      }

      const targetAreaId = resolvedArea ? resolvedArea._id : null;

      const pipeline: any[] = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ];

      if (targetAreaId) {
        pipeline.push(
          {
            $lookup: {
              from: 'area_pricing',
              let: { prodId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$productId', '$$prodId'] },
                        { $eq: ['$areaId', targetAreaId] },
                        { $eq: ['$isAvailable', true] },
                      ],
                    },
                  },
                },
                { $sort: { price: 1 } },
                { $limit: 1 },
              ],
              as: 'matchedAreaPricing',
            },
          },
          {
            $addFields: {
              areaPricing: { $arrayElemAt: ['$matchedAreaPricing', 0] },
            },
          }
        );
      }

      const results = await ProductModel.aggregate(pipeline);
      if (!results || results.length === 0) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      const p = results[0];
      const areaOverride = p.areaPricing;
      const effectivePrice = areaOverride ? areaOverride.price : p.sellingPrice;
      const effectiveMrp = areaOverride ? areaOverride.mrp : p.mrp;
      const effectiveStock = areaOverride ? areaOverride.stock : (p.stock ?? 50);

      const formatted = {
        _id: p._id,
        id: p._id.toString(),
        name: p.name,
        slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        brand: p.brand || 'Womup Fresh',
        category: p.category || 'Groceries',
        categorySlug: (p.category || 'groceries').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sellingPrice: effectivePrice,
        mrp: effectiveMrp,
        price: effectivePrice,
        oldPrice: effectiveMrp,
        discount: effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0,
        discountPercent: p.discountPercent || (effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0),
        areaPrice: areaOverride ? areaOverride.price : null,
        areaMrp: areaOverride ? areaOverride.mrp : null,
        areaStock: areaOverride ? areaOverride.stock : null,
        hasAreaOverride: !!areaOverride,
        imageUrl: p.imageUrl,
        image: p.imageUrl,
        gallery: p.images && p.images.length > 0 ? p.images : [p.imageUrl],
        quantityLabel: p.quantityLabel || '1 unit',
        unit: p.quantityLabel || '1 unit',
        rating: p.rating || 4.8,
        reviewCount: p.reviewCount || 42,
        inStock: effectiveStock > 0,
        stockCount: effectiveStock,
        stock: effectiveStock,
        description: p.description || '',
        specifications: p.specifications || {},
        shelfLife: p.shelfLife || '3-5 days',
        deliveryMinutes: resolvedArea?.defaultDeliveryMinutes || 9,
        isPopular: !!p.isPopular,
        isDeal: !!p.isDeal,
      };

      res.json({ success: true, data: formatted });
      return;
    }

    res.status(404).json({ success: false, message: 'Product not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAreas = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isMongoConnected) {
      const areas = await AreaModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
      res.json({ success: true, count: areas.length, data: areas });
      return;
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
