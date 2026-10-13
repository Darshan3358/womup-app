import { Controller, Get, Post, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users & Profile')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile with coin balance & wallet balance' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Get('wallet-summary')
  @ApiOperation({ summary: 'Get 4 wallet balances: Shopping Coins, Today Income, Available Income, and Verification Status' })
  async getWalletSummary(@CurrentUser() user: any) {
    const summary = await this.usersService.getWalletSummary(user.id);
    return { success: true, data: summary };
  }

  @Post('verify-aadhaar')
  @ApiOperation({ summary: 'Verify user Aadhaar number & full name, unlocking income and crediting referrer' })
  async verifyAadhaar(
    @CurrentUser() user: any,
    @Body() body: { aadhaarNumber: string; fullNameAsPerAadhaar: string },
  ) {
    return this.usersService.verifyAadhaar(user.id, body);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update customer profile information or privacy toggles' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Get current user wishlist items' })
  async getWishlist(@CurrentUser() user: any) {
    const items = await this.usersService.getWishlist(user.id);
    return { success: true, data: items };
  }

  @Post('wishlist/toggle')
  @ApiOperation({ summary: 'Toggle product in current user wishlist' })
  async toggleWishlist(
    @CurrentUser() user: any,
    @Body('productId') productId: string,
  ) {
    const result = await this.usersService.toggleWishlist(user.id, productId);
    return { success: true, data: result };
  }

  @Delete('wishlist')
  @ApiOperation({ summary: 'Clear current user wishlist' })
  async clearWishlist(@CurrentUser() user: any) {
    const result = await this.usersService.clearWishlist(user.id);
    return { success: true, data: result };
  }
}
