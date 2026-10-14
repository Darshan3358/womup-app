import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ── Country ──
export type CountryDocument = Country & Document;
@Schema({ collection: 'countries', timestamps: true })
export class Country {
  @Prop({ required: true, unique: true, trim: true })
  code: string; // e.g. "IN"

  @Prop({ required: true, trim: true })
  name: string; // e.g. "India"

  @Prop({ default: true })
  isActive: boolean;
}
export const CountrySchema = SchemaFactory.createForClass(Country);

// ── State ──
export type StateDocument = State & Document;
@Schema({ collection: 'states', timestamps: true })
export class State {
  @Prop({ required: true, trim: true })
  code: string; // e.g. "GJ"

  @Prop({ required: true, trim: true })
  name: string; // e.g. "Gujarat"

  @Prop({ default: 'IN', trim: true })
  countryCode: string;

  @Prop({ default: true })
  isActive: boolean;
}
export const StateSchema = SchemaFactory.createForClass(State);
StateSchema.index({ code: 1, countryCode: 1 }, { unique: true });

// ── District ──
export type DistrictDocument = District & Document;
@Schema({ collection: 'districts', timestamps: true })
export class District {
  @Prop({ required: true, trim: true })
  name: string; // e.g. "Ahmedabad"

  @Prop({ default: 'Gujarat', trim: true })
  stateName: string;

  @Prop({ default: true })
  isActive: boolean;
}
export const DistrictSchema = SchemaFactory.createForClass(District);
DistrictSchema.index({ name: 1, stateName: 1 });

// ── Taluka ──
export type TalukaDocument = Taluka & Document;
@Schema({ collection: 'talukas', timestamps: true })
export class Taluka {
  @Prop({ required: true, trim: true })
  name: string; // e.g. "Daskroi", "Sanand"

  @Prop({ required: true, trim: true })
  districtName: string;

  @Prop({ default: true })
  isActive: boolean;
}
export const TalukaSchema = SchemaFactory.createForClass(Taluka);
TalukaSchema.index({ name: 1, districtName: 1 });
