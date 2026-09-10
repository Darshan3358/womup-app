import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentOrderDocument = PaymentOrder & Document;

@Schema({ collection: 'payment_orders', timestamps: true })
export class PaymentOrder {
  @Prop({ required: true, unique: true, index: true })
  paymentOrderId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ required: true, enum: ['UPI', 'WALLET', 'CARD', 'NET_BANKING', 'COD'] })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
    default: 'CREATED',
  })
  status: string;

  @Prop()
  gatewayTransactionId?: string;

  @Prop({ type: Object, default: {} })
  rawGatewayResponse: Record<string, any>;
}

export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);
