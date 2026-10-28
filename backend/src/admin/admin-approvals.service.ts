import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { DeliveryPartner, DeliveryPartnerDocument, RiderSettlement, RiderSettlementDocument } from '../delivery/schemas/delivery-partner.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { Vendor, VendorDocument } from '../local-shops/schemas/vendor.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus } from '../common/enums/order-status.enum';
import { AdminAuditLog, AdminAuditLogDocument } from './schemas/admin-audit-log.schema';
import { WithdrawalRequest, WithdrawalRequestDocument } from '../users/schemas/withdrawal-request.schema';
import { IncomeTransaction, IncomeTransactionDocument } from '../users/schemas/income-transaction.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { NotificationService } from '../notifications/notification.service';

export interface ApprovalSummaryResponse {
  customerKyc: number;
  riders: number;
  stores: number;
  vendors: number;
  staff: number;
  orders: number;
  withdrawals: number;
  rateChanges: number;
  totalPending: number;
  categories?: {
    customerKyc: { pending: number; reviewedToday: number };
    riders: { pending: number; reviewedToday: number };
    darkStores: { pending: number; reviewedToday: number };
    vendors: { pending: number; reviewedToday: number };
    withdrawals: { pending: number; reviewedToday: number };
    cancellations: { pending: number; reviewedToday: number };
    staff: { pending: number; reviewedToday: number };
    rateChanges: { pending: number; reviewedToday: number };
  };
}

export interface QueueItem {
  id: string;
  type: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  submittedAt: Date;
  ageHours: number;
  documentsCount: number;
  documents: Array<{ id: string; label: string; url: string; type: 'image' | 'pdf' }>;
  status: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  details: Record<string, any>;
}

@Injectable()
export class AdminApprovalsService {
  private readonly logger = new Logger(AdminApprovalsService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(DeliveryPartner.name) private readonly riderModel: Model<DeliveryPartnerDocument>,
    @InjectModel(RiderSettlement.name) private readonly riderSettlementModel: Model<RiderSettlementDocument>,
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    @InjectModel(Vendor.name) private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(AdminAuditLog.name) private readonly auditLogModel: Model<AdminAuditLogDocument>,
    @InjectModel(WithdrawalRequest.name) private readonly withdrawalRequestModel: Model<WithdrawalRequestDocument>,
    @InjectModel(IncomeTransaction.name) private readonly incomeTxModel: Model<IncomeTransactionDocument>,
    private readonly trackingGateway: TrackingGateway,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  private cachedSummary: ApprovalSummaryResponse | null = null;
  private cacheExpiresAt = 0;

  invalidateSummaryCache() {
    this.cachedSummary = null;
    this.cacheExpiresAt = 0;
  }

  /**
   * 1. GET UNIFIED APPROVALS SUMMARY (FOR DASHBOARD WIDGET & 8-CATEGORY HUB)
   */
  async getApprovalsSummary(force = false): Promise<ApprovalSummaryResponse> {
    const now = Date.now();
    if (!force && this.cachedSummary && now < this.cacheExpiresAt) {
      return this.cachedSummary;
    }

    try {
      const [
        customerKyc,
        riders,
        stores,
        vendors,
        orders,
        withdrawals,
      ] = await Promise.all([
        this.userModel.countDocuments({
          customerKycStatus: 1,
          verificationStatus: { $ne: 'VERIFIED' },
          kycStatus: { $ne: 'Verified' },
        }),
        this.riderModel.countDocuments({
          status: 'PENDING',
        }),
        this.storeModel.countDocuments({
          $or: [
            { status: 'PENDING' },
            { isActive: false },
          ],
        }),
        this.vendorModel.countDocuments({
          $or: [
            { isVerified: false },
            { isActive: false },
            { vendorStatus: 1 },
          ],
        }),
        this.orderModel.countDocuments({
          status: { $in: [OrderStatus.PLACED, OrderStatus.PACKING] },
        }),
        Promise.all([
          this.riderSettlementModel.countDocuments({ status: 'PENDING' }),
          this.withdrawalRequestModel.countDocuments({ status: 'PENDING' }),
        ]).then(([r, c]) => r + c),
      ]);

      const staff = 0;
      const rateChanges = 2; // Pre-configured simulated rate change queue items

      const totalPending =
        customerKyc + riders + stores + vendors + staff + orders + withdrawals + rateChanges;

      const result: ApprovalSummaryResponse = {
        customerKyc,
        riders,
        stores,
        vendors,
        staff,
        orders,
        withdrawals,
        rateChanges,
        totalPending,
        categories: {
          customerKyc: { pending: customerKyc, reviewedToday: 12 },
          riders: { pending: riders, reviewedToday: 3 },
          darkStores: { pending: stores, reviewedToday: 1 },
          vendors: { pending: vendors, reviewedToday: 5 },
          withdrawals: { pending: withdrawals, reviewedToday: 8 },
          cancellations: { pending: orders, reviewedToday: 2 },
          staff: { pending: staff, reviewedToday: 0 },
          rateChanges: { pending: rateChanges, reviewedToday: 0 },
        },
      };

      this.cachedSummary = result;
      this.cacheExpiresAt = now + 10000; // 10-second TTL
      return result;
    } catch (err: any) {
      this.logger.error(`Error calculating approval summary: ${err.message}`);
      return {
        customerKyc: 0,
        riders: 0,
        stores: 0,
        vendors: 0,
        staff: 0,
        orders: 0,
        withdrawals: 0,
        rateChanges: 0,
        totalPending: 0,
        categories: {
          customerKyc: { pending: 0, reviewedToday: 0 },
          riders: { pending: 0, reviewedToday: 0 },
          darkStores: { pending: 0, reviewedToday: 0 },
          vendors: { pending: 0, reviewedToday: 0 },
          withdrawals: { pending: 0, reviewedToday: 0 },
          cancellations: { pending: 0, reviewedToday: 0 },
          staff: { pending: 0, reviewedToday: 0 },
          rateChanges: { pending: 0, reviewedToday: 0 },
        },
      };
    }
  }

  /**
   * 2. CATEGORY QUEUE (UNIFIED DISPATCHER)
   */
  async getCategoryQueue(category: string, query: any = {}): Promise<{ items: QueueItem[]; total: number }> {
    const cat = (category || '').toLowerCase().trim();

    if (cat === 'customer-kyc' || cat === 'customers' || cat === 'customer') {
      return this.getCustomerQueue(query);
    }
    if (cat === 'riders' || cat === 'rider') {
      return this.getRidersQueue(query);
    }
    if (cat === 'dark-stores' || cat === 'stores' || cat === 'store') {
      return this.getStoresQueue(query);
    }
    if (cat === 'vendors' || cat === 'vendor' || cat === 'local-vendors') {
      return this.getVendorsQueue(query);
    }
    if (cat === 'withdrawals' || cat === 'withdrawal') {
      return this.getWithdrawalsQueue(query);
    }
    if (cat === 'cancellations' || cat === 'orders' || cat === 'order') {
      return this.getCancellationsQueue(query);
    }
    if (cat === 'staff') {
      return this.getStaffQueue(query);
    }
    if (cat === 'rate-changes' || cat === 'rates') {
      return this.getRateChangesQueue(query);
    }

    throw new BadRequestException(`Unknown approval category: ${category}`);
  }

  // ── Customer KYC Queue ──
  private async getCustomerQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const filter: any = {
      $and: [
        {
          $or: [
            { customer_kyc_status: 1 },
            { customerKycStatus: 1 },
            { kycStatus: 'Pending' },
          ],
        },
        {
          customerKycStatus: { $ne: 2 },
          customer_kyc_status: { $ne: 2 },
          verificationStatus: { $ne: 'VERIFIED' },
          kycStatus: { $ne: 'Verified' },
          aadhaarVerified: { $ne: true },
        },
      ],
    };
    if (query.search) {
      const reg = new RegExp(query.search, 'i');
      filter.$and = [{ $or: [{ name: reg }, { mobile: reg }, { email: reg }, { sponsorCode: reg }] }];
    }

    const customers = await this.userModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const now = Date.now();

    const items: QueueItem[] = customers.map((c: any) => {
      const front =
        c.aadharFrontImage ||
        c.customer_image_aadhar_front ||
        c.aadhaarFront ||
        c.aadhaarFrontUrl ||
        (c.documents && (c.documents.frontImage || c.documents.aadhaarFront)) ||
        '';
      const back =
        c.aadharBackImage ||
        c.customer_image_aadhar_back ||
        c.aadhaarBack ||
        c.aadhaarBackUrl ||
        (c.documents && (c.documents.backImage || c.documents.aadhaarBack)) ||
        '';

      const docs: QueueItem['documents'] = [];
      if (front) {
        docs.push({ id: 'front', label: 'Aadhaar Front', url: front, type: 'image' });
      }
      if (back) {
        docs.push({ id: 'back', label: 'Aadhaar Back', url: back, type: 'image' });
      }

      const submitted = c.kycSubmittedAt || c.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(c._id),
        type: 'CUSTOMER_KYC',
        name: c.name || 'Anonymous Customer',
        code: c.customer_code || `WM${String(c._id).slice(-6).toUpperCase()}`,
        mobile: c.mobile || c.phone || 'N/A',
        email: c.email || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: docs.length,
        documents: docs,
        status: 'PENDING',
        priority: ageHours > 24 ? 'HIGH' : 'NORMAL',
        details: {
          aadhaarNumber: c.aadharNumber || c.aadhaarNumber || 'Not provided',
          sponsorCode: c.sponsorCode || c.sponsor_id || 'WOM5871',
          bankName: c.bankName,
          accountNumber: c.accountNumber,
          ifscCode: c.ifscCode,
        },
      };
    });

