import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AreasService } from './areas.service';

@ApiTags('Location & Areas')
@Controller('api/v1/location')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get('cities')
  @ApiOperation({ summary: 'List all active cities' })
  async listCities() {
    const cities = await this.areasService.getAllCities();
    return { success: true, data: cities };
  }

  @Post('resolve')
  @ApiOperation({ summary: 'Resolve GPS coordinates to a delivery area/zone' })
  @ApiBody({ schema: { properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } } })
  async resolveLocation(@Body() body: { latitude?: number; longitude?: number }) {
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      // Return default area when coords are missing/invalid
      const defaultArea = await this.areasService.getDefaultArea();
      if (!defaultArea) {
        throw new BadRequestException('No delivery areas configured yet. Run seed script first.');
      }
      return {
        success: true,
        areaId: (defaultArea as any)._id.toString(),
        areaName: defaultArea.name,
        city: defaultArea.city,
        cityName: (defaultArea as any).cityName || defaultArea.city,
        cityId: (defaultArea as any).cityId ? (defaultArea as any).cityId.toString() : null,
        deliveryMinutes: defaultArea.defaultDeliveryMinutes,
        isDefault: true,
      };
    }

    const area = await this.areasService.resolveAreaByCoords(lat, lng);
    if (!area) {
      throw new BadRequestException('No delivery zone found for your location. Service may not be available yet.');
    }

    return {
      success: true,
      areaId: (area as any)._id.toString(),
      areaName: area.name,
      city: area.city,
      cityName: (area as any).cityName || area.city,
      cityId: (area as any).cityId ? (area as any).cityId.toString() : null,
      deliveryMinutes: area.defaultDeliveryMinutes,
      isDefault: false,
    };
  }

  @Get('areas')
  @ApiOperation({ summary: 'List all active delivery areas/zones (optionally filtered by cityId)' })
  @ApiQuery({ name: 'cityId', required: false })
  async listAreas(@Query('cityId') cityId?: string) {
    const areas = await this.areasService.getAllAreas(cityId);
    return { success: true, data: areas };
  }
}
