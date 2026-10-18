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
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isOnline: false,
        isActive: false,
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

    // Prevent going online if not approved by Admin
    if (isOnline && (partner.status !== 'APPROVED' || !partner.isActive)) {
      throw new BadRequestException('Your account is currently under review by Admin. You can go online once your account is approved.');
    }

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
    // 1. GPS coordinates validation
    if (typeof data.latitude !== 'number' || isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90) {
      return { success: false, message: 'Invalid GPS latitude' };
    }
    if (typeof data.longitude !== 'number' || isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180) {
      return { success: false, message: 'Invalid GPS longitude' };
    }

    // Sanitize speed and heading gracefully
    const safeSpeed = typeof data.speed === 'number' && !isNaN(data.speed) ? Math.max(0, data.speed) : 0;
    const safeHeading = typeof data.heading === 'number' && !isNaN(data.heading) ? Math.max(0, Math.min(360, data.heading)) : 0;

    const partner = await this.getPartnerByUserId(userId);

    // 2. If rider is offline, save location for telemetry but return gracefully without 400
    if (!partner.isOnline) {
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
      return { success: true, isOnline: false, message: 'Location updated in offline state' };
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

  // ── Admin Rider Approval Endpoints ──

  async adminGetRiders(filter?: { status?: string; search?: string }) {
    const query: any = {};
    if (filter?.status && filter.status !== 'All') {
      query.status = filter.status.toUpperCase();
    }
    if (filter?.search) {
      query.$or = [
        { fullName: { $regex: filter.search, $options: 'i' } },
        { phoneNumber: { $regex: filter.search, $options: 'i' } },
        { partnerCode: { $regex: filter.search, $options: 'i' } },
        { riderCode: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
      ];
    }
    return this.partnerModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async adminGetPendingRiders() {
    return this.partnerModel.find({
      $or: [{ status: 'PENDING' }, { verificationStatus: 'PENDING' }, { isActive: false }],
    }).sort({ createdAt: -1 }).exec();
  }

  async adminApproveRider(id: string, adminId?: string) {
    const partner = await this.partnerModel.findById(id);
    if (!partner) throw new NotFoundException('Delivery partner not found');

    partner.status = 'APPROVED';
    partner.verificationStatus = 'VERIFIED';
    partner.isActive = true;
    partner.approvedAt = new Date();
    if (adminId) partner.approvedBy = adminId;
    partner.rejectionReason = '';
    await partner.save();

    await this.partnerModel.db.collection('rider_bank_accounts').updateOne(
      { $or: [{ riderId: partner._id }, { userId: partner.userId }] },
      { $set: { verificationStatus: 'VERIFIED', isVerified: true, verifiedAt: new Date() } }
    );

    if (this.trackingGateway) {
      this.trackingGateway.emitRiderApproved(partner._id.toString(), {
        riderId: partner._id.toString(),
        fullName: partner.fullName,
        partnerCode: partner.partnerCode,
        status: 'APPROVED',
        verificationStatus: 'VERIFIED',
      });
    }

    return {
      success: true,
      message: 'Rider approved and dispatch access enabled successfully',
      data: partner,
    };
  }

  async adminRejectRider(id: string, reason?: string, adminId?: string) {
    const partner = await this.partnerModel.findById(id);
    if (!partner) throw new NotFoundException('Delivery partner not found');

    partner.status = 'REJECTED';
    partner.verificationStatus = 'REJECTED';
    partner.isActive = false;
    partner.isOnline = false;
    partner.rejectionReason = reason || 'Documents could not be verified (DL / RC)';
    if (adminId) partner.approvedBy = adminId;
    await partner.save();

    await this.partnerModel.db.collection('rider_bank_accounts').updateOne(
      { $or: [{ riderId: partner._id }, { userId: partner.userId }] },
      { $set: { verificationStatus: 'REJECTED', isVerified: false } }
    );

    if (this.trackingGateway) {
      this.trackingGateway.emitKycRejected('rider', partner._id.toString(), {
        riderId: partner._id.toString(),
        status: 'REJECTED',
        reason: partner.rejectionReason,
      });
    }

    return {
      success: true,
      message: `Rider application rejected: ${partner.rejectionReason}`,
      data: partner,
    };
  }

  async adminDeleteRider(id: string) {
    let partner = await this.partnerModel.findById(id).exec();
    if (!partner) {
      partner = await this.partnerModel.findOne({
        $or: [{ partnerCode: id }, { riderCode: id }, { userId: id }],
      }).exec();
    }
    if (!partner) throw new NotFoundException('Delivery partner not found');

    const partnerId = partner._id;
    const userId = partner.userId;

    await this.partnerModel.deleteOne({ _id: partnerId });
    await this.partnerModel.db.collection('rider_bank_accounts').deleteMany({
      $or: [{ riderId: partnerId }, { riderId: partnerId.toString() }],
    });
    await this.partnerModel.db.collection('rider_wallets').deleteMany({
      $or: [{ riderId: partnerId }, { riderId: partnerId.toString() }],
    });

    if (userId) {
      try {
        await this.partnerModel.db.collection('users').deleteOne({ _id: userId });
      } catch (_) {}
    }

    return {
      success: true,
      message: 'Delivery partner deleted successfully',
    };
  }

  async adminGetRiderDetail(id: string) {
    let partner = await this.partnerModel.findById(id).lean().exec();
    if (!partner) {
      partner = await this.partnerModel.findOne({
        $or: [{ partnerCode: id }, { riderCode: id }, { userId: id }],
      }).lean().exec();
    }
    if (!partner) throw new NotFoundException('Delivery partner not found');

    const p: any = partner;
    const bankDoc = await this.partnerModel.db.collection('rider_bank_accounts').findOne({
      $or: [{ riderId: p._id }, { userId: p.userId }]
    });

    const bankInfo = {
      bankName: p.bankName || bankDoc?.bankName || null,
      accountHolderName: p.accountHolderName || bankDoc?.accountHolderName || p.fullName || null,
      accountNumber: p.accountNumber || bankDoc?.accountNumberFull || bankDoc?.accountNumber || bankDoc?.maskedAccount || null,
      ifscCode: p.ifscCode || bankDoc?.ifscCode || bankDoc?.ifsc || null,
      branchName: p.bankBranch || bankDoc?.branchName || bankDoc?.bankBranch || null,
      upiId: p.upiId || bankDoc?.upiId || null,
      isVerified: p.verificationStatus === 'VERIFIED' || p.status === 'APPROVED' || bankDoc?.verificationStatus === 'VERIFIED',
    };

    return {
      id: p._id.toString(),
      _id: p._id.toString(),
      partnerCode: p.partnerCode || p.riderCode || 'RDR-000',
      riderCode: p.riderCode || p.partnerCode || 'RDR-000',
      name: p.fullName,
      fullName: p.fullName,
      phone: p.phoneNumber,
      phoneNumber: p.phoneNumber,
      email: p.email || '',
      status: p.status || 'PENDING',
      verificationStatus: p.verificationStatus || 'PENDING',
      isActive: !!p.isActive,
      isOnline: !!p.isOnline,
      rating: p.rating || 5.0,
      totalOrders: p.totalOrders || 0,
      completedDeliveries: p.totalOrders || 0,
      walletBalance: p.walletBalance || 0,
      joinedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent',
      createdAt: p.createdAt,
      hubName: p.hubName || p.city || 'Central Hub',
      city: p.city || 'Ahmedabad',
      vehicleType: p.vehicleType || 'Motorbike',
      vehicleNumber: p.vehicleNumber || 'GJ-01-XX-0000',
      vehicleModel: p.vehicleModel || '',
      vehicleModelYear: p.vehicleModelYear || '',
      shiftPreference: p.shiftPreference || 'FULL_TIME',
      rejectionReason: p.rejectionReason || '',
      // KYC Documents with live uploaded URLs
      documents: {
        profilePhoto: p.profilePhotoUrl || null,
        profilePhotoUrl: p.profilePhotoUrl || null,
        dlNumber: p.drivingLicense || p.drivingLicenseNumber || p.dlNumber || null,
        dlFront: p.dlImageUrl || null,
        dlFrontUrl: p.dlImageUrl || null,
        dlBack: p.dlBackUrl || null,
        dlBackUrl: p.dlBackUrl || null,
        rcNumber: p.rcNumber || null,
        rcFront: p.rcImageUrl || null,
        rcFrontUrl: p.rcImageUrl || null,
        rcBack: p.rcBackUrl || null,
        rcBackUrl: p.rcBackUrl || null,
        aadhaarNumber: p.aadharNumber || null,
        aadhaarFront: p.aadharFrontUrl || null,
        aadhaarFrontUrl: p.aadharFrontUrl || null,
        aadhaarBack: p.aadharBackUrl || null,
        aadhaarBackUrl: p.aadharBackUrl || null,
        insuranceNumber: p.insuranceNumber || null,
        insurance: p.vehicleInsuranceUrl || null,
        insuranceUrl: p.vehicleInsuranceUrl || null,
      },
      // Bank Account & Payout Details
      bankAccount: bankInfo,
      bankDetails: bankInfo,
      vehicle: {
        type: p.vehicleType || 'Motorbike',
        number: p.vehicleNumber || '',
        model: p.vehicleModel || '',
        year: p.vehicleModelYear || '',
      },
      zone: {
        city: p.city || 'Ahmedabad',
        hubId: p.hubId || '',
        hubName: p.hubName || p.city || 'Central Hub',
      },
    };
  }

  async adminUpdateRider(id: string, updates: any) {
    let partner = await this.partnerModel.findById(id);
    if (!partner) {
      partner = await this.partnerModel.findOne({
        $or: [{ partnerCode: id }, { riderCode: id }, { userId: id }],
      });
    }
    if (!partner) throw new NotFoundException('Delivery partner not found');

    if (updates.name) partner.fullName = updates.name;
    if (updates.fullName) partner.fullName = updates.fullName;
    if (updates.phone) partner.phoneNumber = updates.phone;
    if (updates.phoneNumber) partner.phoneNumber = updates.phoneNumber;
    if (updates.email !== undefined) partner.email = updates.email;
    if (updates.status) partner.status = updates.status;
    if (updates.verificationStatus) partner.verificationStatus = updates.verificationStatus;
    if (updates.vehicleType) partner.vehicleType = updates.vehicleType;
    if (updates.vehicleNumber) partner.vehicleNumber = updates.vehicleNumber;
    if (updates.vehicleModel) partner.vehicleModel = updates.vehicleModel;
    if (updates.vehicleModelYear) partner.vehicleModelYear = updates.vehicleModelYear;
    if (updates.hubName) partner.hubName = updates.hubName;
    if (updates.city) partner.city = updates.city;
    if (updates.isOnline !== undefined) partner.isOnline = updates.isOnline;
    if (updates.isActive !== undefined) partner.isActive = updates.isActive;
    if (updates.rating !== undefined) partner.rating = updates.rating;
    if (updates.rejectionReason !== undefined) partner.rejectionReason = updates.rejectionReason;

    // Bank Details
    if (updates.bankName) partner.bankName = updates.bankName;
    if (updates.accountHolderName) partner.accountHolderName = updates.accountHolderName;
    if (updates.accountNumber) partner.accountNumber = updates.accountNumber;
    if (updates.ifscCode) partner.ifscCode = updates.ifscCode;
    if (updates.bankBranch || updates.branchName) partner.bankBranch = updates.bankBranch || updates.branchName;
    if (updates.upiId) partner.upiId = updates.upiId;

    // Document URLs
    if (updates.dlNumber) partner.dlNumber = updates.dlNumber;
    if (updates.dlImageUrl || updates.dlFrontUrl) partner.dlImageUrl = updates.dlImageUrl || updates.dlFrontUrl;
    if (updates.dlBackUrl) partner.dlBackUrl = updates.dlBackUrl;
    if (updates.rcNumber) partner.rcNumber = updates.rcNumber;
    if (updates.rcImageUrl || updates.rcFrontUrl) partner.rcImageUrl = updates.rcImageUrl || updates.rcFrontUrl;
    if (updates.rcBackUrl) partner.rcBackUrl = updates.rcBackUrl;
    if (updates.aadharNumber) partner.aadharNumber = updates.aadharNumber;
    if (updates.aadharFrontUrl) partner.aadharFrontUrl = updates.aadharFrontUrl;
    if (updates.aadharBackUrl) partner.aadharBackUrl = updates.aadharBackUrl;
    if (updates.vehicleInsuranceUrl || updates.insuranceUrl) partner.vehicleInsuranceUrl = updates.vehicleInsuranceUrl || updates.insuranceUrl;
    if (updates.profilePhotoUrl) partner.profilePhotoUrl = updates.profilePhotoUrl;

    await partner.save();

    return {
      success: true,
      message: 'Rider details updated successfully',
      data: await this.adminGetRiderDetail(partner._id.toString()),
    };
  }
}

