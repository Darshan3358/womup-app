import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Product,
  ProductDocument,
  ProductVariant,
  ProductVariantDocument,
} from './schemas/product.schema';
import { AreaPricing, AreaPricingDocument } from '../areas/schemas/area-pricing.schema';
import { Inventory, InventoryDocument } from '../inventory/schemas/inventory.schema';

export interface ProductQueryFilter {
  categoryId?: string;
  categoryIds?: string | string[];
  subCategoryId?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  discount?: number;
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  areaId?: string;
  storeId?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(AreaPricing.name) private areaPricingModel: Model<AreaPricingDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
  ) {}

  private buildStoreVisibilityCondition(storeId?: string): any {
    if (!storeId) {
      return { storeScope: { $ne: 'SPECIFIC' } };
    }
    const storeIdStr = storeId.toString();
    const storeCandidates: any[] = [storeIdStr];
    if (Types.ObjectId.isValid(storeIdStr)) {
      storeCandidates.push(new Types.ObjectId(storeIdStr));
    }
    return {
      $or: [
        { storeScope: { $ne: 'SPECIFIC' } },
        { storeScope: 'SPECIFIC', assignedStoreIds: { $in: storeCandidates } },
      ],
    };
  }

  private async enrichWithVariants(products: ProductDocument[], areaId?: string, storeId?: string): Promise<any[]> {
    if (products.length === 0) return [];
    const productIds = products.map((p) => (p as any)._id);
    const allVariants = await this.variantModel
      .find({ productId: { $in: productIds }, isActive: true })
      .sort({ isDefault: -1, mrp: 1 })
      .exec();

    const variantsByProduct = new Map<string, ProductVariantDocument[]>();
    for (const v of allVariants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    let pricingByVariant = new Map<string, any>();
    if (areaId) {
      const variantObjectIds = allVariants.map((v) => (v as any)._id);
      const variantStringIds = allVariants.map((v) => (v as any)._id.toString());
      const areaQueries: any[] = [{ areaId: areaId.toString() }];
      if (Types.ObjectId.isValid(areaId)) {
        areaQueries.push({ areaId: new Types.ObjectId(areaId) });
      }
      const pricingRecords = await this.areaPricingModel
        .find({
          variantId: { $in: [...variantObjectIds, ...variantStringIds] },
          $or: areaQueries,
        })
        .exec();
      for (const p of pricingRecords) {
        pricingByVariant.set(p.variantId.toString(), p);
      }
    }

    const inventoryByProduct = new Map<string, number>();
    const inventoryByProdVar = new Map<string, number>();
    const hiddenProdVarSet = new Set<string>();
    if (storeId) {
      const storeIdStr = storeId.toString();
      const storeCandidates: any[] = [storeIdStr];
      if (Types.ObjectId.isValid(storeIdStr)) {
        storeCandidates.push(new Types.ObjectId(storeIdStr));
      }
      const productCandidates: any[] = [
        ...productIds,
        ...productIds.map((id) => id.toString()),
      ];
      const invRecords = await this.inventoryModel
        .find({
          storeId: { $in: storeCandidates },
          productId: { $in: productCandidates },
        })
        .exec();
      for (const inv of invRecords) {
        const pKey = inv.productId?.toString();
        const vKey = inv.variantId?.toString();
        const qty = Math.max(0, Number(inv.availableQty ?? 0));
        if (pKey && vKey) {
          inventoryByProdVar.set(`${pKey}_${vKey}`, qty);
          if ((inv as any).isHiddenInStore === true) {
            hiddenProdVarSet.add(`${pKey}_${vKey}`);
          }
        } else if (pKey && !inventoryByProduct.has(pKey)) {
          inventoryByProduct.set(pKey, qty);
        }
      }
    }

    return products.map((product) => {
      const prodId = (product as any)._id.toString();
      const storeProdStock = inventoryByProduct.get(prodId);

      const rawProductVariants = variantsByProduct.get(prodId) || [];
      const visibleProductVariants = storeId
        ? rawProductVariants.filter((v) => !hiddenProdVarSet.has(`${prodId}_${(v as any)._id.toString()}`))
        : rawProductVariants;

      const variants = visibleProductVariants.map((v) => {
        const vidStr = (v as any)._id.toString();
        const pricing = pricingByVariant.get(vidStr);
        const storeVarStock = inventoryByProdVar.get(`${prodId}_${vidStr}`);
        const effectiveStock =
          storeVarStock !== undefined
            ? storeVarStock
            : storeProdStock !== undefined
            ? storeProdStock
            : pricing?.stock !== undefined
            ? Math.max(0, Number(pricing.stock))
            : (v as any).stock !== undefined
            ? Math.max(0, Number((v as any).stock))
            : typeof (product as any).stock === 'number'
            ? Math.max(0, (product as any).stock)
            : 50;
        return {
          id: vidStr,
          label: v.weightOrVolume,
          price: pricing?.price ?? v.sellingPrice,
          mrp: pricing?.mrp ?? v.mrp,
          discountPercent: pricing?.discountPercent ?? v.discountPercent,
          stock: effectiveStock,
          isAvailable: effectiveStock > 0 && (pricing?.isAvailable ?? true),
          isDefault: v.isDefault,
        };
      });

      const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
      const effectivePrice = defaultVariant?.price ?? product.sellingPrice;
      const effectiveMrp = defaultVariant?.mrp ?? product.mrp;
      const defaultVarInvStock = defaultVariant
        ? inventoryByProdVar.get(`${prodId}_${defaultVariant.id}`)
        : undefined;
      const allVariantsHidden = rawProductVariants.length > 0 && visibleProductVariants.length === 0;
      const effectiveStock = allVariantsHidden
        ? 0
        : defaultVarInvStock !== undefined
        ? defaultVarInvStock
        : storeProdStock !== undefined
        ? storeProdStock
        : defaultVariant
        ? defaultVariant.stock
        : typeof (product as any).stock === 'number'
        ? Math.max(0, (product as any).stock)
        : 100;

      const rawObj = (product as any).toObject();
      // Never leak storeScope/assignedStoreIds array of internal stores cleanly unless needed, keep payload customer-safe
      const assignedIds = Array.isArray(rawObj.assignedStoreIds)
        ? rawObj.assignedStoreIds.map((id: any) => id?.toString?.() || String(id))
        : [];

      return {
        ...rawObj,
        storeScope: rawObj.storeScope || 'ALL',
        assignedStoreIds: assignedIds,
        variants,
        stock: effectiveStock,
        isOutOfStock: effectiveStock <= 0,
        sellingPrice: effectivePrice,
        mrp: effectiveMrp,
      };
    });
  }

  async findAll(filters: ProductQueryFilter) {
    const query: any = { isActive: { $ne: false } };
    const storeVisibilityCondition = this.buildStoreVisibilityCondition(filters.storeId);
    query.$and = [storeVisibilityCondition];

    // Support single categoryId, comma-separated categoryIds, or array of categoryIds (ObjectIds or slugs/names)
    const rawCategoryList: string[] = [];
    if (filters.categoryIds) {
      if (Array.isArray(filters.categoryIds)) {
        rawCategoryList.push(...filters.categoryIds);
      } else if (typeof filters.categoryIds === 'string') {
        rawCategoryList.push(...filters.categoryIds.split(','));
      }
    }
    if (filters.categoryId) {
      rawCategoryList.push(...filters.categoryId.split(','));
    }

    const cleanCategoryList = rawCategoryList.map((s) => s.trim()).filter(Boolean);

    if (cleanCategoryList.length > 0) {
      const directObjectIds: Types.ObjectId[] = [];
      const nonObjectIds: string[] = [];

      for (const item of cleanCategoryList) {
        if (Types.ObjectId.isValid(item)) {
          directObjectIds.push(new Types.ObjectId(item));
        } else {
          nonObjectIds.push(item);
        }
      }

      if (nonObjectIds.length > 0) {
        try {
          const categoryCollection = this.productModel.db.collection('categories');
          const matchedCats = await categoryCollection
            .find({
              $or: [
                { slug: { $in: nonObjectIds.map((s) => s.toLowerCase()) } },
                { name: { $in: nonObjectIds.map((s) => new RegExp(`^${s}$`, 'i')) } },
              ],
            })
            .toArray();

          for (const cat of matchedCats) {
            if (cat._id) {
              directObjectIds.push(new Types.ObjectId(cat._id.toString()));
            }
          }
        } catch (e) {
          // Fall back to directObjectIds
        }
      }

      const uniqueObjectIds = Array.from(new Set(directObjectIds.map((id) => id.toString()))).map(
        (id) => new Types.ObjectId(id),
      );
      const stringIds = uniqueObjectIds.map((id) => id.toString());

      const catOrConditions: any[] = [
        { categoryId: { $in: [...uniqueObjectIds, ...stringIds] } },
      ];
      if (nonObjectIds.length > 0) {
        catOrConditions.push(
          { category: { $in: nonObjectIds.map((s) => new RegExp(`^${s}$`, 'i')) } },
        );
      }

      if (!query.$and) query.$and = [];
      query.$and.push({ $or: catOrConditions });
    }

    if (filters.subCategoryId && Types.ObjectId.isValid(filters.subCategoryId)) {
      query.subCategoryId = new Types.ObjectId(filters.subCategoryId);
    }
    if (filters.search) {
      const s = filters.search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { brand: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
      ];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: any = {};
      if (filters.minPrice !== undefined && filters.minPrice !== null && !isNaN(Number(filters.minPrice))) {
        priceFilter.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null && !isNaN(Number(filters.maxPrice))) {
        priceFilter.$lte = Number(filters.maxPrice);
      }
      if (Object.keys(priceFilter).length > 0) {
        query.sellingPrice = priceFilter;
      }
    }
    if (filters.discount !== undefined && !isNaN(Number(filters.discount))) {
      query.discountPercent = { $gte: Number(filters.discount) };
    }
    if (filters.rating !== undefined && !isNaN(Number(filters.rating))) {
      query.rating = { $gte: Number(filters.rating) };
    }

    let sortOption: any = { isPopular: -1, createdAt: -1 };
    switch (filters.sort) {
      case 'price_asc': sortOption = { sellingPrice: 1 }; break;
      case 'price_desc': sortOption = { sellingPrice: -1 }; break;
      case 'discount': sortOption = { discountPercent: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      default: sortOption = { isPopular: -1, rating: -1 }; break;
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(filters.limit) || 250));
    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      this.productModel.find(query).sort(sortOption).skip(skip).limit(limit)
        .populate('categoryId', 'name slug').exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    const items = await this.enrichWithVariants(rawItems, filters.areaId, filters.storeId);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, areaId?: string, storeId?: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid Product ID');
    const product = await this.productModel.findById(id).populate('categoryId', 'name slug').exec();
    if (!product) throw new NotFoundException('Product not found');
    if (product.storeScope === 'SPECIFIC') {
      const allowedIds = (product.assignedStoreIds || []).map((sid: any) => sid.toString());
      if (!storeId || !allowedIds.includes(storeId.toString())) {
        throw new NotFoundException('Product is not available in this store');
      }
    }
    const [enriched] = await this.enrichWithVariants([product], areaId, storeId);
    return enriched;
  }

  async findPopular(limit = 10, areaId?: string, storeId?: string) {
    const storeVisibility = this.buildStoreVisibilityCondition(storeId);
    const products = await this.productModel
      .find({ isActive: { $ne: false }, isPopular: true, ...storeVisibility })
      .limit(limit)
      .exec();
    return this.enrichWithVariants(products, areaId, storeId);
  }

  async findDeals(limit = 10, areaId?: string, storeId?: string) {
    const storeVisibility = this.buildStoreVisibilityCondition(storeId);
    const products = await this.productModel
      .find({ isActive: { $ne: false }, isDeal: true, ...storeVisibility })
      .limit(limit)
      .exec();
    return this.enrichWithVariants(products, areaId, storeId);
  }
}
