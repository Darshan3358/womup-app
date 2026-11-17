import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyIncomeDistributionDocument = DailyIncomeDistribution & Document;

@Schema({ timestamps: true })
export class DailyIncomeDistribution {
  @Prop({ required: true, unique: true, index: true })
  date: string; // Format: YYYY-MM-DD (Asia/Kolkata date)

  @Prop({ required: true, default: Date.now })
  executedAt: Date;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({ required: true, default: 0 })
  userCount: number;

  @Prop({ required: true, default: 0 })
  transactionCount: number;

  @Prop({
    type: {
      referralIncome: { type: Number, default: 0 },
      levelIncome: { type: Number, default: 0 },
      otherIncome: { type: Number, default: 0 },
    },
    default: { referralIncome: 0, levelIncome: 0, otherIncome: 0 },
  })
  breakdown: {
    referralIncome: number;
    levelIncome: number;
    otherIncome: number;
  };

  @Prop({ required: true, default: 'SUCCESS', enum: ['SUCCESS', 'PARTIAL', 'FAILED'] })
  status: string;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({ type: [Object], default: [] })
  distributionSummary: Array<{
    userId: string;
    userName: string;
    totalAmount: number;
    referralAmount: number;
    levelAmount: number;
    otherAmount: number;
    txCount: number;
  }>;

  @Prop({ type: String, default: null })
  errorDetails?: string;
}

export const DailyIncomeDistributionSchema =
  SchemaFactory.createForClass(DailyIncomeDistribution);
