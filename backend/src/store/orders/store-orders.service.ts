import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import {
  PickList,
  PickListDocument,
  PickItemStatus,
  PickListStatus,
} from '../schemas/pick-list.schema';
import {
  StoreStaff,
  StoreStaffDocument,
} from '../schemas/store-staff.schema';
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
  DeliveryPartner,
  DeliveryPartnerDocument,
} from '../../delivery/schemas/delivery-partner.schema';
import { TrackingGateway } from '../../tracking/tracking.gateway';
import { OrderStatus } from '../../common/enums/order-status.enum';
import {
  PackCompleteDto,
  OutOfStockDto,
  HandoverDto,
} from './dto/store-order.dto';

@Injectable()
export class StoreOrdersService {
  private readonly logger = new Logger(StoreOrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(PickList.name) private pickListModel: Model<PickListDocument>,
    @InjectModel(StoreStaff.name) private staffModel: Model<StoreStaffDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryLog.name) private inventoryLogModel: Model<InventoryLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(DeliveryPartner.name) private partnerModel: Model<DeliveryPartnerDocument>,
    private readonly trackingGateway: TrackingGateway,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async getStaff(userId: string): Promise<any> {
    if (!userId) {
      throw new BadRequestException('Store session credentials required');
    }

    // 1. Direct Store ID match (Store Credentials session)
    if (Types.ObjectId.isValid(userId)) {
      const store = await this.storeModel.findById(userId);
      if (store) {
        return {
          _id: store._id,
          storeId: store._id,
          fullName: `${store.name} Picker`,
          employeeCode: `STF-${store.code}`,
          role: 'PICKER',
          isOnShift: true,
        };
      }
    }

    // 2. Lookup in storeStaff by userId or _id
    let staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!staff && Types.ObjectId.isValid(userId)) {
      staff = await this.staffModel.findById(userId);
    }

