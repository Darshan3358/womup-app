import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('api/v1/wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist items' })
  @ApiResponse({ status: 200, description: 'Wishlist items' })
  async getWishlist(@CurrentUser() user: any) {
    const items = await this.usersService.getWishlist(user.id);
    return { success: true, data: items };
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle product in user wishlist' })
  @ApiResponse({ status: 200, description: 'Product added or removed from wishlist' })
  async toggleWishlist(
    @CurrentUser() user: any,
    @Body('productId') productId: string,
  ) {
    const result = await this.usersService.toggleWishlist(user.id, productId);
    return {
      success: true,
      action: result.action,
      data: result,
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear current user wishlist' })
  async clearWishlist(@CurrentUser() user: any) {
    const result = await this.usersService.clearWishlist(user.id);
    return { success: true, data: result };
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear current user wishlist (alias)' })
  async clearWishlistAlias(@CurrentUser() user: any) {
    const result = await this.usersService.clearWishlist(user.id);
    return { success: true, data: result };
  }
}
