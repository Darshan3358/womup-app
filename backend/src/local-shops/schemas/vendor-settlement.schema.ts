import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorSettlementDocument = VendorSettlement & Document;

@Schema({ timestamps: true, collection: 'vendor_settlements' })
export class VendorSettlement {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true, index: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'HDFC Bank' })
  bankName: string;

  @Prop({ default: '****9182' })
  accountMasked: string;

  @Prop({ default: 'HDFC0000123' })
  ifsc: string;

  @Prop({ required: true, enum: ['PENDING', 'PROCESSING', 'COMPLETED'], default: 'COMPLETED' })
  status: string;

  @Prop({ required: true })
  utrNumber: string;

  @Prop({ default: Date.now })
  initiatedAt: Date;

  @Prop({ default: Date.now })
  completedAt: Date;
}

export const VendorSettlementSchema = SchemaFactory.createForClass(VendorSettlement);

VendorSettlementSchema.index({ vendorId: 1, createdAt: -1 });
