import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RazorpayWebhookDocument = RazorpayWebhook & Document;

@Schema({ collection: 'razorpay_webhooks', timestamps: true })
export class RazorpayWebhook {
  @Prop({ required: true, index: true })
  event: string; // e.g. "payment.captured", "payment.failed"

  @Prop({ required: false, index: true })
  razorpayOrderId?: string;

  @Prop({ required: false, index: true })
  razorpayPaymentId?: string;

  @Prop({ required: false })
  signature?: string;

  @Prop({ default: false })
  signatureValid: boolean;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ default: () => new Date() })
  receivedAt: Date;

  @Prop({ default: false, index: true })
  processed: boolean;

  @Prop({ required: false })
  processedAt?: Date;

  @Prop({ required: false })
  errorMessage?: string;
}

export const RazorpayWebhookSchema = SchemaFactory.createForClass(RazorpayWebhook);
RazorpayWebhookSchema.index({ razorpayPaymentId: 1, event: 1 });
