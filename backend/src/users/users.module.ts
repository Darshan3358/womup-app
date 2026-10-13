import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { IncomeTransaction, IncomeTransactionSchema } from './schemas/income-transaction.schema';
import { ApprovedPincode, ApprovedPincodeSchema } from '../areas/schemas/approved-pincode.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { WishlistController } from './wishlist.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
      { name: ApprovedPincode.name, schema: ApprovedPincodeSchema },
    ]),
    TrackingModule,
  ],
  controllers: [UsersController, WishlistController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
