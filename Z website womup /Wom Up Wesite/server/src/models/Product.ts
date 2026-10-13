import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: string;
  categoryId?: mongoose.Types.ObjectId;
  category?: string;
  imageUrl: string;
  images?: string[];
  mrp: number;
  sellingPrice: number;
  discountPercent?: number;
  shoppingCoins?: number;
  rating?: number;
  reviewCount?: number;
  deliveryMinutes?: number;
  isPopular?: boolean;
  isDeal?: boolean;
  description?: string;
  specifications?: Record<string, any>;
  quantityLabel?: string;
  shelfLife?: string;
  stock?: number;
  isActive: boolean;
  // Computed area pricing fields
  areaPrice?: number;
  areaMrp?: number;
  areaStock?: number;
  effectivePrice?: number;
  effectiveMrp?: number;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },
    brand: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    category: { type: String },
    imageUrl: { type: String },
    images: [{ type: String }],
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    shoppingCoins: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    deliveryMinutes: { type: Number, default: 9 },
    isPopular: { type: Boolean, default: false },
    isDeal: { type: Boolean, default: false },
    description: { type: String, default: '' },
    specifications: { type: Schema.Types.Mixed },
    quantityLabel: { type: String, default: '1 unit' },
    stock: { type: Number, default: 50 },
    shelfLife: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'products', timestamps: true, strict: false }
);

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
