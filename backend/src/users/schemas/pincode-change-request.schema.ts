import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PincodeChangeRequestDocument = PincodeChangeRequest & Document;

@Schema({ collection: 'pincode_change_requests', timestamps: true })
export class PincodeChangeRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ required: true, trim: true })
  userPhone: string;

  @Prop({ trim: true })
  userEmail?: string;

  @Prop({ trim: true })
  currentPincode?: string;

  @Prop({ required: true, trim: true })
  requestedPincode: string;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  proofDocumentUrl?: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ trim: true })
  adminNotes?: string;

  @Prop({ trim: true })
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop({ default: false })
  isEligiblePincode?: boolean;
}

export const PincodeChangeRequestSchema = SchemaFactory.createForClass(PincodeChangeRequest);
