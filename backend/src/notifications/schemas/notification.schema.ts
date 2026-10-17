import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['CUSTOMER', 'VENDOR', 'STORE', 'RIDER', 'ADMIN', 'ALL'],
    default: 'CUSTOMER',
    index: true,
  })
  role: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: String, default: 'ORDER_STATUS', index: true })
  type: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ default: '' })
  deepLink?: string;

  @Prop({ type: [String], default: ['websocket', 'push', 'db'] })
  channels: string[];

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ role: 1, createdAt: -1 });
