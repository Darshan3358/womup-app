import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function getUserId(user: any, req: any): string {
  if (user?.id) return user.id;
  if (user?.sub) return user.sub;
  if (req?.headers && req.headers['x-user-id']) return req.headers['x-user-id'] as string;
  return '6aa11866c6c3e5984e2ef5e5';
}

@ApiTags('User Settings & Preferences')
@Controller('api/v1/user')
@UseGuards(OptionalJwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ==========================================
  // 1 & 2. PRIVACY & NOTIFICATION SETTINGS
  // ==========================================
  @Get('settings')
  @ApiOperation({ summary: 'Fetch user privacy and notification settings' })
  async getSettings(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getSettings(userId);
  }

  @Patch('settings/privacy')
  @ApiOperation({ summary: 'Update privacy toggles' })
  async updatePrivacy(@CurrentUser() user: any, @Req() req: any, @Body() body: any) {
    const userId = getUserId(user, req);
    return this.settingsService.updatePrivacy(userId, body);
  }

  @Patch('settings/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(@CurrentUser() user: any, @Req() req: any, @Body() body: any) {
    const userId = getUserId(user, req);
    return this.settingsService.updateNotifications(userId, body);
  }

  @Post('settings/clear-history')
  @ApiOperation({ summary: 'Clear search and browsing history' })
  async clearHistory(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.clearHistory(userId);
  }

  @Get('settings/download-data')
  @ApiOperation({ summary: 'Request personal data archive' })
  async downloadData(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.downloadDataArchive(userId);
  }

  // ==========================================
  // 3. PROFILE (BIRTHDAY & SENSITIVE ITEMS)
  // ==========================================
  @Patch('profile/birthday')
  @ApiOperation({ summary: 'Set birthday and receive 50 coins reward' })
  async updateBirthday(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('birthday') birthday: string,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.updateBirthday(userId, birthday);
  }

  @Patch('profile/sensitive')
  @ApiOperation({ summary: 'Toggle hide sensitive items' })
  async updateSensitive(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('hideSensitiveItems') hide: boolean,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.updatePrivacy(userId, { hideSensitiveItems: hide });
  }

  // ==========================================
  // 4. PAYMENT SETTINGS (UPI & COD)
  // ==========================================
  @Get('payment-methods')
  @ApiOperation({ summary: 'List saved payment methods & COD preference' })
  async getPaymentMethods(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getPaymentMethods(userId);
  }

  @Post('payment-methods')
  @ApiOperation({ summary: 'Add a new UPI VPA or payment method' })
  async addPaymentMethod(@CurrentUser() user: any, @Req() req: any, @Body() body: any) {
    const userId = getUserId(user, req);
    return this.settingsService.addPaymentMethod(userId, body);
  }

  @Patch('payment-methods/:id/default')
  @ApiOperation({ summary: 'Set payment method as default' })
  async setDefaultPaymentMethod(
    @CurrentUser() user: any,
    @Req() req: any,
    @Param('id') methodId: string,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.setDefaultPaymentMethod(userId, methodId);
  }

  @Delete('payment-methods/:id')
  @ApiOperation({ summary: 'Delete a saved payment method' })
  async deletePaymentMethod(
    @CurrentUser() user: any,
    @Req() req: any,
    @Param('id') methodId: string,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.deletePaymentMethod(userId, methodId);
  }

  @Patch('payment-methods/cod')
  @ApiOperation({ summary: 'Toggle Cash On Delivery enablement' })
  async toggleCod(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('codEnabled') codEnabled: boolean,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.toggleCod(userId, codEnabled);
  }

  @Post('payment-methods/verify-upi')
  @ApiOperation({ summary: 'Verify UPI VPA via NPCI simulated verification' })
  async verifyUpi(@Body('upiId') upiId: string) {
    return this.settingsService.verifyUpiVpa(upiId);
  }

  // ==========================================
  // 5. GIFT CARD HISTORY FOR USER
  // ==========================================
  @Get('gift-card-history')
  @ApiOperation({ summary: 'List user gift card redemptions' })
  async getGiftCardHistory(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getGiftCardHistory(userId);
  }

  // ==========================================
  // 6. REWARDS & SHOPPING COINS (SCRATCH CARD)
  // ==========================================
  @Get('rewards')
  @ApiOperation({ summary: 'Get rewards, tier, coins, and scratch card availability' })
  async getRewards(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getRewards(userId);
  }

  @Post('rewards/scratch')
  @ApiOperation({ summary: 'Scratch daily card to win random coins' })
  async scratchCard(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.scratchCard(userId);
  }

  @Get('rewards/coupons')
  @ApiOperation({ summary: 'List active promo codes and coupons' })
  async getCoupons(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getCoupons(userId);
  }

  @Get('rewards/history')
  @ApiOperation({ summary: 'Get coin earn and redeem history' })
  async getRewardsHistory(@CurrentUser() user: any, @Req() req: any) {
    const userId = getUserId(user, req);
    return this.settingsService.getRewardsHistory(userId);
  }

  @Post('rewards/coins/redeem')
  @ApiOperation({ summary: 'Redeem coins at checkout for direct discount' })
  async redeemCoins(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('coins') coins: number,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.redeemCoins(userId, coins);
  }
}

@ApiTags('Gift Cards & Vouchers')
@Controller('api/v1/gift-cards')
@UseGuards(OptionalJwtAuthGuard)
@ApiBearerAuth()
export class GiftCardsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate gift card code before claiming' })
  async validateGiftCard(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('code') code: string,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.validateGiftCard(code, userId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem gift card into Worm Up Money wallet' })
  async redeemGiftCard(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('code') code: string,
  ) {
    const userId = getUserId(user, req);
    return this.settingsService.redeemGiftCard(userId, code);
  }
}
