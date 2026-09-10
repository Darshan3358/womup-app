import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Area, AreaSchema } from './schemas/area.schema';
import { AreaPricing, AreaPricingSchema } from './schemas/area-pricing.schema';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Area.name, schema: AreaSchema },
      { name: AreaPricing.name, schema: AreaPricingSchema },
    ]),
  ],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
