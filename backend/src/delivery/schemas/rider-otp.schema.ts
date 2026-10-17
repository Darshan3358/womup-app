import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RiderOtpVerificationDocument = RiderOtpVerification & Document;

@Schema({ collection: 'rider_otp_verifications', timestamps: true })
export class RiderOtpVerification {
  @Prop({ required: true, index: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true, unique: true })
  verificationId: string;

  @Prop({ required: false, default: null })
  registrationToken?: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const RiderOtpVerificationSchema = SchemaFactory.createForClass(RiderOtpVerification);
RiderOtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire TTL after 10 mins
