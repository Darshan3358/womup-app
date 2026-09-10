import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@Controller('api/v1/wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance and recent transaction activity' })
  @ApiResponse({ status: 200, description: 'Wallet balance details' })
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWalletDetails(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get full paginated wallet transaction ledger' })
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getTransactions(user.id, page, limit);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up in-app wallet balance (instant recharge)' })
  @ApiResponse({ status: 201, description: 'Wallet credited and transaction recorded' })
  async topup(@CurrentUser() user: any, @Body('amount') amount: number) {
    return this.walletService.topup(user.id, amount);
  }
}
