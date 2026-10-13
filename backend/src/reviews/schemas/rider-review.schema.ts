import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiderReviewDocument = RiderReview & Document;

@Schema({ collection: 'rider_reviews', timestamps: true })
export class RiderReview {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, uppercase: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  stars: number;

  @Prop({ default: '' })
  comment: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  tipAmount: number;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: () => new Date() })
  reviewedAt: Date;

  @Prop({ default: false })
  isAnonymous: boolean;
}

export const RiderReviewSchema = SchemaFactory.createForClass(RiderReview);
RiderReviewSchema.index({ riderId: 1, reviewedAt: -1 });
RiderReviewSchema.index({ customerId: 1, reviewedAt: -1 });
