import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyIncomeDistribution,
  DailyIncomeDistributionSchema,
} from './schemas/daily-income-distribution.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  IncomeTransaction,
  IncomeTransactionSchema,
} from '../users/schemas/income-transaction.schema';
import {
  CoinTransaction,
  CoinTransactionSchema,
} from '../coins/schemas/coin-transaction.schema';
import { DailyIncomeDistributionService } from './daily-income-distribution.service';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: DailyIncomeDistribution.name, schema: DailyIncomeDistributionSchema },
      { name: User.name, schema: UserSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
    ]),
    TrackingModule,
  ],
  providers: [DailyIncomeDistributionService],
  exports: [DailyIncomeDistributionService],
})
export class CronModule {}

