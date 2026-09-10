import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItemSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '1 unit' })
  quantityLabel: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  unitMrp: number;

  @Prop({ required: true })
  subtotal: number;
}

@Schema({ _id: false })
export class DeliveryAddressSnapshot {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  houseNumber: string;

  @Prop({ required: true })
  street: string;

  @Prop({ default: '' })
  landmark: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({ type: [Number], default: [72.5714, 23.0225] })
  coordinates: number[];
}

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner' })
  deliveryPartnerId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PLACED,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: [OrderItemSnapshot], required: true })
  items: OrderItemSnapshot[];

  @Prop({ type: DeliveryAddressSnapshot, required: true })
  deliveryAddress: DeliveryAddressSnapshot;

  // Authoritative Pricing Breakdown
  @Prop({ required: true })
  itemSubtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  couponDiscount: number;

  @Prop()
  couponCode?: string;

  @Prop({ default: 0 })
  coinsUsed: number;

  @Prop({ default: 0 })
  coinsDiscount: number;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ default: 5 })
  handlingFee: number;

  @Prop({ default: 0 })
  tip: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({
    required: true,
    enum: ['UPI', 'WALLET', 'CARD', 'NET_BANKING', 'COD'],
  })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  })
  paymentStatus: string;

  @Prop({ default: 'Instant (9-15 mins)' })
  deliverySlot: string;

  @Prop({ default: '' })
  deliveryInstructions: string;

  @Prop()
  estimatedArrival?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
