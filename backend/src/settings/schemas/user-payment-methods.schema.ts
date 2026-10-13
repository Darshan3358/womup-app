import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserPaymentMethodsDocument = UserPaymentMethods & Document;

@Schema({ _id: true, timestamps: true })
export class SavedPaymentMethod {
  @Prop({ required: true, enum: ['UPI', 'CARD', 'COD'] })
  type: string;

  @Prop()
  upiId?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  verified: boolean;

  @Prop({ default: 'Personal UPI' })
  label: string;
}
export const SavedPaymentMethodSchema = SchemaFactory.createForClass(SavedPaymentMethod);

@Schema({ collection: 'user_payment_methods', timestamps: true })
export class UserPaymentMethods {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [SavedPaymentMethodSchema], default: [] })
  methods: SavedPaymentMethod[];

  @Prop({ default: true })
  codEnabled: boolean;

  @Prop({ default: 'UPI' })
  preferredMethod: string;
}

export const UserPaymentMethodsSchema = SchemaFactory.createForClass(UserPaymentMethods);
