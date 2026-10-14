import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamPurchaseIncomeDocument = TeamPurchaseIncome & Document;

@Schema({ _id: false })
export class LevelStatSnapshot {
  @Prop({ required: true })
  level: number;

  @Prop({ default: 0 })
  memberCount: number;

  @Prop({ default: 0 })
  activeMemberCount: number;

  @Prop({ default: 0 })
  vegetableGMV: number;

  @Prop({ default: 0 })
  otherGMV: number;

  @Prop({ default: 0 })
  incomeEarned: number;
}

@Schema({ collection: 'team_purchase_income', timestamps: true })
export class TeamPurchaseIncome {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  month: string; // e.g. "2026-10"

  @Prop({ default: 0 })
  teamSize: number; // Total downline count in 7 levels

  @Prop({ default: 0 })
  personalPurchaseValue: number; // User's own monthly spend

  @Prop({ default: 0 })
  direct5ActiveCount: number; // How many of direct 5 were active

  @Prop({ default: false })
  isEligible: boolean; // personalPurchase >= 2000 && direct5ActiveCount >= 5

  @Prop({ default: 0 })
  vegetablePurchaseValue: number; // Total team vegetable GMV

  @Prop({ default: 0 })
  otherPurchaseValue: number; // Total team other products GMV

  @Prop({ default: 0 })
  vegetableIncome: number; // 3% of vegetablePurchaseValue

  @Prop({ default: 0 })
  otherIncome: number; // 0.4% of otherPurchaseValue

  @Prop({ default: 0 })
  totalIncome: number; // vegetableIncome + otherIncome

  @Prop({ type: [LevelStatSnapshot], default: [] })
  levelBreakdown: LevelStatSnapshot[];

  @Prop({
    required: true,
    enum: ['PENDING', 'AVAILABLE', 'CREDITED', 'LAPSED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop({ default: () => new Date() })
  calculatedAt: Date;

  @Prop({ required: true })
  availableFrom: Date; // Next day midnight
}

export const TeamPurchaseIncomeSchema = SchemaFactory.createForClass(TeamPurchaseIncome);
TeamPurchaseIncomeSchema.index({ userId: 1, month: 1 }, { unique: true });
TeamPurchaseIncomeSchema.index({ month: 1, status: 1 });
