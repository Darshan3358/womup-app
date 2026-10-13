import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocalShopsService } from './local-shops.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  CreateCategoryDto,
  VerifyOfflinePaymentDto,
  CreateCollectionRequestDto,
  WithdrawWalletDto,
} from './dto/local-shops.dto';

@ApiTags('Local Shops & Vendors')
@Controller('api/v1')
export class LocalShopsController {
  constructor(private readonly localShopsService: LocalShopsService) {}

  // ── Public Customer Endpoints ─────────────────────────────────────────────

  @Get('local-shops/categories')
  @ApiOperation({ summary: 'Get all active vendor categories' })
  async getCategories() {
    const categories = await this.localShopsService.getCategories();
    return { success: true, data: categories };
  }

  @Get(['local-shops', 'local/nearby-shops'])
  @ApiOperation({ summary: 'Get nearby local vendors with distance calculation' })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  async getNearbyShops(
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius?: number,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('query') query?: string,
  ) {
    const vendors = await this.localShopsService.getNearbyShops(
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      radius ? Number(radius) : 25,
      category,
      city,
      query,
    );
    return { success: true, data: { vendors }, count: vendors.length };
  }

  @Get(['local-shops/:vendorId', 'local/shops/:vendorId'])
  @ApiOperation({ summary: 'Get vendor details, QR code, and UPI info' })
  async getShopDetail(@Param('vendorId') vendorId: string) {
    const data = await this.localShopsService.getVendorDetails(vendorId);
    return { success: true, data };
  }

  @Get('vendor/by-code/:vendorCode')
  @ApiOperation({ summary: 'Lookup vendor by QR vendor code (e.g., VND001)' })
  async getVendorByCode(@Param('vendorCode') vendorCode: string) {
    const data = await this.localShopsService.getVendorByCode(vendorCode);
    return { success: true, data };
  }

  @Post(['local-shops/verify-payment', 'local/verify-payment'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify offline payment and allocate coins/balances per SRS' })
  async verifyPayment(@Body() dto: VerifyOfflinePaymentDto) {
    const result = await this.localShopsService.verifyOfflinePayment(dto);
    return { success: true, data: result };
  }

  @Post('local-shops/collection-requests')
  @ApiOperation({ summary: 'Customer submits a counter collection request to vendor' })
  async createCollectionRequest(@Body() dto: CreateCollectionRequestDto) {
    const result = await this.localShopsService.createCollectionRequest(dto);
    return { success: true, data: result };
  }

  // ── Admin Endpoints ────────────────────────────────────────────────────────

  @Get('admin/vendors')
  @ApiOperation({ summary: 'List all vendors with city & category filters' })
  async adminGetVendors(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    const vendors = await this.localShopsService.adminGetVendors(city, category);
    return { success: true, data: vendors };
  }

  @Get('admin/vendors/:id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  async adminGetVendorById(@Param('id') id: string) {
    const vendor = await this.localShopsService.adminGetVendorById(id);
    return { success: true, data: vendor };
  }

  @Post('admin/vendors')
  @ApiOperation({ summary: 'Create vendor with Admin-defined Shopping Coin %' })
  async adminCreateVendor(@Body() dto: CreateVendorDto) {
    const vendor = await this.localShopsService.adminCreateVendor(dto);
    return { success: true, data: vendor, message: 'Vendor created successfully' };
  }

  @Patch('admin/vendors/:id')
  @ApiOperation({ summary: 'Update vendor details, including Shopping Coin %' })
  async adminUpdateVendor(
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    const vendor = await this.localShopsService.adminUpdateVendor(id, dto);
    return { success: true, data: vendor, message: 'Vendor updated successfully' };
  }

  @Delete('admin/vendors/:id')
  @ApiOperation({ summary: 'Soft delete vendor' })
  async adminDeleteVendor(@Param('id') id: string) {
    const result = await this.localShopsService.adminDeleteVendor(id);
    return { success: true, ...result };
  }

  @Post('admin/vendors/:id/verify-kyc')
  @ApiOperation({ summary: 'Approve vendor KYC' })
  async adminVerifyKyc(@Param('id') id: string) {
    const result = await this.localShopsService.adminVerifyKyc(id);
    return { success: true, ...result };
  }

  @Post('admin/vendors/:id/reject-kyc')
  @ApiOperation({ summary: 'Reject vendor KYC' })
  async adminRejectKyc(@Param('id') id: string, @Body('reason') reason?: string) {
    const result = await this.localShopsService.adminRejectKyc(id, reason);
    return { success: true, ...result };
  }

  @Patch('admin/vendors/:id/coin-rate')
  @ApiOperation({ summary: 'Update vendor Shopping Coin % (2% - 25%)' })
  async adminUpdateCoinRate(
    @Param('id') id: string,
    @Body('shoppingCoinPercent') coinRate: number,
  ) {
    const result = await this.localShopsService.adminUpdateCoinRate(id, Number(coinRate));
    return result;
  }

  @Get('admin/vendors/analytics')
  @ApiOperation({ summary: 'Get overall vendor network stats for Admin' })
  async adminGetVendorsAnalytics() {
    const stats = await this.localShopsService.adminGetVendorsAnalytics();
    return { success: true, data: stats };
  }

  @Get('admin/vendors/:id/qr')
  @ApiOperation({ summary: 'Get vendor QR code data for counter display & printing' })
  async adminGetVendorQR(@Param('id') id: string) {
    const qr = await this.localShopsService.adminGetVendorQR(id);
    return { success: true, data: qr };
  }

  @Get('admin/vendor-categories')
  @ApiOperation({ summary: 'List all vendor categories for Admin' })
  async adminGetCategories() {
    const categories = await this.localShopsService.getCategories();
    return { success: true, data: categories };
  }

  @Post('admin/vendor-categories')
  @ApiOperation({ summary: 'Create a new vendor category' })
  async adminCreateCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.localShopsService.adminCreateCategory(dto);
    return { success: true, data: category };
  }

  @Patch('admin/vendor-categories/:id')
  @ApiOperation({ summary: 'Update category' })
  async adminUpdateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    const category = await this.localShopsService.adminUpdateCategory(id, dto);
    return { success: true, data: category };
  }

