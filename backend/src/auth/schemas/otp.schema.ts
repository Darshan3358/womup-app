import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpVerificationDocument = OtpVerification & Document;

@Schema({ collection: 'otp_verifications', timestamps: true })
export class OtpVerification {
  @Prop({ required: false, index: true })
  phone?: string;

  @Prop({ required: false, index: true, lowercase: true, trim: true })
  email?: string;

  @Prop({ required: false, default: 'LOGIN' })
  purpose?: string;

  @Prop({ required: false })
  verifiedAt?: Date;

  @Prop({ required: false })
  otpHash?: string;

  @Prop({ default: 'pending' })
  status?: string;

  @Prop({ required: true })
  verificationId: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const OtpVerificationSchema = SchemaFactory.createForClass(OtpVerification);
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire TTL
