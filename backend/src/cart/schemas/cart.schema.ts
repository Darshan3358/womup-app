import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ _id: false })
export class CartItemEntry {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

@Schema({ collection: 'carts', timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItemEntry], default: [] })
  items: CartItemEntry[];

  @Prop({ default: 0 })
  appliedCoins: number;

  @Prop()
  couponCode?: string;

  @Prop({ default: 0 })
  tip: number;

  @Prop({ default: '' })
  deliveryInstructions: string;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
