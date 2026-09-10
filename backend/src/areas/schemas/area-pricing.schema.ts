import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AreaPricingDocument = AreaPricing & Document;

@Schema({ collection: 'area_pricing', timestamps: true })
export class AreaPricing {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true, index: true })
  variantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true, index: true })
  areaId: Types.ObjectId;

  // Area-specific selling price (can differ by zone)
  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  mrp: number;

  @Prop({ default: 0 })
  discountPercent: number;

  @Prop({ default: 100 })
  stock: number;

  @Prop({ default: true })
  isAvailable: boolean;
}

export const AreaPricingSchema = SchemaFactory.createForClass(AreaPricing);
// Compound unique index: one price record per product-variant-area combination
AreaPricingSchema.index({ productId: 1, variantId: 1, areaId: 1 }, { unique: true });
