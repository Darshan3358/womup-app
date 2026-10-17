import { Controller, Get, Post, Patch, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RiderService } from './rider.service';

@ApiTags('Admin Delivery Partner & KYC Management')
@Controller(['api/v1/admin/riders', 'api/admin/riders'])
export class AdminRidersController {
  constructor(private readonly riderService: RiderService) {}

  @Get()
  @ApiOperation({ summary: 'List all delivery partners with status & search filters' })
  async getRiders(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.riderService.adminGetRiders({ status, search });
    return { success: true, data };
  }

  @Get('pending')
  @ApiOperation({ summary: 'List all delivery partners awaiting admin approval' })
  async getPendingRiders() {
    const data = await this.riderService.adminGetPendingRiders();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete rider detail including KYC documents and bank account' })
  async getRiderDetail(@Param('id') id: string) {
    const data = await this.riderService.adminGetRiderDetail(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update rider profile, status, vehicle, documents, or bank info' })
  async updateRiderPatch(@Param('id') id: string, @Body() updates: any) {
    return this.riderService.adminUpdateRider(id, updates);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update rider profile (PUT alias)' })
  async updateRiderPut(@Param('id') id: string, @Body() updates: any) {
    return this.riderService.adminUpdateRider(id, updates);
  }

  @Post([':id/approve', ':id/verify'])
  @ApiOperation({ summary: 'Approve rider account, unlock duty toggle and order dispatch' })
  async approveRider(
    @Param('id') id: string,
    @Body('adminId') adminId?: string,
  ) {
    return this.riderService.adminApproveRider(id, adminId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject rider application with reason' })
  async rejectRider(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @Body('adminId') adminId?: string,
  ) {
    return this.riderService.adminRejectRider(id, reason, adminId);
  }
}

