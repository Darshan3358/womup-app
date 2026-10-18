import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import {
  Inventory,
  InventoryDocument,
} from '../../inventory/schemas/inventory.schema';
import {
  InventoryLog,
  InventoryLogDocument,
  InventoryChangeType,
} from '../schemas/inventory-log.schema';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { Store, StoreDocument } from '../../stores/schemas/store.schema';
import {
  StoreStaff,
  StoreStaffDocument,
} from '../schemas/store-staff.schema';
import { TrackingGateway } from '../../tracking/tracking.gateway';
import {
  StockAdjustmentDto,
  RestockDto,
  UpdateShelfLocationDto,
  StoreAddProductDto,
} from './dto/store-inventory.dto';

@Injectable()
export class StoreInventoryService {
  private readonly logger = new Logger(StoreInventoryService.name);

  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryLog.name) private inventoryLogModel: Model<InventoryLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(StoreStaff.name) private staffModel: Model<StoreStaffDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectConnection() private connection: Connection,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  private async getStaff(userId: string): Promise<any> {
    if (Types.ObjectId.isValid(userId)) {
      const staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
      if (staff) return staff;

      const store = await this.storeModel.findById(userId);
      if (store) {
        return {
          _id: store._id,
          userId: store._id,
          storeId: store._id,
          role: 'STORE_MANAGER',
          name: store.name,
        };
      }
    }
    throw new BadRequestException('Store staff record not found');
  }

  async getInventory(
    userId: string,
    search?: string,
    filter?: string,
    page = 1,
    limit = 50,
  ) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;
    const store = storeId ? await this.storeModel.findById(storeId).exec() : null;
    let areaId = store?.areaId;

    // Dynamically resolve areaId if missing on store document (e.g. Chandlodiya - Tragad Dark Store)
    if (!areaId && store) {
      const storeIdStr = store._id?.toString();
      const storeIdObj = Types.ObjectId.isValid(storeIdStr) ? new Types.ObjectId(storeIdStr) : store._id;
      const cleanAreaName = (store.areaName || store.name || '')
        .replace(/^Wom\s*Up\s*/i, '')
        .replace(/\s*Dark\s*Store.*$/i, '')
        .trim();

      const area = await this.connection.collection('areas').findOne({
        $or: [
          { hubStoreId: storeIdObj },
          { hubStoreId: storeIdStr },
          ...(cleanAreaName ? [{ name: new RegExp(cleanAreaName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i') }] : []),
        ],
      });
      if (area) {
        areaId = area._id;
      }
    }

    const query: any = {};
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
      ];
    }

    const products = await this.productModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Query area_pricing for this store's areaId (supports both ObjectId and string format)
    let areaPricings: any[] = [];
    if (areaId) {
      const areaIdStr = areaId.toString();
      const areaIdObj = Types.ObjectId.isValid(areaIdStr) ? new Types.ObjectId(areaIdStr) : null;
      const areaQuery = areaIdObj
        ? { $or: [{ areaId: areaIdObj }, { areaId: areaIdStr }] }
        : { areaId: areaIdStr };
      areaPricings = await this.connection
        .collection('area_pricing')
        .find(areaQuery)
        .toArray();
    }

    // Query product_variants
    const productIds = products.map((p) => p._id);
    const variants = await this.connection
      .collection('product_variants')
      .find({ productId: { $in: productIds } })
      .toArray();

    // Query store-specific inventories for this store (ObjectId and string matched)
    let storeInvs: any[] = [];
    if (storeId) {
      const storeIdStr = storeId.toString();
      const storeIdObj = Types.ObjectId.isValid(storeIdStr) ? new Types.ObjectId(storeIdStr) : storeId;
      storeInvs = await this.inventoryModel
        .find({
          $or: [{ storeId: storeIdObj }, { storeId: storeIdStr }],
        })
        .exec();
    }

    const items = [];
    for (const prod of products) {
      const prodVariants = variants.filter(
        (v) => v.productId && v.productId.toString() === prod._id.toString()
      );

      // Find all store inventory records for this product
      const prodInvs = storeInvs.filter(
        (i) => i.productId && i.productId.toString() === prod._id.toString()
      );
      const mainProdInv = prodInvs.find((i) => !i.variantId) || prodInvs[0];

      // Map each variant with this store's OWN stock (NOT area-shared stock)
      const mappedVariants = prodVariants.map((v) => {
        const ap = areaPricings.find(
          (a) => a.variantId && a.variantId.toString() === v._id.toString()
        );

        // Find store-specific inventory for this variant
        const variantInv = prodInvs.find(
          (i) => i.variantId && i.variantId.toString() === v._id.toString()
        );

        // STORE-WISE STOCK: 1st priority is this store's own recorded inventory!
        const resolvedStock =
          variantInv?.availableQty !== undefined
            ? variantInv.availableQty
            : (v.stock !== undefined ? v.stock : 50);

        return {
          id: v._id.toString(),
          weightOrVolume: v.weightOrVolume || v.packSize || prod.quantityLabel || '1 unit',
          sellingPrice: ap?.price !== undefined ? ap.price : (v.sellingPrice || prod.sellingPrice || 0),
          mrp: ap?.mrp !== undefined && ap.mrp > 0 ? ap.mrp : (v.mrp || prod.mrp || v.sellingPrice || prod.sellingPrice || 0),
          stock: resolvedStock,
          isDefault: Boolean(v.isDefault),
        };
      });

      // Default or primary variant stock
      const defaultVar = mappedVariants.find((v) => v.isDefault) || mappedVariants[0];
      const availableQty = defaultVar
        ? defaultVar.stock
        : (mainProdInv?.availableQty !== undefined ? mainProdInv.availableQty : (prod.stock ?? 50));
      const sellingPrice = defaultVar ? defaultVar.sellingPrice : (prod.sellingPrice ?? 0);
      const mrp = defaultVar ? defaultVar.mrp : (prod.mrp || prod.sellingPrice || 0);

      const reservedQty = defaultVar
        ? (prodInvs.find((i) => i.variantId && i.variantId.toString() === defaultVar.id)?.reservedQty ?? 0)
        : (mainProdInv ? (mainProdInv.reservedQty ?? 0) : 0);
      const threshold = mainProdInv?.lowStockThreshold ?? 10;
      const isLowStock = availableQty > 0 && availableQty <= threshold;
      const isOutOfStock = availableQty <= 0;

      if (filter === 'low' && !isLowStock) continue;
      if (filter === 'oos' && !isOutOfStock) continue;

      items.push({
        productId: prod._id.toString(),
        name: prod.name,
        brand: prod.brand,
        category: (prod as any).categoryName || (prod as any).category || 'Vegetables',
        imageUrl: prod.imageUrl,
        quantityLabel: defaultVar ? defaultVar.weightOrVolume : (prod.quantityLabel || '1 unit'),
        sellingPrice,
        mrp,
        availableQty,
        reservedQty,
        threshold,
        isLowStock,
        isOutOfStock,
        shelfLocation: mainProdInv?.shelfLocation || (prod as any).shelfLocation || 'A1-R2',
        sku: (prod as any).sku || (prod as any).slug || `SKU-${prod._id.toString().slice(-6)}`,
        variants: mappedVariants,
      });
    }

    return items;
  }

  async adjustStock(userId: string, productId: string, dto: StockAdjustmentDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;
    if (!storeId) {
      throw new BadRequestException('Staff is not assigned to any store');
    }

    const storeIdStr = storeId.toString();
    const storeIdObj = Types.ObjectId.isValid(storeIdStr) ? new Types.ObjectId(storeIdStr) : storeId;

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Resolve target variant if specified
    let targetVariantId: Types.ObjectId | null = null;
    let targetVarDoc: any = null;
    if (dto.variantId && Types.ObjectId.isValid(dto.variantId)) {
      targetVariantId = new Types.ObjectId(dto.variantId);
      targetVarDoc = await this.connection.collection('product_variants').findOne({ _id: targetVariantId });
    } else {
      const defaultVar = await this.connection.collection('product_variants').findOne({
        productId: product._id,
        isDefault: true,
      });
      targetVarDoc = defaultVar || (await this.connection.collection('product_variants').findOne({ productId: product._id }));
      if (targetVarDoc) {
        targetVariantId = targetVarDoc._id;
      }
    }

    // Query this specific store's inventory record for this product and variant
    const invQuery: any = {
      $or: [{ storeId: storeIdObj }, { storeId: storeIdStr }],
      productId: product._id,
    };
    if (targetVariantId) {
      invQuery.variantId = targetVariantId;
    }

    let inv = await this.inventoryModel.findOne(invQuery);

    let beforeQty = 50;
    if (inv && inv.availableQty !== undefined) {
      beforeQty = inv.availableQty;
    } else if (targetVarDoc && targetVarDoc.stock !== undefined) {
      beforeQty = targetVarDoc.stock;
    } else {
      beforeQty = product.stock ?? 50;
    }

    const afterQty = Math.max(0, beforeQty + dto.delta);

    // Save STORE-WISE inventory strictly for this store
    if (!inv) {
      inv = await this.inventoryModel.create({
        storeId: storeIdObj,
        storeName: staff.storeName || 'Dark Store',
        warehouseId: storeIdObj,
        productId: product._id,
        productName: product.name,
        category: (product as any).categoryName || (product as any).category || 'General',
        variantId: targetVariantId || undefined,
        sku: targetVarDoc?.sku || (product as any).sku || `SKU-${product._id.toString().slice(-6)}`,
        packSize: targetVarDoc?.weightOrVolume || targetVarDoc?.packSize || product.quantityLabel || '1 unit',
        availableQty: afterQty,
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 10,
        shelfLocation: (product as any).shelfLocation || 'A1-R2',
      });
    } else {
      inv.availableQty = afterQty;
      await inv.save();
    }

    const changeType =
      dto.changeType === 'DAMAGE'
        ? InventoryChangeType.DAMAGE
        : dto.changeType === 'RETURN'
        ? InventoryChangeType.RETURN
        : InventoryChangeType.ADJUSTMENT;

    await this.inventoryLogModel.create({
      storeId: storeIdObj,
      productId: product._id,
      changeType,
      quantityDelta: dto.delta,
      reason: dto.reason,
      staffId: staff._id,
      beforeQty,
      afterQty,
    });

    // Real-time broadcast stock change strictly to this store
    this.trackingGateway.broadcastInventoryUpdate({
      storeId: storeId ? storeId.toString() : '',
      productId: product._id.toString(),
      productName: product.name,
      availableQty: afterQty,
      reservedQty: inv.reservedQty || 0,
    });

    return {
      success: true,
      message: 'Stock adjusted successfully for store',
      productId: product._id.toString(),
      variantId: targetVariantId ? targetVariantId.toString() : undefined,
      beforeQty,
      newQty: afterQty,
    };
  }

  async restock(userId: string, productId: string, dto: RestockDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;
    if (!storeId) {
      throw new BadRequestException('Staff is not assigned to any store');
    }

    const storeIdStr = storeId.toString();
    const storeIdObj = Types.ObjectId.isValid(storeIdStr) ? new Types.ObjectId(storeIdStr) : storeId;

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let inv = await this.inventoryModel.findOne({
      $or: [{ storeId: storeIdObj }, { storeId: storeIdStr }],
      productId: product._id,
    });

    if (!inv) {
      inv = await this.inventoryModel.create({
        storeId: storeIdObj,
        storeName: staff.storeName || 'Dark Store',
        warehouseId: storeIdObj,
        productId: product._id,
        productName: product.name,
        availableQty: dto.quantity,
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 5,
        shelfLocation: (product as any).shelfLocation || 'A1-R2',
      });
    }

    const beforeQty = inv.availableQty;
    const afterQty = beforeQty + dto.quantity;
    inv.availableQty = afterQty;
    inv.reservedQty = Math.max(0, inv.reservedQty || 0);
    await inv.save();

    await this.inventoryLogModel.create({
      storeId: storeIdObj,
      productId: product._id,
      changeType: InventoryChangeType.RESTOCK,
      quantityDelta: dto.quantity,
      reason: `Restock shipment (Batch: ${dto.batchNumber || 'STANDARD'})`,
      staffId: staff._id,
      beforeQty,
      afterQty,
    });

    this.trackingGateway.broadcastInventoryUpdate({
      storeId: storeId ? storeId.toString() : '',
      productId: product._id.toString(),
      productName: product.name,
      availableQty: afterQty,
      reservedQty: inv.reservedQty,
    });

    return {
      success: true,
      message: `Restocked ${dto.quantity} units for store`,
      productId: product._id.toString(),
      beforeQty,
      newQty: afterQty,
    };
  }

  async getLowStock(userId: string) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;

    const lowInv = await this.inventoryModel
      .find({
        storeId,
        availableQty: { $lte: 5 },
      })
      .populate('productId')
      .exec();

    return lowInv.map((inv: any) => ({
      productId: inv.productId?._id?.toString() || inv.productId?.toString(),
      name: inv.productId?.name || 'Item',
      availableQty: inv.availableQty,
      threshold: inv.lowStockThreshold || 5,
      imageUrl: inv.productId?.imageUrl,
    }));
  }

  async getLogs(userId: string, productId?: string) {
    const staff = await this.getStaff(userId);
    const filter: any = {};
    if (staff.storeId) {
      filter.storeId = staff.storeId;
    }
    if (productId && Types.ObjectId.isValid(productId)) {
      filter.productId = new Types.ObjectId(productId);
    }

    const logs = await this.inventoryLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('productId', 'name imageUrl')
      .populate('staffId', 'fullName employeeCode')
      .exec();

    return logs.map((log: any) => ({
      id: log._id.toString(),
      changeType: log.changeType,
      delta: log.quantityDelta,
      reason: log.reason,
      beforeQty: log.beforeQty,
      afterQty: log.afterQty,
      productName: log.productId?.name || 'Inventory Item',
      staffName: log.staffId?.fullName || 'Store Staff',
      timestamp: log.createdAt,
    }));
  }

  async updateShelfLocation(userId: string, productId: string, dto: UpdateShelfLocationDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;
    const cleanShelf = (dto.shelfLocation || '').trim().toUpperCase();

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let inv = await this.inventoryModel.findOne({
      storeId,
      productId: product._id,
    });

    if (!inv) {
      inv = await this.inventoryModel.create({
        storeId,
        productId: product._id,
        availableQty: product.stock || 20,
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 5,
        shelfLocation: cleanShelf,
      });
    } else {
      (inv as any).shelfLocation = cleanShelf;
      await inv.save();
    }

    // Also update product shelfLocation as default fallback
    product.shelfLocation = cleanShelf;
    await product.save();

    this.logger.log(`[Shelf Update] Store ${storeId} set shelf ${cleanShelf} for product ${product.name}`);

    // Update any active picklists that contain this item for immediate live picker reflection
    if (storeId) {
      try {
        await this.inventoryModel.db.collection('pick_lists').updateMany(
          {
            storeId: new Types.ObjectId(storeId.toString()),
            status: 'ACTIVE',
            'items.productId': product._id.toString(),
          },
          {
            $set: { 'items.$[elem].shelfLocation': cleanShelf },
          },
          {
            arrayFilters: [{ 'elem.productId': product._id.toString() }],
          },
        );
      } catch (err: any) {
        this.logger.warn(`[Shelf Update] Pick list item shelf sync skipped: ${err.message}`);
      }
    }

    // Broadcast inventory update to store
    if (storeId) {
      this.trackingGateway.server?.to(`store_${storeId.toString()}`).emit('inventory_update', {
        productId: product._id.toString(),
        shelfLocation: cleanShelf,
      });
    }

    return {
      success: true,
      productId: product._id.toString(),
      shelfLocation: cleanShelf,
      message: `Shelf location set to ${cleanShelf}`,
    };
  }

  async addProduct(userId: string, dto: StoreAddProductDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Product name is required');
    }

    const cleanName = dto.name.trim();
    const cleanShelf = (dto.shelfLocation || '').trim().toUpperCase();
    const primaryVariant = dto.variants?.[0] || {};
    const packSize = primaryVariant.packSize || '1 unit';
    const sellingPrice = Number(primaryVariant.sellingPrice) || 20;
    const mrp = Number(primaryVariant.mrp) || Math.max(sellingPrice, 25);
    const initialQty = Number(dto.initialStock) || 100;

    // Check if category exists or find/create
    const catName = dto.category || 'General';
    let category = await this.productModel.db.collection('categories').findOne({
      name: { $regex: new RegExp(`^${catName}$`, 'i') },
    });
    if (!category) {
      const catRes = await this.productModel.db.collection('categories').insertOne({
        name: catName,
        slug: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      category = { _id: catRes.insertedId };
    }

    // Check if product exists in master catalog
    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = slugBase;
    let counter = 1;
    while (await this.productModel.findOne({ slug })) {
      slug = `${slugBase}-${counter++}`;
    }

    const defaultImg =
      dto.imageUrl?.trim() ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';

    const product = await this.productModel.create({
      name: cleanName,
      slug,
      brand: dto.brand?.trim() || 'Wom Up',
      categoryId: category._id,
      imageUrl: defaultImg,
      images: [defaultImg],
      quantityLabel: packSize,
      mrp,
      sellingPrice,
      discountPercent: mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0,
      stock: initialQty,
      shelfLocation: cleanShelf,
      description: dto.description?.trim() || `Fresh ${cleanName}`,
      isActive: true,
    });

    // Create or update store inventory entry
    let inv = await this.inventoryModel.findOne({
      storeId,
      productId: product._id,
    });

    if (!inv) {
      inv = await this.inventoryModel.create({
        storeId,
        productId: product._id,
        availableQty: initialQty,
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 5,
        shelfLocation: cleanShelf,
      });
    } else {
      inv.availableQty = initialQty;
      (inv as any).shelfLocation = cleanShelf;
      await inv.save();
    }

    // Also record inventory log
    await this.inventoryLogModel.create({
      storeId,
      productId: product._id,
      staffId: staff._id,
      changeType: InventoryChangeType.RESTOCK,
      quantityDelta: initialQty,
      beforeQty: 0,
      afterQty: initialQty,
      reason: 'Initial local stock added by dark store staff',
      createdAt: new Date(),
    });

    this.logger.log(`[Store Add Product] Store ${storeId} added product "${product.name}" with stock ${initialQty}`);

    // Broadcast inventory update
    if (storeId) {
      this.trackingGateway.server?.to(`store_${storeId.toString()}`).emit('inventory_update', {
        productId: product._id.toString(),
        name: product.name,
      });
    }

    return {
      success: true,
      product: {
        id: product._id.toString(),
        name: product.name,
        sellingPrice: product.sellingPrice,
        mrp: product.mrp,
        quantityLabel: product.quantityLabel,
        imageUrl: product.imageUrl,
        shelfLocation: cleanShelf,
      },
      inventory: {
        availableQty: inv.availableQty,
        shelfLocation: (inv as any).shelfLocation || cleanShelf,
      },
      message: 'Product added to master catalog and store inventory successfully',
    };
  }
}

