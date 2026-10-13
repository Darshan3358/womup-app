import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IncomeTransactionDocument = IncomeTransaction & Document;

@Schema({ collection: 'income_transactions', timestamps: true })
export class IncomeTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId; // Who earned

  @Prop({
    required: true,
    enum: ['APP_DOWNLOAD', 'REFERRAL', 'ORDER_CASHBACK', 'SIGNUP_BONUS', 'TEAM_PURCHASE'],
  })
  type: string;

  @Prop({ required: true })
  amount: number; // e.g. ₹50

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sourceUserId?: Types.ObjectId; // Referred user

  @Prop()
  sourceVerificationStatus?: string; // 'VERIFIED' | 'NON_VERIFIED'

  @Prop({ default: () => new Date() })
  earnedAt: Date;

  @Prop({ required: true })
  availableFrom: Date; // Usable from (next day midnight)

  @Prop({ default: false })
  isUsable: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  usedInOrderId?: Types.ObjectId;

  @Prop()
  usedAt?: Date;

  @Prop({
    required: true,
    enum: ['PENDING', 'AVAILABLE', 'USED', 'EXPIRED'],
    default: 'PENDING',
    index: true,
  })
  status: 'PENDING' | 'AVAILABLE' | 'USED' | 'EXPIRED';

  @Prop({ default: '' })
  description: string;
}

export const IncomeTransactionSchema = SchemaFactory.createForClass(IncomeTransaction);
IncomeTransactionSchema.index({ userId: 1, status: 1 });
IncomeTransactionSchema.index({ availableFrom: 1, status: 1 });
