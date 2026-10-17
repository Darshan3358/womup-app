import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart & Pricing Engine')
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current cart items with authoritative server-calculated pricing breakdown' })
  @ApiResponse({ status: 200, description: 'Cart summary with subtotal, discounts, fees, coins and total' })
  async getCart(
    @CurrentUser() user: any,
    @Query('areaId') areaId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.cartService.getCartSummary(user.id, areaId, storeId);
  }

  @Post('set-location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set user active delivery area/store for cart pricing recalculation' })
  async setLocation(
    @CurrentUser() user: any,
    @Body() body: { areaId?: string; storeId?: string },
  ) {
    return this.cartService.setCartLocation(user.id, body.areaId, body.storeId);
  }

  // Standard SRS Cart Add API
  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product item to cart (SRS standardized)' })
  async addCartItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; variantId?: string; quantity?: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity || 1, body.variantId);
  }

  // Legacy Cart Add API
  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product item to cart' })
  async addItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; variantId?: string; quantity: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity || 1, body.variantId);
  }

  // Standard SRS Cart Update API
  @Post('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart quantity (SRS standardized)' })
  async updateCartItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; variantId?: string; quantity?: number; delta?: number },
  ) {
    if (typeof body.quantity === 'number') {
      return this.cartService.setExactQuantity(user.id, body.productId, body.quantity, body.variantId);
    }
    return this.cartService.updateQuantity(user.id, body.productId, body.delta ?? 1, body.variantId);
  }

  @Patch('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increment or decrement quantity in cart (+1 or -1)' })
  async updateQuantity(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('delta') delta: number,
    @Body('variantId') variantId?: string,
  ) {
    return this.cartService.updateQuantity(user.id, productId, delta, variantId);
  }

  // Standard SRS Cart Remove API
  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product item from cart (SRS standardized)' })
  async removeCartItem(
    @CurrentUser() user: any,
    @Body() body: { productId?: string; variantId?: string },
    @Param() params: any,
  ) {
    const pId = body?.productId || params?.productId;
    return this.cartService.removeItem(user.id, pId, body?.variantId);
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product item from cart completely' })
  async removeItem(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('variantId') variantId?: string,
    @Query('variantId') queryVariantId?: string,
  ) {
    return this.cartService.removeItem(user.id, productId, variantId || queryVariantId);
  }

  // Standard SRS Cart Clear API
  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all items from cart (SRS standardized)' })
  async clearCartAlias(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  @Post('apply-coins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply Shopping Coins for direct checkout deduction' })
  async applyCoins(@CurrentUser() user: any, @Body('coins') coins: number) {
    return this.cartService.applyCoins(user.id, coins);
  }

  @Post('toggle-coins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle Shopping Coins on/off with instant real-time synchronization' })
  async toggleCoins(
    @CurrentUser() user: any,
    @Body() body: { useCoins?: boolean; enabled?: boolean },
  ) {
    const flag = typeof body.useCoins === 'boolean' ? body.useCoins : !!body.enabled;
    return this.cartService.toggleCoins(user.id, flag);
  }

  @Post('apply-coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply promo coupon code' })
  async applyCoupon(
    @CurrentUser() user: any,
    @Body('couponCode') couponCode: string,
  ) {
    return this.cartService.applyCoupon(user.id, couponCode);
  }

  @Post('tip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add delivery partner tip' })
  async setTip(@CurrentUser() user: any, @Body('tip') tip: number) {
    return this.cartService.setTip(user.id, tip);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate dynamic delivery fee and totals based on distance and admin rates' })
  async calculateCart(@Body() body: any) {
    return this.cartService.calculateDynamic(body);
  }
}
