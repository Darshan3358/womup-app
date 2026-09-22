import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('Stores & Serviceability')
@Controller('api/v1')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('stores')
  @ApiOperation({ summary: 'Get list of all active dark stores' })
  async getStores() {
    return this.storesService.findAll();
  }

  @Get('stores/:id')
  @ApiOperation({ summary: 'Get dark store by ID' })
  async getStoreById(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Post('serviceability/check')
  @ApiOperation({ summary: 'Check hyper-local 9-minute serviceability for customer coordinates' })
  @ApiResponse({ status: 200, description: 'Serviceability status, assigned store, and delivery ETA' })
  async checkServiceability(
    @Body() body: { latitude: number; longitude: number; pincode?: string },
  ) {
    return this.storesService.checkServiceability(body.latitude, body.longitude);
  }

  @Post('location/resolve')
  @ApiOperation({ summary: 'Resolve customer GPS to serviceable area and dark store' })
  @ApiResponse({ status: 200, description: 'Resolved area and dark store details' })
  async resolveLocation(
    @Body() body: { latitude: number; longitude: number; pincode?: string },
  ) {
    const res = await this.storesService.checkServiceability(body.latitude, body.longitude);
    return {
      serviceable: res.serviceable,
      areaId: res.areaId,
      areaName: res.areaName,
      storeId: res.storeId,
      storeName: res.storeName,
      storeCode: res.storeCode,
      city: 'Ahmedabad',
      deliveryMinutes: res.estimatedDeliveryMinutes || 9,
      message: res.message,
    };
  }
}
