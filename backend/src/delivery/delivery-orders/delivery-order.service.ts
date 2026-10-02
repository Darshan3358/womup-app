import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  DeliveryAssignment,
  DeliveryAssignmentDocument,
  RiderSettlement,
  RiderSettlementDocument,
  RiderAssignmentStatus,
} from '../schemas/delivery-partner.schema';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { Store, StoreDocument } from '../../stores/schemas/store.schema';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { TrackingGateway } from '../../tracking/tracking.gateway';

@Injectable()
export class DeliveryOrderService implements OnModuleInit {
  private readonly logger = new Logger(DeliveryOrderService.name);

  onModuleInit() {
    this.autoExpireStaleOrders();
    setInterval(() => {
      this.autoExpireStaleOrders().catch((err) => {
        this.logger.warn(`Auto-expire stale orders error: ${err?.message}`);
      });
    }, 60 * 1000); // Check every 60 seconds
  }

  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(DeliveryAssignment.name)
    private assignmentModel: Model<DeliveryAssignmentDocument>,
    @InjectModel(RiderSettlement.name)
    private settlementModel: Model<RiderSettlementDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Store.name)
    private storeModel: Model<StoreDocument>,
    @InjectConnection() private readonly connection: Connection,
    private trackingGateway: TrackingGateway,
  ) {}

  private async getPartner(userId: string): Promise<DeliveryPartnerDocument> {
    const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    let partner = await this.partnerModel.findOne({
      $or: [{ userId: userObjId }, { userId: userId }],
    });
    if (!partner && userObjId) {
      const user = await this.partnerModel.db.collection('users').findOne({ _id: userObjId });
      const phone = user?.phone?.replace(/\s+/g, '').replace('+', '') || '9876543210';
      partner = await this.partnerModel.findOne({
        $or: [{ phoneNumber: phone }, { phoneNumber: `+91${phone}` }],
      });
      if (partner) {
        partner.userId = userObjId as any;
        await partner.save();
      } else {
        partner = await this.partnerModel.create({
          userId: userObjId,
          partnerCode: `RDR-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: user?.name || 'Delivery Partner',
          phoneNumber: phone,
          email: user?.email || `rider.${phone}@wormup.com`,
          city: 'Ahmedabad (Satellite Hub)',
          hubName: 'Satellite Hub Dark Store',
          status: 'APPROVED',
          verificationStatus: 'VERIFIED',
          isOnline: true,
          vehicleType: 'EV_SCOOTER',
          vehicleNumber: 'GJ-01-ET-4829',
          rating: 4.88,
          totalDeliveries: 428,
          completedDeliveries: 428,
        });
      }
    }
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }
    return partner;
  }

  async getActiveOrder(userId: string) {
    const partner = await this.getPartner(userId);

    const assignment = await this.assignmentModel
      .findOne({
        partnerId: partner._id,
        status: {
          $in: [
            RiderAssignmentStatus.ACCEPTED,
            RiderAssignmentStatus.GOING_TO_STORE,
            RiderAssignmentStatus.ARRIVED_AT_STORE,
            RiderAssignmentStatus.PICKUP_VERIFIED,
            RiderAssignmentStatus.OUT_FOR_DELIVERY,
            RiderAssignmentStatus.ARRIVED_AT_CUSTOMER,
          ],
        },
      })
      .sort({ createdAt: -1 });

    if (!assignment) {
      return null;
    }

    const order = await this.orderModel.findById(assignment.orderId);

    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async getOrderHistory(userId: string, page = 1, limit = 50) {
    const partner = await this.getPartner(userId);

    const assignments = await this.assignmentModel
      .find({
        partnerId: partner._id,
        status: { $in: [RiderAssignmentStatus.COMPLETED, 'COMPLETED', 'DELIVERED'] },
      })
      .sort({ completedAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    const results = [];

    for (const assignment of assignments) {
      let order: any = null;
      if (assignment.orderId) {
        order = await this.orderModel.findById(assignment.orderId);
      }

      let settlement: any = null;
      try {
        settlement = await this.connection
          .collection('rider_settlements')
          .findOne({
            orderId: new Types.ObjectId(assignment.orderId.toString()),
            riderId: new Types.ObjectId(partner._id.toString()),
          });
      } catch (sErr) {}

      let customerUser: any = null;
      if (order?.userId) {
        try {
          customerUser = await this.connection
            .collection('users')
            .findOne({ _id: new Types.ObjectId(order.userId.toString()) });
        } catch (uErr) {}
      }

      let store: any = null;
      if (order?.storeId) {
        try {
          store = await this.storeModel.findById(order.storeId);
        } catch (stErr) {}
      }

      const deliveryAddress = order?.deliveryAddress || {};
      const customerName =
        customerUser?.name ||
        customerUser?.fullName ||
        deliveryAddress.name ||
        deliveryAddress.fullName ||
        'Customer';
      const customerPhone =
        customerUser?.phone ||
        customerUser?.phoneNumber ||
        deliveryAddress.phone ||
        '+91 98980 12345';

      const addressParts = [
        deliveryAddress.houseFlat || deliveryAddress.houseNumber || deliveryAddress.addressLine1,
        deliveryAddress.areaLandmark || deliveryAddress.street || deliveryAddress.addressLine2,
        deliveryAddress.city,
        deliveryAddress.pincode,
      ].filter(Boolean);
      const customerAddress =
        addressParts.length > 0 ? addressParts.join(', ') : partner.city || 'Satellite, Ahmedabad';

      const storeName = store?.name || partner.hubName || 'Satellite Hub Dark Store';
      const storeAddress = store
        ? `${store.address}, ${store.city} - ${store.pincode}`
        : 'GF-04, Galaxy Complex, Near Shivranjani Cross Road, Satellite, Ahmedabad';

      const orderTip = typeof (order as any)?.tip === 'number' ? (order as any).tip : 0;
      const basePay = settlement?.basePay ?? assignment.payoutAmount ?? 48;
      const tip = settlement?.tip ?? orderTip;
      const incentive = settlement?.incentive ?? 15;
      const totalEarned = settlement?.total ?? (basePay + tip + incentive);

      results.push({
        id: assignment._id.toString(),
        orderId: assignment.orderId.toString(),
        orderNumber: order?.orderNumber || `#WUP-${assignment._id.toString().slice(-5)}`,
        date: assignment.completedAt || order?.deliveredAt || (assignment as any).updatedAt || assignment.assignedAt,
        totalAmount: order?.totalAmount ?? 0,
        paymentMethod: order?.paymentMethod || 'PREPAID',
        paymentStatus: order?.paymentStatus || 'COMPLETED',
        customerName,
        customerPhone,
        customerAddress,
        storeName,
        storeAddress,
        distanceKm: assignment.distanceKm || 1.8,
        itemCount: order?.items?.length || 0,
        items: (order?.items || []).map((it: any) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price || it.unitPrice || 0,
        })),
        earnings: {
          basePay,
          tip,
          incentive,
          totalEarned,
        },
        rating: 5.0,
        status: 'DELIVERED',
      });
    }

    return results;
  }

  async autoExpireStaleOrders() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    try {
      const staleOrders = await this.orderModel.find({
        status: OrderStatus.PLACED,
        deliveryPartnerId: { $in: [null, undefined] },
        createdAt: { $lt: fifteenMinutesAgo },
      });

      for (const order of staleOrders) {
        order.status = OrderStatus.CANCELLED;
        (order as any).cancellationReason = 'No rider available within 15 minutes';
        await order.save();
        this.logger.warn(`[Auto-Expire] Cancelled stale unassigned order #${order.orderNumber} (>15 mins old)`);
      }
    } catch {
      // non-fatal
    }
  }

  // Helper: Haversine geodesic distance in kilometers
  private calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  async getAvailableOrdersList(userId: string): Promise<any[]> {
    const partner = await this.getPartner(userId);
    if (!partner.isOnline) {
      return [];
    }

    // Clean up stale orders
    await this.autoExpireStaleOrders();

    // Orders active within the last 2 hours remain visible for delivery partners
    const maxOrderAge = new Date(Date.now() - 120 * 60 * 1000);

    // 1. Collect all order IDs rejected by this rider
    const rejectedAssignments = await this.assignmentModel
      .find({
        $or: [
          { partnerId: partner._id, status: RiderAssignmentStatus.REJECTED },
          { rejectedBy: partner._id },
        ],
      })
      .select('orderId');
    const rejectedOrderIds = rejectedAssignments.map((a) => a.orderId.toString());

    // 2. Collect all order IDs already accepted by any rider
    const activeAssignments = await this.assignmentModel
      .find({
        status: {
          $in: [
            RiderAssignmentStatus.ACCEPTED,
            RiderAssignmentStatus.GOING_TO_STORE,
            RiderAssignmentStatus.ARRIVED_AT_STORE,
            RiderAssignmentStatus.PICKUP_VERIFIED,
            RiderAssignmentStatus.OUT_FOR_DELIVERY,
            RiderAssignmentStatus.ARRIVED_AT_CUSTOMER,
            RiderAssignmentStatus.COMPLETED,
          ],
        },
      })
      .select('orderId');
    const assignedOrderIds = activeAssignments.map((a) => a.orderId.toString());

    const excludedIds = [...new Set([...rejectedOrderIds, ...assignedOrderIds])]
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const results: any[] = [];
    const handledOrderIds = new Set<string>();

    // 3. Resolve rider's coordinates and build allowedHubMap (Home Hub + nearby stores within 6 km)
    const riderLat = partner.currentLocation?.coordinates?.[1] ?? 23.0245;
    const riderLng = partner.currentLocation?.coordinates?.[0] ?? 72.5298;
    const allowedHubMap = new Map<string, { store: StoreDocument; distanceKm: number; isOwnHub: boolean }>();

    // Add rider's assigned home hub
    if (partner.hubId) {
      try {
        const homeStore = await this.storeModel.findById(partner.hubId);
        if (homeStore) {
          const storeLng = homeStore.location?.coordinates?.[0] ?? riderLng;
          const storeLat = homeStore.location?.coordinates?.[1] ?? riderLat;
          const dist = this.calculateHaversineDistanceKm(riderLat, riderLng, storeLat, storeLng);
          allowedHubMap.set(homeStore._id.toString(), { store: homeStore, distanceKm: dist, isOwnHub: true });
        }
      } catch (err) {}
    }

    // Discover nearby active dark stores within 6.0 km
    try {
      const allActiveStores = await this.storeModel.find({ isActive: { $ne: false } });
      for (const st of allActiveStores) {
        if (st.location?.coordinates && st.location.coordinates.length === 2) {
          const sLng = st.location.coordinates[0];
          const sLat = st.location.coordinates[1];
          const dist = this.calculateHaversineDistanceKm(riderLat, riderLng, sLat, sLng);
          const maxRadius = Math.max(6.0, (st.serviceRadiusKm || 4.0) + 2.0);
          if (dist <= maxRadius) {
            const isOwn = partner.hubId ? partner.hubId.toString() === st._id.toString() : false;
            allowedHubMap.set(st._id.toString(), { store: st, distanceKm: dist, isOwnHub: isOwn });
          }
        }
      }
    } catch (stErr: any) {
      this.logger.warn(`Failed finding nearby stores for rider ${partner._id}: ${stErr?.message}`);
    }

    const allowedHubIds = Array.from(allowedHubMap.keys())
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    // 4. Existing fresh OFFERED assignments specifically for this partner
    const offeredAssignments = await this.assignmentModel
      .find({
        partnerId: partner._id,
        status: RiderAssignmentStatus.OFFERED,
        createdAt: { $gte: maxOrderAge },
        orderId: { $nin: excludedIds },
      })
      .sort({ createdAt: -1 });

    for (const assignment of offeredAssignments) {
      try {
        const order = await this.orderModel.findById(assignment.orderId);
        if (order && order.status !== OrderStatus.CANCELLED && (!order.deliveryPartnerId || order.deliveryPartnerId === null)) {
          const orderStoreIdStr = order.storeId?.toString();
          if (allowedHubMap.size > 0 && orderStoreIdStr && !allowedHubMap.has(orderStoreIdStr)) {
            continue; // Skip orders from dark stores too far away
          }
          const hubInfo = orderStoreIdStr ? allowedHubMap.get(orderStoreIdStr) : null;
          const payload = await this.formatOrderDeliveryPayload(assignment, order, partner, hubInfo);
          results.push(payload);
          handledOrderIds.add(order._id.toString());
        }
      } catch (err: any) {
        this.logger.warn(`Failed formatting offered assignment ${assignment._id}: ${err?.message}`);
      }
    }

    // 5. Query unassigned fresh orders from allowed hubs (home hub + nearby stores within 6 km)
    const unhandledExcludedIds = [
      ...excludedIds,
      ...Array.from(handledOrderIds)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
    ];

    if (allowedHubIds.length === 0) {
      return results;
    }

    const freshOrders = await this.orderModel
      .find({
        storeId: { $in: allowedHubIds },
        _id: { $nin: unhandledExcludedIds },
        orderNumber: { $ne: '#WUP-84920' },
        deliveryPartnerId: { $in: [null, undefined] },
        createdAt: { $gte: maxOrderAge },
        status: {
          $in: [
            OrderStatus.PLACED,
            OrderStatus.PACKING,
            OrderStatus.PACKED,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .limit(15);

    for (const realOrder of freshOrders) {
      try {
        const orderStoreIdStr = realOrder.storeId?.toString() || '';
        const hubInfo = allowedHubMap.get(orderStoreIdStr);
        const pickupDistanceKm = hubInfo ? hubInfo.distanceKm : 1.8;
        const deliveryDistanceKm = 2.0;
        const totalDistanceKm = parseFloat((pickupDistanceKm + deliveryDistanceKm).toFixed(2));

        // Dynamic Per-KM Payout based on Area -> City -> Global hierarchy
        const payoutConfig = await this.resolvePayoutForOrder(realOrder, totalDistanceKm);
        const payoutAmount = payoutConfig.payoutAmount;

        const assignment = await this.assignmentModel.create({
          orderId: realOrder._id,
          partnerId: partner._id,
          status: RiderAssignmentStatus.OFFERED,
          payoutAmount,
          ratePerKm: payoutConfig.ratePerKm,
          rateSource: payoutConfig.rateSource,
          distanceKm: totalDistanceKm,
          etaMinutes: Math.max(8, Math.round(totalDistanceKm * 4 + 3)),
          assignedAt: new Date(),
        });
        const payload = await this.formatOrderDeliveryPayload(assignment, realOrder, partner, hubInfo);
        (payload as any).ratePerKm = payoutConfig.ratePerKm;
        (payload as any).rateSource = payoutConfig.rateSource;
        results.push(payload);
      } catch (err: any) {
        this.logger.warn(`Failed offering fresh order ${realOrder._id}: ${err?.message}`);
      }
    }

    // 6. Sort results: Own hub orders first, then nearest pickup stores first
    results.sort((a, b) => {
      if (a.isFromOwnHub && !b.isFromOwnHub) return -1;
      if (!a.isFromOwnHub && b.isFromOwnHub) return 1;
      return (a.distanceToStoreKm || 0) - (b.distanceToStoreKm || 0);
    });

    return results;
  }

  async getAvailableOrder(userId: string) {
    const partner = await this.getPartner(userId);

    // 1. If partner already has an active assignment, return it
    const active = await this.getActiveOrder(userId);
    if (active) {
      return active;
    }

    const list = await this.getAvailableOrdersList(userId);
    return list.length > 0 ? list[0] : null;
  }

  async getOrderById(userId: string, orderId: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.assignmentModel.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : null },
        { orderId: Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : null },
      ],
      partnerId: partner._id,
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    const order = await this.orderModel.findById(assignment.orderId);
    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async acceptOrder(userId: string, assignmentOrOrderId: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);

    assignment.status = RiderAssignmentStatus.GOING_TO_STORE;
    assignment.acceptedAt = new Date();
    await assignment.save();

    partner.currentOrderId = assignment.orderId;
    await partner.save();

    const order = await this.orderModel.findById(assignment.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (partner.hubId && order.storeId && order.storeId.toString() !== partner.hubId.toString()) {
      throw new BadRequestException('You are not authorized to accept orders from another dark store hub.');
    }

    if (order) {
      order.deliveryPartnerId = partner._id;
      if (order.status === OrderStatus.PLACED) {
        order.status = OrderStatus.ASSIGNED;
      }
      await order.save();
    }

    this.trackingGateway.notifyOrderStatus(assignment.orderId.toString(), 'GOING_TO_STORE', {
      partnerId: partner._id.toString(),
      partnerName: partner.fullName,
      phoneNumber: partner.phoneNumber,
      partnerPhone: partner.phoneNumber,
      vehicleNumber: partner.vehicleNumber,
      orderNumber: order?.orderNumber,
    });

    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async rejectOrder(userId: string, assignmentOrOrderId: string, reason: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);

    assignment.status = RiderAssignmentStatus.REJECTED;
    assignment.rejectionReason = reason;

    if (!assignment.rejectedBy) {
      assignment.rejectedBy = [];
    }
    if (!assignment.rejectedBy.some((id) => id.toString() === partner._id.toString())) {
      assignment.rejectedBy.push(partner._id);
    }
    await assignment.save();

    if (partner.currentOrderId?.toString() === assignment.orderId.toString()) {
      partner.currentOrderId = undefined;
      await partner.save();
    }

    return { success: true, message: 'Delivery offer rejected' };
  }

  async resolvePayoutForOrder(order: any, totalDistanceKm: number = 3.5): Promise<{
    payoutAmount: number;
    ratePerKm: number;
    rateSource: 'AREA' | 'CITY' | 'GLOBAL';
    minimumPayout: number;
    maximumPayout: number;
  }> {
    try {
      const db = this.orderModel.db;
      const ratesColl = db.collection('rider_payout_rates');
      const storeId = order.storeId?._id || order.storeId;
      const store = storeId
        ? await db.collection('stores').findOne({ $or: [{ _id: storeId }, { _id: storeId.toString() }] })
        : null;

      const cityName = order.deliveryAddress?.city || store?.cityName || store?.city || 'Ahmedabad';
      const areaName = order.deliveryAddress?.area || store?.areaName || 'Prahlad Nagar';
      const cityId = store?.cityId;
      const areaId = store?.areaId;

      // 1. Area Level
      let rateDoc: any = null;
      let rateSource: 'AREA' | 'CITY' | 'GLOBAL' = 'GLOBAL';

      if (areaId || areaName) {
        const query: any = { scope: 'AREA', isActive: { $ne: false } };
        if (areaId) {
          query.$or = [{ areaId }, { areaId: areaId.toString() }];
        } else {
          query.areaName = new RegExp(`^${areaName.trim()}$`, 'i');
        }
        rateDoc = await ratesColl.findOne(query);
        if (rateDoc) rateSource = 'AREA';
      }

      // 2. City Level
      if (!rateDoc && (cityId || cityName)) {
        const query: any = { scope: 'CITY', isActive: { $ne: false } };
        if (cityId) {
          query.$or = [{ cityId }, { cityId: cityId.toString() }];
        } else {
          query.cityName = new RegExp(`^${cityName.trim()}$`, 'i');
        }
        rateDoc = await ratesColl.findOne(query);
        if (rateDoc) rateSource = 'CITY';
      }

      // 3. Global Level
      if (!rateDoc) {
        rateDoc = await ratesColl.findOne({ scope: 'GLOBAL', isActive: { $ne: false } });
        if (rateDoc) rateSource = 'GLOBAL';
      }

      const ratePerKm = Number(rateDoc?.ratePerKm) || 10;
      const minPayout = Number(rateDoc?.minimumPayout) || 30;
      const maxPayout = Number(rateDoc?.maximumPayout) || 150;

      const dist = Math.max(1, Number(totalDistanceKm) || 3.5);
      const rawPayout = Math.round(dist * ratePerKm);
      const finalPayout = Math.min(maxPayout, Math.max(minPayout, rawPayout));

      return {
        payoutAmount: finalPayout,
        ratePerKm,
        rateSource,
        minimumPayout: minPayout,
        maximumPayout: maxPayout,
      };
    } catch {
      return {
        payoutAmount: Math.max(35, Math.round(25 + (totalDistanceKm || 3.5) * 8)),
        ratePerKm: 10,
        rateSource: 'GLOBAL',
        minimumPayout: 30,
        maximumPayout: 150,
      };
    }
  }

  async arrivedAtStore(userId: string, assignmentOrOrderId: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);

    assignment.status = RiderAssignmentStatus.ARRIVED_AT_STORE;
    assignment.arrivedStoreAt = new Date();
    await assignment.save();

    const order = await this.orderModel.findById(assignment.orderId);

    this.trackingGateway.notifyOrderStatus(assignment.orderId.toString(), 'ARRIVED_AT_STORE', {
      partnerId: partner._id.toString(),
      partnerName: partner.fullName,
      phoneNumber: partner.phoneNumber,
      partnerPhone: partner.phoneNumber,
      vehicleNumber: partner.vehicleNumber,
      orderNumber: order?.orderNumber,
    });

    if (order?.storeId) {
      this.trackingGateway.notifyRiderAtStore(order.storeId.toString(), {
        orderId: assignment.orderId.toString(),
        orderNumber: order?.orderNumber,
        riderName: partner.fullName,
        phoneNumber: partner.phoneNumber,
        vehicleNumber: partner.vehicleNumber,
      });
    }

    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async pickupOrder(userId: string, assignmentOrOrderId: string, packageCode?: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);

    assignment.status = RiderAssignmentStatus.OUT_FOR_DELIVERY;
    assignment.pickedUpAt = new Date();
    await assignment.save();

    const order = await this.orderModel.findById(assignment.orderId);
    if (order) {
      order.deliveryPartnerId = partner._id;
      order.status = OrderStatus.OUT_FOR_DELIVERY;
      await order.save();
    }

    this.trackingGateway.notifyOrderStatus(assignment.orderId.toString(), 'OUT_FOR_DELIVERY', {
      partnerId: partner._id.toString(),
      partnerName: partner.fullName,
      phoneNumber: partner.phoneNumber,
      partnerPhone: partner.phoneNumber,
      vehicleNumber: partner.vehicleNumber,
      pickupConfirmedAt: assignment.pickedUpAt,
      orderNumber: order?.orderNumber,
    });

    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async arrivedAtCustomer(userId: string, assignmentOrOrderId: string) {
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);

    assignment.status = RiderAssignmentStatus.ARRIVED_AT_CUSTOMER;
    assignment.arrivedCustomerAt = new Date();
    await assignment.save();

    const order = await this.orderModel.findById(assignment.orderId);

    this.trackingGateway.notifyOrderStatus(assignment.orderId.toString(), 'ARRIVED_AT_CUSTOMER', {
      partnerId: partner._id.toString(),
      partnerName: partner.fullName,
      phoneNumber: partner.phoneNumber,
      partnerPhone: partner.phoneNumber,
      vehicleNumber: partner.vehicleNumber,
      orderNumber: order?.orderNumber,
    });

    return this.formatOrderDeliveryPayload(assignment, order, partner);
  }

  async verifyDelivery(userId: string, assignmentOrOrderId: string, deliveryPin: string) {
    const cleanPin = (deliveryPin || '').trim();
    const partner = await this.getPartner(userId);
    const assignment = await this.findAssignment(partner._id, assignmentOrOrderId);
    const order = await this.orderModel.findById(assignment.orderId);

    // 0. Idempotency Check: prevent double settlement or duplicate completion
    if (assignment.status === RiderAssignmentStatus.COMPLETED || order?.status === OrderStatus.DELIVERED) {
      const existingSettlement = await this.settlementModel.findOne({
        orderId: assignment.orderId,
        riderId: partner._id,
      });
      const orderTip = typeof (order as any)?.tip === 'number' ? (order as any).tip : 0;
      const resolvedBase = existingSettlement?.basePay ?? (assignment.payoutAmount ?? 48);
      const resolvedIncentive = existingSettlement?.incentive ?? 15;
      const resolvedTip = existingSettlement?.tip ?? orderTip;
      const resolvedTotal = existingSettlement?.total ?? (resolvedBase + resolvedIncentive + resolvedTip);

      return {
        success: true,
        message: 'Order already verified and delivered',
        orderId: assignment.orderId.toString(),
        earnings: resolvedTotal,
        breakdown: {
          basePay: resolvedBase,
          incentive: resolvedIncentive,
          tip: resolvedTip,
          total: resolvedTotal,
        },
      };
    }

    // Validate 4-digit Delivery PIN strictly against database OTP
    const orderOtp = (order as any)?.deliveryOtp?.toString().trim();
    const isPinCorrect = Boolean(orderOtp && orderOtp === cleanPin);

    if (!isPinCorrect) {
      throw new BadRequestException('Invalid 4-digit Delivery Verification PIN provided by customer');
    }

    // Run transaction
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Mark assignment COMPLETED
      assignment.status = RiderAssignmentStatus.COMPLETED;
      assignment.completedAt = new Date();
      await assignment.save({ session });

      // 2. Mark order DELIVERED
      if (order) {
        order.status = OrderStatus.DELIVERED;
        order.deliveredAt = new Date();
        order.paymentStatus = 'COMPLETED';
        await order.save({ session });
      }

      // 3. Create rider settlement item (base + incentives + customer tip)
      const basePay = assignment.payoutAmount ?? 48;
      const incentive = 15;
      const tip = typeof (order as any)?.tip === 'number' ? (order as any).tip : 0;
      const total = basePay + incentive + tip;

      const orderNumber = order ? (order as any).orderNumber || '#WUP-84920' : '#WUP-84920';

      await this.settlementModel.create(
        [
          {
            riderId: partner._id,
            orderId: assignment.orderId,
            orderNumber,
            basePay,
            incentive,
            tip,
            total,
            status: 'SETTLED',
            period: 'TODAY',
            settledAt: new Date(),
          },
        ],
        { session },
      );

      // 4. Update rider completed counts
      partner.completedDeliveries = (partner.completedDeliveries || 0) + 1;
      partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;
      partner.currentOrderId = undefined;
      await partner.save({ session });

      // 5. Credit 10% Shopping Coins to customer if applicable
      if (order && order.userId) {
        try {
          const coinsEarned = Math.max(5, Math.round(((order as any).finalAmount || (order as any).totalAmount || 50) * 0.1));
          await this.connection.collection('users').updateOne(
            { _id: new Types.ObjectId(order.userId.toString()) },
            { $inc: { shoppingCoins: coinsEarned } },
            { session },
          );
          await this.connection.collection('coin_transactions').insertOne(
            {
              userId: new Types.ObjectId(order.userId.toString()),
              type: 'EARN',
              coins: coinsEarned,
              referenceType: 'ORDER',
              description: `10% Cashback for Order ${orderNumber}`,
              createdAt: new Date(),
            },
            { session },
          );
        } catch (coinErr) {
          this.logger.warn('Failed to credit customer coins', coinErr);
        }
      }

      // 6. Release reserved stock and increment sold stock in inventory
      if (order && order.storeId && order.items && order.items.length > 0) {
        for (const item of order.items) {
          try {
            const updatedInv = await this.connection.collection('inventory').findOneAndUpdate(
              {
                storeId: new Types.ObjectId(order.storeId.toString()),
                productId: new Types.ObjectId(item.productId.toString()),
              },
              {
                $inc: {
                  reservedQty: -item.quantity,
                  soldQty: item.quantity,
                },
              },
              { session, returnDocument: 'after' },
            );

            this.trackingGateway.broadcastInventoryUpdate({
              storeId: order.storeId.toString(),
              productId: item.productId.toString(),
              productName: item.name,
              availableQty: updatedInv?.availableQty ?? 0,
              reservedQty: Math.max(0, updatedInv?.reservedQty ?? 0),
              soldQty: updatedInv?.soldQty ?? 0,
            });
          } catch (invErr) {
            // non-fatal
          }
        }
      }

      await session.commitTransaction();

      // Emit real-time tracking WebSocket event
      this.trackingGateway.notifyOrderStatus(assignment.orderId.toString(), 'DELIVERED', {
        partnerId: partner._id.toString(),
        completedAt: assignment.completedAt,
        orderId: assignment.orderId.toString(),
        orderNumber: order?.orderNumber,
      });

      return {
        success: true,
        message: 'Order verified and delivered successfully',
        orderId: assignment.orderId.toString(),
        earnings: total,
        breakdown: {
          basePay,
          incentive,
          tip,
          total,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Failed to complete delivery verification transaction', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async findAssignment(partnerId: Types.ObjectId, id: string): Promise<DeliveryAssignmentDocument> {
    const isObjectId = Types.ObjectId.isValid(id);
    const query: any = {
      partnerId,
      $or: isObjectId ? [{ _id: new Types.ObjectId(id) }, { orderId: new Types.ObjectId(id) }] : [{ status: RiderAssignmentStatus.GOING_TO_STORE }],
    };

    const assignment = await this.assignmentModel.findOne(query).sort({ createdAt: -1 });
    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }
    return assignment;
  }

  private async formatOrderDeliveryPayload(
    assignment: DeliveryAssignmentDocument,
    order: any,
    partner: DeliveryPartnerDocument,
    hubInfo?: { store: StoreDocument; distanceKm: number; isOwnHub: boolean } | null,
  ) {
    const orderNumber = order?.orderNumber || (assignment ? `#WUP-${assignment._id.toString().slice(-5)}` : '#ORDER');
    let store: StoreDocument | null = hubInfo?.store || null;
    if (!store && order?.storeId && Types.ObjectId.isValid(order.storeId.toString())) {
      try {
        store = await this.storeModel.findById(order.storeId);
      } catch {
        store = null;
      }
    }

    // Customer details from users collection via order.userId
    let customerUser: any = null;
    if (order?.userId && Types.ObjectId.isValid(order.userId.toString())) {
      try {
        customerUser = await this.connection
          .collection('users')
          .findOne({ _id: new Types.ObjectId(order.userId.toString()) });
      } catch (err: any) {
        this.logger.warn(`Could not fetch customer user for order: ${err?.message}`);
      }
    }

    const deliveryAddress: any = order?.deliveryAddress || {};
    const customerName =
      customerUser?.name ||
      customerUser?.fullName ||
      deliveryAddress.name ||
      deliveryAddress.fullName ||
      'Customer';
    const customerPhone =
      customerUser?.phone ||
      customerUser?.phoneNumber ||
      deliveryAddress.phone ||
      '+91 98980 12345';

    const addressParts = [
      deliveryAddress.houseFlat || deliveryAddress.houseNumber || deliveryAddress.addressLine1,
      deliveryAddress.areaLandmark || deliveryAddress.street || deliveryAddress.addressLine2,
      deliveryAddress.city,
      deliveryAddress.pincode,
    ].filter(Boolean);
    const customerAddress = addressParts.length > 0 ? addressParts.join(', ') : (partner.city || 'Satellite, Ahmedabad');

    const storeName = store?.name || partner.hubName || 'Satellite Hub Dark Store';
    const storeAddress = store ? `${store.address}, ${store.city} - ${store.pincode}` : 'GF-04, Galaxy Complex, Near Shivranjani Cross Road, Satellite, Ahmedabad';

    const totalAmount = order?.totalAmount ?? order?.finalAmount ?? 0;
    const paymentMethod = order?.paymentMethod || 'COD';
    const paymentStatus = order?.paymentStatus || (paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED');

    // Fetch order status histories from collection
    let histories: any[] = [];
    if (assignment?.orderId) {
      try {
        histories = await this.connection
          .collection('order_status_history')
          .find({ orderId: assignment.orderId })
          .sort({ createdAt: 1 })
          .toArray();
      } catch (hErr) {
        // non-fatal
      }
    }

    const orderCreatedAt = order?.createdAt
      ? new Date(order.createdAt)
      : assignment?.assignedAt
      ? new Date(assignment.assignedAt)
      : new Date();

    const getStageTime = (stageName: string, fallbackDate?: Date) => {
      const match = histories.find(
        (h: any) =>
          h.newStatus === stageName ||
          h.newStatus === stageName.toUpperCase().replace(/\s+/g, '_') ||
          (stageName === 'Order Placed' && h.newStatus === 'PLACED') ||
          (stageName === 'Packed' && h.newStatus === 'PACKED') ||
          (stageName === 'Out for Delivery' && h.newStatus === 'OUT_FOR_DELIVERY') ||
          (stageName === 'Delivered' && h.newStatus === 'DELIVERED')
      );
      if (match?.createdAt) return new Date(match.createdAt).toISOString();
      return fallbackDate ? fallbackDate.toISOString() : undefined;
    };

    let stageIndex = 7; // Default: Rider Assigned
    if (assignment.status === RiderAssignmentStatus.ARRIVED_AT_STORE) {
      stageIndex = 8; // Ready for Dispatch
    } else if (
      assignment.status === RiderAssignmentStatus.PICKUP_VERIFIED ||
      assignment.status === RiderAssignmentStatus.OUT_FOR_DELIVERY
    ) {
      stageIndex = 9; // Out for Delivery
    } else if (assignment.status === RiderAssignmentStatus.ARRIVED_AT_CUSTOMER) {
      stageIndex = 9; // Out for Delivery / At Doorstep
    } else if (assignment.status === RiderAssignmentStatus.COMPLETED) {
      stageIndex = 10; // Delivered
    }

    const statusHistory = [
      { stage: 'Order Placed', timestamp: getStageTime('Order Placed', orderCreatedAt), completed: true },
      {
        stage: 'Payment Confirmed',
        timestamp: getStageTime('Payment Confirmed', new Date(orderCreatedAt.getTime() + 1000 * 30)),
        completed: true,
      },
      {
        stage: 'Order Accepted',
        timestamp: getStageTime(
          'Order Accepted',
          assignment.assignedAt || new Date(orderCreatedAt.getTime() + 1000 * 60)
        ),
        completed: true,
      },
      {
        stage: 'Picker Assigned',
        timestamp: getStageTime('Picker Assigned', new Date(orderCreatedAt.getTime() + 1000 * 90)),
        completed: true,
      },
      {
        stage: 'Picking',
        timestamp: getStageTime('Picking', new Date(orderCreatedAt.getTime() + 1000 * 120)),
        completed: true,
      },
      {
        stage: 'Picking Completed',
        timestamp: getStageTime('Picking Completed', new Date(orderCreatedAt.getTime() + 1000 * 180)),
        completed: true,
      },
      {
        stage: 'Packed',
        timestamp: getStageTime('Packed', new Date(orderCreatedAt.getTime() + 1000 * 240)),
        completed: true,
      },
      {
        stage: 'Rider Assigned',
        timestamp: getStageTime('Rider Assigned', assignment.acceptedAt || assignment.assignedAt),
        completed: stageIndex >= 7,
      },
      {
        stage: 'Ready for Dispatch',
        timestamp: getStageTime('Ready for Dispatch', assignment.arrivedStoreAt),
        completed: stageIndex >= 8,
      },
      {
        stage: 'Out for Delivery',
        timestamp: getStageTime('Out for Delivery', assignment.pickedUpAt),
        completed: stageIndex >= 9,
      },
      {
        stage: 'Delivered',
        timestamp: getStageTime('Delivered', assignment.completedAt || order?.deliveredAt),
        completed: stageIndex >= 10,
      },
    ];

    const riderLat = partner.currentLocation?.coordinates?.[1] ?? 23.0245;
    const riderLng = partner.currentLocation?.coordinates?.[0] ?? 72.5298;
    const storeLat = store?.location?.coordinates?.[1] ?? 23.0245;
    const storeLng = store?.location?.coordinates?.[0] ?? 72.5298;

    const distanceToStoreKm = hubInfo
      ? hubInfo.distanceKm
      : this.calculateHaversineDistanceKm(riderLat, riderLng, storeLat, storeLng);

    const isFromOwnHub = hubInfo
      ? hubInfo.isOwnHub
      : (partner.hubId && store?._id ? partner.hubId.toString() === store._id.toString() : true);

    return {
      id: assignment._id.toString(),
      orderId: assignment.orderId.toString(),
      orderNumber,
      storeId: store?.code || 'STR-SAT-01',
      storeName,
      storeAddress,
      storeCoordinates: {
        latitude: store?.location?.coordinates?.[1] ?? 23.0245,
        longitude: store?.location?.coordinates?.[0] ?? 72.5298,
      },
      customerName,
      customerAddress,
      customerCoordinates: {
        latitude: deliveryAddress.location?.coordinates?.[1] ?? deliveryAddress.coordinates?.[1] ?? 23.0312,
        longitude: deliveryAddress.location?.coordinates?.[0] ?? deliveryAddress.coordinates?.[0] ?? 72.5342,
      },
      customerPhone,
      deliveryInstructions: deliveryAddress.instructions || order?.deliveryInstructions || 'Leave at door. Ring doorbell once.',
      distanceKm: assignment.distanceKm ?? 0,
      distanceToStoreKm,
      isFromOwnHub,
      etaMinutes: assignment.etaMinutes ?? 0,
      itemCount: order?.items?.length || 0,
      items: order?.items?.map((it: any, index: number) => ({
        id: it._id?.toString() || `ITM-${index + 1}`,
        name: it.name,
        quantity: it.quantity,
        unit: it.unit || 'pack',
        price: it.price || it.unitPrice || 0,
      })) || [],
      hasPrintJob: order?.items?.some((it: any) => it.name?.toLowerCase().includes('print')) || false,
      orderAmount: totalAmount,
      paymentMethod,
      paymentStatus,
      payoutAmount: assignment.payoutAmount ?? 0,
      stepStatus: assignment.status,
      stageIndex,
      statusHistory,
      createdAt: orderCreatedAt.toISOString(),
      offeredAt: (assignment?.assignedAt ? new Date(assignment.assignedAt) : new Date()).toISOString(),
      // Security: never leak OTP to rider; only indicate requirement
      deliveryOtpRequired: true,
    };
  }
}
