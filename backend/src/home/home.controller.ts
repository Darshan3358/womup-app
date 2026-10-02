import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('Home')
@Controller('api/v1/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('sections')
  @ApiOperation({ summary: 'Get unified home screen data including hero banners, categories, and 7 curated product sections' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Dark store ID' })
  @ApiQuery({ name: 'areaId', required: false, description: 'Area ID for localized pricing' })
  async getHomeSections(
    @Query('storeId') storeId?: string,
    @Query('areaId') areaId?: string,
  ) {
    return this.homeService.getHomeSections(storeId, areaId);
  }
}
