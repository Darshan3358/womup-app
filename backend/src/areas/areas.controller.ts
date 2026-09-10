import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AreasService } from './areas.service';

@ApiTags('Location & Areas')
@Controller('api/v1/location')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

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
      deliveryMinutes: area.defaultDeliveryMinutes,
      isDefault: false,
    };
  }

  @Get('areas')
  @ApiOperation({ summary: 'List all active delivery areas/zones' })
  async listAreas() {
    const areas = await this.areasService.getAllAreas();
    return { success: true, data: areas };
  }
}
