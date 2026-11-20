import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Shopping Coins')
@Controller('api/v1/coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer Shopping Coins balance and recent activity' })
  @ApiResponse({ status: 200, description: 'Coin balance details' })
  async getCoins(@CurrentUser() user: any) {
    return this.coinsService.getCoinsDetails(user.id);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated Shopping Coins reward & redemption ledger' })
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coinsService.getTransactions(user.id, page, limit);
  }

  /**
   * ADMIN: Points Purchase Report (Item 3)
   */
  @Get('purchases/report')
  @ApiOperation({ summary: 'Admin: Get points purchase ledger and revenue statistics' })
  async getPurchasesReport(@Query() query: any) {
    return this.coinsService.getPurchasesReport(query);
  }

  /**
   * ADMIN: Manually Credit / Record Purchased Points (Item 3)
   */
  @Post('purchases/credit')
  @ApiOperation({ summary: 'Admin: Purchase/Credit shopping points for a user' })
  async creditPointsPurchase(@Body() body: any) {
    return this.coinsService.adminCreditPurchase(body);
  }

  /**
   * ADMIN: Get all coin transactions and history for a specific customer (Item 8)
   */
  @Get('user/:id/history')
  @ApiOperation({ summary: 'Admin: Get full coin ledger and history for a specific customer' })
  async getUserCoinHistory(@Param('id') id: string) {
    return this.coinsService.getUserHistoryForAdmin(id);
  }
}
