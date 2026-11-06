import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpVerificationDocument = OtpVerification & Document;

@Schema({ collection: 'otp_verifications', timestamps: true })
export class OtpVerification {
  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: false, index: true })
  phone?: string; // alias/backward-compatibility

  @Prop({ required: false, lowercase: true, trim: true })
  email?: string;

  @Prop({ required: true, default: '+91' })
  phoneCountryCode: string;

  @Prop({ required: true, default: 'LOGIN', index: true })
  purpose: string; // 'LOGIN' | 'SIGNUP' | 'PHONE_CHANGE' | 'DELIVERY_LOGIN'

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true, default: 'PENDING', enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'FAILED'], index: true })
  status: string;

  @Prop({ required: true, unique: true, index: true })
  verificationId: string;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop({ default: 0 })
  attempts: number; // alias for existing callers

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: () => new Date() })
  lastSentAt: Date;

  @Prop({ required: false })
  verifiedAt?: Date;
}

export const OtpVerificationSchema = SchemaFactory.createForClass(OtpVerification);
// Auto-expire TTL cleanup
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for querying recent OTP sessions and rate limiting
OtpVerificationSchema.index({ phoneNumber: 1, createdAt: -1 });
OtpVerificationSchema.index({ verificationId: 1 });
