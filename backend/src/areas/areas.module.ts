import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Area, AreaSchema } from './schemas/area.schema';
import { AreaPricing, AreaPricingSchema } from './schemas/area-pricing.schema';
import { City, CitySchema } from './schemas/city.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import {
  Country,
  CountrySchema,
  State,
  StateSchema,
  District,
  DistrictSchema,
  Taluka,
  TalukaSchema,
} from './schemas/location-hierarchy.schema';
import { AreasService } from './areas.service';
import { AreasController, DetectAreaController, DeliveryQuoteController } from './areas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Area.name, schema: AreaSchema },
      { name: AreaPricing.name, schema: AreaPricingSchema },
      { name: City.name, schema: CitySchema },
      { name: Store.name, schema: StoreSchema },
      { name: Country.name, schema: CountrySchema },
      { name: State.name, schema: StateSchema },
      { name: District.name, schema: DistrictSchema },
      { name: Taluka.name, schema: TalukaSchema },
    ]),
  ],
  controllers: [AreasController, DetectAreaController, DeliveryQuoteController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
