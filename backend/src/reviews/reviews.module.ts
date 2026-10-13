import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RiderReview, RiderReviewSchema } from './schemas/rider-review.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { DeliveryPartner, DeliveryPartnerSchema } from '../delivery/schemas/delivery-partner.schema';
import { TrackingModule } from '../tracking/tracking.module';
import { RiderReviewsService } from './rider-reviews.service';
import { RiderReviewsController } from './rider-reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RiderReview.name, schema: RiderReviewSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: DeliveryPartner.name, schema: DeliveryPartnerSchema },
    ]),
    TrackingModule,
  ],
  controllers: [RiderReviewsController],
  providers: [RiderReviewsService],
  exports: [RiderReviewsService],
})
export class ReviewsModule {}
