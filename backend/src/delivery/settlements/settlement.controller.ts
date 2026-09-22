import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestPayoutDto, UpdateBankAccountDto } from './settlement.dto';

@ApiTags('Delivery Settlements & Payouts')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('settlements/today')
  @ApiOperation({ summary: "Get today's operational settlement breakdown" })
  async getToday(@CurrentUser() user: any) {
    return this.settlementService.getTodaySettlement(user.id);
  }

  @Get('settlements/week')
  @ApiOperation({ summary: 'Get current week earnings settlement' })
  async getWeek(@CurrentUser() user: any) {
    return this.settlementService.getWeekSettlement(user.id);
  }

  @Get('settlements/month')
  @ApiOperation({ summary: 'Get current month earnings settlement' })
  async getMonth(@CurrentUser() user: any) {
    return this.settlementService.getMonthSettlement(user.id);
  }

  @Get('settlements/recent')
  @ApiOperation({ summary: 'Get recent trip earnings and payout status' })
  async getRecent(@CurrentUser() user: any) {
    return this.settlementService.getRecentSettlements(user.id);
  }

  @Get('settlements/balance')
  @ApiOperation({ summary: 'Get available payout balance and pending settlement' })
  async getBalance(@CurrentUser() user: any) {
    return this.settlementService.getBalance(user.id);
  }

  @Post('payout/request')
  @ApiOperation({ summary: 'Request instant IMPS payout to verified bank account' })
  async requestPayout(@CurrentUser() user: any, @Body() body: RequestPayoutDto) {
    return this.settlementService.requestPayout(user.id, body.amount);
  }

  @Get('bank-account')
  @ApiOperation({ summary: 'Get verified payout bank account details (masked)' })
  async getBankAccount(@CurrentUser() user: any) {
    return this.settlementService.getBankAccount(user.id);
  }

  @Patch('bank-account')
  @ApiOperation({ summary: 'Update payout bank account details' })
  async updateBankAccount(@CurrentUser() user: any, @Body() body: UpdateBankAccountDto) {
    return this.settlementService.updateBankAccount(user.id, body);
  }
}

