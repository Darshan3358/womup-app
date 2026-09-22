import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ collection: 'chat_messages', timestamps: true })
export class ChatMessage {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({
    required: true,
    enum: ['CUSTOMER', 'RIDER', 'ADMIN'],
    default: 'CUSTOMER',
  })
  senderRole: string;

  @Prop({ default: '' })
  senderName: string;

  @Prop({ default: '' })
  receiverId?: string;

  @Prop({
    enum: ['CUSTOMER', 'RIDER', 'ADMIN', 'ALL'],
    default: 'ALL',
  })
  receiverRole: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: '' })
  attachmentUrl?: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ orderId: 1, createdAt: 1 });