  @Delete('admin/vendor-categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  async adminDeleteCategory(@Param('id') id: string) {
    const category = await this.localShopsService.adminDeleteCategory(id);
    return { success: true, data: category };
  }

  // ── Vendor Merchant App Endpoints ─────────────────────────────────────────

  @Post('vendor/auth/login')
  @ApiOperation({ summary: 'Vendor merchant login' })
  async vendorLogin(@Body() body: { loginId: string; password?: string }) {
    const vendor = await this.localShopsService.vendorLogin(body.loginId, body.password || '');
    return { success: true, data: vendor };
  }

  @Get('vendor/auth/me')
  @ApiOperation({ summary: 'Get current vendor profile' })
  async vendorMe(@Query('vendorCode') vendorCode?: string) {
    const vendor = await this.localShopsService.vendorLogin(vendorCode || 'VND001', '');
    return { success: true, data: vendor };
  }

  @Get('vendor/dashboard-stats')
  @ApiOperation({ summary: 'Get real-time dashboard collection stats and pending requests' })
  async getDashboardStats(@Query('vendorCode') vendorCode?: string) {
    const stats = await this.localShopsService.getVendorDashboardStats(vendorCode || 'VND001');
    return { success: true, data: stats };
  }

  @Get('vendor/collection-requests')
  @ApiOperation({ summary: 'List real pending counter collection requests' })
  async vendorGetRequests(@Query('vendorCode') vendorCode?: string) {
    const reqs = await this.localShopsService.vendorGetPendingRequests(vendorCode || 'VND001');
    return { success: true, data: reqs };
  }

  @Post('vendor/collection-requests/:id/verify')
  @ApiOperation({ summary: 'Verify and accept counter collection request' })
  async vendorVerifyRequest(@Param('id') id: string) {
    const res = await this.localShopsService.vendorVerifyRequest(id);
    return res;
  }

  @Post('vendor/collection-requests/:id/reject')
  @ApiOperation({ summary: 'Reject counter collection request' })
  async vendorRejectRequest(@Param('id') id: string, @Body() body: { reason?: string }) {
    const res = await this.localShopsService.vendorRejectRequest(id, body?.reason);
    return res;
  }

  @Get('vendor/wallet')
  @ApiOperation({ summary: 'Get real wallet balance, pending balance, and bank settlements' })
  async getVendorWallet(@Query('vendorCode') vendorCode?: string) {
    const data = await this.localShopsService.getVendorWallet(vendorCode || 'VND001');
    return { success: true, data };
  }

  @Post('vendor/wallet/withdraw')
  @ApiOperation({ summary: 'Withdraw available wallet balance to bank account' })
  async vendorWithdraw(@Body() dto: WithdrawWalletDto, @Query('vendorCode') vendorCode?: string) {
    const res = await this.localShopsService.vendorWithdrawWallet(vendorCode || 'VND001', dto);
    return res;
  }

  @Get('vendor/transactions')
  @ApiOperation({ summary: 'Vendor real transactions history with filters' })
  async vendorTransactions(
    @Query('vendorCode') vendorCode?: string,
    @Query('filter') filter?: 'today' | 'yesterday' | 'all',
    @Query('search') search?: string,
  ) {
    const txs = await this.localShopsService.getVendorTransactions(vendorCode || 'VND001', filter, search);
    return { success: true, data: txs };
  }

  @Get('vendor/analytics')
  @ApiOperation({ summary: 'Vendor real analytics, GMV, payment distribution, and top customers' })
  async vendorAnalytics(@Query('vendorCode') vendorCode?: string) {
    const data = await this.localShopsService.getVendorAnalytics(vendorCode || 'VND001');
    return { success: true, data };
  }
}

