import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { BannersModule } from '../banners/banners.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [ProductsModule, CategoriesModule, BannersModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
