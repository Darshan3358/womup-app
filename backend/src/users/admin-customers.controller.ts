import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Admin Customer & KYC Management')
@Controller('api/v1/admin/customers')
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers with filters (search, kycStatus, isBlocked)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'kycStatus', required: false, type: Number })
  @ApiQuery({ name: 'isBlocked', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCustomers(
    @Query('search') search?: string,
    @Query('kycStatus') kycStatus?: number,
    @Query('isBlocked') isBlocked?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.adminGetCustomers({
      search,
      kycStatus: kycStatus !== undefined ? Number(kycStatus) : undefined,
      isBlocked: isBlocked !== undefined ? Number(isBlocked) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('kyc/pending')
  @ApiOperation({ summary: 'List all customers with pending KYC verification' })
  async getPendingKyc(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.usersService.adminGetPendingCustomerKyc({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
  }

  @Get(':id/kyc-review')
  @ApiOperation({ summary: 'Get customer KYC review details with masked fields and document images' })
  async getCustomerKycReview(@Param('id') id: string): Promise<any> {
    return this.usersService.adminGetCustomerKycReview(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full customer details, KYC images, bank details, and downline summary' })
  async getCustomerById(@Param('id') id: string): Promise<any> {
    return this.usersService.adminGetCustomerById(id);
  }

  @Post([':id/kyc-approve', ':id/approve-kyc', ':id/approve'])
  @ApiOperation({ summary: 'Approve customer Aadhaar / KYC and release sponsor download income' })
  async approveKyc(@Param('id') id: string) {
    return this.usersService.adminApproveCustomerKyc(id);
  }

  @Post([':id/kyc-reject', ':id/reject-kyc', ':id/reject'])
  @ApiOperation({ summary: 'Reject customer KYC with reason' })
  async rejectKyc(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.usersService.adminRejectCustomerKyc(id, reason);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block or unblock customer account' })
  async blockCustomer(
    @Param('id') id: string,
    @Body('isBlocked') isBlocked: number,
    @Body('reason') reason?: string,
  ) {
    return this.usersService.adminBlockCustomer(id, Number(isBlocked), reason);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend or unsuspend customer account' })
  async suspendCustomer(
    @Param('id') id: string,
    @Body('isSuspended') isSuspended: number,
  ) {
    return this.usersService.adminSuspendCustomer(id, Number(isSuspended));
  }

  @Post(':id/payment-status')
  @ApiOperation({ summary: 'Enable or disable customer checkout/payment capability' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: number,
  ) {
    return this.usersService.adminUpdateCustomerPaymentStatus(id, Number(status));
  }

  @Post(':id/credit-coins')
  @ApiOperation({ summary: 'Manually credit Shopping Coins to customer' })
  async creditCoins(
    @Param('id') id: string,
    @Body('coins') coins?: number,
  ) {
    return this.usersService.adminCreditCustomerCoins(id, coins ? Number(coins) : 2000);
  }

  @Get(':id/sponsor-tree')
  @ApiOperation({ summary: 'View customer 7-level sponsor and downline tree' })
  async getSponsorTree(@Param('id') id: string) {
    return this.usersService.adminGetSponsorTree(id);
  }
}
