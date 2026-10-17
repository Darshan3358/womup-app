import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true, collection: 'vendors' })
export class Vendor {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  vendorCode: string;

  @Prop({ required: true, trim: true })
  storeName: string;

  @Prop({ required: true, trim: true })
  ownerName: string;

  @Prop({ required: true, trim: true })
  ownerPhone: string;

  // Category
  @Prop({ type: Types.ObjectId, ref: 'VendorCategory', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ required: true, default: 'General' })
  categoryName: string;

  // Location
  @Prop({ required: true })
  address: string;

  @Prop({ required: true, default: 'Ahmedabad' })
  city: string;

  @Prop({ type: Types.ObjectId, required: false })
  cityId?: Types.ObjectId;

  @Prop({ required: true, default: '380015' })
  pincode: string;

  @Prop({ default: 23.1288 })
  latitude: number;

  @Prop({ default: 72.5507 })
  longitude: number;

  @Prop(
    raw({
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.5507, 23.1288] }, // [lng, lat]
    }),
  )
  coordinates: {
    type: string;
    coordinates: [number, number];
  };

  @Prop(
    raw({
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.5507, 23.1288] }, // [lng, lat]
    }),
  )
  location: {
    type: string;
    coordinates: [number, number];
  };

  // Shopping Coins Config — SET BY ADMIN
  @Prop({ required: true, default: 10, min: 1, max: 100 })
  shoppingCoinPercent: number;

  @Prop({ default: 2 })
  minCoinPercent: number;

  @Prop({ default: 25 })
  maxCoinPercent: number;

  // Operating Hours
  @Prop({ default: '8:00 AM' })
  openingTime: string;

  @Prop({ default: '9:00 PM' })
  closingTime: string;

  @Prop({ default: true })
  isOpenNow: boolean;

  // Media
  @Prop({ default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80' })
  imageUrl: string;

  @Prop({ default: '' })
  bannerUrl: string;

  // Ratings & Stats
  @Prop({ default: 4.8 })
  rating: number;

  @Prop({ default: 42 })
  totalReviews: number;

  @Prop({ default: 0 })
  totalTransactions: number;

  @Prop({ default: 0 })
  monthlyRevenue: number;

  // Payment & QR
  @Prop({ default: '' })
  qrCodeUrl: string;

  @Prop({ default: '' })
  upiId: string;

  @Prop(
    raw({
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
    }),
  )
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };

  // Status & KYC (Defaults to Pending, requires Real Admin Approval)
  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop(
    raw({
      aadhaarUrl: { type: String, default: '' },
      panUrl: { type: String, default: '' },
      gstUrl: { type: String, default: '' },
      shopLicenseUrl: { type: String, default: '' },
    }),
  )
  kycDocuments: {
    aadhaarUrl: string;
    panUrl: string;
    gstUrl: string;
    shopLicenseUrl: string;
  };

  // Commission (for WormUp)
  @Prop({ default: 2 })
  platformCommissionPercent: number;

  // Vendor App Auth & Wallet Fields
  @Prop({ default: '' })
  loginId: string;

  @Prop({ default: '' })
  passwordHash: string;

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ default: 0 })
  pendingBalance: number;

  @Prop({ default: 0 })
  totalEarned: number;

  @Prop({ default: 0 })
  totalCollections: number;

  @Prop({ default: 0 })
  totalCommissionPaid: number;

  @Prop({ default: '' })
  qrCodeData: string;

  // ── tbl_vendor Full SQL Schema Alignment ──
  @Prop({ default: 0 })
  vendorBalance: number; // Available for withdrawal

  @Prop({ default: 0 })
  vendorAdminBalance: number; // Pending verification balance

  @Prop({ default: 0 })
  vendorPayableToAdmin: number; // Platform commission owed

  @Prop({ default: '' })
  vendorFirmName?: string;

  @Prop({ default: '' })
  vendorOwnerName?: string;

  @Prop({ default: '' })
  businessType?: string;

  @Prop({ default: '' })
  vendorGstNo?: string;

  @Prop({ default: '' })
  vendorMobile?: string;

  @Prop({ default: '' })
  vendorAlternateMobile?: string;

  @Prop({ default: '' })
  vendorEmail?: string;

  @Prop({ default: '' })
  vendorAadharNo?: string;

  @Prop({ default: '' })
  businessAddress?: string;

  @Prop({ default: '' })
  businessLandmark?: string;

  @Prop({ default: '' })
  businessCategoryId?: string;

  // Location Hierarchy
  @Prop({ default: '' })
  talukaId?: string;

  @Prop({ default: '' })
  districtId?: string;

  @Prop({ default: '' })
  stateId?: string;

  @Prop({ default: 'IN' })
  countryId?: string;

  @Prop({ default: '' })
  businessPincode?: string;

  // Bank Details
  @Prop({ default: '' })
  bankName?: string;

  @Prop({ default: '' })
  bankBranch?: string;

  @Prop({ default: '' })
  accountHolderName?: string;

  @Prop({ default: '' })
  accountNumber?: string;

  @Prop({ default: '' })
  ifscCode?: string;

  // KYC Document Images (8+ images)
  @Prop({ default: '' })
  cancelledChequeImage?: string;

  @Prop({ default: '' })
  vendorAadharFrontImage?: string;

  @Prop({ default: '' })
  vendorAadharBackImage?: string;

  @Prop({ default: '' })
  gstCertificateImage?: string;

  @Prop({ default: '' })
  tradeLicenseImage?: string;

  @Prop({ default: '' })
  panCardImage?: string;

  @Prop({ default: '' })
  businessCardImage?: string;

  @Prop({ default: '' })
  shopPhotoImage?: string;

  @Prop({ default: '' })
  ownerPhotoImage?: string;

  // Joining & Codes
  @Prop({ default: Date.now })
  vendorJoiningDate?: Date;

  @Prop({ default: '' })
  vendorCodeNumber?: string;

  @Prop({ default: '' })
  vendorOtp?: string;

  // Percentages & Rates
  @Prop({ default: 2 })
  vendorPersantage?: number; // Platform commission %

  @Prop({ default: 10 })
  vendorCustomerPersantage?: number; // Customer coin discount %

  @Prop({ default: 0 })
  vendorLat?: number;

  @Prop({ default: 0 })
  vendorLong?: number;

  // Status Workflow: 1 = pending, 2 = active, 3 = reject
  @Prop({ default: 1 })
  vendorStatus: number;

  @Prop({ default: '' })
  vendorRejectReason?: string;

  @Prop({ default: '' })
  vendorLastLoginDetails?: string;

  @Prop({ default: '' })
  vendorAndroidToken?: string;

  @Prop({ default: '' })
  vendorIosToken?: string;

  @Prop({ default: '' })
  vendorQrLink?: string;

  @Prop({ default: '' })
  vendorQrImageLink?: string;

  @Prop({ default: '' })
  addedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop({ default: '' })
  approvedBy?: string;

  @Prop()
  rejectedAt?: Date;

  @Prop({ default: '' })
  rejectedBy?: string;

  // Security Flags: 1 = Blocked, 0 = Active
  @Prop({ default: 0 })
  isSuspended: number;

  @Prop({ default: 0 })
  isBlocked: number;

  @Prop({ default: '' })
  blockReason?: string;

  @Prop({ default: '1.0.0' })
  vendorVersion?: string;

  @Prop({ default: '' })
  vendorPassword?: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.index({ coordinates: '2dsphere' });
VendorSchema.index({ location: '2dsphere' });
VendorSchema.index({ city: 1, categoryName: 1, isActive: 1 });
VendorSchema.index({ vendorCode: 1 }, { unique: true });
VendorSchema.index({ vendorStatus: 1 });
VendorSchema.index({ isBlocked: 1 });
VendorSchema.index({ isSuspended: 1 });
