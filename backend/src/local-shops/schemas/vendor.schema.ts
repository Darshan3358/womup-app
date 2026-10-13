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

  // Status & KYC
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
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

  @Prop({ default: '' })
  qrCodeData: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

VendorSchema.index({ coordinates: '2dsphere' });
VendorSchema.index({ city: 1, categoryName: 1, isActive: 1 });
VendorSchema.index({ vendorCode: 1 }, { unique: true });
