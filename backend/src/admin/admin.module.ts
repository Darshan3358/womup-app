import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { WithdrawalRequest, WithdrawalRequestSchema } from '../users/schemas/withdrawal-request.schema';
import { PincodeChangeRequest, PincodeChangeRequestSchema } from '../users/schemas/pincode-change-request.schema';
import { IncomeTransaction, IncomeTransactionSchema } from '../users/schemas/income-transaction.schema';
import { DeliveryPartner, DeliveryPartnerSchema, RiderSettlement, RiderSettlementSchema } from '../delivery/schemas/delivery-partner.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { Vendor, VendorSchema } from '../local-shops/schemas/vendor.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { AdminAuditLog, AdminAuditLogSchema } from './schemas/admin-audit-log.schema';
import { AdminApprovalsService } from './admin-approvals.service';
import { AdminApprovalsController } from './admin-approvals.controller';
import { AdminRealtimeController } from './admin-realtime.controller';
import { TrackingModule } from '../tracking/tracking.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { CronModule } from '../cron/cron.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
      { name: PincodeChangeRequest.name, schema: PincodeChangeRequestSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: RiderSettlement.name, schema: RiderSettlementSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Order.name, schema: OrderSchema },
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
    ]),
    TrackingModule,
    NotificationsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CronModule),
  ],
  controllers: [AdminApprovalsController, AdminRealtimeController],
  providers: [AdminApprovalsService],
  exports: [AdminApprovalsService],
})
export class AdminModule {}
