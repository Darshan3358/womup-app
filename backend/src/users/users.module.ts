import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { IncomeTransaction, IncomeTransactionSchema } from './schemas/income-transaction.schema';
import { ApprovedPincode, ApprovedPincodeSchema } from '../areas/schemas/approved-pincode.schema';
import { CoinTransaction, CoinTransactionSchema } from '../coins/schemas/coin-transaction.schema';
import { TeamPurchaseIncome, TeamPurchaseIncomeSchema } from './schemas/team-purchase-income.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { WishlistController } from './wishlist.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
      { name: ApprovedPincode.name, schema: ApprovedPincodeSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
      { name: TeamPurchaseIncome.name, schema: TeamPurchaseIncomeSchema },
    ]),
    TrackingModule,
  ],
  controllers: [UsersController, WishlistController, AdminCustomersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
