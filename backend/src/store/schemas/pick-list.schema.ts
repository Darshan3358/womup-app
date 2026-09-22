import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PickListDocument = PickList & Document;

export enum PickItemStatus {
  PENDING = 'PENDING',
  PICKED = 'PICKED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SUBSTITUTED = 'SUBSTITUTED',
}

export enum PickListStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

@Schema({ _id: false })
export class PickItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ default: 'pack' })
  unit: string;

  @Prop({ default: 'A1-R1' })
  shelfLocation: string; // e.g. "A3-R2"

  @Prop({ default: '' })
  barcode: string; // Barcode to scan

  @Prop({ type: String, enum: PickItemStatus, default: PickItemStatus.PENDING })
  status: PickItemStatus;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  substituteProductId?: Types.ObjectId;

  @Prop()
  pickedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'StoreStaff' })
  scannedBy?: Types.ObjectId;

  @Prop({ default: '' })
  notes: string;
}

@Schema({ collection: 'pick_lists', timestamps: true })
export class PickList {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StoreStaff', index: true })
  pickerId?: Types.ObjectId;

  @Prop({ type: [PickItem], default: [] })
  items: PickItem[];

  @Prop({ type: String, enum: PickListStatus, default: PickListStatus.ACTIVE, index: true })
  status: PickListStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  packingStartedAt?: Date;

  @Prop()
  packedAt?: Date;

  @Prop()
  readyAt?: Date;

  @Prop({ sparse: true, index: true })
  bagBarcode?: string; // e.g. "BAG-9412-8021"

  @Prop({ default: 'READY-01' })
  shelfSlot?: string; // e.g. "READY-14"

  @Prop({ default: 0 })
  exceptionCount: number;

  @Prop({ default: 0 })
  pickDurationSeconds: number;
}

export const PickListSchema = SchemaFactory.createForClass(PickList);
