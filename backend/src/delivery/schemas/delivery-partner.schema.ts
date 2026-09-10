import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryPartnerDocument = DeliveryPartner & Document;
export type DeliveryAssignmentDocument = DeliveryAssignment & Document;
export type DeliveryLocationDocument = DeliveryLocation & Document;

@Schema({ collection: 'delivery_partners', timestamps: true })
export class DeliveryPartner {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ default: 'Two Wheeler' })
  vehicleType: string;

  @Prop({ required: true })
  vehicleNumber: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [72.5714, 23.0225],
    },
  })
  currentLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 4.9 })
  rating: number;

  @Prop({ default: 0 })
  completedDeliveries: number;
}

export const DeliveryPartnerSchema =
  SchemaFactory.createForClass(DeliveryPartner);
DeliveryPartnerSchema.index({ currentLocation: '2dsphere' });

@Schema({ collection: 'delivery_assignments', timestamps: true })
export class DeliveryAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  partnerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'COMPLETED', 'CANCELLED'],
    default: 'ASSIGNED',
  })
  status: string;

  @Prop({ default: Date.now })
  assignedAt: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const DeliveryAssignmentSchema =
  SchemaFactory.createForClass(DeliveryAssignment);

@Schema({ collection: 'delivery_locations', timestamps: true })
export class DeliveryLocation {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  partnerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  orderId?: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0 })
  speedKmph: number;

  @Prop({ default: 0 })
  headingDegrees: number;
}

export const DeliveryLocationSchema =
  SchemaFactory.createForClass(DeliveryLocation);
DeliveryLocationSchema.index({ location: '2dsphere' });
