import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import {
  OrderStatusHistory,
  OrderStatusHistorySchema,
} from './schemas/order-status-history.schema';
import { Address, AddressSchema } from '../addresses/schemas/address.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  CoinTransaction,
  CoinTransactionSchema,
} from '../coins/schemas/coin-transaction.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from '../wallet/schemas/wallet-transaction.schema';
import {
  DeliveryPartner,
  DeliveryPartnerSchema,
  DeliveryAssignment,
  DeliveryAssignmentSchema,
} from '../delivery/schemas/delivery-partner.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StoreOrdersController } from './store-orders.controller';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { TrackingModule } from '../tracking/tracking.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CartModule,
    InventoryModule,
    TrackingModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatusHistory.name, schema: OrderStatusHistorySchema },
      { name: Address.name, schema: AddressSchema },
      { name: Store.name, schema: StoreSchema },
      { name: User.name, schema: UserSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: DeliveryAssignment.name, schema: DeliveryAssignmentSchema },
    ]),
  ],
  controllers: [
    OrdersController,
    StoreOrdersController,
    DeliveryOrdersController,
    AdminOrdersController,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
