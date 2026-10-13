import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovedPincodeDocument = ApprovedPincode & Document;

@Schema({ collection: 'approved_pincodes', timestamps: true })
export class ApprovedPincode {
  @Prop({ required: true, unique: true, index: true, trim: true })
  pincode: string; // e.g. "380015"

  @Prop({ type: Types.ObjectId, ref: 'City', index: true })
  cityId?: Types.ObjectId;

  @Prop({ required: true, default: 'Ahmedabad' })
  cityName: string;

  @Prop({ default: true })
  isRegistrationAllowed: boolean;

  @Prop({ default: true })
  isDeliveryAllowed: boolean;

  @Prop()
  areaName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  addedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const ApprovedPincodeSchema = SchemaFactory.createForClass(ApprovedPincode);
