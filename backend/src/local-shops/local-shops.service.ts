import { Injectable, OnModuleInit, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { VendorCategory, VendorCategoryDocument } from './schemas/vendor-category.schema';
import { VendorTransaction, VendorTransactionDocument } from './schemas/vendor-transaction.schema';
import { VendorCollectionRequest, VendorCollectionRequestDocument } from './schemas/vendor-collection-request.schema';
import { VendorSettlement, VendorSettlementDocument } from './schemas/vendor-settlement.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { IncomeTransaction, IncomeTransactionDocument } from '../users/schemas/income-transaction.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';
import {
  CreateVendorDto,
  UpdateVendorDto,
  CreateCategoryDto,
  VerifyOfflinePaymentDto,
  CreateCollectionRequestDto,
  WithdrawWalletDto,
  SendVendorOtpDto,
  VerifyVendorOtpDto,
  VendorLoginDto,
  VendorLoginOtpDto,
  VendorResetPasswordDto,
  RegisterVendorDto,
} from './dto/local-shops.dto';

@Injectable()
export class LocalShopsService implements OnModuleInit {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(VendorCategory.name) private categoryModel: Model<VendorCategoryDocument>,
    @InjectModel(VendorTransaction.name) private transactionModel: Model<VendorTransactionDocument>,
    @InjectModel(VendorCollectionRequest.name) private collectionRequestModel: Model<VendorCollectionRequestDocument>,
    @InjectModel(VendorSettlement.name) private settlementModel: Model<VendorSettlementDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(IncomeTransaction.name) private incomeTxModel: Model<IncomeTransactionDocument>,
    @Optional() private trackingGateway?: TrackingGateway,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
    await this.seedDefaultVendors();
    // Ensure Gokul Vegetables is configured to 18% Shopping Coin Benefit per SRS
    await this.vendorModel.updateOne(
      { vendorCode: 'VND001' },
      { $set: { shoppingCoinPercent: 18 } }
    );
  }

  // ── Seed Categories ────────────────────────────────────────────────────────
  private async seedDefaultCategories() {
    const count = await this.categoryModel.countDocuments();
    if (count > 0) return;

    const defaultCats = [
      { name: 'Vegetables', slug: 'vegetables', icon: 'carrot', bgColor: '#D1FAE5', iconColor: '#10B981', sortOrder: 1 },
      { name: 'Grocery', slug: 'grocery', icon: 'cart-outline', bgColor: '#FCE7F3', iconColor: '#EC4899', sortOrder: 2 },
      { name: 'Medical', slug: 'medical', icon: 'medical-outline', bgColor: '#E0F2FE', iconColor: '#0284C7', sortOrder: 3 },
      { name: 'Salon', slug: 'salon', icon: 'cut-outline', bgColor: '#FFEDD5', iconColor: '#EA580C', sortOrder: 4 },
      { name: 'Garments', slug: 'garments', icon: 'shirt-outline', bgColor: '#F3E8FF', iconColor: '#9333EA', sortOrder: 5 },
      { name: 'Electronics', slug: 'electronics', icon: 'laptop-outline', bgColor: '#FEF3C7', iconColor: '#D97706', sortOrder: 6 },
      { name: 'Bakery', slug: 'bakery', icon: 'cafe-outline', bgColor: '#FFE4E6', iconColor: '#F43F5E', sortOrder: 7 },
      { name: 'Restaurants', slug: 'restaurants', icon: 'restaurant-outline', bgColor: '#E0E7FF', iconColor: '#4F46E5', sortOrder: 8 },
      { name: 'More', slug: 'more', icon: 'grid-outline', bgColor: '#F1F5F9', iconColor: '#64748B', sortOrder: 9 },
    ];

    for (const c of defaultCats) {
      await this.categoryModel.create(c);
    }
  }

  // ── Seed Initial Real Vendors in DB ─────────────────────────────────────────
  private async seedDefaultVendors() {
    const count = await this.vendorModel.countDocuments();
    if (count > 0) return;

    const initialVendors: Partial<Vendor>[] = [
      {
        vendorCode: 'VND001',
        storeName: 'Gokul Vegetables',
        ownerName: 'Ramesh Patel',
        ownerPhone: '+91 98250 12345',
        categoryName: 'Vegetables',
        address: 'Near Nandanvan Society, Mahesana',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.5507, 23.1288] },
        shoppingCoinPercent: 18, // 18% Shopping Coin Benefit per SRS
        minCoinPercent: 2,
        maxCoinPercent: 25,
        openingTime: '08:00 AM',
        closingTime: '09:00 PM',
        isOpenNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
        rating: 4.8,
        totalReviews: 128,
        upiId: 'gokulveg@okaxis',
        isActive: true,
        isVerified: true,
        platformCommissionPercent: 2,
      },
      {
        vendorCode: 'VND002',
        storeName: 'Shree Kirana Store',
        ownerName: 'Jayesh Shah',
        ownerPhone: '+91 98251 23456',
        categoryName: 'Grocery',
        address: 'Near Sardar Chowk, Mahesana',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.5540, 23.1310] },
        shoppingCoinPercent: 6, // 6% Coin as per Notebook
        minCoinPercent: 2,
        maxCoinPercent: 25,
        openingTime: '07:30 AM',
        closingTime: '10:00 PM',
        isOpenNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80',
        rating: 4.6,
        totalReviews: 84,
        upiId: 'shreekirana@oksbi',
        isActive: true,
        isVerified: true,
        platformCommissionPercent: 2,
      },
      {
        vendorCode: 'VND003',
        storeName: 'Jay Medical Store',
        ownerName: 'Dr. Suresh Varma',
        ownerPhone: '+91 98252 34567',
        categoryName: 'Medical',
        address: 'Near City Point, Mahesana',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.5570, 23.1340] },
        shoppingCoinPercent: 10, // 10% Coin as per Notebook
        minCoinPercent: 2,
        maxCoinPercent: 25,
        openingTime: '08:00 AM',
        closingTime: '11:00 PM',
        isOpenNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
        rating: 4.9,
        totalReviews: 210,
        upiId: 'jaymedical@okicici',
        isActive: true,
        isVerified: true,
        platformCommissionPercent: 2,
      },
      {
        vendorCode: 'VND004',
        storeName: "Royal Men's Salon",
        ownerName: 'Haresh Barot',
        ownerPhone: '+91 98253 45678',
        categoryName: 'Salon',
        address: 'Highway Cross Road, Mahesana',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.5600, 23.1380] },
        shoppingCoinPercent: 12,
        minCoinPercent: 2,
        maxCoinPercent: 25,
        openingTime: '09:00 AM',
        closingTime: '09:30 PM',
        isOpenNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
        rating: 4.7,
        totalReviews: 95,
        upiId: 'royalsalon@okhdfcbank',
        isActive: true,
        isVerified: true,
        platformCommissionPercent: 2,
      },
      {
        vendorCode: 'VND005',
        storeName: 'Fashion Hub Garments',
        ownerName: 'Manoj Prajapati',
        ownerPhone: '+91 98254 56789',
        categoryName: 'Garments',
        address: 'Opp. Radhanpur Chokdi, Mahesana',
        city: 'Ahmedabad',
        pincode: '380015',
        coordinates: { type: 'Point', coordinates: [72.5630, 23.1410] },
        shoppingCoinPercent: 8,
        minCoinPercent: 2,
        maxCoinPercent: 25,
        openingTime: '10:00 AM',
        closingTime: '09:00 PM',
        isOpenNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
        rating: 4.5,
        totalReviews: 67,
        upiId: 'fashionhub@okaxis',
        isActive: true,
        isVerified: true,
        platformCommissionPercent: 2,
      },
    ];

    for (const v of initialVendors) {
      await this.vendorModel.create(v);
    }
  }

  // ── Haversine Distance Calculation (KM) ───────────────────────────────────
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // Helper color map based on category
  private getCategoryStyling(cat: string) {
    const norm = (cat || '').toLowerCase();
    switch (norm) {
      case 'vegetables':
        return { badgeColor: '#10B981', buttonColor: '#10B981', pillBgColor: '#D1FAE5' };
      case 'grocery':
        return { badgeColor: '#EC4899', buttonColor: '#EC4899', pillBgColor: '#FCE7F3' };
      case 'medical':
        return { badgeColor: '#0284C7', buttonColor: '#0284C7', pillBgColor: '#E0F2FE' };
      case 'salon':
        return { badgeColor: '#EA580C', buttonColor: '#EA580C', pillBgColor: '#FFEDD5' };
      case 'garments':
        return { badgeColor: '#9333EA', buttonColor: '#9333EA', pillBgColor: '#F3E8FF' };
      default:
        return { badgeColor: '#0F172A', buttonColor: '#0F172A', pillBgColor: '#F1F5F9' };
    }
  }

  // ── Public API 1: Nearby Vendors ──────────────────────────────────────────
  async getNearbyShops(
    lat?: number,
    lng?: number,
    radiusKm: number = 25,
    category?: string,
    city?: string,
    query?: string,
  ) {
    const filter: any = { isActive: true };

    if (category && category !== 'All' && category !== 'More') {
      filter.categoryName = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }

    if (query && query.trim() !== '') {
      const q = query.trim();
      filter.$or = [
        { storeName: { $regex: q, $options: 'i' } },
        { categoryName: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ];
    }

    const docs = await this.vendorModel.find(filter).lean();
    const userLat = lat ?? 23.1288;
    const userLng = lng ?? 72.5507;

    const formatted = docs.map((v) => {
      const vLat = v.coordinates?.coordinates?.[1] ?? 23.1288;
      const vLng = v.coordinates?.coordinates?.[0] ?? 72.5507;
      const distance = this.calculateDistance(userLat, userLng, vLat, vLng);
      const styling = this.getCategoryStyling(v.categoryName);

      return {
        id: v._id.toString(),
        _id: v._id.toString(),
        vendorCode: v.vendorCode,
        storeName: v.storeName,
        name: v.storeName,
        category: v.categoryName,
        categoryName: v.categoryName,
        coinPercentage: v.shoppingCoinPercent,
        shoppingCoinPercent: v.shoppingCoinPercent,
        address: v.address,
        city: v.city,
        pincode: v.pincode,
        phone: v.ownerPhone,
        ownerName: v.ownerName,
        timings: `${v.openingTime} - ${v.closingTime}`,
        openingTime: v.openingTime,
        closingTime: v.closingTime,
        isOpenNow: v.isOpenNow ?? true,
        distanceKm: distance,
        distance,
        rating: v.rating ?? 4.8,
        reviewCount: v.totalReviews ?? 50,
        totalReviews: v.totalReviews ?? 50,
        image: v.imageUrl,
        imageUrl: v.imageUrl,
        bannerUrl: v.bannerUrl || v.imageUrl,
        verified: v.isVerified ?? true,
        isVerified: v.isVerified ?? true,
        upiId: v.upiId || `${v.vendorCode.toLowerCase()}@okhdfcbank`,
        qrCodeUrl: v.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${v.upiId || 'wormup@okaxis'}&pn=${encodeURIComponent(v.storeName)}`,
        ...styling,
      };
    });

    // Sort ascending by distance
    formatted.sort((a, b) => a.distanceKm - b.distanceKm);

    return formatted;
  }

  // ── Public API 2: Single Vendor Detail ─────────────────────────────────────
  async getVendorDetails(vendorId: string) {
    let vendor: VendorDocument | null = null;
    if (Types.ObjectId.isValid(vendorId)) {
      vendor = await this.vendorModel.findById(vendorId);
    }
    if (!vendor) {
      vendor = await this.vendorModel.findOne({ vendorCode: vendorId.toUpperCase() });
    }
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID "${vendorId}" not found`);
    }

    const styling = this.getCategoryStyling(vendor.categoryName);
    const upi = vendor.upiId || `${vendor.vendorCode.toLowerCase()}@okhdfcbank`;

    return {
      id: vendor._id.toString(),
      _id: vendor._id.toString(),
      vendorCode: vendor.vendorCode,
      storeName: vendor.storeName,
      name: vendor.storeName,
      category: vendor.categoryName,
      categoryName: vendor.categoryName,
      coinPercentage: vendor.shoppingCoinPercent,
      shoppingCoinPercent: vendor.shoppingCoinPercent,
      address: vendor.address,
      city: vendor.city,
      pincode: vendor.pincode,
      phone: vendor.ownerPhone,
      ownerName: vendor.ownerName,
      timings: `${vendor.openingTime} - ${vendor.closingTime}`,
      openingTime: vendor.openingTime,
      closingTime: vendor.closingTime,
      isOpenNow: vendor.isOpenNow ?? true,
      rating: vendor.rating,
      reviewCount: vendor.totalReviews,
      image: vendor.imageUrl,
      imageUrl: vendor.imageUrl,
      bannerUrl: vendor.bannerUrl || vendor.imageUrl,
      verified: vendor.isVerified,
      upiId: upi,
      qrCodeUrl:
        vendor.qrCodeUrl ||
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${upi}&pn=${encodeURIComponent(
          vendor.storeName,
        )}`,
      ...styling,
    };
  }

  // ── Public API 3: Active Categories ────────────────────────────────────────
  async getCategories() {
    return this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  }

  // ── Public API 4: Offline Purchase Flow (SRS Notebook Specs) ───────────────
  async verifyOfflinePayment(dto: VerifyOfflinePaymentDto) {
    let vendor: VendorDocument | null = null;
    if (Types.ObjectId.isValid(dto.vendorId)) {
      vendor = await this.vendorModel.findById(dto.vendorId);
    }
    if (!vendor) {
      vendor = await this.vendorModel.findOne({ vendorCode: dto.vendorId.toUpperCase() });
    }
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const billAmount = Number(dto.billAmount);
    if (billAmount <= 0) {
      throw new BadRequestException('Bill amount must be greater than 0');
    }

    let customer: UserDocument | null = null;
    if (dto.customerId && Types.ObjectId.isValid(dto.customerId)) {
      customer = await this.userModel.findById(dto.customerId);
    }

    let coinsUsed = 0;
    let cashPaid = 0;
    let coinsEarned = 0;

    const commissionPercent = vendor.platformCommissionPercent || 2;
    const platformCommission = Math.round((billAmount * commissionPercent) / 100);

    const benefitRate = vendor.shoppingCoinPercent || 10;
    const coinBenefit = Math.round((billAmount * benefitRate) / 100);
    const payableAmount = Math.max(0, billAmount - coinBenefit);

    const method = dto.paymentMethod ? dto.paymentMethod.toUpperCase() : 'COIN';

    // 1. SHOPPING COINS: Admin % applied (max coinBenefit), customer uses min(coinBenefit, available coins)
    if (method === 'COIN' || method === 'COINS') {
      const requestedCoins = dto.coinsUsed !== undefined ? Number(dto.coinsUsed) : coinBenefit;
      coinsUsed = Math.min(coinBenefit, Math.max(0, requestedCoins));
      cashPaid = Math.max(0, billAmount - coinsUsed);
      coinsEarned = 0;
      if (customer) {
        customer.shoppingCoins = Math.max(0, (customer.shoppingCoins || 0) - coinsUsed);
        await customer.save();
      }
    }
    // 2. INCOME WALLET: 100% full bill from Income Wallet, 0 coins, 0 cash
    else if (method === 'WALLET') {
      cashPaid = 0;
      coinsUsed = 0;
      coinsEarned = 0;
      if (customer) {
        customer.appDownloadIncome = Math.max(0, (customer.appDownloadIncome || 0) - billAmount);
        customer.availableIncome = Math.max(0, (customer.availableIncome || 0) - billAmount);
        customer.walletBalance = Math.max(0, (customer.walletBalance || 0) - billAmount);
        await customer.save();
      }
    }
    // 3. CASH AT STORE: 100% full bill in cash given to vendor
    else if (method === 'CASH') {
      cashPaid = billAmount;
      coinsUsed = 0;
      coinsEarned = 0;
    }
    // 4. COUNTER UPI: 100% full bill paid via digital UPI gateway
    else {
      cashPaid = 0;
      coinsUsed = 0;
      coinsEarned = 0;
    }

    // Team Purchase Income (0.4% per notebook rule on eligible non-wallet purchases)
    if (customer && customer.sponsorId && dto.paymentMethod !== 'WALLET' && billAmount > 0) {
      try {
        const sponsor = await this.userModel.findById(customer.sponsorId);
        if (sponsor) {
          const teamIncome = Number(((billAmount * 0.4) / 100).toFixed(2));
          if (teamIncome > 0) {
            await this.incomeTxModel.create({
              userId: sponsor._id,
              type: 'TEAM_PURCHASE',
              amount: teamIncome,
              sourceUserId: customer._id,
              sourceVerificationStatus: customer.verificationStatus,
              earnedAt: new Date(),
              availableFrom: new Date(),
              isUsable: true,
              status: 'AVAILABLE',
              description: `0.4% Team Purchase Income from ${customer.fullNameAsPerAadhaar || customer.name || 'Team member'} at ${vendor.storeName}`,
            });
            sponsor.availableIncome = Number(((sponsor.availableIncome || 0) + teamIncome).toFixed(2));
            sponsor.walletBalance = Number(((sponsor.walletBalance || 0) + teamIncome).toFixed(2));
            await sponsor.save();
            if (this.trackingGateway) {
              this.trackingGateway.emitWalletUpdated(sponsor._id.toString(), {
                availableIncome: sponsor.availableIncome,
                pendingIncome: sponsor.pendingIncome,
                walletBalance: sponsor.walletBalance,
              });
            }
          }
        }
      } catch (teamErr) {
        console.warn('Team purchase income distribution error:', teamErr);
      }
    }

    const vendorPayout = billAmount - platformCommission;

    const orderNumber = `#WML-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await this.transactionModel.create({
      vendorId: vendor._id,
      vendorName: vendor.storeName,
      customerId: customer?._id,
      customerPhone: dto.customerPhone || customer?.phone,
      orderNumber,
      billAmount,
      paymentMethod: dto.paymentMethod,
      coinsUsed,
      cashPaid,
      coinsEarned,
      platformCommission,
      vendorPayout,
      status: 'SUCCESS',
      qrScanned: true,
      verifiedAt: new Date(),
    });

    // Update vendor metrics
    vendor.totalTransactions = (vendor.totalTransactions || 0) + 1;
    vendor.monthlyRevenue = (vendor.monthlyRevenue || 0) + billAmount;
    await vendor.save();

    return {
      success: true,
      message: 'Payment verified and transaction recorded successfully',
      transaction: {
        id: transaction._id.toString(),
        orderNumber: transaction.orderNumber,
        vendorId: vendor._id.toString(),
        vendorName: vendor.storeName,
        billAmount,
        paymentMethod: dto.paymentMethod,
        coinsUsed,
        cashPaid,
        coinsEarned,
        status: transaction.status,
        date: 'Just now',
      },
      coinsEarned,
      coinsUsed,
      cashPaid,
      customerNewCoinBalance: customer?.shoppingCoins,
    };
  }

  // ── Admin APIs ─────────────────────────────────────────────────────────────
  async adminGetVendors(city?: string, category?: string) {
    const filter: any = {};
    if (city && city !== 'All') filter.city = city;
    if (category && category !== 'All') filter.categoryName = category;

    return this.vendorModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async adminGetVendorById(id: string) {
    const vendor = await this.vendorModel.findById(id).lean();
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async adminCreateVendor(dto: CreateVendorDto) {
    const code = (dto.vendorCode || `VND${Date.now().toString().slice(-4)}`).toUpperCase();

    const existing = await this.vendorModel.findOne({ vendorCode: code });
    if (existing) {
      throw new BadRequestException(`Vendor code ${code} already in use`);
    }

    const coordinates: [number, number] = [
      dto.longitude ?? 72.5507,
      dto.latitude ?? 23.1288,
    ];

    const vendor = await this.vendorModel.create({
      ...dto,
      vendorCode: code,
      categoryName: dto.categoryName || 'General',
      city: dto.city || 'Ahmedabad',
      pincode: dto.pincode || '380015',
      coordinates: { type: 'Point', coordinates },
      shoppingCoinPercent: dto.shoppingCoinPercent || 10,
      platformCommissionPercent: dto.platformCommissionPercent || 2,
      isActive: false,
      isVerified: false,
      vendorStatus: 1, // Pending Admin Approval
    });

    return vendor;
  }

  async adminUpdateVendor(id: string, dto: UpdateVendorDto) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      vendor.coordinates = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    if (dto.shoppingCoinPercent !== undefined) {
      vendor.shoppingCoinPercent = dto.shoppingCoinPercent;
    }

    Object.assign(vendor, dto);
    await vendor.save();
    return vendor;
  }

  async adminDeleteVendor(id: string) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.isActive = false;
    await vendor.save();
    return { success: true, message: 'Vendor soft deleted' };
  }

  async adminVerifyKyc(
    id: string,
    options?: {
      shoppingCoinPercent?: number;
      platformCommissionPercent?: number;
      adminId?: string;
    },
  ) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.isVerified = true;
    vendor.isActive = true;
    vendor.vendorStatus = 2; // Active
    vendor.vendorRejectReason = '';
    vendor.vendorJoiningDate = new Date();
    vendor.approvedAt = new Date();
    if (options?.adminId) vendor.approvedBy = options.adminId;

    if (options?.shoppingCoinPercent !== undefined && options.shoppingCoinPercent > 0) {
      vendor.shoppingCoinPercent = options.shoppingCoinPercent;
      vendor.vendorCustomerPersantage = options.shoppingCoinPercent;
    }
    if (options?.platformCommissionPercent !== undefined && options.platformCommissionPercent >= 0) {
      vendor.platformCommissionPercent = options.platformCommissionPercent;
      vendor.vendorPersantage = options.platformCommissionPercent;
    }

    const code = vendor.vendorCode || `VND${vendor._id.toString().slice(-6).toUpperCase()}`;
    vendor.vendorCode = code;
    vendor.vendorQrLink = `womup://vendor/${code}`;
    vendor.vendorQrImageLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=womup://vendor/${code}`;
    await vendor.save();

    if (this.trackingGateway) {
      this.trackingGateway.emitVendorStatusChanged?.(vendor._id.toString(), {
        vendorStatus: 2,
        isVerified: true,
        isActive: true,
        qrLink: vendor.vendorQrLink,
        shoppingCoinPercent: vendor.shoppingCoinPercent,
      });
      this.trackingGateway.emitVendorApproved?.(vendor._id.toString(), {
        vendorId: vendor._id.toString(),
        vendorStatus: 2,
        storeName: vendor.storeName,
        qrLink: vendor.vendorQrLink,
      });
    }

    return {
      success: true,
      message: 'Vendor KYC approved and status set to Active',
      data: vendor,
      vendorStatus: 2,
    };
  }

  async adminRejectKyc(id: string, reason?: string, adminId?: string) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    const rejectReason = reason || 'Documentation incomplete';
    vendor.isVerified = false;
    vendor.isActive = false;
    vendor.vendorStatus = 3; // Reject
    vendor.vendorRejectReason = rejectReason;
    vendor.rejectedAt = new Date();
    if (adminId) vendor.rejectedBy = adminId;
    await vendor.save();

    if (this.trackingGateway) {
      this.trackingGateway.emitVendorStatusChanged?.(vendor._id.toString(), {
        vendorStatus: 3,
        isVerified: false,
        isActive: false,
        rejectReason,
      });
      this.trackingGateway.emitKycRejected?.('vendor', vendor._id.toString(), {
        vendorStatus: 3,
        reason: rejectReason,
      });
    }

    return {
      success: true,
      message: `Vendor KYC rejected: ${rejectReason}`,
      data: vendor,
      vendorStatus: 3,
    };
  }

  async adminGetPendingVendors(filter?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const query: any = {
      isDeleted: { $ne: true },
      $or: [
        { vendorStatus: 1 },
        { vendor_status: 1 },
        { isVerified: false },
      ],
    };

    if (filter?.search) {
      query.$and = [
        {
          $or: [
            { storeName: { $regex: filter.search, $options: 'i' } },
            { vendorFirmName: { $regex: filter.search, $options: 'i' } },
            { vendorOwnerName: { $regex: filter.search, $options: 'i' } },
            { ownerPhone: { $regex: filter.search, $options: 'i' } },
            { vendorCode: { $regex: filter.search, $options: 'i' } },
          ],
        },
      ];
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.vendorModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.vendorModel.countDocuments(query),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetVendorKycReview(id: string): Promise<any> {
    const vendor = (await this.vendorModel.findById(id).lean()) as any;
    if (!vendor) throw new NotFoundException('Vendor not found');

    const docFields = [
      vendor.vendor_aadhar_front_image || vendor.aadharFrontImage,
      vendor.vendor_aadhar_back_image || vendor.aadharBackImage,
      vendor.pan_card_image || vendor.panCardImage,
      vendor.gst_certificate_image || vendor.gstCertificateImage,
      vendor.trade_license_image || vendor.tradeLicenseImage,
      vendor.cancelled_cheque_image || vendor.cancelledChequeImage,
      vendor.business_card_image || vendor.businessCardImage,
      vendor.shop_photo_image || vendor.shopPhotoImage,
      vendor.owner_photo_image || vendor.ownerPhotoImage,
    ];
    const uploadedDocsCount = docFields.filter(Boolean).length;

    return {
      success: true,
      data: {
        ...vendor,
        uploadedDocsCount,
        totalDocsCount: 9,
      },
    };
  }

  async adminBlockVendor(id: string, isBlocked: number, reason?: string) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.isBlocked = isBlocked;
    if (reason) vendor.blockReason = reason;
    await vendor.save();
    return { success: true, message: `Vendor ${isBlocked ? 'Blocked' : 'Unblocked'} successfully`, isBlocked };
  }

  async adminSuspendVendor(id: string, isSuspended: number) {
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.isSuspended = isSuspended;
    await vendor.save();
    return { success: true, message: `Vendor ${isSuspended ? 'Suspended' : 'Unsuspended'} successfully`, isSuspended };
  }

  async adminUpdateCoinRate(id: string, coinRate: number) {
    if (coinRate < 2 || coinRate > 25) {
      throw new BadRequestException('Shopping Coin % must be between 2% and 25%');
    }
    const vendor = await this.vendorModel.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.shoppingCoinPercent = coinRate;
    await vendor.save();
    return {
      success: true,
      message: `Updated shopping coin rate to ${coinRate}% for ${vendor.storeName}`,
      data: vendor,
    };
  }

  async adminGetVendorsAnalytics() {
    const [total, active, kycPending, revenueAgg] = await Promise.all([
      this.vendorModel.countDocuments(),
      this.vendorModel.countDocuments({ isActive: true }),
      this.vendorModel.countDocuments({ isVerified: false }),
      this.vendorModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalRevenue: { $sum: '$monthlyRevenue' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg?.[0]?.totalRevenue || 0;

    return {
      totalVendors: total,
      activeVendors: active,
      kycPending,
      monthlyRevenue: totalRevenue,
    };
  }

  async adminGetVendorQR(id: string) {
    const vendor = await this.vendorModel.findById(id).lean();
    if (!vendor) throw new NotFoundException('Vendor not found');
    const qrData = `womup://vendor/${vendor.vendorCode}`;
    return {
      vendorCode: vendor.vendorCode,
      storeName: vendor.storeName,
      shoppingCoinPercent: vendor.shoppingCoinPercent,
      qrData,
      upiId: vendor.upiId || 'womup@okhdfcbank',
      label: `WOMUP-PAY-${vendor.vendorCode}`,
    };
  }

  async adminCreateCategory(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-');
    return this.categoryModel.create({ ...dto, slug });
  }

  async adminUpdateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async adminDeleteCategory(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }

  // ── Vendor App APIs ────────────────────────────────────────────────────────
  async getVendorByCode(code: string) {
    const vendor = await this.vendorModel.findOne({
      vendorCode: code.toUpperCase(),
      isActive: true,
    }).lean();

    if (!vendor) {
      throw new NotFoundException(`Vendor with code ${code} not found`);
    }

    return {
      id: vendor._id.toString(),
      _id: vendor._id.toString(),
      vendorCode: vendor.vendorCode,
      storeName: vendor.storeName,
      ownerName: vendor.ownerName,
      ownerPhone: vendor.ownerPhone,
      categoryName: vendor.categoryName,
      address: vendor.address,
      city: vendor.city,
      pincode: vendor.pincode,
      shoppingCoinPercent: vendor.shoppingCoinPercent,
      platformCommissionPercent: vendor.platformCommissionPercent || 2,
      openingTime: vendor.openingTime || '8:00 AM',
      closingTime: vendor.closingTime || '9:00 PM',
      isOpenNow: vendor.isOpenNow ?? true,
      rating: vendor.rating || 4.8,
      totalReviews: vendor.totalReviews || 0,
      totalTransactions: vendor.totalTransactions || 0,
      monthlyRevenue: vendor.monthlyRevenue || 0,
      upiId: vendor.upiId || 'womup@okhdfcbank',
      qrCodeData: `womup://vendor/${vendor.vendorCode}`,
      walletBalance: vendor.walletBalance || 0,
      pendingBalance: vendor.pendingBalance || 0,
      isVerified: vendor.isVerified,
      isActive: vendor.isActive,
      bankAccount: vendor.bankAccount,
    };
  }

  private otpStore = new Map<string, { mobile: string; otp: string; purpose?: string; expiresAt: number }>();

  private buildPhoneRegex(phone: string): RegExp {
    const raw = phone.replace(/\D/g, '').slice(-10);
    const pattern = raw.split('').join('[\\s-]*');
    return new RegExp(pattern, 'i');
  }

  // ── Vendor Merchant Auth & Registration (tbl_vendor Alignment) ───────────────

  async vendorSendOtp(dto: SendVendorOtpDto) {
    const rawMobile = dto.mobile.replace(/\D/g, '').slice(-10);
    if (!rawMobile || rawMobile.length !== 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const fullMobile = `+91${rawMobile}`;
    const mobileRegex = this.buildPhoneRegex(rawMobile);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpStore.set(verificationId, { mobile: rawMobile, otp, purpose: dto.purpose, expiresAt });
    this.otpStore.set(rawMobile, { mobile: rawMobile, otp, purpose: dto.purpose, expiresAt });

    await this.vendorModel.updateOne(
      { $or: [{ ownerPhone: mobileRegex }, { vendorMobile: mobileRegex }] },
      { $set: { vendorOtp: otp } },
    );

    return {
      success: true,
      data: {
        message: `OTP sent to ${fullMobile}`,
        verificationId,
        expiresIn: 600,
        devOtp: otp,
      },
    };
  }

  async vendorVerifyOtp(dto: VerifyVendorOtpDto) {
    const rawMobile = dto.mobile.replace(/\D/g, '').slice(-10);
    const enteredOtp = dto.otp?.trim();

    if (!enteredOtp) {
      throw new BadRequestException('OTP is required');
    }

    const cached = (dto.verificationId ? this.otpStore.get(dto.verificationId) : null) || this.otpStore.get(rawMobile);
    if (!cached || cached.expiresAt < Date.now()) {
      const vendor = await this.vendorModel.findOne({
        $or: [{ ownerPhone: new RegExp(rawMobile, 'i') }, { vendorMobile: new RegExp(rawMobile, 'i') }],
      });
      if (vendor && vendor.vendorOtp === enteredOtp) {
        return { success: true, verified: true, verificationId: dto.verificationId || crypto.randomUUID() };
      }
      throw new BadRequestException('OTP has expired or is invalid. Please request a new one.');
    }

    if (cached.otp !== enteredOtp) {
      throw new BadRequestException('Incorrect OTP. Please enter the valid 6-digit code.');
    }

    return { success: true, verified: true, verificationId: dto.verificationId || crypto.randomUUID() };
  }

  async vendorRegister(dto: RegisterVendorDto) {
    const rawMobile = dto.mobile.replace(/\D/g, '').slice(-10);
    if (!rawMobile || rawMobile.length !== 10) {
      throw new BadRequestException('Valid 10-digit mobile number is required');
    }

    const existing = await this.vendorModel.findOne({
      $or: [
        { ownerPhone: new RegExp(rawMobile, 'i') },
        { vendorMobile: new RegExp(rawMobile, 'i') },
        ...(dto.email ? [{ vendorEmail: dto.email.toLowerCase() }] : []),
      ],
    });

    if (existing && existing.vendorStatus === 2) {
      throw new BadRequestException('A registered and approved vendor already exists with this mobile or email.');
    }

    let vendorCode = '';
    const lastVendor = await this.vendorModel.findOne({ vendorCode: /^VND\d+$/i }).sort({ vendorCode: -1 });
    if (lastVendor && lastVendor.vendorCode) {
      const match = lastVendor.vendorCode.match(/VND(\d+)/i);
      const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
      vendorCode = `VND${nextNum.toString().padStart(3, '0')}`;
    } else {
      const count = await this.vendorModel.countDocuments();
      vendorCode = `VND${(count + 1).toString().padStart(3, '0')}`;
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : '';

    const coordinates: [number, number] = [
      dto.longitude ?? 72.5507,
      dto.latitude ?? 23.1288,
    ];

    const categoryName = dto.businessCategoryName || dto.businessType || 'General';

    let vendor: VendorDocument;
    if (existing && (existing.vendorStatus === 1 || existing.vendorStatus === 3)) {
      vendor = existing;
      vendorCode = vendor.vendorCode || vendorCode;
    } else {
      vendor = new this.vendorModel();
      vendor.vendorCode = vendorCode;
    }

    vendor.storeName = dto.firmName;
    vendor.vendorFirmName = dto.firmName;
    vendor.ownerName = dto.ownerName;
    vendor.vendorOwnerName = dto.ownerName;
    vendor.ownerPhone = `+91 ${rawMobile}`;
    vendor.vendorMobile = `+91 ${rawMobile}`;
    vendor.vendorAlternateMobile = dto.alternateMobile || '';
    vendor.vendorEmail = dto.email.toLowerCase();
    vendor.businessType = dto.businessType;
    vendor.categoryName = categoryName;
    if (dto.businessCategoryId && Types.ObjectId.isValid(dto.businessCategoryId)) {
      vendor.categoryId = new Types.ObjectId(dto.businessCategoryId);
      vendor.businessCategoryId = dto.businessCategoryId;
    }

    vendor.address = dto.address;
    vendor.businessAddress = dto.address;
    vendor.businessLandmark = dto.landmark || '';
    vendor.countryId = dto.countryId || 'IN';
    vendor.stateId = dto.stateId || 'GJ';
    vendor.districtId = dto.districtId || 'Ahmedabad';
    vendor.talukaId = dto.talukaId || 'Daskroi';
    vendor.city = dto.cityName || dto.city || 'Ahmedabad';
    vendor.pincode = dto.pincode;
    vendor.businessPincode = dto.pincode;
    vendor.latitude = dto.latitude ?? 23.1288;
    vendor.longitude = dto.longitude ?? 72.5507;
    vendor.vendorLat = dto.latitude ?? 23.1288;
    vendor.vendorLong = dto.longitude ?? 72.5507;
    vendor.coordinates = { type: 'Point', coordinates };
    vendor.location = { type: 'Point', coordinates };

    vendor.vendorAadharNo = dto.aadhaarNumber;
    vendor.vendorAadharFrontImage = dto.aadhaarFrontUrl;
    vendor.vendorAadharBackImage = dto.aadhaarBackUrl;
    vendor.vendorGstNo = dto.gstNumber || '';
    vendor.gstCertificateImage = dto.gstCertificateUrl || '';
    vendor.panCardImage = dto.panCardUrl;
    vendor.tradeLicenseImage = dto.tradeLicenseUrl;
    vendor.cancelledChequeImage = dto.cancelledChequeUrl;
    vendor.businessCardImage = dto.businessCardUrl || '';
    vendor.shopPhotoImage = dto.shopPhotoUrl;
    vendor.ownerPhotoImage = dto.ownerPhotoUrl;
    vendor.imageUrl = dto.shopPhotoUrl || vendor.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';

    vendor.bankName = dto.bankName;
    vendor.bankBranch = dto.bankBranch;
    vendor.accountHolderName = dto.accountHolderName;
    vendor.accountNumber = dto.accountNumber;
    vendor.ifscCode = dto.ifscCode;
    vendor.upiId = dto.upiId || '';
    vendor.bankAccount = {
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      ifscCode: dto.ifscCode,
    };

    if (passwordHash) {
      vendor.vendorPassword = passwordHash;
      vendor.passwordHash = passwordHash;
    }

    vendor.vendorStatus = 1; // PENDING
    vendor.isVerified = false;
    vendor.isActive = true;
    vendor.vendorRejectReason = '';
    vendor.vendorJoiningDate = new Date();
    vendor.vendorQrLink = `womup://vendor/${vendorCode}`;
    vendor.vendorQrImageLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=womup://vendor/${vendorCode}`;

    await vendor.save();

    const profile = await this.vendorLogin(vendor.vendorCode);

    return {
      success: true,
      data: {
        vendorId: vendor._id.toString(),
        vendorCode: vendor.vendorCode,
        status: 1,
        message: 'Registration submitted. Awaiting admin approval.',
        accessToken: `v_jwt_${vendor._id.toString()}`,
        refreshToken: `v_refresh_${vendor._id.toString()}`,
        vendor: profile,
      },
    };
  }

  async vendorLogin(loginId: string, _pass?: string) {
    const cleanId = (loginId || '').trim();
    const rawDigits = cleanId.replace(/\D/g, '');
    const mobileRegex = rawDigits.length >= 10 ? this.buildPhoneRegex(rawDigits) : null;

    let vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: cleanId.toUpperCase() },
        ...(mobileRegex ? [{ ownerPhone: mobileRegex }, { vendorMobile: mobileRegex }] : []),
        { storeName: new RegExp(cleanId, 'i') },
      ],
    });

    if (!vendor && (cleanId === 'VND001' || !cleanId)) {
      vendor = (await this.vendorModel.findOne({ vendorCode: 'VND001' })) || (await this.vendorModel.findOne());
    }

    if (!vendor) {
      throw new NotFoundException('Vendor credentials invalid. Please check your mobile or store ID.');
    }

    // If password provided, verify (bypass master/demo passwords)
    if (_pass && _pass !== 'admin123' && _pass !== '123456' && _pass !== 'password') {
      const storedHash = vendor.vendorPassword || vendor.passwordHash;
      if (storedHash) {
        if (storedHash.startsWith('$2')) {
          const match = await bcrypt.compare(_pass, storedHash);
          if (!match) throw new BadRequestException('Incorrect password. Please try again.');
        } else if (storedHash !== _pass) {
          throw new BadRequestException('Incorrect password. Please try again.');
        }
      }
    }

    const pendingSum = await this.collectionRequestModel.aggregate([
      { $match: { vendorId: vendor._id, status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$vendorPayout' } } },
    ]);
    const pendingBalance = pendingSum[0]?.total || 0;

    return {
      id: vendor._id.toString(),
      _id: vendor._id.toString(),
      vendorCode: vendor.vendorCode,
      storeName: vendor.storeName,
      ownerName: vendor.ownerName,
      ownerPhone: vendor.ownerPhone,
      categoryName: vendor.categoryName,
      address: vendor.address,
      city: vendor.city,
      pincode: vendor.pincode,
      shoppingCoinPercent: vendor.shoppingCoinPercent,
      platformCommissionPercent: vendor.platformCommissionPercent || 2,
      openingTime: vendor.openingTime || '8:00 AM',
      closingTime: vendor.closingTime || '9:00 PM',
      isOpenNow: vendor.isOpenNow ?? true,
      rating: vendor.rating || 4.8,
      totalReviews: vendor.totalReviews || 0,
      totalTransactions: vendor.totalTransactions || 0,
      monthlyRevenue: vendor.monthlyRevenue || 0,
      upiId: vendor.upiId || 'gokul@okhdfcbank',
      qrCodeData: `womup://vendor/${vendor.vendorCode}`,
      walletBalance: vendor.walletBalance || 0,
      pendingBalance,
      isVerified: vendor.isVerified,
      isActive: vendor.isActive,
      vendorStatus: vendor.vendorStatus ?? (vendor.isVerified ? 2 : 1),
      vendorRejectReason: vendor.vendorRejectReason || '',
      isBlocked: vendor.isBlocked ?? 0,
      isSuspended: vendor.isSuspended ?? 0,
      blockReason: vendor.blockReason || '',
      vendorFirmName: vendor.vendorFirmName || vendor.storeName,
      vendorOwnerName: vendor.vendorOwnerName || vendor.ownerName,
      vendorBalance: vendor.vendorBalance ?? vendor.walletBalance ?? 0,
      vendorAdminBalance: vendor.vendorAdminBalance ?? pendingBalance,
      vendorPayableToAdmin: vendor.vendorPayableToAdmin ?? 0,
      cancelledChequeImage: vendor.cancelledChequeImage || '',
      vendorAadharFrontImage: vendor.vendorAadharFrontImage || vendor.kycDocuments?.aadhaarUrl || '',
      vendorAadharBackImage: vendor.vendorAadharBackImage || '',
      gstCertificateImage: vendor.gstCertificateImage || vendor.kycDocuments?.gstUrl || '',
      tradeLicenseImage: vendor.tradeLicenseImage || vendor.kycDocuments?.shopLicenseUrl || '',
      panCardImage: vendor.panCardImage || vendor.kycDocuments?.panUrl || '',
      businessCardImage: vendor.businessCardImage || '',
      shopPhotoImage: vendor.shopPhotoImage || vendor.imageUrl || '',
      ownerPhotoImage: vendor.ownerPhotoImage || '',
      talukaId: vendor.talukaId || '',
      districtId: vendor.districtId || '',
      stateId: vendor.stateId || '',
      countryId: vendor.countryId || 'IN',
      businessPincode: vendor.businessPincode || vendor.pincode,
      bankName: vendor.bankName || vendor.bankAccount?.bankName || 'HDFC Bank',
      bankBranch: vendor.bankBranch || '',
      accountHolderName: vendor.accountHolderName || vendor.ownerName,
      accountNumber: vendor.accountNumber || vendor.bankAccount?.accountNumber || 'XXXX9182',
      ifscCode: vendor.ifscCode || vendor.bankAccount?.ifscCode || 'HDFC0000123',
      bankAccount: vendor.bankAccount || {
        bankName: 'HDFC Bank',
        accountNumber: 'XXXX9182',
        ifscCode: 'HDFC0000123',
      },
    };
  }

  async vendorLoginWithOtp(mobile: string, otp: string) {
    const rawMobile = mobile.replace(/\D/g, '').slice(-10);
    await this.vendorVerifyOtp({ mobile: rawMobile, otp });
    const mobileRegex = this.buildPhoneRegex(rawMobile);

    const vendor = await this.vendorModel.findOne({
      $or: [
        { ownerPhone: mobileRegex },
        { vendorMobile: mobileRegex },
      ],
    });

    if (!vendor) {
      throw new NotFoundException(`No vendor account found with mobile number ${mobile}. Please register your store.`);
    }

    return this.vendorLogin(vendor.vendorCode);
  }

  async vendorForgotPassword(mobile: string) {
    return this.vendorSendOtp({ mobile, purpose: 'FORGOT_PASSWORD' });
  }

  async vendorResetPassword(dto: VendorResetPasswordDto) {
    await this.vendorVerifyOtp({ mobile: dto.mobile, otp: dto.otp });
    const rawMobile = dto.mobile.replace(/\D/g, '').slice(-10);
    const mobileRegex = this.buildPhoneRegex(rawMobile);

    const vendor = await this.vendorModel.findOne({
      $or: [
        { ownerPhone: mobileRegex },
        { vendorMobile: mobileRegex },
      ],
    });

    if (!vendor) {
      throw new NotFoundException(`No vendor account found with mobile ${dto.mobile}`);
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);
    vendor.vendorPassword = hash;
    vendor.passwordHash = hash;
    await vendor.save();

    return { success: true, message: 'Password reset successfully. You can now login.' };
  }

  async vendorGetStatus(identifier: string) {
    const rawDigits = identifier.replace(/\D/g, '');
    const mobileRegex = rawDigits.length >= 10 ? this.buildPhoneRegex(rawDigits) : null;

    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: identifier.toUpperCase() },
        ...(mobileRegex ? [{ ownerPhone: mobileRegex }, { vendorMobile: mobileRegex }] : []),
        ...(Types.ObjectId.isValid(identifier) ? [{ _id: new Types.ObjectId(identifier) }] : []),
      ],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      success: true,
      data: {
        vendorId: vendor._id.toString(),
        vendorCode: vendor.vendorCode,
        storeName: vendor.storeName,
        ownerName: vendor.ownerName,
        vendorStatus: vendor.vendorStatus ?? (vendor.isVerified ? 2 : 1),
        isVerified: vendor.isVerified,
        isActive: vendor.isActive,
        isBlocked: vendor.isBlocked ?? 0,
        isSuspended: vendor.isSuspended ?? 0,
        rejectReason: vendor.vendorRejectReason || '',
        approvedAt: vendor.approvedAt,
        joiningDate: vendor.vendorJoiningDate,
        qrCodeUrl: vendor.vendorQrImageLink || vendor.qrCodeUrl,
      },
    };
  }

  async createCollectionRequest(dto: CreateCollectionRequestDto) {
    let vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: dto.vendorCode.toUpperCase() },
        ...(dto.vendorId && Types.ObjectId.isValid(dto.vendorId) ? [{ _id: new Types.ObjectId(dto.vendorId) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with code ${dto.vendorCode} not found`);
    }

    const billAmount = Number(dto.billAmount);
    if (!billAmount || billAmount <= 0) {
      throw new BadRequestException('Invalid bill amount');
    }

    const platformCommissionPercent = vendor.platformCommissionPercent || 2;
    const platformCommission = Math.round((billAmount * platformCommissionPercent) / 100);
    const vendorPayout = billAmount - platformCommission;

    const benefitRate = vendor.shoppingCoinPercent || 10;
    const coinBenefit = Math.round((billAmount * benefitRate) / 100);
    const payableAmount = Math.max(0, billAmount - coinBenefit);

    let coinsUsed = 0;
    let walletUsed = 0;
    let cashToCollect = 0;
    let upiAmount = 0;
    let coinsEarned = 0;

    const method = dto.paymentMethod ? dto.paymentMethod.toUpperCase() : 'COIN';

    // 1. Shopping Coins: Admin % applies (max coinBenefit), customer uses min(coinBenefit, available coins)
    if (method === 'COIN' || method === 'COINS') {
      const requestedCoins = dto.coinsUsed !== undefined ? Number(dto.coinsUsed) : coinBenefit;
      coinsUsed = Math.min(coinBenefit, Math.max(0, requestedCoins));
      cashToCollect = Math.max(0, billAmount - coinsUsed);
      walletUsed = 0;
      upiAmount = 0;
      coinsEarned = 0;
    }
    // 2. Income Wallet: Full 100% (₹1,000) from Income Wallet, 0 coins, 0 cash
    else if (method === 'WALLET') {
      walletUsed = billAmount;
      cashToCollect = 0;
      coinsUsed = 0;
      upiAmount = 0;
      coinsEarned = 0;
    }
    // 3. Counter UPI: Full 100% (₹1,000) via digital UPI gateway, zero cash
    else if (method === 'UPI') {
      upiAmount = billAmount;
      cashToCollect = 0;
      coinsUsed = 0;
      walletUsed = 0;
      coinsEarned = Math.floor((billAmount * (vendor.shoppingCoinPercent || 10)) / 100);
    }
    // 4. Cash at Store: Customer gives full 100% (₹1,000) physical cash to vendor
    else {
      cashToCollect = billAmount;
      coinsUsed = 0;
      walletUsed = 0;
      upiAmount = 0;
      coinsEarned = Math.floor((billAmount * (vendor.shoppingCoinPercent || 10)) / 100);
    }

    let customerIdObj: Types.ObjectId | undefined;
    if (dto.customerId && Types.ObjectId.isValid(dto.customerId)) {
      customerIdObj = new Types.ObjectId(dto.customerId);
    }

    const newRequest = await this.collectionRequestModel.create({
      vendorId: vendor._id,
      vendorCode: vendor.vendorCode,
      customerId: customerIdObj,
      customerName: dto.customerName || 'Local Shopper',
      customerPhone: dto.customerPhone || '',
      billAmount,
      coinsUsed,
      walletUsed,
      cashToCollect,
      upiAmount,
      coinsEarned,
      platformCommission,
      vendorPayout,
      paymentMethod: method === 'COIN' ? 'COINS' : method,
      status: 'PENDING',
      requestedAt: new Date(),
    });

    vendor.pendingBalance = (vendor.pendingBalance || 0) + vendorPayout;
    await vendor.save();

    const wsPayload = {
      id: newRequest._id.toString(),
      requestId: newRequest._id.toString(),
      vendorId: vendor.vendorCode,
      vendorCode: vendor.vendorCode,
      customerName: newRequest.customerName,
      customerPhone: newRequest.customerPhone,
      billAmount: newRequest.billAmount,
      coinsUsed: newRequest.coinsUsed,
      walletUsed: newRequest.walletUsed,
      cashToCollect: newRequest.cashToCollect,
      upiAmount: newRequest.upiAmount,
      coinsEarned: newRequest.coinsEarned,
      platformCommission: newRequest.platformCommission,
      vendorPayout: newRequest.vendorPayout,
      paymentMethod: newRequest.paymentMethod,
      status: 'PENDING',
      requestedAt: 'Just now',
    };

    if (this.trackingGateway) {
      this.trackingGateway.emitCollectionRequestToVendor(vendor._id.toString(), wsPayload);
      this.trackingGateway.emitCollectionRequestToVendor(vendor.vendorCode, wsPayload);
    }

    return wsPayload;
  }

  async vendorGetPendingRequests(vendorCodeOrId?: string) {
    let filter: any = { status: 'PENDING' };
    if (vendorCodeOrId) {
      if (Types.ObjectId.isValid(vendorCodeOrId)) {
        filter.$or = [
          { vendorId: new Types.ObjectId(vendorCodeOrId) },
          { vendorCode: vendorCodeOrId.toUpperCase() },
        ];
      } else {
        filter.vendorCode = vendorCodeOrId.toUpperCase();
      }
    }

    const requests = await this.collectionRequestModel
      .find(filter)
      .sort({ requestedAt: -1 })
      .limit(20)
      .lean();

    return requests.map((r) => ({
      id: r._id.toString(),
      vendorId: r.vendorCode,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      billAmount: r.billAmount,
      coinsUsed: r.coinsUsed,
      walletUsed: r.walletUsed,
      cashToCollect: r.cashToCollect,
      upiAmount: r.upiAmount,
      coinsEarned: r.coinsEarned,
      platformCommission: r.platformCommission,
      vendorPayout: r.vendorPayout,
      paymentMethod: r.paymentMethod,
      status: r.status,
      requestedAt: new Date(r.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  async vendorVerifyRequest(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.collectionRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Collection request not found');
    }

    if (request.status !== 'PENDING') {
      return { success: true, message: `Request is already ${request.status}` };
    }

    request.status = 'VERIFIED';
    request.verifiedAt = new Date();
    await request.save();

    const vendor = await this.vendorModel.findById(request.vendorId);
    if (vendor) {
      vendor.walletBalance = (vendor.walletBalance || 0) + request.vendorPayout;
      vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - request.vendorPayout);
      vendor.totalEarned = (vendor.totalEarned || 0) + request.vendorPayout;
      vendor.totalTransactions = (vendor.totalTransactions || 0) + 1;
      vendor.monthlyRevenue = (vendor.monthlyRevenue || 0) + request.billAmount;
      await vendor.save();
    }

    let customerNewCoins: number | undefined;
    if (request.customerId) {
      const customer = await this.userModel.findById(request.customerId);
      if (customer) {
        if (request.coinsUsed > 0) {
          customer.shoppingCoins = Math.max(0, (customer.shoppingCoins || 0) - request.coinsUsed);
        }
        if (request.walletUsed > 0) {
          customer.appDownloadIncome = Math.max(0, (customer.appDownloadIncome || 0) - request.walletUsed);
          customer.availableIncome = Math.max(0, (customer.availableIncome || 0) - request.walletUsed);
          customer.walletBalance = Math.max(0, (customer.walletBalance || 0) - request.walletUsed);
        }
        if (request.coinsEarned > 0) {
          customer.shoppingCoins = (customer.shoppingCoins || 0) + request.coinsEarned;
        }

        // Record Monthly GMV Activity (only on real purchases, NOT wallet balance spend)
        if (request.paymentMethod !== 'WALLET' && request.billAmount > 0) {
          const isVeg = (vendor?.categoryName || '').toLowerCase().includes('veg');
          customer.monthlyPurchaseValue = Number(((customer.monthlyPurchaseValue || 0) + request.billAmount).toFixed(2));
          if (isVeg) {
            customer.monthlyVegetablePurchase = Number(((customer.monthlyVegetablePurchase || 0) + request.billAmount).toFixed(2));
          } else {
            customer.monthlyOtherPurchase = Number(((customer.monthlyOtherPurchase || 0) + request.billAmount).toFixed(2));
          }
          if (customer.monthlyPurchaseValue >= 2000) {
            customer.isActiveMember = true;
          }
        }

        await customer.save();
        customerNewCoins = customer.shoppingCoins;

        if (this.trackingGateway) {
          this.trackingGateway.emitWalletUpdated(customer._id.toString(), {
            shoppingCoins: customer.shoppingCoins,
            availableIncome: customer.availableIncome,
            appDownloadIncome: customer.appDownloadIncome,
            monthlyPurchaseValue: customer.monthlyPurchaseValue,
            isActiveMember: customer.isActiveMember,
          });
        }

        // Team Purchase Income (0.4% on eligible non-wallet purchases per notebook spec)
        if (customer.sponsorId && request.paymentMethod !== 'WALLET' && request.billAmount > 0) {
          try {
            const sponsor = await this.userModel.findById(customer.sponsorId);
            if (sponsor) {
              const teamIncome = Number(((request.billAmount * 0.4) / 100).toFixed(2));
              if (teamIncome > 0) {
                await this.incomeTxModel.create({
                  userId: sponsor._id,
                  type: 'TEAM_PURCHASE',
                  amount: teamIncome,
                  sourceUserId: customer._id,
                  sourceVerificationStatus: customer.verificationStatus,
                  earnedAt: new Date(),
                  availableFrom: new Date(),
                  isUsable: true,
                  status: 'AVAILABLE',
                  description: `0.4% Team Purchase Income from ${customer.fullNameAsPerAadhaar || customer.name || 'Team member'} at ${vendor?.storeName || 'Vendor'}`,
                });
                sponsor.availableIncome = Number(((sponsor.availableIncome || 0) + teamIncome).toFixed(2));
                sponsor.walletBalance = Number(((sponsor.walletBalance || 0) + teamIncome).toFixed(2));
                await sponsor.save();

                if (this.trackingGateway) {
                  this.trackingGateway.emitWalletUpdated(sponsor._id.toString(), {
                    availableIncome: sponsor.availableIncome,
                    pendingIncome: sponsor.pendingIncome,
                    walletBalance: sponsor.walletBalance,
                  });
                }
              }
            }
          } catch (teamErr) {
            console.warn('Team purchase income distribution error in vendorVerifyRequest:', teamErr);
          }
        }
      }
    }

    const orderNumber = `WM-TXN-${request._id.toString().slice(-4).toUpperCase()}`;
    const transaction = await this.transactionModel.create({
      vendorId: request.vendorId,
      vendorName: vendor?.storeName || 'Vendor Store',
      customerId: request.customerId,
      customerPhone: request.customerPhone,
      orderNumber,
      billAmount: request.billAmount,
      paymentMethod: request.paymentMethod,
      coinsUsed: request.coinsUsed,
      cashPaid: request.cashToCollect,
      coinsEarned: request.coinsEarned,
      platformCommission: request.platformCommission,
      vendorPayout: request.vendorPayout,
      status: 'SUCCESS',
      qrScanned: true,
      verifiedAt: new Date(),
    });

    if (this.trackingGateway) {
      this.trackingGateway.emitCollectionVerifiedToCustomer(request.customerId?.toString() || '', {
        requestId: request._id.toString(),
        orderNumber,
        vendorName: vendor?.storeName || 'Merchant',
        billAmount: request.billAmount,
        coinsUsed: request.coinsUsed,
        cashPaid: request.cashToCollect,
        coinsEarned: request.coinsEarned,
        newCoinBalance: customerNewCoins,
        vendorPayout: request.vendorPayout,
        status: 'VERIFIED',
      });
    }

    return {
      success: true,
      message: 'Collection verified and credited to vendor wallet!',
      data: {
        requestId: request._id.toString(),
        transactionId: transaction._id.toString(),
        orderNumber,
        vendorPayout: request.vendorPayout,
        newWalletBalance: vendor?.walletBalance || 0,
        customerNewCoins,
      },
    };
  }

  async vendorRejectRequest(id: string, reason?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.collectionRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Collection request not found');
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Merchant declined';
    await request.save();

    const vendor = await this.vendorModel.findById(request.vendorId);
    if (vendor) {
      vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - request.vendorPayout);
      await vendor.save();
    }

    if (this.trackingGateway) {
      this.trackingGateway.emitCollectionRejectedToCustomer(request.customerId?.toString() || '', {
        requestId: request._id.toString(),
        reason: request.rejectionReason,
        status: 'REJECTED',
      });
    }

    return {
      success: true,
      message: `Collection request ${id} rejected.`,
    };
  }

  async getCollectionRequestById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid request ID');
    }
    const request = await this.collectionRequestModel.findById(id).lean();
    if (!request) {
      throw new NotFoundException('Collection request not found');
    }
    const vendor = await this.vendorModel.findById(request.vendorId).lean();
    let newCoinBalance: number | undefined;
    if (request.customerId) {
      const customer = await this.userModel.findById(request.customerId).lean();
      newCoinBalance = customer?.shoppingCoins;
    }
    return {
      id: request._id.toString(),
      requestId: request._id.toString(),
      status: request.status,
      vendorName: vendor?.storeName || 'Merchant',
      billAmount: request.billAmount,
      coinsUsed: request.coinsUsed,
      cashToCollect: request.cashToCollect,
      coinsEarned: request.coinsEarned,
      newCoinBalance,
      rejectionReason: (request as any).rejectionReason,
      verifiedAt: request.verifiedAt,
      requestedAt: request.requestedAt,
    };
  }

  async cancelCollectionRequest(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid request ID');
    }
    const request = await this.collectionRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Collection request not found');
    }
    if (request.status !== 'PENDING') {
      return { success: false, message: `Cannot cancel request in ${request.status} status` };
    }
    request.status = 'CANCELLED';
    await request.save();

    const vendor = await this.vendorModel.findById(request.vendorId);
    if (vendor) {
      vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - request.vendorPayout);
      await vendor.save();
    }

    if (this.trackingGateway && vendor) {
      this.trackingGateway.emitCollectionRequestCancelled(vendor._id.toString(), {
        requestId: request._id.toString(),
      });
      this.trackingGateway.emitCollectionRequestCancelled(vendor.vendorCode, {
        requestId: request._id.toString(),
      });
    }

    return { success: true, message: 'Collection request cancelled successfully' };
  }

  async getVendorDashboardStats(vendorIdOrCode: string) {
    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: vendorIdOrCode.toUpperCase() },
        ...(Types.ObjectId.isValid(vendorIdOrCode) ? [{ _id: new Types.ObjectId(vendorIdOrCode) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      return {
        todayCollection: 0,
        todayGrowthPercent: 0,
        orderCount: 0,
        coinsSettled: 0,
        cashCollected: 0,
        pendingCount: 0,
        pendingRequests: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await this.transactionModel.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: today },
          status: 'SUCCESS',
        },
      },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: '$billAmount' },
          orderCount: { $sum: 1 },
          coinsSettled: { $sum: '$coinsUsed' },
          cashCollected: { $sum: '$cashPaid' },
        },
      },
    ]);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStats = await this.transactionModel.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: yesterday, $lt: today },
          status: 'SUCCESS',
        },
      },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: '$billAmount' },
        },
      },
    ]);

    const todayCollection = todayStats[0]?.totalCollection || 0;
    const yesterdayCollection = yesterdayStats[0]?.totalCollection || 0;
    const growthPercent = yesterdayCollection > 0
      ? Number((((todayCollection - yesterdayCollection) / yesterdayCollection) * 100).toFixed(1))
      : 0;

    const pendingRequests = await this.collectionRequestModel
      .find({ vendorId: vendor._id, status: 'PENDING' })
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();

    return {
      todayCollection,
      todayGrowthPercent: growthPercent,
      orderCount: todayStats[0]?.orderCount || 0,
      coinsSettled: todayStats[0]?.coinsSettled || 0,
      cashCollected: todayStats[0]?.cashCollected || 0,
      pendingCount: pendingRequests.length,
      pendingRequests: pendingRequests.map((r) => ({
        id: r._id.toString(),
        vendorId: r.vendorCode,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        billAmount: r.billAmount,
        coinsUsed: r.coinsUsed,
        walletUsed: r.walletUsed,
        cashToCollect: r.cashToCollect,
        upiAmount: r.upiAmount,
        coinsEarned: r.coinsEarned,
        platformCommission: r.platformCommission,
        vendorPayout: r.vendorPayout,
        paymentMethod: r.paymentMethod,
        status: r.status,
        requestedAt: new Date(r.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    };
  }

  async getVendorWallet(vendorIdOrCode: string) {
    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: vendorIdOrCode.toUpperCase() },
        ...(Types.ObjectId.isValid(vendorIdOrCode) ? [{ _id: new Types.ObjectId(vendorIdOrCode) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const pendingSum = await this.collectionRequestModel.aggregate([
      { $match: { vendorId: vendor._id, status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$vendorPayout' }, count: { $sum: 1 } } },
    ]);

    const settlements = await this.settlementModel
      .find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      availableBalance: vendor.walletBalance || 0,
      pendingBalance: pendingSum[0]?.total || 0,
      pendingCount: pendingSum[0]?.count || 0,
      bankAccount: {
        bankName: vendor.bankAccount?.bankName || 'HDFC Bank',
        accountMasked: vendor.bankAccount?.accountNumber ? `****${vendor.bankAccount.accountNumber.slice(-4)}` : '****9182',
        ifsc: vendor.bankAccount?.ifscCode || 'HDFC0000123',
        isPrimary: true,
      },
      recentSettlements: settlements.map((s) => ({
        id: s._id.toString(),
        date: new Date((s as any).createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        amount: s.amount,
        utrNumber: s.utrNumber,
        status: s.status,
      })),
    };
  }

  async vendorWithdrawWallet(vendorIdOrCode: string, dto: WithdrawWalletDto) {
    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: vendorIdOrCode.toUpperCase() },
        ...(Types.ObjectId.isValid(vendorIdOrCode) ? [{ _id: new Types.ObjectId(vendorIdOrCode) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const withdrawAmount = Number(dto.amount);
    if (withdrawAmount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount');
    }

    if ((vendor.walletBalance || 0) < withdrawAmount) {
      throw new BadRequestException(`Insufficient wallet balance. Available: ₹${vendor.walletBalance || 0}`);
    }

    vendor.walletBalance = Math.max(0, (vendor.walletBalance || 0) - withdrawAmount);
    await vendor.save();

    const utrNumber = `UTR${Date.now().toString().slice(-8)}`;
    const settlement = await this.settlementModel.create({
      vendorId: vendor._id,
      amount: withdrawAmount,
      bankName: dto.bankName || vendor.bankAccount?.bankName || 'HDFC Bank',
      accountMasked: dto.accountMasked || (vendor.bankAccount?.accountNumber ? `****${vendor.bankAccount.accountNumber.slice(-4)}` : '****9182'),
      ifsc: dto.ifsc || vendor.bankAccount?.ifscCode || 'HDFC0000123',
      status: 'COMPLETED',
      utrNumber,
      initiatedAt: new Date(),
      completedAt: new Date(),
    });

    return {
      success: true,
      message: `₹${withdrawAmount.toLocaleString()} withdrawn to ${settlement.bankName}. UTR: ${utrNumber}`,
      settlementId: settlement._id.toString(),
      utrNumber,
      newWalletBalance: vendor.walletBalance,
    };
  }

  async getVendorTransactions(vendorIdOrCode: string, filter?: string, search?: string) {
    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: vendorIdOrCode.toUpperCase() },
        ...(Types.ObjectId.isValid(vendorIdOrCode) ? [{ _id: new Types.ObjectId(vendorIdOrCode) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      return [];
    }

    const query: any = { vendorId: vendor._id, status: 'SUCCESS' };

    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (filter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: yesterday, $lt: today };
    }

    if (search) {
      query.$or = [
        { customerPhone: new RegExp(search, 'i') },
        { orderNumber: new RegExp(search, 'i') },
      ];
    }

    const txs = await this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return txs.map((t) => ({
      id: t._id.toString(),
      orderNumber: t.orderNumber || `WM-TXN-${t._id.toString().slice(-4).toUpperCase()}`,
      customerName: t.customerPhone ? `Customer (${t.customerPhone.slice(-4)})` : 'Local Shopper',
      customerPhone: t.customerPhone,
      billAmount: t.billAmount,
      coinsUsed: t.coinsUsed || 0,
      cashPaid: t.cashPaid || 0,
      coinsEarned: t.coinsEarned || 0,
      vendorPayout: t.vendorPayout || t.billAmount,
      platformCommission: t.platformCommission || 0,
      paymentMethod: t.paymentMethod,
      status: t.status,
      date: new Date((t as any).createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      time: new Date((t as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  async getVendorAnalytics(vendorIdOrCode: string) {
    const vendor = await this.vendorModel.findOne({
      $or: [
        { vendorCode: vendorIdOrCode.toUpperCase() },
        ...(Types.ObjectId.isValid(vendorIdOrCode) ? [{ _id: new Types.ObjectId(vendorIdOrCode) }] : []),
      ],
      isActive: true,
    });

    if (!vendor) {
      return {
        monthlyGmv: 0,
        growthPercent: 0,
        orderCount: 0,
        paymentSplit: { coins: 0, cash: 0, wallet: 0, upi: 0 },
        topCustomers: [],
        peakHours: [],
      };
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const currentMonthGmv = await this.transactionModel.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: monthStart },
          status: 'SUCCESS',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$billAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const lastMonthGmv = await this.transactionModel.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          createdAt: { $gte: lastMonthStart, $lt: monthStart },
          status: 'SUCCESS',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$billAmount' },
        },
      },
    ]);

    const currentTotal = currentMonthGmv[0]?.total || 0;
    const lastTotal = lastMonthGmv[0]?.total || 0;
    const growthPercent = lastTotal > 0
      ? Number((((currentTotal - lastTotal) / lastTotal) * 100).toFixed(1))
      : 0;

    const paymentSplitData = await this.transactionModel.aggregate([
      { $match: { vendorId: vendor._id, status: 'SUCCESS' } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$billAmount' },
        },
      },
    ]);

    const paymentSplit = {
      coins: 0,
      cash: 0,
      wallet: 0,
      upi: 0,
    };
    paymentSplitData.forEach((p) => {
      const method = (p._id || '').toUpperCase();
      if (method === 'COINS' || method === 'COIN') paymentSplit.coins += p.total;
      else if (method === 'CASH') paymentSplit.cash += p.total;
      else if (method === 'WALLET') paymentSplit.wallet += p.total;
      else if (method === 'UPI') paymentSplit.upi += p.total;
    });

    const topCustomersData = await this.transactionModel.aggregate([
      { $match: { vendorId: vendor._id, status: 'SUCCESS' } },
      {
        $group: {
          _id: '$customerPhone',
          totalSpent: { $sum: '$billAmount' },
          visitCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]);

    const peakHoursData = await this.transactionModel.aggregate([
      { $match: { vendorId: vendor._id, status: 'SUCCESS' } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    return {
      monthlyGmv: currentTotal,
      growthPercent,
      orderCount: currentMonthGmv[0]?.count || 0,
      paymentSplit,
      topCustomers: topCustomersData.map((c) => ({
        name: c._id ? `Customer (${c._id.slice(-4)})` : 'Local Shopper',
        phone: c._id,
        totalSpent: c.totalSpent,
        visitCount: c.visitCount,
      })),
      peakHours: peakHoursData.map((h) => ({
        hour: h._id,
        count: h.count,
      })),
    };
  }
}

