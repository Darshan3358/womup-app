import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: true, default: 5 }) // In Kilometers
  serviceRadiusKm: number;

  @Prop({ default: 9 }) // In Minutes
  estimatedDeliveryMinutes: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '07:00' })
  openingTime: string;

  @Prop({ default: '23:00' })
  closingTime: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
StoreSchema.index({ location: '2dsphere' });
