import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  DeliveryAssignment,
  DeliveryAssignmentDocument,
  RiderSettlement,
  RiderSettlementDocument,
  RiderDutySession,
  RiderDutySessionDocument,
  RiderLocationLog,
  RiderLocationLogDocument,
  RiderAssignmentStatus,
} from '../schemas/delivery-partner.schema';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { Store, StoreDocument } from '../../stores/schemas/store.schema';
import { TrackingGateway } from '../../tracking/tracking.gateway';

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(DeliveryAssignment.name)
    private assignmentModel: Model<DeliveryAssignmentDocument>,
    @InjectModel(RiderSettlement.name)
    private settlementModel: Model<RiderSettlementDocument>,
    @InjectModel(RiderDutySession.name)
    private dutyModel: Model<RiderDutySessionDocument>,
    @InjectModel(RiderLocationLog.name)
    private locationLogModel: Model<RiderLocationLogDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Store.name)
    private storeModel: Model<StoreDocument>,
    private trackingGateway: TrackingGateway,
  ) {}

  async getPartnerByUserId(userId: string): Promise<DeliveryPartnerDocument> {
    let partner = await this.partnerModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!partner) {
      // Find or create registered delivery partner document for this user in DB
      const user = await this.partnerModel.db.collection('users').findOne({ _id: new Types.ObjectId(userId) });
      partner = await this.partnerModel.create({
        userId: new Types.ObjectId(userId),
        partnerCode: `RDR-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: user?.name || 'Delivery Partner',
        phoneNumber: user?.phone || '9876543210',
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
    return partner;
  }

  async getProfile(userId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return {
      id: partner._id.toString(),
      partnerCode: partner.partnerCode,
      name: partner.fullName,
      phone: partner.phoneNumber,
      email: partner.email,
      city: partner.city,
      hubName: partner.hubName,
      status: partner.status,
      verificationStatus: partner.verificationStatus,
      isOnline: partner.isOnline,
      vehicleType: partner.vehicleType,
      vehicleNumber: partner.vehicleNumber,
      rating: partner.rating,
      totalDeliveries: partner.totalDeliveries,
      completedDeliveries: partner.completedDeliveries,
      acceptanceRate: partner.acceptanceRate,
      completionRate: partner.completionRate,
      onTimeRate: partner.onTimeRate,
      avgDeliveryMinutes: partner.avgDeliveryMinutes,
    };
  }

  async getDashboard(userId: string) {
    const partner = await this.getPartnerByUserId(userId);

    // 1. Find active non-terminal assignment
    const activeAssignment = await this.assignmentModel
      .findOne({
        partnerId: partner._id,
        status: {
          $in: [
            RiderAssignmentStatus.OFFERED,
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

    let activeDeliveryData: any = null;
    if (activeAssignment) {
      const order = await this.orderModel.findById(activeAssignment.orderId);
      let store: StoreDocument | null = null;
      if (order?.storeId) {
        store = await this.storeModel.findById(order.storeId);
      }

      const deliveryAddress: any = order?.deliveryAddress || {};
      const customerName = deliveryAddress.name || deliveryAddress.fullName || 'Customer';
      const addressParts = [
        deliveryAddress.houseFlat || deliveryAddress.houseNumber || deliveryAddress.addressLine1,
        deliveryAddress.areaLandmark || deliveryAddress.street || deliveryAddress.addressLine2,
        deliveryAddress.city,
        deliveryAddress.pincode,
      ].filter(Boolean);
      const customerAddress = addressParts.length > 0 ? addressParts.join(', ') : (partner.city || 'Satellite, Ahmedabad');
      const customerCoordinates = {
        latitude: deliveryAddress.location?.coordinates?.[1] ?? deliveryAddress.coordinates?.[1] ?? 23.0312,
        longitude: deliveryAddress.location?.coordinates?.[0] ?? deliveryAddress.coordinates?.[0] ?? 72.5342,
      };

      const storeName = store?.name || partner.hubName || 'Satellite Hub Dark Store';
      const storeAddress = store ? `${store.address}, ${store.city} - ${store.pincode}` : 'GF-04, Galaxy Complex, Satellite, Ahmedabad';
      const storeCoordinates = {
        latitude: store?.location?.coordinates?.[1] ?? 23.0245,
        longitude: store?.location?.coordinates?.[0] ?? 72.5298,
      };

      activeDeliveryData = {
        id: activeAssignment._id.toString(),
        orderId: activeAssignment.orderId.toString(),
        orderNumber: order?.orderNumber || '#WUP-84920',
        status: activeAssignment.status,
        stepStatus: activeAssignment.status,
        payoutAmount: activeAssignment.payoutAmount ?? 0,
        distanceKm: activeAssignment.distanceKm ?? 0,
        etaMinutes: activeAssignment.etaMinutes ?? 0,
        storeName,
        storeAddress,
        storeCoordinates,
        customerName,
        customerAddress,
        customerCoordinates,
        itemCount: order?.items?.length || 0,
        items: order?.items?.map((it: any, idx: number) => ({
          id: it._id?.toString() || `ITM-${idx + 1}`,
          name: it.name,
          quantity: it.quantity,
          price: it.price || it.unitPrice || 0,
        })) || [],
        // Security rule: Never expose raw delivery OTP in dashboard. Only notify that OTP is required on delivery.
        deliveryOtpRequired: true,
      };
    }

    // 2. Aggregate Today's Operational Settlement
    const todaySettlements = await this.settlementModel.find({
      riderId: partner._id,
      period: 'TODAY',
    });

    const totalEarnings = todaySettlements.reduce((sum, s) => sum + (s.total || 0), 0);
    const completedToday = todaySettlements.length;
    const inProgressCount = activeAssignment ? 1 : 0;

    return {
      rider: {
        id: partner._id.toString(),
        name: partner.fullName,
        partnerCode: partner.partnerCode,
        city: partner.city,
        hubName: partner.hubName,
        vehicleNumber: partner.vehicleNumber,
        rating: partner.rating,
        isOnline: partner.isOnline,
      },
      activeDelivery: activeDeliveryData,
      today: {
        completed: completedToday,
        inProgress: inProgressCount,
        earnings: totalEarnings,
        rating: partner.rating,
      },
    };
  }

  async getDutyStatus(userId: string) {
    const partner = await this.getPartnerByUserId(userId);
    return {
      isOnline: partner.isOnline,
      status: partner.isOnline ? 'ONLINE' : 'OFFLINE',
    };
  }

  async updateDutyStatus(userId: string, isOnline: boolean) {
    const partner = await this.getPartnerByUserId(userId);

    // Prevent going offline during active delivery
    if (!isOnline) {
      const hasActiveDelivery = await this.assignmentModel.exists({
        partnerId: partner._id,
        status: {
          $in: [
            RiderAssignmentStatus.OFFERED,
            RiderAssignmentStatus.ACCEPTED,
            RiderAssignmentStatus.GOING_TO_STORE,
            RiderAssignmentStatus.ARRIVED_AT_STORE,
            RiderAssignmentStatus.PICKUP_VERIFIED,
            RiderAssignmentStatus.OUT_FOR_DELIVERY,
            RiderAssignmentStatus.ARRIVED_AT_CUSTOMER,
          ],
        },
      });
      if (hasActiveDelivery) {
        throw new BadRequestException('Cannot go offline while an active delivery assignment is in progress');
      }
    }

    // Prevent duplicate active duty sessions
    const activeSession = await this.dutyModel
      .findOne({
        riderId: partner._id,
        isActive: true,
      })
      .sort({ startedAt: -1 });

    if (isOnline) {
      if (!activeSession) {
        await this.dutyModel.create({
          riderId: partner._id,
          startedAt: new Date(),
          city: partner.city,
          isActive: true,
        });
      }
    } else {
      if (activeSession) {
        activeSession.endedAt = new Date();
        activeSession.isActive = false;
        const durationMinutes = Math.max(
          1,
          Math.round((activeSession.endedAt.getTime() - activeSession.startedAt.getTime()) / 60000),
        );
        activeSession.onlineDurationMinutes = durationMinutes;
        await activeSession.save();
      }
    }

    partner.isOnline = isOnline;
    await partner.save();

    return {
      isOnline: partner.isOnline,
      status: partner.isOnline ? 'ONLINE' : 'OFFLINE',
    };
  }

  async updateLocation(
    userId: string,
    data: { latitude: number; longitude: number; speed?: number; heading?: number; orderId?: string },
  ) {
    // 1. Strict GPS validation
    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      throw new BadRequestException('Invalid GPS latitude. Must be between -90 and 90');
    }
    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      throw new BadRequestException('Invalid GPS longitude. Must be between -180 and 180');
    }
    if (data.speed !== undefined && data.speed < 0) {
      throw new BadRequestException('Speed cannot be negative');
    }
    if (data.heading !== undefined && (data.heading < 0 || data.heading > 360)) {
      throw new BadRequestException('Heading must be between 0 and 360 degrees');
    }

    const partner = await this.getPartnerByUserId(userId);

    // 2. Only accept GPS when rider is online
    if (!partner.isOnline) {
      throw new BadRequestException('Rider must be online on duty to broadcast live location');
    }

    // 3. Atomically update rider current location
    await this.partnerModel.updateOne(
      { _id: partner._id },
      {
        $set: {
          currentLocation: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude],
          },
          locationUpdatedAt: new Date(),
        },
      },
    );

    // 4. Log telemetry
    await this.locationLogModel.create({
      riderId: partner._id,
      orderId: data.orderId ? new Types.ObjectId(data.orderId) : partner.currentOrderId,
      latitude: data.latitude,
      longitude: data.longitude,
      speedKmph: data.speed || 0,
      headingDegrees: data.heading || 0,
    });

    // 5. Broadcast via tracking gateway if active order
    const activeOrderId = (data.orderId || partner.currentOrderId)?.toString();
    if (activeOrderId) {
      this.trackingGateway.handleLocationUpdate({
        orderId: activeOrderId,
        partnerId: partner._id.toString(),
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }

    return { success: true };
  }
}

