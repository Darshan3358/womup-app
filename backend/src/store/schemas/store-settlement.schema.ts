import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreSettlementDocument = StoreSettlement & Document;

@Schema({ timestamps: true, collection: 'store_settlement_requests' })
export class StoreSettlement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true, default: 'Dark Store' })
  storeName: string;

  @Prop({ default: '' })
  storeCode: string;

  @Prop({ default: '' })
  storeCity: string;

  @Prop({ default: '' })
  storeArea: string;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ required: true, trim: true, index: true })
  utrNumber: string;

  @Prop({ default: 'UPI' })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: '' })
  adminRemarks: string;

  @Prop({ default: '' })
  requestedBy: string;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date })
  rejectedAt?: Date;
}

export const StoreSettlementSchema = SchemaFactory.createForClass(StoreSettlement);
