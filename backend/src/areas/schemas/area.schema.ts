import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AreaDocument = Area & Document;

@Schema({ collection: 'areas', timestamps: true })
export class Area {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ type: [String], default: [] })
  pincodes: string[];

  @Prop({ required: true })
  centerLat: number;

  @Prop({ required: true })
  centerLng: number;

  @Prop({ default: 3.5 })
  radiusKm: number;

  @Prop({ default: 9 })
  defaultDeliveryMinutes: number;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
AreaSchema.index({ centerLat: 1, centerLng: 1 });
AreaSchema.index({ pincodes: 1 });
