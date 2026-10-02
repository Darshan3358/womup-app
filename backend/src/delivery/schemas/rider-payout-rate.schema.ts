import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiderPayoutRateDocument = RiderPayoutRate & Document;

export enum PayoutScope {
  GLOBAL = 'GLOBAL',
  CITY = 'CITY',
  AREA = 'AREA',
}

@Schema({ timestamps: true, collection: 'rider_payout_rates' })
export class RiderPayoutRate {
  @Prop({ type: String, enum: PayoutScope, required: true, default: PayoutScope.GLOBAL })
  scope: PayoutScope;

  @Prop({ type: Types.ObjectId, ref: 'City', default: null })
  cityId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  cityName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Area', default: null })
  areaId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  areaName?: string;

  @Prop({ type: Number, required: true, default: 10 })
  ratePerKm: number;

  @Prop({ type: Number, required: true, default: 30 })
  minimumPayout: number;

  @Prop({ type: Number, required: true, default: 150 })
  maximumPayout: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  effectiveFrom: Date;

  @Prop({ type: Date, default: null })
  effectiveUntil?: Date;

  @Prop({ type: String, default: '' })
  description?: string;
}

export const RiderPayoutRateSchema = SchemaFactory.createForClass(RiderPayoutRate);

RiderPayoutRateSchema.index({ scope: 1, cityId: 1, areaId: 1 });
RiderPayoutRateSchema.index({ cityId: 1, areaId: 1, isActive: 1 });
