import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannersService } from './banners.service';

@ApiTags('Banners & Promotions')
@Controller('api/v1/banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get promotional video & image banners' })
  async getBanners(@Query('placement') placement?: string) {
    return this.bannersService.findAll(placement);
  }
}
