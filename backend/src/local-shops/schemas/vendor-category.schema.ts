import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorCategoryDocument = VendorCategory & Document;

@Schema({ timestamps: true, collection: 'vendor_categories' })
export class VendorCategory {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: 'store' })
  icon: string;

  @Prop({ default: '#D1FAE5' })
  bgColor: string;

  @Prop({ default: '#10B981' })
  iconColor: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const VendorCategorySchema = SchemaFactory.createForClass(VendorCategory);
