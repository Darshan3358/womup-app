import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('Stores & Serviceability')
@Controller(['api/v1', 'api', ''])
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
    const lat = typeof body?.latitude === 'number' ? body.latitude : Number(body?.latitude);
    const lng = typeof body?.longitude === 'number' ? body.longitude : Number(body?.longitude);
    const res = await this.storesService.checkServiceability(lat, lng);
    return {
      success: true,
      serviceable: res.serviceable,
      areaId: res.areaId,
      areaName: res.areaName,
      storeId: res.storeId,
      storeName: res.storeName,
      storeCode: res.storeCode,
      city: 'Ahmedabad',
      deliveryMinutes: res.estimatedDeliveryMinutes || 9,
      distanceKm: (res as any).distanceKm || 0,
      message: res.message,
    };
  }

  // ── Admin Store Approval Endpoints ──
  @Get('admin/stores')
  @ApiOperation({ summary: 'List all dark stores with status and search filters' })
  async adminGetStores(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.storesService.adminGetStores({ status, search });
    return { success: true, data };
  }

  @Get('admin/stores/pending')
  @ApiOperation({ summary: 'List all dark stores pending admin approval' })
  async adminGetPendingStores() {
    const data = await this.storesService.adminGetPendingStores();
    return { success: true, data };
  }

  @Post('admin/stores/:id/approve')
  @ApiOperation({ summary: 'Approve and activate dark store' })
  async adminApproveStore(
    @Param('id') id: string,
    @Body('adminId') adminId?: string,
  ) {
    return this.storesService.adminApproveStore(id, adminId);
  }

  @Post('admin/stores/:id/reject')
  @ApiOperation({ summary: 'Reject dark store registration' })
  async adminRejectStore(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Body('adminId') adminId?: string,
  ) {
    return this.storesService.adminRejectStore(id, reason, adminId);
  }
}
