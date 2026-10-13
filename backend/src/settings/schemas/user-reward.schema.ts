import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRewardDocument = UserReward & Document;

@Schema({ collection: 'user_rewards', timestamps: true })
export class UserReward {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  shoppingCoins: number;

  @Prop({ default: true })
  scratchCardAvailable: boolean;

  @Prop()
  lastScratchAt?: Date;

  @Prop({ default: 1 })
  scratchStreak: number;

  @Prop({ default: 0 })
  totalCoinsEarned: number;

  @Prop({ default: 0 })
  coinsExpiringSoon: number;

  @Prop({ default: 'Bronze', enum: ['Bronze', 'Silver', 'Gold', 'Platinum'] })
  tier: string;
}

export const UserRewardSchema = SchemaFactory.createForClass(UserReward);
