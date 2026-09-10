import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ collection: 'wallet_transactions', timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['TOPUP', 'DEBIT', 'REFUND', 'CASHBACK'],
  })
  type: 'TOPUP' | 'DEBIT' | 'REFUND' | 'CASHBACK';

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({
    enum: ['TOPUP_GATEWAY', 'ORDER_PAYMENT', 'ORDER_REFUND', 'ADMIN_ADJUST'],
    default: 'TOPUP_GATEWAY',
  })
  referenceType: string;

  @Prop()
  referenceId?: string;

  @Prop({ default: 'SUCCESS', enum: ['PENDING', 'SUCCESS', 'FAILED'] })
  status: 'PENDING' | 'SUCCESS' | 'FAILED';

  @Prop({ required: true })
  description: string;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
