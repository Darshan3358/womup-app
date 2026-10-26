import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { VendorCategory, VendorCategorySchema } from './schemas/vendor-category.schema';
import { VendorTransaction, VendorTransactionSchema } from './schemas/vendor-transaction.schema';
import { VendorCollectionRequest, VendorCollectionRequestSchema } from './schemas/vendor-collection-request.schema';
import { VendorSettlement, VendorSettlementSchema } from './schemas/vendor-settlement.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { IncomeTransaction, IncomeTransactionSchema } from '../users/schemas/income-transaction.schema';
import { CoinTransaction, CoinTransactionSchema } from '../coins/schemas/coin-transaction.schema';
import { DeliveryPartner, DeliveryPartnerSchema } from '../delivery/schemas/delivery-partner.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { TrackingModule } from '../tracking/tracking.module';
import { AuthModule } from '../auth/auth.module';
import { LocalShopsController } from './local-shops.controller';
import { LocalShopsService } from './local-shops.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: VendorCategory.name, schema: VendorCategorySchema },
      { name: VendorTransaction.name, schema: VendorTransactionSchema },
      { name: VendorCollectionRequest.name, schema: VendorCollectionRequestSchema },
      { name: VendorSettlement.name, schema: VendorSettlementSchema },
      { name: User.name, schema: UserSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    TrackingModule,
    AuthModule,
  ],
  controllers: [LocalShopsController],
  providers: [LocalShopsService],
  exports: [LocalShopsService],
})
export class LocalShopsModule {}
