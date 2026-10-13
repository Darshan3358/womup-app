import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RiderReviewsService, RateRiderDto } from './rider-reviews.service';

@Controller('api/v1')
export class RiderReviewsController {
  constructor(private readonly riderReviewsService: RiderReviewsService) {}

  /**
   * Check if an order is eligible for rider review
   */
  @Get('orders/:orderId/review-status')
  async getReviewStatus(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?._id;
    return this.riderReviewsService.getReviewStatus(orderId, userId);
  }

  /**
   * Submit rider rating, tags, comment, and optional tip
   */
  @Post('orders/:orderId/rate-rider')
  @HttpCode(HttpStatus.OK)
  async submitRiderReview(
    @Param('orderId') orderId: string,
    @Body() dto: RateRiderDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.riderReviewsService.submitRiderReview(orderId, userId, dto);
  }

  /**
   * Get reviews for a specific delivery partner (Admin & Rider dashboard)
   */
  @Get('admin/riders/:riderId/reviews')
  async getRiderReviews(
    @Param('riderId') riderId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.riderReviewsService.getRiderReviews(riderId, pageNum, limitNum);
  }
}
