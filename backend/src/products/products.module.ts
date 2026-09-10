import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Product,
  ProductSchema,
  ProductVariant,
  ProductVariantSchema,
} from './schemas/product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AreaPricing, AreaPricingSchema } from '../areas/schemas/area-pricing.schema';
import { AreasModule } from '../areas/areas.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: AreaPricing.name, schema: AreaPricingSchema },
    ]),
    AreasModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

