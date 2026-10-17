import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DeliveryPartner, DeliveryPartnerSchema } from '../delivery/schemas/delivery-partner.schema';
import { Vendor, VendorSchema } from '../local-shops/schemas/vendor.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
  ],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}

