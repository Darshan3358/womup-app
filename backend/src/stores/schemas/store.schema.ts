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

  @Prop({ trim: true })
  cityName?: string;

  @Prop({ type: Object, ref: 'City' })
  cityId?: any;

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

  @Prop({ default: true })
  isOnShift?: boolean;

  @Prop({ default: '07:00' })
  openingTime: string;

  @Prop({ default: '23:00' })
  closingTime: string;

  @Prop({ type: Object, ref: 'Area' })
  areaId?: any;

  @Prop({ trim: true })
  areaName?: string;

  @Prop({ trim: true })
  managerName?: string;

  @Prop({ trim: true })
  managerPhone?: string;

  @Prop({ trim: true })
  ownerName?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, default: 'ACTIVE' })
  status?: string;

  @Prop({ trim: true, lowercase: true, sparse: true })
  loginId?: string;

  @Prop()
  loginPasswordHash?: string;

  @Prop()
  passwordUpdatedAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ trim: true })
  lastLoginBy?: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
StoreSchema.index({ location: '2dsphere' });
StoreSchema.index({ loginId: 1 }, { unique: true, sparse: true });
StoreSchema.index({ areaId: 1, isActive: 1 });
