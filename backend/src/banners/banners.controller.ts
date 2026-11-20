import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannersService } from './banners.service';

@ApiTags('Banners & Promotions')
@Controller('api/v1/banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Get active promotional video & image banners' })
  async getBanners(@Query('placement') placement?: string) {
    return this.bannersService.findAll(placement);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: Get all banners including inactive' })
  async getAdminBanners() {
    const banners = await this.bannersService.findAllForAdmin();
    return { success: true, count: banners.length, banners };
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new promotional banner' })
  async createBanner(@Body() body: any) {
    const banner = await this.bannersService.create(body);
    return { success: true, banner };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update banner metadata & active status' })
  async updateBanner(@Param('id') id: string, @Body() body: any) {
    const banner = await this.bannersService.update(id, body);
    return { success: true, banner };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.bannersService.delete(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Admin: Toggle banner active/inactive' })
  async toggleActive(@Param('id') id: string) {
    const banner = await this.bannersService.toggleActive(id);
    return { success: true, banner };
  }
}
