import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Shopping Coins')
@Controller('api/v1/coins')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer Shopping Coins balance and recent activity' })
  @ApiResponse({ status: 200, description: 'Coin balance details' })
  async getCoins(@CurrentUser() user: any) {
    return this.coinsService.getCoinsDetails(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get paginated Shopping Coins reward & redemption ledger' })
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.coinsService.getTransactions(user.id, page, limit);
  }
}
