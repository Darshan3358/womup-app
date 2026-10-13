import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController, GiftCardsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UserSettings, UserSettingsSchema } from './schemas/user-settings.schema';
import { UserPaymentMethods, UserPaymentMethodsSchema } from './schemas/user-payment-methods.schema';
import { GiftCard, GiftCardSchema, GiftCardRedemption, GiftCardRedemptionSchema } from './schemas/gift-card.schema';
import { UserReward, UserRewardSchema } from './schemas/user-reward.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { WalletTransaction, WalletTransactionSchema } from '../wallet/schemas/wallet-transaction.schema';
import { CoinTransaction, CoinTransactionSchema } from '../coins/schemas/coin-transaction.schema';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSettings.name, schema: UserSettingsSchema },
      { name: UserPaymentMethods.name, schema: UserPaymentMethodsSchema },
      { name: GiftCard.name, schema: GiftCardSchema },
      { name: GiftCardRedemption.name, schema: GiftCardRedemptionSchema },
      { name: UserReward.name, schema: UserRewardSchema },
      { name: User.name, schema: UserSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
    ]),
    TrackingModule,
  ],
  controllers: [SettingsController, GiftCardsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