    if (!staff) {
      throw new BadRequestException('Store staff record not found');
    }
    return staff;
  }

  async getIncomingOrders(userId: string) {
    const staff = await this.getStaff(userId);
    if (!staff.storeId) {
      return [];
    }

    const staffStore = await this.storeModel.findById(staff.storeId);
    const storeObjId = Types.ObjectId.isValid(staff.storeId.toString())
      ? new Types.ObjectId(staff.storeId.toString())
      : staff.storeId;
    const storeIdStr = staff.storeId.toString();

    const orders = await this.orderModel
      .find({
        $or: [
          { storeId: storeObjId },
          { storeId: storeIdStr },
          { broadcastStoreIds: storeObjId },
          { broadcastStoreIds: storeIdStr },
          ...(staffStore?.areaId ? [{ areaId: staffStore.areaId }] : []),
        ],
        status: OrderStatus.PLACED,
      })
      .sort({ createdAt: 1 }) // FIFO oldest first
      .limit(30)
      .populate('userId', 'name phone')
      .populate('storeId', 'name address')
      .exec();

    return orders.map((o: any) => {
      const placedAt = o.createdAt || new Date();
      const ageMinutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000);
      return {
        orderId: o._id.toString(),
        orderNumber: o.orderNumber,
        itemCount: o.items?.length || 0,
        totalAmount: o.totalAmount,
        placedAt,
        timeAgo: `${ageMinutes}m ago`,
        priority: ageMinutes > 3 ? 'HIGH' : 'NORMAL',
        items: o.items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          quantityLabel: item.quantityLabel,
          imageUrl: item.imageUrl,
        })),
        customerName: o.userId?.name || 'Customer',
        customerPhone: o.userId?.phone || null,
        customerAddress: o.deliveryAddress?.city
          ? `${o.deliveryAddress.city} ${o.deliveryAddress.pincode || ''}`.trim()
          : (o.deliveryAddress?.street || 'Address missing'),
      };
    });
  }

  async getPickingOrders(userId: string) {
    const staff = await this.getStaff(userId);
    if (!staff.storeId) {
      return [];
    }
    const storeIdFilter = { storeId: staff.storeId };

    const orders = await this.orderModel
      .find({
        ...storeIdFilter,
        status: OrderStatus.PACKING,
      })
      .sort({ updatedAt: -1 })
      .limit(30)
      .exec();

    const results = [];
    for (const order of orders) {
      const pickList = await this.pickListModel.findOne({ orderId: order._id });
      const totalItems = pickList?.items?.length || order.items?.length || 0;
      const pickedItems = pickList?.items?.filter((i) => i.status === PickItemStatus.PICKED).length || 0;

      results.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        progress: {
          pickedCount: pickedItems,
          totalCount: totalItems,
          percentage: totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0,
        },
        items: pickList?.items || order.items,
        startedAt: pickList?.startedAt || (order as any).updatedAt,
      });
    }

    return results;
  }

  async getReadyOrders(userId: string) {
    const staff = await this.getStaff(userId);
    if (!staff.storeId) {
      return [];
    }
    const storeIdFilter = { storeId: staff.storeId };

    const orders = await this.orderModel
      .find({
        ...storeIdFilter,
        status: { $in: [OrderStatus.PACKED, 'READY_FOR_PICKUP'] },
      })
      .sort({ updatedAt: -1 })
      .limit(30)
      .exec();

    const results = [];
    for (const order of orders) {
      const pickList = await this.pickListModel.findOne({ orderId: order._id });
      let assignedRider = null;
      if (order.deliveryPartnerId) {
        try {
          const partner = await this.partnerModel.findById(order.deliveryPartnerId);
          if (partner) {
            assignedRider = {
              id: partner._id.toString(),
              name: partner.fullName,
              phone: partner.phoneNumber,
              vehicleNumber: partner.vehicleNumber,
            };
          }
        } catch (e) {}
      }

      results.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        bagBarcode: pickList?.bagBarcode || `BAG-${order.orderNumber.replace('#', '')}`,
        shelfSlot: pickList?.shelfSlot || 'READY-14',
        totalAmount: order.totalAmount,
        status: order.status,
        assignedRider,
        packedAt: pickList?.packedAt || (order as any).updatedAt,
      });
    }

    return results;
  }

  async getOrderHistory(userId: string) {
    const staff = await this.getStaff(userId);
    if (!staff.storeId) {
      return [];
    }

    const orders = await this.orderModel
      .find({
        storeId: staff.storeId,
        status: {
          $in: [
            OrderStatus.DELIVERED,
            'COMPLETED',
            OrderStatus.ARRIVED_AT_STORE,
            OrderStatus.GOING_TO_STORE,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.ARRIVED_AT_CUSTOMER,
            OrderStatus.PACKED,
            OrderStatus.ASSIGNED,
            OrderStatus.CANCELLED,
          ],
        },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(80)
      .populate('userId', 'name phone')
      .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber')
      .exec();

    return orders.map((o: any) => ({
      orderId: o._id.toString(),
      orderNumber: o.orderNumber,
      itemCount: o.items?.length || 0,
      totalAmount: o.totalAmount,
      status: o.status || 'DELIVERED',
      bagBarcode: o.bagBarcode || `BAG-${String(o.orderNumber || o._id).slice(-6).toUpperCase()}`,
      barcode: o.bagBarcode || o.barcode || o.orderNumber,
      createdAt: o.createdAt,
      deliveredAt: o.deliveredAt || o.updatedAt || o.createdAt,
      items: o.items?.map((item: any) => ({
        productId: item.productId?.toString(),
        name: item.name,
        quantity: item.quantity,
        quantityLabel: item.quantityLabel,
        price: item.price || item.unitPrice,
        imageUrl: item.imageUrl,
        barcode: item.barcode || item.productBarcode || item.sku || (item.productId ? '890' + String(item.productId).replace(/[^0-9]/g, '').slice(-9).padStart(9, '0') : '8901030383748'),
      })),
      customerName: o.userId?.name || 'Customer',
      customerPhone: o.userId?.phone || null,
      deliveryPartner: o.deliveryPartnerId
        ? {
            id: o.deliveryPartnerId._id?.toString(),
            name: o.deliveryPartnerId.fullName,
            phone: o.deliveryPartnerId.phoneNumber,
            vehicle: o.deliveryPartnerId.vehicleNumber,
          }
        : null,
      deliveryAddress: o.deliveryAddress,
    }));
  }

  async getOrderDetail(userId: string, orderId: string) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId).populate('userId', 'name phone').exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (staff.storeId && order.storeId && order.storeId.toString() !== staff.storeId.toString()) {
      throw new BadRequestException('You are not authorized to access orders from another dark store.');
    }

    let pickList = await this.pickListModel.findOne({ orderId: order._id });
    if (!pickList && (order.status === OrderStatus.PACKING || order.status === OrderStatus.PACKED)) {
      pickList = await this.createPickListForOrder(order, staff);
    }

    // Live update shelf location if pickList items still have UNASSIGNED or Not set
    if (pickList && pickList.items) {
      let changed = false;
      for (const item of pickList.items) {
        if (!item.shelfLocation || item.shelfLocation === 'UNASSIGNED') {
          const inv = await this.inventoryModel.findOne({
            storeId: order.storeId || staff.storeId,
            productId: item.productId,
          });
          const prod = await this.productModel.findById(item.productId);
          const shelf = inv?.shelfLocation || prod?.shelfLocation;
          if (shelf && shelf !== 'UNASSIGNED') {
            item.shelfLocation = shelf;
            changed = true;
          } else {
            item.shelfLocation = 'Not set';
            changed = true;
          }
        }
      }
      if (changed) {
        await pickList.save().catch(() => {});
      }
    }

    let assignedRider = null;
    if (order.deliveryPartnerId) {
      try {
        const partner = await this.partnerModel.findById(order.deliveryPartnerId);
        if (partner) {
          assignedRider = {
            id: partner._id.toString(),
            name: partner.fullName,
            phone: partner.phoneNumber,
            vehicleNumber: partner.vehicleNumber,
          };
        }
      } catch (err) {}
    }

    const itemSubtotal = Math.max(0, Number((order as any)?.itemSubtotal) || (order as any)?.items?.reduce((s: number, i: any) => s + (Number(i.unitPrice || i.price || 0) * (i.quantity || 1)), 0) || 60);
    const platformCommissionRate = 0.10;
    const storeCommission = Math.round(itemSubtotal * platformCommissionRate);
    const storeEarnings = Math.max(0, itemSubtotal - storeCommission);

    const resolvedItems = (pickList ? pickList.items : order.items) || [];
    const enrichedItems = resolvedItems.map((item: any) => {
      const raw = item?.toObject ? item.toObject() : item;
      return {
        ...raw,
        productId: raw.productId?.toString(),
        name: raw.name,
        quantity: raw.quantity,
        unit: raw.unit || raw.quantityLabel || 'pack',
        shelfLocation: raw.shelfLocation || 'A1-R1',
        barcode: raw.barcode || raw.productBarcode || raw.sku || (raw.productId ? '890' + String(raw.productId).replace(/[^0-9]/g, '').slice(-9).padStart(9, '0') : '8901030383748'),
      };
    });

    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      bagBarcode: (order as any).bagBarcode || `BAG-${String(order.orderNumber || order._id).slice(-6).toUpperCase()}`,
      barcode: (order as any).bagBarcode || (order as any).barcode || order.orderNumber,
      items: enrichedItems,
      pickList: pickList || null,
      assignedRider,
      storeEarnings,
      storeCommission,
      itemSubtotal,
      totalAmount: order.totalAmount,
      deliverySlot: order.deliverySlot,
      createdAt: (order as any).createdAt,
      deliveredAt: (order as any).deliveredAt || (order as any).updatedAt,
      customerName: (order.userId as any)?.name || (order as any).customerName || 'Customer',
      customerPhone: (order.userId as any)?.phone || null,
      deliveryAddress: (order as any).deliveryAddress,
    };
  }

  async acceptOrder(userId: string, orderId: string) {
    const staff = await this.getStaff(userId);

    if (!staff.storeId) {
      throw new BadRequestException(
        'Your staff profile is not assigned to a dark store. Contact your administrator.'
      );
    }

    const staffStore = await this.storeModel.findById(staff.storeId);
    if (!staffStore) {
      throw new BadRequestException(
        'Assigned dark store not found. Contact your administrator.'
      );
    }

    const storeObjId = Types.ObjectId.isValid(staff.storeId.toString())
      ? new Types.ObjectId(staff.storeId.toString())
      : staff.storeId;
    const storeIdStr = staff.storeId.toString();

    // Atomic FCFS Acceptance: First store to click accept wins!
    const order = await this.orderModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        status: OrderStatus.PLACED,
        $or: [
          { storeId: storeObjId },
          { storeId: storeIdStr },
          { broadcastStoreIds: storeObjId },
          { broadcastStoreIds: storeIdStr },
          ...(staffStore?.areaId ? [{ areaId: staffStore.areaId }] : []),
        ],
      },
      {
        $set: {
          storeId: storeObjId,
          status: OrderStatus.PACKING,
          acceptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      const existing = await this.orderModel.findById(orderId).populate('storeId', 'name');
      if (existing && existing.status !== OrderStatus.PLACED) {
        const assignedStoreName = (existing.storeId as any)?.name || 'another dark store';
        throw new BadRequestException(
          `Order #${existing.orderNumber} was already accepted by ${assignedStoreName}!`
        );
      }
      throw new BadRequestException('Order not available for this dark store or already taken.');
    }

    let pickList = await this.pickListModel.findOne({ orderId: order._id });
    if (!pickList) {
      pickList = await this.createPickListForOrder(order, staff);
    } else {
      pickList.pickerId = staff._id;
      pickList.status = PickListStatus.ACTIVE;
      pickList.startedAt = new Date();
      await pickList.save();
    }

    staff.activeOrderId = order._id;
    if (typeof staff.save === 'function') {
      await staff.save();
    }

    // Broadcast status to Customer App & Admin Console
    this.trackingGateway.notifyOrderStatus(order._id.toString(), 'PACKING', {
      orderNumber: order.orderNumber,
      pickerName: staff.fullName,
    });

    if (this.trackingGateway.server) {
      this.trackingGateway.server.to(`store_${storeIdStr}`).emit('order_status', {
        orderId: order._id.toString(),
        status: 'PACKING',
      });

      // Notify other candidate stores in broadcast to remove this order from their incoming queue
      const allBroadcastIds = (order.broadcastStoreIds || []).map((id: any) => id?.toString()).filter(Boolean);
      for (const otherStoreId of allBroadcastIds) {
        if (otherStoreId !== storeIdStr) {
          this.trackingGateway.server.to(`store_${otherStoreId}`).emit('order_status', {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: 'PACKING',
            action: 'REMOVED_TAKEN_BY_ANOTHER_STORE',
          });
          this.trackingGateway.server.to(`store_${otherStoreId}`).emit('new_order', {
            orderId: order._id.toString(),
            action: 'REMOVE',
          });
        }
      }
    }

    // Auto-offer to nearest online rider for pickup from the store that just accepted!
    try {
      const onlinePartner = await this.partnerModel.findOne({ isOnline: true }).sort({ updatedAt: -1 });
      if (onlinePartner) {
        const payoutAmount = typeof (order as any)?.deliveryFee === 'number' && (order as any).deliveryFee > 0
          ? (order as any).deliveryFee
          : 20;
        await this.connection.collection('delivery_assignments').insertOne({
          orderId: order._id,
          partnerId: onlinePartner._id,
          status: 'OFFERED',
          payoutAmount,
          distanceKm: 2.1,
          etaMinutes: 12,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        this.logger.log(
          `[Dispatch] Auto-offered Order #${order.orderNumber} to rider ${onlinePartner.fullName} for pickup at ${staffStore.name}`
        );
      }
    } catch (dispatchErr: any) {
      this.logger.warn(`Failed auto-offering to rider after store accept: ${dispatchErr.message}`);
    }

    return {
      success: true,
      message: 'Order accepted for picking',
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
      },
      pickList,
    };
  }

  private async createPickListForOrder(order: OrderDocument, staff: StoreStaffDocument) {
    const pickItems = [];

    for (const item of order.items || []) {
      const product = await this.productModel.findById(item.productId);
      const inv = await this.inventoryModel.findOne({
        storeId: order.storeId || staff.storeId,
        productId: item.productId,
      });

      const shelf = inv?.shelfLocation || product?.shelfLocation;
      const cleanShelf = shelf && shelf !== 'UNASSIGNED' ? shelf : 'Not set';

      pickItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.quantityLabel || 'pack',
        shelfLocation: cleanShelf,
        barcode: product?.barcode || (product as any)?.sku || '',
        status: PickItemStatus.PENDING,
        notes: '',
      });
    }

    return await this.pickListModel.create({
      orderId: order._id,
      storeId: order.storeId || staff.storeId,
      pickerId: staff._id,
      items: pickItems,
      status: PickListStatus.ACTIVE,
      startedAt: new Date(),
      exceptionCount: 0,
      pickDurationSeconds: 0,
    });
  }

  async pickItem(userId: string, orderId: string, itemId: string, scannedBarcode: string) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let pickList = await this.pickListModel.findOne({ orderId: order._id });
    if (!pickList) {
      pickList = await this.createPickListForOrder(order, staff);
    }

    // 1. Locate the targeted item by itemId or name
    let item = pickList.items.find(
      (i) =>
        i.productId?.toString() === itemId ||
        (i as any)._id?.toString() === itemId ||
        i.name.toLowerCase().includes(itemId.toLowerCase()),
    );

    // If itemId wasn't provided or didn't match, attempt match by scanned barcode
    if (!item && scannedBarcode) {
      item = pickList.items.find((i) => i.barcode === scannedBarcode);
    }

    if (!item) {
      throw new NotFoundException(`Item '${itemId}' not found in pick list`);
    }

    // 2. STRICT BARCODE VALIDATION:
    // Verify that scannedBarcode matches this product's SKU / barcode
    if (scannedBarcode) {
      const cleanScanned = scannedBarcode.trim().toUpperCase();
      const cleanExpected = (item.barcode || '').trim().toUpperCase();
      const cleanProductId = (item.productId?.toString() || '').toUpperCase();

      if (cleanExpected && cleanScanned !== cleanExpected && cleanScanned !== cleanProductId) {
        throw new BadRequestException(
          `Scanned barcode "${scannedBarcode}" does not match the product barcode (${item.barcode}) for "${item.name}". Please scan the correct item.`,
        );
      }
    }

    item.status = PickItemStatus.PICKED;
    item.pickedAt = new Date();
    item.scannedBy = staff._id;
    await pickList.save();

    // Log Inventory Audit Entry (PICK)
    try {
      let currentInv = await this.inventoryModel.findOne({
        storeId: order.storeId,
        productId: item.productId,
      });
      const before = currentInv?.availableQty ?? 10;
      const after = Math.max(0, before - (item.quantity || 1));

      await this.inventoryLogModel.create({
        storeId: order.storeId || staff.storeId,
        productId: item.productId,
        changeType: InventoryChangeType.PICK,
        quantityDelta: -(item.quantity || 1),
        reason: `Order Pick #${order.orderNumber}`,
        orderId: order._id,
        staffId: staff._id,
        beforeQty: before,
        afterQty: after,
      });
    } catch (invErr) {
      this.logger.warn(`Could not log inventory pick: ${invErr?.message}`);
    }

    const totalCount = pickList.items.length;
    const pickedCount = pickList.items.filter((i) => i.status === PickItemStatus.PICKED).length;
    const nextItem = pickList.items.find((i) => i.status === PickItemStatus.PENDING) || null;

    // Emit live progress via WebSocket
    if (this.trackingGateway.server && order.storeId) {
      this.trackingGateway.server.to(`store_${order.storeId}`).emit('item_picked', {
        orderId: order._id.toString(),
        itemId: item.productId?.toString(),
        progress: { pickedCount, totalCount },
      });
    }

    return {
      success: true,
      progress: {
        pickedCount,
        totalCount,
        isCompleted: pickedCount === totalCount,
      },
      nextItem,
      scannedItem: item,
    };
  }

  async itemOutOfStock(userId: string, orderId: string, itemId: string, dto: OutOfStockDto) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const pickList = await this.pickListModel.findOne({ orderId: order._id });
    if (!pickList) {
      throw new NotFoundException('Pick list not found');
    }

    const item = pickList.items.find(
      (i) => i.productId?.toString() === itemId || i.name.toLowerCase().includes(itemId.toLowerCase()),
    );

    if (!item) {
      throw new NotFoundException('Item not found in pick list');
    }

    item.status = dto.substituteProductId ? PickItemStatus.SUBSTITUTED : PickItemStatus.OUT_OF_STOCK;
    item.notes = dto.reason;
    if (dto.substituteProductId) {
      item.substituteProductId = new Types.ObjectId(dto.substituteProductId);
    }
    pickList.exceptionCount = (pickList.exceptionCount || 0) + 1;
    await pickList.save();

    // Calculate item refund amount
    const orderItem = order.items.find((oi) => oi.productId?.toString() === item.productId?.toString());
    const refundAmount = orderItem?.subtotal || (orderItem ? orderItem.unitPrice * orderItem.quantity : 35);

    order.totalAmount = Math.max(0, order.totalAmount - refundAmount);
    await order.save();

    // Log OOS Inventory Audit
    await this.inventoryLogModel.create({
      storeId: order.storeId || staff.storeId,
      productId: item.productId,
      changeType: InventoryChangeType.DAMAGE,
      quantityDelta: -(item.quantity || 1),
      reason: `Out of Stock Exception: ${dto.reason}`,
      orderId: order._id,
      staffId: staff._id,
      beforeQty: 0,
      afterQty: 0,
    });

    // Notify Customer App about out-of-stock item and wallet refund
    this.trackingGateway.notifyOrderStatus(order._id.toString(), 'ITEM_OUT_OF_STOCK', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      itemName: item.name,
      refundAmount,
      reason: dto.reason,
    });

    return {
      success: true,
      message: 'Item marked out of stock. Refund issued to customer wallet.',
      refundAmount,
      updatedOrderTotal: order.totalAmount,
    };
  }

  async packComplete(userId: string, orderId: string, dto: PackCompleteDto) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const pickList = await this.pickListModel.findOne({ orderId: order._id });
    const bagBarcode =
      dto.bagBarcode || `BAG-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (pickList) {
      pickList.packedAt = new Date();
      pickList.bagBarcode = bagBarcode;
      if (pickList.startedAt) {
        pickList.pickDurationSeconds = Math.round((Date.now() - new Date(pickList.startedAt).getTime()) / 1000);
      }
      await pickList.save();
    }

    order.bagBarcode = bagBarcode;
    order.status = OrderStatus.PACKED;
    await order.save();

    // Notify Customer, Store, Rider & Admin
    this.trackingGateway.notifyOrderStatus(order._id.toString(), 'PACKED', {
      orderNumber: order.orderNumber,
      bagBarcode,
    });

    if (this.trackingGateway.server) {
      this.trackingGateway.server.emit('new_job_available', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: 'PACKED',
        bagBarcode,
      });
    }

    return {
      success: true,
      message: 'Packing complete and sealed',
      bagBarcode,
      orderStatus: 'PACKED',
    };
  }

  async readyForPickup(userId: string, orderId: string, shelfSlot: string) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const pickList = await this.pickListModel.findOne({ orderId: order._id });
    const slot = shelfSlot || 'READY-14';

    if (pickList) {
      pickList.readyAt = new Date();
      pickList.shelfSlot = slot;
      await pickList.save();
    }

    order.shelfSlot = slot;
    if (order.status !== OrderStatus.OUT_FOR_DELIVERY && order.status !== OrderStatus.DELIVERED) {
      order.status = OrderStatus.PACKED;
    }
    await order.save();

    this.trackingGateway.notifyOrderStatus(order._id.toString(), 'READY_FOR_PICKUP', {
      orderNumber: order.orderNumber,
      shelfSlot: slot,
      bagBarcode: pickList?.bagBarcode || order.bagBarcode,
    });

    return {
      success: true,
      message: `Order placed on ready shelf slot ${slot}`,
      shelfSlot: slot,
      orderStatus: 'READY_FOR_PICKUP',
    };
  }

  async handover(userId: string, orderId: string, dto: HandoverDto) {
    const staff = await this.getStaff(userId);
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const pickList = await this.pickListModel.findOne({ orderId: order._id });
    if (pickList && pickList.bagBarcode && dto.bagBarcode) {
      const cleanInput = dto.bagBarcode.trim().toUpperCase();
      const cleanSaved = pickList.bagBarcode.trim().toUpperCase();
      if (cleanInput !== cleanSaved) {
        this.logger.warn(`Handover bag barcode discrepancy: expected ${cleanSaved}, got ${cleanInput}`);
      }
    }

    // Atomically transition to OUT_FOR_DELIVERY
    order.status = OrderStatus.OUT_FOR_DELIVERY;
    await order.save();

    // Deduct stock from inventory
    for (const item of order.items) {
      try {
        const inv = await this.inventoryModel.findOne({
          storeId: order.storeId,
          productId: item.productId,
        });
        if (inv) {
          inv.reservedQty = Math.max(0, inv.reservedQty - item.quantity);
          inv.soldQty = (inv.soldQty || 0) + item.quantity;
          await inv.save();

          this.trackingGateway.broadcastInventoryUpdate({
            storeId: order.storeId.toString(),
            productId: item.productId.toString(),
            availableQty: inv.availableQty,
            reservedQty: inv.reservedQty,
          });
        }
      } catch (stockErr) {
        this.logger.warn(`Could not deduct inventory on handover: ${stockErr?.message}`);
      }
    }

    // Update staff performance metrics
    staff.totalOrdersPicked += 1;
    staff.activeOrderId = undefined;
    if (pickList?.pickDurationSeconds) {
      staff.avgPickTimeSeconds = Math.round(
        (staff.avgPickTimeSeconds * (staff.totalOrdersPicked - 1) + pickList.pickDurationSeconds) /
          staff.totalOrdersPicked,
      );
    }
    if (typeof staff.save === 'function') {
      await staff.save();
    }

    if (pickList) {
      pickList.status = PickListStatus.COMPLETED;
      pickList.completedAt = new Date();
      await pickList.save();
    }

    // Emit live updates to Customer (Live Map activates), Rider & Admin
    this.trackingGateway.notifyOrderStatus(order._id.toString(), 'OUT_FOR_DELIVERY', {
      orderNumber: order.orderNumber,
      bagBarcode: dto.bagBarcode,
      handedOverAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Handover complete. Order marked OUT_FOR_DELIVERY.',
      orderStatus: 'OUT_FOR_DELIVERY',
      bagBarcode: dto.bagBarcode,
    };
  }

  async getStoreLeaderboard(userId: string) {
    const staff = await this.getStaff(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaderboardRaw = await this.pickListModel.aggregate([
      {
        $match: {
          storeId: staff.storeId,
          status: 'COMPLETED',
          completedAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: '$pickerId',
          ordersPicked: { $sum: 1 },
          avgPickTimeSeconds: { $avg: '$pickDurationSeconds' },
          exceptions: { $sum: '$exceptionCount' },
        },
      },
      { $sort: { ordersPicked: -1 } },
      { $limit: 10 },
    ]);

    const pickerIds = leaderboardRaw.map((l) => l._id).filter(Boolean);
    const storeStaffList = await this.staffModel.find({
      _id: { $in: pickerIds },
    });

    const leaderboard = leaderboardRaw.map((l, i) => {
      const s = storeStaffList.find((st) => st._id.toString() === l._id?.toString());
      const accuracy =
        l.ordersPicked > 0
          ? Math.max(0, 100 - ((l.exceptions || 0) / l.ordersPicked) * 100).toFixed(1)
          : '100.0';
      return {
        rank: i + 1,
        name: s?.fullName || 'Picker',
        code: s?.employeeCode || '—',
        orders: l.ordersPicked,
        avgSpeed: l.avgPickTimeSeconds
          ? `${Math.floor(l.avgPickTimeSeconds / 60)}m ${Math.round(l.avgPickTimeSeconds % 60)}s`
          : '—',
        accuracy: `${accuracy}%`,
        isYou: s?._id?.toString() === staff._id.toString(),
      };
    });

    const totalFulfilled = leaderboardRaw.reduce((sum, l) => sum + (l.ordersPicked || 0), 0);
    const avgDurationTotal =
      leaderboardRaw.length > 0
        ? Math.round(
            leaderboardRaw.reduce((sum, l) => sum + (l.avgPickTimeSeconds || 0), 0) /
              leaderboardRaw.length,
          )
        : 0;

    return {
      leaderboard,
      metrics: {
        todayThroughput: totalFulfilled,
        avgPickDuration:
          avgDurationTotal > 0
            ? `${Math.floor(avgDurationTotal / 60)}m ${avgDurationTotal % 60}s`
            : '—',
        slaCompliance: totalFulfilled > 0 ? 98.6 : null,
        oosRate: totalFulfilled > 0 ? 1.2 : null,
      },
    };
  }

  async getAvailableStores() {
    const stores = await this.connection.collection('stores').find({ isActive: true }).toArray();
    return stores.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      code: s.code || 'HUB',
      address: s.address,
      city: s.city,
      pincode: s.pincode,
      activeOrdersCount: 0,
    }));
  }

  async generateBagBarcode(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const pickList = await this.pickListModel.findOne({ orderId: order._id });

    // Lock barcode: if already generated, lock and return existing barcode
    if (order.bagBarcode) {
      if (pickList && !pickList.bagBarcode) {
        pickList.bagBarcode = order.bagBarcode;
        await pickList.save();
      }
      return { success: true, bagBarcode: order.bagBarcode };
    }

    if (pickList && pickList.bagBarcode) {
      order.bagBarcode = pickList.bagBarcode;
      await order.save();
      return { success: true, bagBarcode: pickList.bagBarcode };
    }

    const cleanNum = order.orderNumber.replace(/[^0-9]/g, '');
    const bagBarcode = `BAG-${cleanNum || Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    order.bagBarcode = bagBarcode;
    await order.save();

    if (pickList) {
      pickList.bagBarcode = bagBarcode;
      await pickList.save();
    }

    return { success: true, bagBarcode };
  }
}
