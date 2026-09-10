import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';

export type OrderStatusHistoryDocument = OrderStatusHistory & Document;

@Schema({ collection: 'order_status_history', timestamps: true })
export class OrderStatusHistory {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: String, enum: OrderStatus, required: true })
  previousStatus: OrderStatus;

  @Prop({ type: String, enum: OrderStatus, required: true })
  newStatus: OrderStatus;

  @Prop({ required: true, enum: ['CUSTOMER', 'STORE_STAFF', 'DELIVERY_PARTNER', 'ADMIN', 'SYSTEM'] })
  changedByRole: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  changedById?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const OrderStatusHistorySchema =
  SchemaFactory.createForClass(OrderStatusHistory);
