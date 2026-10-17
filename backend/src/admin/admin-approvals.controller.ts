import { Controller, Get, Post, Param, Body, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminApprovalsService } from './admin-approvals.service';

@ApiTags('Admin Approval & Rejection Flows')
@Controller('api/v1/admin')
export class AdminApprovalsController {
  constructor(private readonly approvalsService: AdminApprovalsService) {}

  /**
   * 1. GET APPROVAL COUNTS SUMMARY (8-CATEGORY DASHBOARD & WIDGET)
   */
  @Get('approvals/summary')
  @ApiOperation({ summary: 'Get total pending counts across all 8 approval workflows' })
  async getApprovalsSummary() {
    const data = await this.approvalsService.getApprovalsSummary();
    return { success: true, data };
  }

  /**
   * 2. UNIFIED CATEGORY QUEUE
   */
  @Get('approvals/:category')
  @ApiOperation({ summary: 'Get queue of pending items for a specific approval category' })
  @ApiParam({ name: 'category', description: 'customer-kyc | riders | dark-stores | vendors | withdrawals | cancellations | staff | rate-changes' })
  @ApiQuery({ name: 'search', required: false })
  async getCategoryQueue(
    @Param('category') category: string,
    @Query() query: any,
  ) {
    const { items, total } = await this.approvalsService.getCategoryQueue(category, query);
    return {
      success: true,
      category,
      count: items.length,
      total,
      data: {
        items,
        pagination: {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 50,
          total,
          totalPages: Math.max(1, Math.ceil(total / (Number(query.limit) || 50))),
        },
      },
    };
  }

  /**
   * 3. UNIFIED APPROVE ACTION
   */
  @Post('approvals/:category/:id/approve')
  @ApiOperation({ summary: 'Approve pending request by category and record ID' })
  async approveCategoryItem(
    @Param('category') category: string,
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-admin-id') adminIdHeader?: string,
  ) {
    const adminId = body.adminId || adminIdHeader || 'SUPER_ADMIN';
    return this.approvalsService.approveCategoryItem(category, id, body, adminId);
  }

  /**
   * 4. UNIFIED REJECT ACTION
   */
  @Post('approvals/:category/:id/reject')
  @ApiOperation({ summary: 'Reject pending request with reason by category and record ID' })
  async rejectCategoryItem(
    @Param('category') category: string,
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-admin-id') adminIdHeader?: string,
  ) {
    const adminId = body.adminId || adminIdHeader || 'SUPER_ADMIN';
    return this.approvalsService.rejectCategoryItem(category, id, body, adminId);
  }

  /**
   * 5. BULK ACTION
   */
  @Post('approvals/bulk-action')
  @ApiOperation({ summary: 'Approve or reject multiple pending items in a single atomic batch' })
  async bulkAction(
    @Body()
    body: {
      action: 'APPROVE' | 'REJECT';
      category: string;
      ids: string[];
      reason?: string;
      notes?: string;
      extraData?: any;
      adminId?: string;
    },
    @Headers('x-admin-id') adminIdHeader?: string,
  ) {
    const adminId = body.adminId || adminIdHeader || 'SUPER_ADMIN';
    return this.approvalsService.bulkAction(body, adminId);
  }

  // ───────────────────────────────────────────────
  // LEGACY SPECIFIC ENDPOINTS (BACKWARDS COMPATIBILITY)
  // ───────────────────────────────────────────────

  @Get('customers/pending-kyc')
  async getPendingCustomers() {
    const data = await this.approvalsService.getPendingCustomers();
    return { success: true, count: data.length, data };
  }

  @Post('customers/:id/approve-kyc')
  async approveCustomerKyc(@Param('id') id: string, @Body('adminId') adminId?: string, @Body('notes') notes?: string) {
    return this.approvalsService.approveCustomerKyc(id, adminId, notes);
  }

  @Post('customers/:id/reject-kyc')
  async rejectCustomerKyc(@Param('id') id: string, @Body('reason') reason?: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.rejectCustomerKyc(id, reason, adminId);
  }

  @Get('stores/pending')
  async getPendingStores() {
    const data = await this.approvalsService.getPendingStores();
    return { success: true, count: data.length, data };
  }

  @Post('stores/:id/approve')
  async approveStore(@Param('id') id: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.approveStore(id, adminId);
  }

  @Post('stores/:id/reject')
  async rejectStore(@Param('id') id: string, @Body('reason') reason?: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.rejectStore(id, reason, adminId);
  }

  @Get('vendors/pending')
  async getPendingVendors() {
    const data = await this.approvalsService.getPendingVendors();
    return { success: true, count: data.length, data };
  }

  @Post('vendors/:id/approve')
  async approveVendor(
    @Param('id') id: string,
    @Body() payload: { shoppingCoinPercent?: number; platformCommissionPercent?: number; adminId?: string },
  ) {
    return this.approvalsService.approveVendor(id, payload, payload?.adminId);
  }

  @Post('vendors/:id/reject')
  async rejectVendor(@Param('id') id: string, @Body('reason') reason?: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.rejectVendor(id, reason, adminId);
  }

  @Get('withdrawals/pending')
  async getPendingWithdrawals() {
    const data = await this.approvalsService.getPendingWithdrawals();
    return { success: true, count: data.length, data };
  }

  @Post('withdrawals/:id/approve')
  async approveWithdrawal(@Param('id') id: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.approveWithdrawal(id, adminId);
  }

  @Post('withdrawals/:id/reject')
  async rejectWithdrawal(@Param('id') id: string, @Body('reason') reason?: string, @Body('adminId') adminId?: string) {
    return this.approvalsService.rejectWithdrawal(id, reason, adminId);
  }

  @Post('payout-rates/update')
  async updatePayoutRate(@Body() payload: any, @Body('adminId') adminId?: string) {
    return this.approvalsService.updatePayoutRate(payload, adminId);
  }
}
