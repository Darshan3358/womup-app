import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({ collection: 'banners', timestamps: true })
export class Banner {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  videoUrl?: string; // For MP4 / GIF hero banners

  @Prop({ default: 'HOME_HERO', enum: ['HOME_HERO', 'CATEGORY_SPOTLIGHT', 'FESTIVE_RAIL'] })
  placement: string;

  @Prop({ default: '' })
  targetType: string; // 'CATEGORY' | 'PRODUCT' | 'PROMO'

  @Prop({ default: '' })
  targetId: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
