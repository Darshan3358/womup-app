import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RazorpayOrder, RazorpayOrderSchema } from './schemas/razorpay-order.schema';
import { RazorpayWebhook, RazorpayWebhookSchema } from './schemas/razorpay-webhook.schema';
import { PaymentOrder, PaymentOrderSchema } from './schemas/payment-order.schema';
import { Vendor, VendorSchema } from '../local-shops/schemas/vendor.schema';
import { VendorTransaction, VendorTransactionSchema } from '../local-shops/schemas/vendor-transaction.schema';
import {
  VendorCollectionRequest,
  VendorCollectionRequestSchema,
} from '../local-shops/schemas/vendor-collection-request.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  IncomeTransaction,
  IncomeTransactionSchema,
} from '../users/schemas/income-transaction.schema';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RazorpayOrder.name, schema: RazorpayOrderSchema },
      { name: RazorpayWebhook.name, schema: RazorpayWebhookSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: VendorTransaction.name, schema: VendorTransactionSchema },
      { name: VendorCollectionRequest.name, schema: VendorCollectionRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: IncomeTransaction.name, schema: IncomeTransactionSchema },
    ]),
    TrackingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
