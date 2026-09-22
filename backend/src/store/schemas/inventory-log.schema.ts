import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryLogDocument = InventoryLog & Document;

export enum InventoryChangeType {
  PICK = 'PICK',
  RESTOCK = 'RESTOCK',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Schema({ collection: 'inventory_logs', timestamps: true })
export class InventoryLog {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ type: String, enum: InventoryChangeType, required: true, index: true })
  changeType: InventoryChangeType;

  @Prop({ required: true })
  quantityDelta: number; // e.g. -1 for pick/damage, +50 for restock

  @Prop({ default: '' })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StoreStaff' })
  staffId?: Types.ObjectId;

  @Prop({ required: true })
  beforeQty: number;

  @Prop({ required: true })
  afterQty: number;
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);
