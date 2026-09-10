import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;
export type CouponUsageDocument = CouponUsage & Document;

@Schema({ collection: 'coupons', timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['PERCENTAGE', 'FLAT'] })
  discountType: 'PERCENTAGE' | 'FLAT';

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  @Prop({ default: 0 }) // 0 = no limit
  maxDiscountAmount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: 1 })
  perUserLimit: number;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

@Schema({ collection: 'coupon_usages', timestamps: true })
export class CouponUsage {
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true, index: true })
  couponId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  discountApplied: number;
}

export const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);
