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

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Compound index: unique phone (only when set, not null)
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ sponsorId: 1 });
UserSchema.index({ sponsorCode: 1 });
UserSchema.index({ verificationStatus: 1 });
