import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CoinTransaction,
  CoinTransactionSchema,
} from './schemas/coin-transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
