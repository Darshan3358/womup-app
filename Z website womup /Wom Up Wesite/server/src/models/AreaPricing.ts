import mongoose, { Document, Schema } from 'mongoose';

export interface IAreaPricing extends Document {
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
  areaId: mongoose.Types.ObjectId;
  price: number;
  mrp: number;
  discountPercent?: number;
  stock: number;
  isAvailable: boolean;
}

const AreaPricingSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area', required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { collection: 'area_pricing', timestamps: true, strict: false }
);

export const AreaPricingModel = mongoose.model<IAreaPricing>('AreaPricing', AreaPricingSchema);
