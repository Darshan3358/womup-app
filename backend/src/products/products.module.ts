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
import { StoresModule } from '../stores/stores.module';
import { AreasModule } from '../areas/areas.module';
import { AreaPricing, AreaPricingSchema } from '../areas/schemas/area-pricing.schema';
import { Inventory, InventorySchema } from '../inventory/schemas/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: AreaPricing.name, schema: AreaPricingSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
    AreasModule,
    StoresModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

