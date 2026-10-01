import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CityDocument = City & Document;

@Schema({ collection: 'cities', timestamps: true })
export class City {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  code: string;

  @Prop({ default: 'Gujarat', trim: true })
  state: string;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const CitySchema = SchemaFactory.createForClass(City);
CitySchema.index({ code: 1 }, { unique: true });
CitySchema.index({ name: 1 }, { unique: true });
