import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;
export type ProductVariantDocument = ProductVariant & Document;

@Schema({ collection: 'products', timestamps: true })
export class Product {
  @Prop({ required: true, trim: true, index: 'text' })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: 'Worm Up' })
  brand: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', index: true })
  subCategoryId?: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: '1 unit' })
  quantityLabel: string;

  @Prop({ required: true })
  mrp: number;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ default: 0 })
  discountPercent: number;

  @Prop({ default: 10 })
  shoppingCoins: number;

  @Prop({ default: 4.8 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 9 })
  deliveryMinutes: number;

  @Prop({ default: false })
  isPopular: boolean;

  @Prop({ default: false })
  isDeal: boolean;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Object, default: {} })
  specifications: Record<string, string>;

  @Prop({ default: '7 days' })
  shelfLife: string;

  @Prop({ default: '' })
  manufacturer: string;

  @Prop({ default: '' })
  storageInstructions: string;

  @Prop({ default: 100 })
  stock: number;

  @Prop({ default: '', trim: true })
  shelfLocation: string; // e.g. "A3-R2"

  @Prop({ default: '', trim: true, index: true })
  barcode: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

@Schema({ collection: 'product_variants', timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  weightOrVolume: string; // e.g. "500ml", "1kg"

  @Prop({ required: true })
  mrp: number;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ default: 0 })
  discountPercent: number;

  @Prop({ default: true })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
