import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RazorpayOrderDocument = RazorpayOrder & Document;

@Schema({ collection: 'razorpay_orders', timestamps: true })
export class RazorpayOrder {
  @Prop({ required: true, unique: true, index: true })
  razorpayOrderId: string; // e.g. "order_MxYzAbC123"

  @Prop({ type: Types.ObjectId, ref: 'VendorTransaction', required: false, index: true })
  vendorTransactionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true, index: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // in paise (e.g. 100000 paise = ₹1,000)

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ required: true })
  receipt: string;

  @Prop({
    required: true,
    enum: ['CREATED', 'PAID', 'FAILED', 'EXPIRED'],
    default: 'CREATED',
    index: true,
  })
  status: 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED';

  @Prop({ required: false })
  paymentId?: string; // filled on success

  @Prop({ required: false })
  signature?: string;

  @Prop({ type: Object, default: {} })
  notes: Record<string, any>;
}

export const RazorpayOrderSchema = SchemaFactory.createForClass(RazorpayOrder);
RazorpayOrderSchema.index({ customerId: 1, createdAt: -1 });
RazorpayOrderSchema.index({ vendorId: 1, createdAt: -1 });
