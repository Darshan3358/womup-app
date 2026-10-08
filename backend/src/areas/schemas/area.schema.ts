import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AreaDocument = Area & Document;

@Schema({ collection: 'areas', timestamps: true })
export class Area {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ trim: true })
  cityName?: string;

  @Prop({ type: Object, ref: 'City' })
  cityId?: any;

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

  @Prop({ trim: true })
  code?: string;

  @Prop({
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon',
    },
    coordinates: {
      type: [[[Number]]], // [[[lng, lat], [lng, lat], ...]]
    },
  })
  polygon?: {
    type: string;
    coordinates: number[][][];
  };

  @Prop({ default: 1 })
  maxStores: number;

  @Prop({ default: 0 })
  currentStoreCount: number;

  @Prop({ default: 'NEAREST', enum: ['NEAREST', 'LOAD_BALANCED', 'STOCK_FIRST', 'ROUND_ROBIN', 'PRIORITY'] })
  storeRoutingStrategy: string;

  @Prop({ type: Object, ref: 'Store' })
  hubStoreId?: any;
}

export const AreaSchema = SchemaFactory.createForClass(Area);
AreaSchema.index({ centerLat: 1, centerLng: 1 });
AreaSchema.index({ pincodes: 1 });
AreaSchema.index({ polygon: '2dsphere' });
