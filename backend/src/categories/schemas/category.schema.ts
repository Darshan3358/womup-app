import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;
export type SubCategoryDocument = SubCategory & Document;

@Schema({ collection: 'categories', timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop()
  image: string;

  @Prop({ default: 'shopping-bag' })
  icon: string;

  @Prop({ default: '#FCE1F5' })
  bgColor: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: 0 })
  itemCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ collection: 'subcategories', timestamps: true })
export class SubCategory {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ default: 'grid' })
  icon: string;

  @Prop({ default: 0 })
  itemCount: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);
