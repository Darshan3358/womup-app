import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoinTransactionDocument = CoinTransaction & Document;

@Schema({ collection: 'coin_transactions', timestamps: true })
export class CoinTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['EARN', 'SPEND', 'REFUND', 'BONUS'],
  })
  type: 'EARN' | 'SPEND' | 'REFUND' | 'BONUS';

  @Prop({ required: true })
  coins: number; // Positive integer

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ enum: ['ORDER', 'REFERRAL', 'PROMOTION', 'ADMIN_ADJUSTMENT', 'SIGNUP_BONUS', 'TIER_COIN_INCOME', 'VENDOR_REDEEM'], default: 'ORDER' })
  referenceType: string;

  @Prop()
  referenceId?: string;

  @Prop({ required: true })
  description: string;
}

export const CoinTransactionSchema = SchemaFactory.createForClass(CoinTransaction);
