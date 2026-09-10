import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart & Pricing Engine')
@Controller('api/v1/cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart items with authoritative server-calculated pricing breakdown' })
  @ApiResponse({ status: 200, description: 'Cart summary with subtotal, discounts, fees, coins and total' })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCartSummary(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product item to cart' })
  async addItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity || 1);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Increment or decrement quantity in cart (+1 or -1)' })
  async updateQuantity(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('delta') delta: number,
  ) {
    return this.cartService.updateQuantity(user.id, productId, delta);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove product item from cart completely' })
  async removeItem(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  @Post('apply-coins')
  @ApiOperation({ summary: 'Apply Shopping Coins for direct checkout deduction' })
  async applyCoins(@CurrentUser() user: any, @Body('coins') coins: number) {
    return this.cartService.applyCoins(user.id, coins);
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply promo coupon code' })
  async applyCoupon(
    @CurrentUser() user: any,
    @Body('couponCode') couponCode: string,
  ) {
    return this.cartService.applyCoupon(user.id, couponCode);
  }

  @Post('tip')
  @ApiOperation({ summary: 'Add delivery partner tip' })
  async setTip(@CurrentUser() user: any, @Body('tip') tip: number) {
    return this.cartService.setTip(user.id, tip);
  }
}
