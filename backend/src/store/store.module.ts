import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StoreStaff, StoreStaffSchema } from './schemas/store-staff.schema';
import { PickList, PickListSchema } from './schemas/pick-list.schema';
import { InventoryLog, InventoryLogSchema } from './schemas/inventory-log.schema';

import { User, UserSchema } from '../users/schemas/user.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Inventory, InventorySchema } from '../inventory/schemas/inventory.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { DeliveryPartner, DeliveryPartnerSchema } from '../delivery/schemas/delivery-partner.schema';
import { OtpVerification, OtpVerificationSchema } from '../auth/schemas/otp.schema';

import { MailService } from '../common/services/mail.service';
import { TrackingModule } from '../tracking/tracking.module';

import { StoreAuthController } from './auth/store-auth.controller';
import { StoreOrdersController } from './orders/store-orders.controller';
import { StoreInventoryController } from './inventory/store-inventory.controller';

import { StoreAuthService } from './auth/store-auth.service';
import { StoreOrdersService } from './orders/store-orders.service';
import { StoreInventoryService } from './inventory/store-inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreStaff.name, schema: StoreStaffSchema },
      { name: PickList.name, schema: PickListSchema },
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
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
    StoreAuthController,
    StoreOrdersController,
    StoreInventoryController,
  ],
  providers: [
    StoreAuthService,
    StoreOrdersService,
    StoreInventoryService,
    MailService,
  ],
  exports: [
    StoreAuthService,
    StoreOrdersService,
    StoreInventoryService,
  ],
})
export class StoreModule {}
