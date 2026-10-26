import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

@Schema({ collection: 'withdrawal_requests', timestamps: true })
export class WithdrawalRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ trim: true })
  userPhone?: string;

  @Prop({ required: true, min: 600 })
  amount: number; // Gross requested amount

  @Prop({ required: true, default: 0 })
  tdsAmount: number; // 20% TDS deduction

  @Prop({ required: true })
  netAmount: number; // 80% Net payable to bank/UPI

  @Prop({ type: Object })
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    destination?: string;
  };

  @Prop({
    default: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    index: true,
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ trim: true })
  adminRemarks?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  settledAt?: Date;

  @Prop({ trim: true })
  transactionReference?: string;
}

export const WithdrawalRequestSchema = SchemaFactory.createForClass(WithdrawalRequest);
