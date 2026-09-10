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
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(AreaPricing.name) private areaPricingModel: Model<AreaPricingDocument>,
  ) {}

  private async enrichWithVariants(products: ProductDocument[], areaId?: string): Promise<any[]> {
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

    let pricingByVariant = new Map<string, AreaPricingDocument>();
    if (areaId && Types.ObjectId.isValid(areaId)) {
      const variantIds = allVariants.map((v) => (v as any)._id);
      const pricingRecords = await this.areaPricingModel
        .find({ variantId: { $in: variantIds }, areaId: new Types.ObjectId(areaId) })
        .exec();
      for (const p of pricingRecords) {
        pricingByVariant.set(p.variantId.toString(), p);
      }
    }

    return products.map((product) => {
      const prodId = (product as any)._id.toString();
      const variants = (variantsByProduct.get(prodId) || []).map((v) => {
        const vidStr = (v as any)._id.toString();
        const pricing = pricingByVariant.get(vidStr);
        return {
          id: vidStr,
          label: v.weightOrVolume,
          price: pricing?.price ?? v.sellingPrice,
          mrp: pricing?.mrp ?? v.mrp,
          discountPercent: pricing?.discountPercent ?? v.discountPercent,
          stock: pricing?.stock ?? 100,
          isAvailable: pricing?.isAvailable ?? true,
          isDefault: v.isDefault,
        };
      });

      const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
      const effectivePrice = defaultVariant?.price ?? product.sellingPrice;
      const effectiveMrp = defaultVariant?.mrp ?? product.mrp;

      return {
        ...(product as any).toObject(),
        variants,
        sellingPrice: effectivePrice,
        mrp: effectiveMrp,
      };
    });
  }

  async findAll(filters: ProductQueryFilter) {
    const query: any = { isActive: true };

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

      if (uniqueObjectIds.length === 1) {
        query.categoryId = uniqueObjectIds[0];
      } else if (uniqueObjectIds.length > 1) {
        query.categoryId = { $in: uniqueObjectIds };
      } else {
        query.categoryId = new Types.ObjectId();
      }
    }

    if (filters.subCategoryId && Types.ObjectId.isValid(filters.subCategoryId)) {
      query.subCategoryId = new Types.ObjectId(filters.subCategoryId);
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { brand: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
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
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      this.productModel.find(query).sort(sortOption).skip(skip).limit(limit)
        .populate('categoryId', 'name slug').exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    const items = await this.enrichWithVariants(rawItems, filters.areaId);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, areaId?: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid Product ID');
    const product = await this.productModel.findById(id).populate('categoryId', 'name slug').exec();
    if (!product) throw new NotFoundException('Product not found');
    const [enriched] = await this.enrichWithVariants([product], areaId);
    return enriched;
  }

  async findPopular(limit = 10, areaId?: string) {
    const products = await this.productModel
      .find({ isActive: true, isPopular: true }).limit(limit).exec();
    return this.enrichWithVariants(products, areaId);
  }

  async findDeals(limit = 10, areaId?: string) {
    const products = await this.productModel
      .find({ isActive: true, isDeal: true }).limit(limit).exec();
    return this.enrichWithVariants(products, areaId);
  }
}