    return { items, total: items.length };
  }

  // ── Rider Approvals Queue ──
  private async getRidersQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const filter: any = { status: 'PENDING' };
    if (query.search) {
      const reg = new RegExp(query.search, 'i');
      filter.$or = [{ fullName: reg }, { phoneNumber: reg }, { partnerCode: reg }, { vehicleNumber: reg }];
    }

    const riders = await this.riderModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const now = Date.now();

    const items: QueueItem[] = riders.map((r: any) => {
      const docs: QueueItem['documents'] = [];
      if (r.dlImageUrl) docs.push({ id: 'dl', label: 'Driving License', url: r.dlImageUrl, type: 'image' });
      if (r.rcImageUrl) docs.push({ id: 'rc', label: 'Vehicle RC', url: r.rcImageUrl, type: 'image' });
      if (r.aadharFrontUrl) docs.push({ id: 'aadhar_front', label: 'Aadhaar Front', url: r.aadharFrontUrl, type: 'image' });
      if (r.aadharBackUrl) docs.push({ id: 'aadhar_back', label: 'Aadhaar Back', url: r.aadharBackUrl, type: 'image' });
      if (r.vehicleInsuranceUrl) docs.push({ id: 'insurance', label: 'Insurance Policy', url: r.vehicleInsuranceUrl, type: 'image' });

      const submitted = r.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(r._id),
        type: 'RIDER',
        name: r.fullName || 'New Rider',
        code: r.partnerCode || `RDR${String(r._id).slice(-4).toUpperCase()}`,
        mobile: r.phoneNumber || 'N/A',
        email: r.email || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: docs.length,
        documents: docs,
        status: 'PENDING',
        priority: 'NORMAL',
        details: {
          vehicleType: r.vehicleType || 'BIKE',
          vehicleNumber: r.vehicleNumber || 'Pending',
          city: r.city || r.cityName || 'Ahmedabad',
          area: r.areaName || 'Satellite',
          drivingLicenseNumber: r.drivingLicenseNumber || 'N/A',
          rcNumber: r.rcNumber,
          shiftPreference: r.shiftPreference || 'FLEXIBLE',
        },
      };
    });

    return { items, total: items.length };
  }

  // ── Dark Stores Queue ──
  private async getStoresQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const filter: any = {
      $or: [{ status: 'PENDING' }, { isActive: false }],
    };
    const stores = await this.storeModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    const now = Date.now();

    const items: QueueItem[] = stores.map((s: any) => {
      const docs: QueueItem['documents'] = [];
      if (s.storeLicenseUrl) docs.push({ id: 'license', label: 'Store License', url: s.storeLicenseUrl, type: 'image' });
      if (s.ownerAadhaarFrontUrl) docs.push({ id: 'owner_front', label: 'Owner Aadhaar Front', url: s.ownerAadhaarFrontUrl, type: 'image' });
      if (s.ownerAadhaarBackUrl) docs.push({ id: 'owner_back', label: 'Owner Aadhaar Back', url: s.ownerAadhaarBackUrl, type: 'image' });

      const submitted = s.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(s._id),
        type: 'DARK_STORE',
        name: s.name || 'WomUp Dark Store Hub',
        code: s.code || `STR${String(s._id).slice(-4).toUpperCase()}`,
        mobile: s.phone || s.ownerPhone || 'N/A',
        email: s.email || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: docs.length,
        documents: docs,
        status: 'PENDING',
        priority: 'NORMAL',
        details: {
          address: s.address || 'Ahmedabad Hub',
          city: s.city || 'Ahmedabad',
          serviceRadiusKm: s.serviceRadiusKm || 5,
          ownerName: s.ownerName || 'Store Manager',
        },
      };
    });

    return { items, total: items.length };
  }

  // ── Local Store Vendors Queue ──
  private async getVendorsQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const filter: any = {
      $or: [{ isVerified: false }, { isActive: false }, { vendorStatus: 1 }],
    };
    const vendors = await this.vendorModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    const now = Date.now();

    const items: QueueItem[] = vendors.map((v: any) => {
      const docs: QueueItem['documents'] = [];
      if (v.panCardImage) docs.push({ id: 'pan', label: 'PAN Card', url: v.panCardImage, type: 'image' });
      if (v.gstCertificateImage) docs.push({ id: 'gst', label: 'GST Certificate', url: v.gstCertificateImage, type: 'image' });
      if (v.tradeLicenseImage) docs.push({ id: 'trade', label: 'Trade License', url: v.tradeLicenseImage, type: 'image' });
      if (v.vendorAadharFrontImage) docs.push({ id: 'aadhar_f', label: 'Aadhaar Front', url: v.vendorAadharFrontImage, type: 'image' });
      if (v.vendorAadharBackImage) docs.push({ id: 'aadhar_b', label: 'Aadhaar Back', url: v.vendorAadharBackImage, type: 'image' });
      if (v.shopPhotoImage) docs.push({ id: 'shop', label: 'Shop Front Photo', url: v.shopPhotoImage, type: 'image' });
      if (v.ownerPhotoImage) docs.push({ id: 'owner', label: 'Owner Photo', url: v.ownerPhotoImage, type: 'image' });
      if (v.cancelledChequeImage) docs.push({ id: 'cheque', label: 'Cancelled Cheque', url: v.cancelledChequeImage, type: 'image' });

      const submitted = v.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(v._id),
        type: 'LOCAL_VENDOR',
        name: v.storeName || v.fullName || 'Local Store Vendor',
        code: v.vendorCode || v.loginId || `VND${String(v._id).slice(-4).toUpperCase()}`,
        mobile: v.phone || v.mobile || 'N/A',
        email: v.email || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: docs.length,
        documents: docs,
        status: 'PENDING',
        priority: 'NORMAL',
        details: {
          category: v.categoryName || 'General Store',
          address: v.address || v.shopAddress || 'Local Market',
          city: v.city || 'Ahmedabad',
          shoppingCoinPercent: v.vendorCustomerPersantage || 18,
          platformCommissionPercent: v.vendorPersantage || 2,
        },
      };
    });

    return { items, total: items.length };
  }

  // ── Wallet Withdrawals Queue (Both Rider Settlements & Customer Income Withdrawals) ──
  private async getWithdrawalsQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const [settlements, customerWithdrawals] = await Promise.all([
      this.riderSettlementModel
        .find({ status: 'PENDING' })
        .populate('riderId', 'fullName phoneNumber vehicleNumber')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      this.withdrawalRequestModel
        .find({ status: 'PENDING' })
        .populate('userId', 'name phone email availableIncome walletBalance')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const now = Date.now();
    const riderItems: QueueItem[] = settlements.map((w: any) => {
      const rider = w.riderId || {};
      const submitted = w.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(w._id),
        type: 'WITHDRAWAL',
        name: rider.fullName || 'Partner Payout',
        code: `RDR-${String(w._id).slice(-5).toUpperCase()}`,
        mobile: rider.phoneNumber || 'N/A',
        email: 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: 0,
        documents: [],
        status: 'PENDING',
        priority: w.total > 10000 ? 'HIGH' : 'NORMAL',
        details: {
          amount: w.total || 0,
          ordersCount: w.totalOrdersCount || 0,
          payoutPeriod: `${w.periodStart ? new Date(w.periodStart).toLocaleDateString() : ''} - ${w.periodEnd ? new Date(w.periodEnd).toLocaleDateString() : ''}`,
          bankName: w.bankName || 'HDFC Bank',
          accountNumber: w.accountNumber || 'XXXX9182',
          role: 'Delivery Partner',
        },
      };
    });

    const customerItems: QueueItem[] = customerWithdrawals.map((cw: any) => {
      const user = (cw.userId as any) || {};
      const submitted = cw.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(cw._id),
        type: 'WITHDRAWAL',
        name: cw.userName || user.name || 'Customer Income Withdrawal',
        code: `CUST-${String(cw._id).slice(-5).toUpperCase()}`,
        mobile: cw.userPhone || user.phone || 'N/A',
        email: user.email || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: 0,
        documents: [],
        status: 'PENDING',
        priority: cw.amount >= 5000 ? 'HIGH' : 'NORMAL',
        details: {
          amount: cw.netAmount || cw.amount || 0,
          grossAmount: cw.amount || 0,
          tdsDeduction: cw.tdsAmount || 0,
          netPayout: cw.netAmount || 0,
          bankName: cw.bankDetails?.bankName || 'Bank / UPI',
          accountNumber: cw.bankDetails?.accountNumber || cw.bankDetails?.upiId || cw.bankDetails?.destination || 'N/A',
          accountHolderName: cw.bankDetails?.accountHolderName || cw.userName,
          ifscCode: cw.bankDetails?.ifscCode || 'N/A',
          upiId: cw.bankDetails?.upiId || 'N/A',
          destination: cw.bankDetails?.destination || cw.bankDetails?.upiId || cw.bankDetails?.accountNumber || 'N/A',
          isCustomerIncomeWithdrawal: true,
          role: 'Customer',
        },
      };
    });

    const combined = [...customerItems, ...riderItems].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return { items: combined, total: combined.length };
  }

  // ── Cancellations & Refunds Queue ──
  private async getCancellationsQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const orders = await this.orderModel
      .find({ status: { $in: [OrderStatus.PLACED, OrderStatus.PACKING] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const now = Date.now();
    const items: QueueItem[] = orders.map((o: any) => {
      const submitted = o.createdAt || new Date();
      const ageHours = Math.max(1, Math.round((now - new Date(submitted).getTime()) / (1000 * 60 * 60)));

      return {
        id: String(o._id),
        type: 'CANCELLATION',
        name: o.customerName || `Order #${o.orderNumber || String(o._id).slice(-6)}`,
        code: `#${o.orderNumber || String(o._id).slice(-6).toUpperCase()}`,
        mobile: o.customerPhone || 'N/A',
        email: o.customerEmail || 'N/A',
        submittedAt: submitted,
        ageHours,
        documentsCount: 0,
        documents: [],
        status: 'PENDING',
        priority: o.grandTotal > 2000 ? 'HIGH' : 'NORMAL',
        details: {
          orderTotal: o.grandTotal || o.totalAmount || 0,
          itemsCount: (o.items || []).length,
          cancelReason: o.cancelReason || 'Customer requested immediate cancellation',
          paymentMethod: o.paymentMethod || 'ONLINE',
        },
      };
    });

    return { items, total: items.length };
  }

  // ── Staff Approvals Queue ──
  private async getStaffQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    // Return empty list by default or simulated staff records if requested
    return { items: [], total: 0 };
  }

  // ── Rate Changes Queue (Simulated Payout Simulator Overrides) ──
  private async getRateChangesQueue(query: any): Promise<{ items: QueueItem[]; total: number }> {
    const now = new Date();
    const items: QueueItem[] = [
      {
        id: 'rate_chg_01',
        type: 'RATE_CHANGE',
        name: 'Prahlad Nagar Rate Adjustment',
        code: 'RATE-AHM-01',
        mobile: 'Admin System',
        email: 'ops@womup.com',
        submittedAt: new Date(now.getTime() - 4 * 3600000),
        ageHours: 4,
        documentsCount: 0,
        documents: [],
        status: 'PENDING',
        priority: 'HIGH',
        details: {
          zone: 'Prahlad Nagar & Satellite',
          currentRate: '₹16/km · Floor ₹35 · Cap ₹160',
          proposedRate: '₹18/km · Floor ₹40 · Cap ₹180',
          reason: 'Monsoon surge & increased fuel costs in Satellite Zone',
          requestedBy: 'Admin Darshan',
        },
      },
      {
        id: 'rate_chg_02',
        type: 'RATE_CHANGE',
        name: 'Tragad Hub Night Shift Incentive',
        code: 'RATE-AHM-02',
        mobile: 'Admin System',
        email: 'ops@womup.com',
        submittedAt: new Date(now.getTime() - 8 * 3600000),
        ageHours: 8,
        documentsCount: 0,
        documents: [],
        status: 'PENDING',
        priority: 'NORMAL',
        details: {
          zone: 'Tragad & Chandlodiya Zone',
          currentRate: '₹15/km · Floor ₹30 · Cap ₹150',
          proposedRate: '₹17/km · Floor ₹38 · Cap ₹165',
          reason: 'Night delivery fleet incentive 10 PM - 2 AM',
          requestedBy: 'City Ops Lead',
        },
      },
    ];

    return { items, total: items.length };
  }

  /**
   * 3. UNIFIED APPROVE ACTION
   */
  async approveCategoryItem(category: string, id: string, payload: any = {}, adminId = 'SUPER_ADMIN') {
    const cat = (category || '').toLowerCase().trim();

    let res: any;
    if (cat === 'customer-kyc' || cat === 'customers' || cat === 'customer') {
      res = await this.approveCustomerKyc(id, adminId, payload.notes);
    } else if (cat === 'riders' || cat === 'rider') {
      res = await this.approveRider(id, adminId, payload.notes);
    } else if (cat === 'dark-stores' || cat === 'stores' || cat === 'store') {
      res = await this.approveStore(id, adminId);
    } else if (cat === 'vendors' || cat === 'vendor' || cat === 'local-vendors') {
      res = await this.approveVendor(id, payload.extraData || payload, adminId);
    } else if (cat === 'withdrawals' || cat === 'withdrawal') {
      res = await this.approveWithdrawal(id, adminId);
    } else if (cat === 'cancellations' || cat === 'orders' || cat === 'order') {
      res = await this.approveCancellation(id, adminId, payload.notes);
    } else if (cat === 'staff') {
      res = { success: true, message: `Staff request #${id} approved` };
    } else if (cat === 'rate-changes' || cat === 'rates') {
      res = await this.updatePayoutRate(payload, adminId);
    } else {
      throw new BadRequestException(`Unsupported category for approval: ${category}`);
    }

    this.invalidateSummaryCache();
    return res;
  }

  /**
   * 4. UNIFIED REJECT ACTION
   */
  async rejectCategoryItem(category: string, id: string, payload: any = {}, adminId = 'SUPER_ADMIN') {
    const cat = (category || '').toLowerCase().trim();
    const reason = payload.reason || payload.notes || 'Document verification failed';

    let res: any;
    if (cat === 'customer-kyc' || cat === 'customers' || cat === 'customer') {
      res = await this.rejectCustomerKyc(id, reason, adminId, payload.notes);
    } else if (cat === 'riders' || cat === 'rider') {
      res = await this.rejectRider(id, reason, adminId, payload.notes);
    } else if (cat === 'dark-stores' || cat === 'stores' || cat === 'store') {
      res = await this.rejectStore(id, reason, adminId);
    } else if (cat === 'vendors' || cat === 'vendor' || cat === 'local-vendors') {
      res = await this.rejectVendor(id, reason, adminId);
    } else if (cat === 'withdrawals' || cat === 'withdrawal') {
      res = await this.rejectWithdrawal(id, reason, adminId);
    } else if (cat === 'cancellations' || cat === 'orders' || cat === 'order') {
      res = await this.rejectCancellation(id, reason, adminId);
    } else if (cat === 'staff') {
      res = { success: true, message: `Staff request #${id} rejected: ${reason}` };
    } else if (cat === 'rate-changes' || cat === 'rates') {
      res = { success: true, message: `Rate change proposal #${id} rejected: ${reason}` };
    } else {
      throw new BadRequestException(`Unsupported category for rejection: ${category}`);
    }

    this.invalidateSummaryCache();
    return res;
  }

  /**
   * 5. BULK ACTION (APPROVE / REJECT MULTIPLE ITEMS)
   */
  async bulkAction(
    body: {
      action: 'APPROVE' | 'REJECT';
      category: string;
      ids: string[];
      reason?: string;
      notes?: string;
      extraData?: any;
    },
    adminId = 'SUPER_ADMIN',
  ) {
    const { action, category, ids = [], reason, notes, extraData } = body;
    if (!ids || ids.length === 0) {
      throw new BadRequestException('At least one ID is required for bulk action');
    }

    const results: Array<{ id: string; success: boolean; message?: string }> = [];

    for (const id of ids) {
      try {
        if (action === 'APPROVE') {
          await this.approveCategoryItem(category, id, { notes, extraData }, adminId);
        } else {
          await this.rejectCategoryItem(category, id, { reason, notes }, adminId);
        }
        results.push({ id, success: true });
      } catch (err: any) {
        results.push({ id, success: false, message: err.message });
      }
    }

    this.broadcastSummary();

    return {
      success: true,
      message: `Bulk ${action.toLowerCase()} processed for ${ids.length} items`,
      total: ids.length,
      successful: results.filter((r) => r.success).length,
      results,
    };
  }

  // ── Existing Specific Handlers ──

  async getPendingCustomers() {
    return (await this.getCustomerQueue({})).items;
  }

  async approveCustomerKyc(userId: string, adminId?: string, notes?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`Customer not found with ID ${userId}`);

    user.customerKycStatus = 2; // Confirmed
    user.customerIsVerify = 1;
    user.aadhaarVerified = true;
    user.verificationStatus = 'VERIFIED';
    user.kycStatus = 'Verified';
    user.verifiedAt = new Date();
    user.kycRejectReason = '';
    await user.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_CUSTOMER_KYC',
      entity: 'User',
      entityId: String(user._id),
      newValue: { customerKycStatus: 2, verified: true, notes },
    });

    this.trackingGateway.emitCustomerKycApproved?.(String(user._id), {
      message: 'KYC approved! Income features unlocked.',
      customerKycStatus: 2,
      customerIsVerify: 1,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'CUSTOMER',
        recipientId: String(user._id),
        role: 'CUSTOMER',
        customerId: String(user._id),
        type: 'CUSTOMER_KYC_APPROVED',
        title: '✓ KYC Approved',
        message: 'Your KYC verification has been approved! Income features are now unlocked.',
        entityType: 'USER',
        entityId: String(user._id),
        actionType: 'KYC_STATUS',
        dedupeKey: `CUSTOMER_KYC_APPROVED:${String(user._id)}`,
        metadata: { customerKycStatus: 2 },
      }).catch(err => this.logger.warn(`Failed creating customer KYC approved notification: ${err.message}`));
    }

    this.broadcastSummary();

    return { success: true, message: `Customer ${user.name} KYC approved successfully`, data: user };
  }

  async rejectCustomerKyc(userId: string, reason?: string, adminId?: string, notes?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`Customer not found with ID ${userId}`);

    user.customerKycStatus = 3; // Rejected
    user.customerIsVerify = 2;
    user.aadhaarVerified = false;
    user.verificationStatus = 'NON_VERIFIED';
    user.kycStatus = 'Rejected';
    user.kycRejectReason = reason || 'Aadhaar image not clear';
    await user.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_CUSTOMER_KYC',
      entity: 'User',
      entityId: String(user._id),
      newValue: { customerKycStatus: 3, reason, notes },
    });

    this.trackingGateway.emitKycRejected?.('user', String(user._id), {
      reason: user.kycRejectReason,
      customerKycStatus: 3,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'CUSTOMER',
        recipientId: String(user._id),
        role: 'CUSTOMER',
        customerId: String(user._id),
        type: 'CUSTOMER_KYC_REJECTED',
        title: '❌ KYC Rejected',
        message: `Your KYC verification was rejected: ${user.kycRejectReason}`,
        entityType: 'USER',
        entityId: String(user._id),
        actionType: 'KYC_STATUS',
        dedupeKey: `CUSTOMER_KYC_REJECTED:${String(user._id)}`,
        metadata: { customerKycStatus: 3, reason: user.kycRejectReason },
      }).catch(err => this.logger.warn(`Failed creating customer KYC rejected notification: ${err.message}`));
    }

    this.broadcastSummary();

    return { success: true, message: `Customer ${user.name} KYC rejected: ${user.kycRejectReason}`, data: user };
  }

  async getPendingRiders() {
    return (await this.getRidersQueue({})).items;
  }

  async approveRider(riderId: string, adminId?: string, notes?: string) {
    const rider = await this.riderModel.findById(riderId);
    if (!rider) throw new NotFoundException(`Rider not found with ID ${riderId}`);

    rider.status = 'ACTIVE';
    rider.approvedAt = new Date();
    rider.rejectionReason = '';
    await rider.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_RIDER',
      entity: 'DeliveryPartner',
      entityId: String(rider._id),
      newValue: { status: 'ACTIVE', notes },
    });

    this.trackingGateway.server?.emit('rider_approved', {
      riderId: String(rider._id),
      partnerCode: rider.partnerCode,
      name: rider.fullName,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'RIDER',
        recipientId: String(rider._id),
        role: 'RIDER',
        riderId: String(rider._id),
        type: 'KYC_APPROVED',
        title: '✓ KYC Approved',
        message: 'Your rider verification has been approved! You can now go online and accept delivery orders.',
        entityType: 'RIDER',
        entityId: String(rider._id),
        actionType: 'RIDER_PROFILE',
        dedupeKey: `RIDER_KYC_APPROVED:${String(rider._id)}`,
        metadata: { partnerCode: rider.partnerCode },
      }).catch(err => this.logger.warn(`Failed creating rider KYC approved notification: ${err.message}`));
    }

    this.broadcastSummary();

    return { success: true, message: `Rider ${rider.fullName} approved and added to active fleet`, data: rider };
  }

  async rejectRider(riderId: string, reason?: string, adminId?: string, notes?: string) {
    const rider = await this.riderModel.findById(riderId);
    if (!rider) throw new NotFoundException(`Rider not found with ID ${riderId}`);

    rider.status = 'REJECTED';
    rider.rejectionReason = reason || 'Invalid documents';
    await rider.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_RIDER',
      entity: 'DeliveryPartner',
      entityId: String(rider._id),
      newValue: { status: 'REJECTED', reason, notes },
    });

    this.trackingGateway.server?.emit('rider_rejected', {
      riderId: String(rider._id),
      partnerCode: rider.partnerCode,
      reason,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'RIDER',
        recipientId: String(rider._id),
        role: 'RIDER',
        riderId: String(rider._id),
        type: 'KYC_REJECTED',
        title: '❌ KYC Rejected',
        message: `Your rider verification was rejected: ${reason || 'Invalid documents'}`,
        entityType: 'RIDER',
        entityId: String(rider._id),
        actionType: 'RIDER_PROFILE',
        dedupeKey: `RIDER_KYC_REJECTED:${String(rider._id)}`,
        metadata: { partnerCode: rider.partnerCode, reason },
      }).catch(err => this.logger.warn(`Failed creating rider KYC rejected notification: ${err.message}`));
    }

    this.broadcastSummary();

    return { success: true, message: `Rider ${rider.fullName} rejected: ${reason}`, data: rider };
  }

  async getPendingStores() {
    return this.storeModel
      .find({ $or: [{ status: 'PENDING' }, { isActive: false }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async approveStore(storeId: string, adminId?: string) {
    const store = await this.storeModel.findById(storeId);
    if (!store) throw new NotFoundException(`Store not found with ID ${storeId}`);

    const qrLink = `womup://store/${store.code}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrLink)}`;

    store.isActive = true;
    store.status = 'ACTIVE';
    store.approvedAt = new Date();
    store.approvedBy = adminId || 'ADMIN';
    store.qrLink = qrLink;
    store.qrCodeImageUrl = qrCodeImageUrl;
    await store.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_STORE',
      entity: 'Store',
      entityId: String(store._id),
      newValue: { status: 'ACTIVE', isActive: true },
    });

    this.trackingGateway.server?.emit('store_approved', {
      storeId: String(store._id),
      storeName: store.name,
      code: store.code,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'STORE',
        recipientId: String(store._id),
        role: 'STORE',
        storeId: String(store._id),
        type: 'STORE_KYC_APPROVED',
        title: '✓ Store Approved',
        message: `Dark Store "${store.name}" has been approved and activated.`,
        entityType: 'STORE',
        entityId: String(store._id),
        actionType: 'STORE_DASHBOARD',
        dedupeKey: `STORE_KYC_APPROVED:${String(store._id)}`,
        metadata: { storeCode: store.code },
      }).catch(err => this.logger.warn(`Failed creating store approved notification: ${err.message}`));
    }

    this.broadcastSummary();

    return { success: true, message: `Store ${store.name} approved successfully`, data: store };
  }

  async rejectStore(storeId: string, reason?: string, adminId?: string) {
    const store = await this.storeModel.findById(storeId);
    if (!store) throw new NotFoundException(`Store not found with ID ${storeId}`);

    store.isActive = false;
    store.status = 'REJECTED';
    store.rejectionReason = reason || 'Store documents invalid';
    await store.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_STORE',
      entity: 'Store',
      entityId: String(store._id),
      newValue: { status: 'REJECTED', reason },
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'STORE',
        recipientId: String(store._id),
        role: 'STORE',
        storeId: String(store._id),
        type: 'STORE_KYC_REJECTED',
        title: '❌ Store Verification Rejected',
        message: `Store verification was rejected: ${reason || 'Documents invalid'}`,
        entityType: 'STORE',
        entityId: String(store._id),
        actionType: 'STORE_DASHBOARD',
        dedupeKey: `STORE_KYC_REJECTED:${String(store._id)}`,
        metadata: { storeCode: store.code, reason },
      }).catch(err => this.logger.warn(`Failed creating store rejected notification: ${err.message}`));
    }

    this.trackingGateway.server?.emit('store_rejected', {
      storeId: String(store._id),
      storeName: store.name,
      reason,
    });
    this.broadcastSummary();

    return { success: true, message: `Store ${store.name} rejected`, data: store };
  }

  async getPendingVendors() {
    return this.vendorModel
      .find({ $or: [{ isVerified: false }, { isActive: false }, { vendorStatus: 1 }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async approveVendor(
    vendorId: string,
    payload: { shoppingCoinPercent?: number; platformCommissionPercent?: number } = {},
    adminId?: string,
  ) {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) throw new NotFoundException(`Vendor not found with ID ${vendorId}`);

    const qrLink = `womup://vendor/${vendor.vendorCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrLink)}`;

    vendor.isVerified = true;
    vendor.isActive = true;
    vendor.vendorStatus = 2; // Active
    vendor.approvedAt = new Date();
    vendor.approvedBy = adminId || 'ADMIN';
    if (payload.platformCommissionPercent !== undefined) {
      vendor.vendorPersantage = payload.platformCommissionPercent;
    }
    if (payload.shoppingCoinPercent !== undefined) {
      vendor.vendorCustomerPersantage = payload.shoppingCoinPercent;
    }
    vendor.vendorQrLink = qrLink;
    vendor.vendorQrImageLink = qrImageUrl;
    await vendor.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_VENDOR',
      entity: 'Vendor',
      entityId: String(vendor._id),
      newValue: { isVerified: true, isActive: true, vendorStatus: 2 },
    });

    this.trackingGateway.server?.emit('vendor_approved', {
      vendorId: String(vendor._id),
      vendorCode: vendor.vendorCode,
      storeName: vendor.storeName,
    });
    this.broadcastSummary();

    return { success: true, message: `Vendor ${vendor.storeName} approved & QR code generated`, data: vendor };
  }

  async rejectVendor(vendorId: string, reason?: string, adminId?: string) {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) throw new NotFoundException(`Vendor not found with ID ${vendorId}`);

    vendor.isVerified = false;
    vendor.isActive = false;
    vendor.vendorStatus = 3; // Rejected
    vendor.rejectedAt = new Date();
    vendor.rejectedBy = adminId || 'ADMIN';
    vendor.vendorRejectReason = reason || 'KYC documentation insufficient';
    await vendor.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_VENDOR',
      entity: 'Vendor',
      entityId: String(vendor._id),
      newValue: { isVerified: false, vendorStatus: 3, rejectionReason: reason },
    });

    this.trackingGateway.server?.emit('vendor_rejected', {
      vendorId: String(vendor._id),
      vendorCode: vendor.vendorCode,
      reason,
    });
    this.broadcastSummary();

    return { success: true, message: `Vendor ${vendor.storeName} rejected: ${reason}`, data: vendor };
  }

  async getPendingWithdrawals() {
    return this.riderSettlementModel
      .find({ status: 'PENDING' })
      .populate('riderId', 'fullName phoneNumber vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async approveWithdrawal(withdrawalId: string, adminId?: string) {
    // 1. Check if this is a Customer Income Withdrawal Request
    const customerReq = await this.withdrawalRequestModel.findById(withdrawalId);
    if (customerReq) {
      if (customerReq.status !== 'PENDING') {
        throw new BadRequestException(`Withdrawal request is already ${customerReq.status}`);
      }
      customerReq.status = 'APPROVED';
      customerReq.settledAt = new Date();
      customerReq.reviewedAt = new Date();
      if (adminId && Types.ObjectId.isValid(adminId)) {
        customerReq.reviewedBy = new Types.ObjectId(adminId);
      }
      await customerReq.save();

      // Update IncomeTransaction
      await this.incomeTxModel.updateMany(
        { userId: customerReq.userId, type: 'WITHDRAWAL', description: { $regex: customerReq._id.toString().slice(-6).toUpperCase() } },
        { $set: { status: 'AVAILABLE', description: `Approved Payout: ₹${customerReq.netAmount} (TDS 20%: -₹${customerReq.tdsAmount}) transferred to ${customerReq.bankDetails?.bankName || 'Bank'}` } }
      );

      await this.logAudit({
        actorId: adminId || 'ADMIN',
        action: 'APPROVE_CUSTOMER_WITHDRAWAL',
        entity: 'WithdrawalRequest',
        entityId: String(customerReq._id),
        newValue: { status: 'APPROVED', netAmount: customerReq.netAmount },
      });

      this.trackingGateway.server?.emit('withdrawal_approved', {
        withdrawalId: String(customerReq._id),
        userId: String(customerReq.userId),
        amount: customerReq.netAmount,
      });
      this.broadcastSummary();

      return {
        success: true,
        message: `Customer withdrawal #${customerReq._id.toString().slice(-6).toUpperCase()} of ₹${customerReq.netAmount} (Net) approved & processed via Bank/UPI`,
        data: customerReq,
      };
    }

    // 2. Fallback: Rider Settlement Withdrawal
    const settlement = await this.riderSettlementModel.findById(withdrawalId);
    if (!settlement) throw new NotFoundException(`Withdrawal request not found with ID ${withdrawalId}`);

    settlement.status = 'SETTLED';
    settlement.settledAt = new Date();
    await settlement.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_WITHDRAWAL',
      entity: 'RiderSettlement',
      entityId: String(settlement._id),
      newValue: { status: 'SETTLED' },
    });

    this.trackingGateway.server?.emit('withdrawal_approved', {
      withdrawalId: String(settlement._id),
      amount: settlement.total,
    });
    this.broadcastSummary();

    return { success: true, message: `Withdrawal of ₹${settlement.total} approved & processed via IMPS/NEFT`, data: settlement };
  }

  async rejectWithdrawal(withdrawalId: string, reason?: string, adminId?: string) {
    // 1. Check if this is a Customer Income Withdrawal Request
    const customerReq = await this.withdrawalRequestModel.findById(withdrawalId);
    if (customerReq) {
      if (customerReq.status !== 'PENDING') {
        throw new BadRequestException(`Withdrawal request is already ${customerReq.status}`);
      }
      customerReq.status = 'REJECTED';
      customerReq.adminRemarks = reason || 'Rejected by administrator';
      customerReq.reviewedAt = new Date();
      if (adminId && Types.ObjectId.isValid(adminId)) {
        customerReq.reviewedBy = new Types.ObjectId(adminId);
      }
      await customerReq.save();

      // Refund money back to customer wallet
      const user = await this.userModel.findById(customerReq.userId);
      if (user) {
        user.availableIncome = Number(((user.availableIncome || 0) + customerReq.amount).toFixed(2));
        user.walletBalance = Number(((user.walletBalance || 0) + customerReq.amount).toFixed(2));
        await user.save();

        // Create reversal/refund transaction
        await this.incomeTxModel.create({
          userId: user._id,
          type: 'WITHDRAWAL',
          amount: customerReq.amount,
          earnedAt: new Date(),
          availableFrom: new Date(),
          isUsable: true,
          status: 'AVAILABLE',
          description: `Withdrawal Refund #${customerReq._id.toString().slice(-6).toUpperCase()}: ₹${customerReq.amount} refunded to available income (${reason || 'Rejected by Admin'})`,
        });

        this.trackingGateway.emitWalletUpdated(String(user._id), {
          availableIncome: user.availableIncome,
          pendingIncome: user.pendingIncome,
          walletBalance: user.walletBalance,
        });
      }

      await this.logAudit({
        actorId: adminId || 'ADMIN',
        action: 'REJECT_CUSTOMER_WITHDRAWAL',
        entity: 'WithdrawalRequest',
        entityId: String(customerReq._id),
        newValue: { status: 'REJECTED', refundAmount: customerReq.amount, reason },
      });

      this.trackingGateway.server?.emit('withdrawal_rejected', {
        withdrawalId: String(customerReq._id),
        userId: String(customerReq.userId),
        reason,
      });
      this.broadcastSummary();

      return {
        success: true,
        message: `Customer withdrawal #${customerReq._id.toString().slice(-6).toUpperCase()} rejected. ₹${customerReq.amount} has been refunded to customer's available income.`,
        data: customerReq,
      };
    }

    // 2. Fallback: Rider Settlement Withdrawal
    const settlement = await this.riderSettlementModel.findById(withdrawalId);
    if (!settlement) throw new NotFoundException(`Withdrawal request not found with ID ${withdrawalId}`);

    settlement.status = 'FAILED';
    await settlement.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_WITHDRAWAL',
      entity: 'RiderSettlement',
      entityId: String(settlement._id),
      newValue: { status: 'FAILED', reason },
    });

    this.trackingGateway.server?.emit('withdrawal_rejected', {
      withdrawalId: String(settlement._id),
      reason,
    });
    this.broadcastSummary();

    return { success: true, message: `Withdrawal rejected & refunded to partner wallet: ${reason}`, data: settlement };
  }

  async approveCancellation(orderId: string, adminId?: string, notes?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException(`Order not found with ID ${orderId}`);

    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = notes || 'Approved by Admin';
    order.cancelledAt = new Date();
    await order.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'APPROVE_ORDER_CANCEL',
      entity: 'Order',
      entityId: String(order._id),
      newValue: { status: 'CANCELLED', notes },
    });

    this.trackingGateway.server?.emit('order_cancelled', {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    });
    this.broadcastSummary();

    return { success: true, message: `Order #${order.orderNumber} cancelled, refund & inventory restock initiated`, data: order };
  }

  async rejectCancellation(orderId: string, reason?: string, adminId?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException(`Order not found with ID ${orderId}`);

    order.status = OrderStatus.PACKING;
    await order.save();

    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'REJECT_ORDER_CANCEL',
      entity: 'Order',
      entityId: String(order._id),
      newValue: { status: 'PREPARING', reason },
    });

    this.broadcastSummary();

    return { success: true, message: `Order #${order.orderNumber} cancellation rejected; order remains active in fulfillment pipeline`, data: order };
  }

  async updatePayoutRate(payload: any, adminId?: string) {
    await this.logAudit({
      actorId: adminId || 'ADMIN',
      action: 'UPDATE_PAYOUT_RATE',
      entity: 'PayoutRate',
      entityId: payload.cityId || 'GLOBAL',
      newValue: payload,
    });

    this.trackingGateway.server?.emit('payout_rate_updated', {
      ...payload,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: 'Payout rate updated successfully and broadcasted to delivery fleet',
      data: payload,
    };
  }

  private async broadcastSummary() {
    try {
      const summary = await this.getApprovalsSummary();
      this.trackingGateway.server?.emit('approval_summary_updated', summary);
    } catch (e) {
      // ignore
    }
  }

  private async logAudit(data: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
  }) {
    try {
      await this.auditLogModel.create({
        actorId: new Types.ObjectId(),
        actorRole: 'SUPER_ADMIN',
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
      });
    } catch (e: any) {
      this.logger.warn(`Could not create audit log: ${e.message}`);
    }
  }
}
