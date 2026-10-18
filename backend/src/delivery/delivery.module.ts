import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  DeliveryPartner,
  DeliveryPartnerSchema,
  DeliveryAssignment,
  DeliveryAssignmentSchema,
  RiderSettlement,
  RiderSettlementSchema,
  RiderBankAccount,
  RiderBankAccountSchema,
  RiderDutySession,
  RiderDutySessionSchema,
  DeliveryPartnerDocumentItem,
  DeliveryPartnerDocumentSchema,
  SupportTicket,
  SupportTicketSchema,
  RiderLocationLog,
  RiderLocationLogSchema,
  DeliveryLocation,
  DeliveryLocationSchema,
  RiderSettlementRequest,
  RiderSettlementRequestSchema,
} from './schemas/delivery-partner.schema';
import { RiderPayoutRate, RiderPayoutRateSchema } from './schemas/rider-payout-rate.schema';
import { RiderOtpVerification, RiderOtpVerificationSchema } from './schemas/rider-otp.schema';

import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { OtpVerification, OtpVerificationSchema } from '../auth/schemas/otp.schema';
import { Fast2SmsService } from '../auth/fast2sms.service';
import { EmailService } from '../auth/email.service';
import { TrackingModule } from '../tracking/tracking.module';

// Controllers
import { DeliveryAuthController } from './auth/delivery-auth.controller';
import { RiderController } from './rider/rider.controller';
import { AdminRidersController } from './rider/admin-riders.controller';
import { DeliveryOrderController } from './delivery-orders/delivery-order.controller';
import { SettlementController } from './settlements/settlement.controller';
import { DutyController } from './duty/duty.controller';
import { DocumentController } from './documents/document.controller';
import { SupportController } from './support/support.controller';

// Services
import { DeliveryAuthService } from './auth/delivery-auth.service';
import { RiderService } from './rider/rider.service';
import { DeliveryOrderService } from './delivery-orders/delivery-order.service';
import { SettlementService } from './settlements/settlement.service';
import { DutyService } from './duty/duty.service';
import { DocumentService } from './documents/document.service';
import { SupportService } from './support/support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: DeliveryAssignment.name, schema: DeliveryAssignmentSchema },
      { name: RiderSettlement.name, schema: RiderSettlementSchema },
      { name: RiderBankAccount.name, schema: RiderBankAccountSchema },
      { name: RiderDutySession.name, schema: RiderDutySessionSchema },
      { name: DeliveryPartnerDocumentItem.name, schema: DeliveryPartnerDocumentSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: RiderLocationLog.name, schema: RiderLocationLogSchema },
      { name: DeliveryLocation.name, schema: DeliveryLocationSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Store.name, schema: StoreSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
      { name: RiderPayoutRate.name, schema: RiderPayoutRateSchema },
      { name: RiderOtpVerification.name, schema: RiderOtpVerificationSchema },
      { name: RiderSettlementRequest.name, schema: RiderSettlementRequestSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_ACCESS_SECRET',
          'wormup_super_secure_access_token_secret_2026',
        ),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '30d'),
        },
      }),
      inject: [ConfigService],
    }),
    TrackingModule,
  ],
  controllers: [
    DeliveryAuthController,
    RiderController,
    AdminRidersController,
    DeliveryOrderController,
    SettlementController,
    DutyController,
    DocumentController,
    SupportController,
  ],
  providers: [
    DeliveryAuthService,
    RiderService,
    DeliveryOrderService,
    SettlementService,
    DutyService,
    DocumentService,
    SupportService,
    Fast2SmsService,
    EmailService,
  ],
  exports: [
    DeliveryAuthService,
    RiderService,
    DeliveryOrderService,
    SettlementService,
  ],
})
export class DeliveryModule {}
