import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ sparse: true, index: true })
  phone?: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ sparse: true, index: true })
  googleId?: string;

  @Prop({ default: 'MOBILE' })
  authProvider?: string; // 'GOOGLE' | 'MOBILE'

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ default: 2000 }) // Welcome bonus: 2000 Shopping Coins per SRS
  shoppingCoins: number;

  // Registration Address Details
  @Prop({ trim: true })
  registrationCity?: string;

  @Prop({ trim: true })
  registrationPincode?: string;

  @Prop({ trim: true })
  fullNameAsPerAadhaar?: string;

  // Aadhaar Verification Fields
  @Prop({ default: false })
  aadhaarVerified: boolean;

  @Prop({
    default: 'NON_VERIFIED',
    enum: ['NON_VERIFIED', 'VERIFIED', 'PENDING', 'BLOCKED'],
  })
  verificationStatus: string;

  @Prop({ trim: true })
  aadhaarNumber?: string;

  @Prop()
  verifiedAt?: Date;

  // Income Fields (MLM / Referral & App Download)
  @Prop({ default: 0 })
  appDownloadIncome: number;

  @Prop({ default: 0 })
  pendingIncome: number; // Income earned today, usable tomorrow midnight

  @Prop({ default: 0 })
  availableIncome: number; // Income usable for shopping today

  @Prop()
  lastIncomeCreditedAt?: Date;

  @Prop()
  lastMonthlyCoinCredit?: Date; // For idempotency: prevents duplicate monthly ₹2000 Shopping Coin credits

  // Sponsor & Referral Fields
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  sponsorId?: Types.ObjectId;

  @Prop({ trim: true, uppercase: true })
  sponsorCode?: string;

  @Prop({ default: false })
  isCompanySponsored: boolean;

  @Prop({ default: false })
  isCompanyAccount: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  parentId?: Types.ObjectId;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  leftChildCount: number;

  @Prop({ default: 0 })
  rightChildCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  directReferrals: Types.ObjectId[];

  @Prop({ default: 0 })
  referredUsersCount: number;

  @Prop({ default: 0 })
  verifiedReferralsCount: number;

  @Prop({ unique: true, sparse: true, uppercase: true })
  referralCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredBy?: Types.ObjectId;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  hideSensitiveItems: boolean;

  @Prop({ required: false })
  birthday?: string; // Stored as "DD MonthName YYYY" e.g. "07 August 2005"


  @Prop({ type: Types.ObjectId, ref: 'City' })
  preferredCityId?: Types.ObjectId;

  @Prop({ trim: true })
  preferredCityName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Store' })
  assignedStoreId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Types.ObjectId[];

  // ── 7-Level Team Purchase & Monthly Activity Tracking ──
  @Prop({ default: 0 })
  monthlyPurchaseValue: number; // Current month total personal purchase

  @Prop({ default: 0 })
  monthlyVegetablePurchase: number; // Current month vegetable GMV

  @Prop({ default: 0 })
  monthlyOtherPurchase: number; // Current month other categories GMV

  @Prop({ default: false })
  isActiveMember: boolean; // Personal purchase >= ₹2,000

  @Prop({ default: 0 })
  direct5ActiveCount: number; // Direct referrals currently active (>= ₹2,000)

  @Prop({ default: 0 })
  teamSize: number; // Total downline count across 7 levels

  @Prop({ default: true })
  isActive: boolean;

  // ── tbl_customer Full SQL Schema Alignment ──
  @Prop({ default: '' })
  customerCodeNumber?: string;

  @Prop({ default: '' })
  customerCode?: string;

  @Prop({ default: '' })
  customerReferralBy?: string;

  @Prop({ default: '' })
  surname?: string;

  @Prop({ default: '' })
  firstName?: string;

  @Prop({ default: '' })
  fatherHusbandName?: string;

  @Prop({ default: '' })
  gender?: string;

  @Prop({ default: '' })
  birthDate?: string;

  @Prop({ default: '' })
  address?: string;

  @Prop({ default: '' })
  landmark?: string;

  @Prop({ default: '' })
  village?: string;

  @Prop({ default: '' })
  customerPincode?: string;

  // Location Hierarchy
  @Prop({ default: '' })
  talukaId?: string;

  @Prop({ default: '' })
  districtId?: string;

  @Prop({ default: '' })
  cityId?: string;

  @Prop({ default: '' })
  stateId?: string;

  @Prop({ default: 'IN' })
  countryId?: string;

  // Bank Details
  @Prop({ default: '' })
  bankName?: string;

  @Prop({ default: '' })
  accountHolderName?: string;

  @Prop({ default: '' })
  accountNumber?: string;

  @Prop({ default: '' })
  ifscCode?: string;

  @Prop({ default: '' })
  branchName?: string;

  @Prop({ default: '' })
  upiId?: string;

  // KYC Document Images & Status
  @Prop({ default: '' })
  aadharFrontImage?: string;

  @Prop({ default: '' })
  customer_image_aadhar_front?: string;

  @Prop({ default: '' })
  aadharBackImage?: string;

  @Prop({ default: '' })
  customer_image_aadhar_back?: string;

  @Prop({ default: 2 }) // 1 = yes, 2 = no
  customerIsVerify: number;

  @Prop({ default: 1 }) // 1 pending, 2 confirm, 3 rejectd
  customerKycStatus: number;

  @Prop({ default: '' })
  kycRejectReason?: string;

  // Sponsor Details
  @Prop({ default: '' })
  sponsorName?: string;

  @Prop({ default: Date.now })
  joiningDate?: Date;

  @Prop({ default: '' })
  customerOtp?: string;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: '' })
  androidToken?: string;

  @Prop({ default: '' })
  iosToken?: string;

  @Prop({ default: '' })
  addedBy?: string;

  // Security, Block & Suspended Flags
  @Prop({ default: 1 }) // 1 yes, 2 no
  customerPaymentStatus: number;

  @Prop({ default: false })
  isLogin: boolean;

  @Prop({ default: 0 }) // 0=No, 1=Yes
  isBlocked: number;

  @Prop({ default: 0 }) // 0=No, 1=Yes
  isSuspended: number;

  @Prop({ default: '' })
  blockReason?: string;

  @Prop({ default: '1.0.0' })
  appVersion?: string;

  @Prop({ default: '' })
  customerPin?: string;

  @Prop({ default: 1 }) // 0 = not credited this month, 1 = credited
  monthlyCreditStatus: number;

  @Prop({ default: '' })
  passwordHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Compound index: unique phone (only when set, not null)
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ sponsorId: 1 });
UserSchema.index({ sponsorCode: 1 });
UserSchema.index({ verificationStatus: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ isSuspended: 1 });
UserSchema.index({ customerKycStatus: 1 });
