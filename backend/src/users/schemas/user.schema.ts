import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  // Phone is optional — set only if provided during registration
  @Prop({ sparse: true, index: true })
  phone?: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ default: 50 }) // Welcome reward coins
  shoppingCoins: number;

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


  @Prop({ type: Types.ObjectId, ref: 'Store' })
  assignedStoreId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Compound index: unique phone (only when set, not null)
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
