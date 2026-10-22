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
  @ApiOperation({ summary: 'Resolve GPS coordinates to a delivery area/zone and serving dark store' })
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
      const defaultRes = await this.areasService.detectArea(
        (defaultArea as any).centerLat || 23.0141,
        (defaultArea as any).centerLng || 72.5067,
      );
      return {
        ...defaultRes,
        isDefault: true,
      };
    }

    const detected = await this.areasService.detectArea(lat, lng);
    if (!detected || !detected.success || !detected.areaId) {
      return {
        success: false,
        serviceable: false,
        message: detected?.message || 'Delivery is not available at this location',
        deliveryMinutes: 0,
      };
    }

    return {
      ...detected,
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

  @Post('detect-area')
  @ApiOperation({ summary: 'Detect delivery area and dark store using GeoJSON Point-in-Polygon spatial query' })
  @ApiBody({ schema: { properties: { cityId: { type: 'string' }, areaId: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, latitude: { type: 'number' }, longitude: { type: 'number' } } } })
  async detectAreaLocation(@Body() body: { cityId?: string; areaId?: string; lat?: number; lng?: number; latitude?: number; longitude?: number }) {
    const lat = Number(body.lat ?? body.latitude);
    const lng = Number(body.lng ?? body.longitude);
    return this.areasService.detectArea(lat, lng, body.cityId, body.areaId);
  }
}

@ApiTags('Detect Area')
@Controller('api/v1')
export class DetectAreaController {
  constructor(private readonly areasService: AreasService) {}

  @Post('detect-area')
  @ApiOperation({ summary: 'Detect delivery area from coordinates using GeoJSON boundaries in MongoDB' })
  @ApiBody({ schema: { properties: { cityId: { type: 'string' }, areaId: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, latitude: { type: 'number' }, longitude: { type: 'number' } } } })
  async detectArea(@Body() body: { cityId?: string; areaId?: string; lat?: number; lng?: number; latitude?: number; longitude?: number }) {
    const lat = Number(body.lat ?? body.latitude);
    const lng = Number(body.lng ?? body.longitude);
    return this.areasService.detectArea(lat, lng, body.cityId, body.areaId);
  }
}

@ApiTags('Delivery & Quotes')
@Controller('api/v1/delivery')
export class DeliveryQuoteController {
  @Post('quote')
  @ApiOperation({ summary: 'Calculate delivery quote from OSRM road distance' })
  async getDeliveryQuote(@Body() body: any) {
    const fromLat = Number(body.from?.lat ?? body.fromLat);
    const fromLng = Number(body.from?.lng ?? body.fromLng);
    const toLat = Number(body.to?.lat ?? body.toLat);
    const toLng = Number(body.to?.lng ?? body.toLng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      throw new BadRequestException('Valid from and to coordinates are required');
    }

    let distanceKm = 2.5;
    let durationMinutes = 9;
    let routeCoordinates: Array<[number, number]> = [];

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(osrmUrl, { signal: ctrl.signal });
      clearTimeout(tid);

      if (res.ok) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes && json.routes[0]) {
          const route = json.routes[0];
          distanceKm = Number(((route.distance || 0) / 1000).toFixed(2));
          durationMinutes = Math.max(1, Math.round((distanceKm / 22) * 60));
          routeCoordinates = (route.geometry?.coordinates || []).map(
            ([lng, lat]: [number, number]) => [lat, lng],
          );
        }
      }
    } catch {
      // Haversine fallback
      const R = 6371;
      const dLat = ((toLat - fromLat) * Math.PI) / 180;
      const dLon = ((toLng - fromLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((fromLat * Math.PI) / 180) *
          Math.cos((toLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Number((R * c).toFixed(2));
      durationMinutes = Math.max(1, Math.round((distanceKm / 20) * 60));
      routeCoordinates = [
        [fromLat, fromLng],
        [fromLat + (toLat - fromLat) * 0.5, fromLng + (toLng - fromLng) * 0.5],
        [toLat, toLng],
      ];
    }

    const ratePerKm = 11.5;
    const minFee = 40;
    const maxFee = 150;
    const rawFee = distanceKm * ratePerKm;
    const deliveryFee = Math.min(maxFee, Math.max(minFee, Math.round(rawFee)));

    return {
      success: true,
      distanceKm,
      durationMinutes,
      deliveryFee,
      ratePerKm,
      minFee,
      maxFee,
      routeCoordinates,
      currency: 'INR',
    };
  }
}
