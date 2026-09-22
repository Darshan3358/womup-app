import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    limit = 20,
  ) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;

    const query: any = {};
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const products = await this.productModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const items = [];
    for (const prod of products) {
      let inv = null;
      if (storeId) {
        inv = await this.inventoryModel.findOne({
          storeId,
          productId: prod._id,
        });
      }

      const availableQty = inv ? (inv.availableQty ?? 0) : (prod.stock ?? 0);
      const reservedQty = inv ? (inv.reservedQty ?? 0) : 0;
      const threshold = inv?.lowStockThreshold ?? 10;
      const isLowStock = availableQty <= threshold;
      const isOutOfStock = availableQty === 0;

      if (filter === 'low' && !isLowStock) continue;
      if (filter === 'oos' && !isOutOfStock) continue;

      items.push({
        productId: prod._id.toString(),
        name: prod.name,
        brand: prod.brand,
        imageUrl: prod.imageUrl,
        quantityLabel: prod.quantityLabel,
        sellingPrice: prod.sellingPrice,
        availableQty,
        reservedQty,
        threshold,
        isLowStock,
        isOutOfStock,
        shelfLocation: prod.shelfLocation || 'UNASSIGNED',
        sku: (prod as any).sku || prod.slug || `SKU-${prod._id.toString().slice(-6)}`,
      });
    }

    return items;
  }

  async adjustStock(userId: string, productId: string, dto: StockAdjustmentDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;

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
        availableQty: Math.max(0, (product.stock || 20) + dto.delta),
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 5,
      });
    }

    const beforeQty = inv.availableQty;
    const afterQty = Math.max(0, beforeQty + dto.delta);
    inv.availableQty = afterQty;
    inv.reservedQty = Math.max(0, inv.reservedQty || 0);
    await inv.save();

    // Update base product stock as well
    product.stock = afterQty;
    await product.save();

    const changeType =
      dto.changeType === 'DAMAGE'
        ? InventoryChangeType.DAMAGE
        : dto.changeType === 'RETURN'
        ? InventoryChangeType.RETURN
        : InventoryChangeType.ADJUSTMENT;

    await this.inventoryLogModel.create({
      storeId,
      productId: product._id,
      changeType,
      quantityDelta: dto.delta,
      reason: dto.reason,
      staffId: staff._id,
      beforeQty,
      afterQty,
    });

    // Real-time broadcast stock change
    this.trackingGateway.broadcastInventoryUpdate({
      storeId: storeId ? storeId.toString() : '',
      productId: product._id.toString(),
      productName: product.name,
      availableQty: afterQty,
      reservedQty: inv.reservedQty,
    });

    return {
      success: true,
      message: 'Stock adjusted successfully',
      productId: product._id.toString(),
      beforeQty,
      newQty: afterQty,
    };
  }

  async restock(userId: string, productId: string, dto: RestockDto) {
    const staff = await this.getStaff(userId);
    const storeId = staff.storeId;

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
        availableQty: dto.quantity,
        reservedQty: 0,
        soldQty: 0,
        lowStockThreshold: 5,
      });
    }

    const beforeQty = inv.availableQty;
    const afterQty = beforeQty + dto.quantity;
    inv.availableQty = afterQty;
    inv.reservedQty = Math.max(0, inv.reservedQty || 0);
    await inv.save();

    product.stock = afterQty;
    await product.save();

    await this.inventoryLogModel.create({
      storeId,
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
      message: `Restocked ${dto.quantity} units`,
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
}
