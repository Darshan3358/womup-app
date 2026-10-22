import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({
    type: String,
    enum: ['CUSTOMER', 'ADMIN', 'STORE', 'RIDER', 'VENDOR'],
    default: 'CUSTOMER',
    index: true,
  })
  recipientType: 'CUSTOMER' | 'ADMIN' | 'STORE' | 'RIDER' | 'VENDOR';

  @Prop({ type: String, required: true, index: true })
  recipientId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['CUSTOMER', 'VENDOR', 'STORE', 'RIDER', 'ADMIN', 'ALL'],
    default: 'CUSTOMER',
    index: true,
  })
  role: string;

  @Prop({ type: String, required: false, index: true })
  storeId?: string;

  @Prop({ type: String, required: false, index: true })
  riderId?: string;

  @Prop({ type: String, required: false, index: true })
  customerId?: string;

  @Prop({ type: String, required: false })
  areaId?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: false, default: '' })
  body: string;

  @Prop({ type: String, default: 'ORDER_STATUS', index: true })
  type: string;

  @Prop({ type: String, required: false })
  entityType?: string;

  @Prop({ type: String, required: false })
  entityId?: string;

  @Prop({ type: String, required: false, index: true })
  orderId?: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date, required: false })
  readAt?: Date;

  @Prop({ type: String, required: false })
  actionType?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String, required: false, index: { unique: true, sparse: true } })
  dedupeKey?: string;

  @Prop({ default: '' })
  deepLink?: string;

  @Prop({ type: [String], default: ['websocket', 'push', 'db'] })
  channels: string[];

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ storeId: 1, createdAt: -1 });
NotificationSchema.index({ riderId: 1, createdAt: -1 });
NotificationSchema.index({ role: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
