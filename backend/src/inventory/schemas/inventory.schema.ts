import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryDocument = Inventory & Document;
export type InventoryReservationDocument = InventoryReservation & Document;

@Schema({ collection: 'inventory', timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  availableQty: number;

  @Prop({ required: true, default: 0, min: 0 })
  reservedQty: number;

  @Prop({ required: true, default: 0, min: 0 })
  soldQty: number;

  @Prop({ default: 5 })
  lowStockThreshold: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
InventorySchema.index({ storeId: 1, productId: 1, variantId: 1 }, { unique: true });

@Schema({ collection: 'inventory_reservations', timestamps: true })
export class InventoryReservation {
  @Prop({ required: true, index: true })
  reservationId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Types.ObjectId, ref: 'ProductVariant' },
        quantity: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: {
    productId: Types.ObjectId;
    variantId?: Types.ObjectId;
    quantity: number;
  }[];

  @Prop({ default: 'PENDING', enum: ['PENDING', 'CONFIRMED', 'RELEASED'] })
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';

  @Prop({ required: true })
  expiresAt: Date;
}

export const InventoryReservationSchema =
  SchemaFactory.createForClass(InventoryReservation);
InventoryReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }, // 10 min TTL auto-release
);
