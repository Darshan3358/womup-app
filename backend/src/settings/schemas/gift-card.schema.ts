import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GiftCardDocument = GiftCard & Document;

@Schema({ collection: 'gift_cards', timestamps: true })
export class GiftCard {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({ default: 'FLAT', enum: ['FLAT', 'PERCENT'] })
  discountType: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  @Prop({ default: 500 })
  maxDiscount: number;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: 100 })
  maxUses: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  applicableCategories: string[];
}

export const GiftCardSchema = SchemaFactory.createForClass(GiftCard);

export type GiftCardRedemptionDocument = GiftCardRedemption & Document;

@Schema({ collection: 'gift_card_redemptions', timestamps: true })
export class GiftCardRedemption {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: Date.now })
  redeemedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;
}

export const GiftCardRedemptionSchema = SchemaFactory.createForClass(GiftCardRedemption);
