import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    enum: [
      'ORDER_STATUS',
      'DELIVERY_UPDATE',
      'COIN_CREDIT',
      'WALLET_UPDATE',
      'PROMOTION',
    ],
    default: 'ORDER_STATUS',
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
