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
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current cart items with authoritative server-calculated pricing breakdown' })
  @ApiResponse({ status: 200, description: 'Cart summary with subtotal, discounts, fees, coins and total' })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCartSummary(user.id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product item to cart' })
  async addItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity || 1);
  }

  @Patch('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increment or decrement quantity in cart (+1 or -1)' })
  async updateQuantity(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('delta') delta: number,
  ) {
    return this.cartService.updateQuantity(user.id, productId, delta);
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product item from cart completely' })
  async removeItem(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(user.id, productId);
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
