import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorCollectionRequestDocument = VendorCollectionRequest & Document;

@Schema({ timestamps: true, collection: 'vendor_collection_requests' })
export class VendorCollectionRequest {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true, index: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true, uppercase: true, index: true })
  vendorCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  customerId?: Types.ObjectId;

  @Prop({ required: true, default: 'Customer' })
  customerName: string;

  @Prop({ required: false, default: '' })
  customerPhone: string;

  @Prop({ required: true })
  billAmount: number;

  @Prop({ default: 0 })
  coinsUsed: number;

  @Prop({ default: 0 })
  walletUsed: number;

  @Prop({ default: 0 })
  cashToCollect: number;

  @Prop({ default: 0 })
  upiAmount: number;

  @Prop({ default: 0 })
  coinsEarned: number;

  @Prop({ default: 0 })
  platformCommission: number;

  @Prop({ default: 0 })
  vendorPayout: number;

  @Prop({ required: true, enum: ['COINS', 'WALLET', 'CASH', 'UPI'], default: 'CASH' })
  paymentMethod: string;

  @Prop({ required: true, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING', index: true })
  status: string;

  @Prop({ default: Date.now })
  requestedAt: Date;

  @Prop({ required: false })
  verifiedAt?: Date;

  @Prop({ required: false })
  rejectionReason?: string;
}

export const VendorCollectionRequestSchema = SchemaFactory.createForClass(VendorCollectionRequest);

VendorCollectionRequestSchema.index({ vendorId: 1, status: 1 });
VendorCollectionRequestSchema.index({ vendorCode: 1, status: 1 });
VendorCollectionRequestSchema.index({ requestedAt: -1 });
