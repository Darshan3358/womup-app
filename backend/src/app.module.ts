import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { StoresModule } from './stores/stores.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { CoinsModule } from './coins/coins.module';
import { TrackingModule } from './tracking/tracking.module';
import { PrintingModule } from './printing/printing.module';
import { BannersModule } from './banners/banners.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AreasModule } from './areas/areas.module';
import { DeliveryModule } from './delivery/delivery.module';
import { StoreModule } from './store/store.module';
import { HomeModule } from './home/home.module';
import { SettingsModule } from './settings/settings.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    AddressesModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    CartModule,
    OrdersModule,
    WalletModule,
    CoinsModule,
    TrackingModule,
    PrintingModule,
    BannersModule,
    CloudinaryModule,
    AreasModule,
    DeliveryModule,
    StoreModule,
    HomeModule,
    SettingsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
