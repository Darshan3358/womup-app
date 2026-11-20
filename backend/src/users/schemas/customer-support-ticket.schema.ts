import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerSupportTicketDocument = CustomerSupportTicket & Document;

@Schema({ collection: 'customer_support_tickets', timestamps: true })
export class CustomerSupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  ticketNumber: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true, index: true })
  customerPhone: string;

  @Prop({ default: '' })
  customerEmail: string;

  @Prop({ required: true, default: 'General Query' })
  category: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: '' })
  orderNumber?: string;

  @Prop({ default: '' })
  proofUrl?: string;

  @Prop({
    required: true,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  })
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @Prop({
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  })
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @Prop({ default: '' })
  adminResponse?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop({ default: '' })
  resolvedBy?: string;
}

export const CustomerSupportTicketSchema = SchemaFactory.createForClass(CustomerSupportTicket);
