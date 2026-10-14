import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorTransactionDocument = VendorTransaction & Document;

@Schema({ timestamps: true, collection: 'vendor_transactions' })
export class VendorTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  vendorName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  customerId?: Types.ObjectId;

  @Prop({ required: false })
  customerPhone?: string;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ required: true })
  billAmount: number;

  @Prop({ required: true, enum: ['COIN', 'COINS', 'WALLET', 'CASH', 'UPI'] })
  paymentMethod: string;

  @Prop({ default: 0 })
  coinsUsed: number;

  @Prop({ default: 0 })
  cashPaid: number;

  @Prop({ default: 0 })
  coinsEarned: number;

  @Prop({ default: 0 })
  platformCommission: number;

  @Prop({ default: 0 })
  vendorPayout: number;

  @Prop({ default: 'SUCCESS', enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUCCESS'] })
  status: string;

  @Prop({ default: true })
  qrScanned: boolean;

  @Prop({ required: false })
  verifiedBy?: string;

  @Prop({ required: false })
  verifiedAt?: Date;

  // Razorpay Payment Gateway Tracking
  @Prop({ required: false, sparse: true, index: true })
  razorpayOrderId?: string;

  @Prop({ required: false, sparse: true })
  razorpayPaymentId?: string;

  @Prop({ required: false })
  razorpaySignature?: string;

  @Prop({ default: 'INTERNAL', enum: ['RAZORPAY', 'INTERNAL', 'CASH'] })
  paymentGateway: string;

  @Prop({ default: 'CREATED', enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'] })
  gatewayStatus: string;

  @Prop({ type: Object, default: {} })
  gatewayResponse?: Record<string, any>;
}

export const VendorTransactionSchema = SchemaFactory.createForClass(VendorTransaction);

VendorTransactionSchema.index({ vendorId: 1, createdAt: -1 });
VendorTransactionSchema.index({ customerId: 1, createdAt: -1 });
VendorTransactionSchema.index({ orderNumber: 1 });
