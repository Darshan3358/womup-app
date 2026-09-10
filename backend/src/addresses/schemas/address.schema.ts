import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ collection: 'addresses', timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['Home', 'Work', 'Other', 'Current'], default: 'Home' })
  label: string;

  @Prop({ required: true })
  houseNumber: string;

  @Prop({ required: true })
  street: string;

  @Prop({ default: '' })
  landmark: string;

  @Prop({ required: true })
  city: string;

  @Prop({ default: 'Gujarat' })
  state: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [72.5714, 23.0225],
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: '' })
  deliveryInstructions: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
AddressSchema.index({ location: '2dsphere' });
