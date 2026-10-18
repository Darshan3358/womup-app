import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { DeliveryOrderService } from './delivery-order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class RejectDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

class PickupDto {
  @IsString()
  @IsOptional()
  packageCode?: string;
}

class VerifyDeliveryDto {
  @IsString()
  @IsNotEmpty()
  otp: string;
}

class CollectCashDto {
  @IsOptional()
  amount?: number;
}

@ApiTags('Delivery Partner Order Lifecycle')
@Controller('api/v1/delivery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveryOrderController {
  constructor(private readonly orderService: DeliveryOrderService) {}

  @Get('active-order')
  @ApiOperation({ summary: 'Get current active assigned delivery order' })
  async getActiveOrder(@CurrentUser() user: any) {
    return this.orderService.getActiveOrder(user.id);
  }

  @Get('orders/available')
  @ApiOperation({ summary: 'Check and dispatch real available order for online partner' })
  async getAvailableOrder(@CurrentUser() user: any) {
    return this.orderService.getAvailableOrder(user.id);
  }

  @Get('orders/available-list')
  @ApiOperation({ summary: 'Get list of all fresh available orders for job board' })
  async getAvailableOrdersList(@CurrentUser() user: any) {
    return this.orderService.getAvailableOrdersList(user.id);
  }

  @Get('orders/history')
  @ApiOperation({ summary: 'Get completed delivery orders history for rider' })
  async getOrderHistory(@CurrentUser() user: any) {
    return this.orderService.getOrderHistory(user.id);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get details of a specific delivery order' })
  async getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orderService.getOrderById(user.id, id);
  }

  @Post('orders/:id/accept')
  @ApiOperation({ summary: 'Accept delivery assignment' })
  async acceptOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orderService.acceptOrder(user.id, id);
  }

  @Post('orders/:id/reject')
  @ApiOperation({ summary: 'Reject delivery assignment' })
  async rejectOrder(@CurrentUser() user: any, @Param('id') id: string, @Body() body: RejectDto) {
    return this.orderService.rejectOrder(user.id, id, body?.reason || 'Other');
  }

  @Post('orders/:id/arrived-store')
  @ApiOperation({ summary: 'Mark arrival at dark store' })
  async arrivedStore(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orderService.arrivedAtStore(user.id, id);
  }

  @Post('orders/:id/pickup')
  @ApiOperation({ summary: 'Verify package code and mark picked up' })
  async pickupOrder(@CurrentUser() user: any, @Param('id') id: string, @Body() body: PickupDto) {
    return this.orderService.pickupOrder(user.id, id, body?.packageCode);
  }

  @Post('orders/:id/arrived-customer')
  @ApiOperation({ summary: 'Mark arrival at customer delivery location' })
  async arrivedCustomer(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orderService.arrivedAtCustomer(user.id, id);
  }

  @Post('orders/:id/collect-cash')
  @ApiOperation({ summary: 'Rider confirms physical cash collected for COD delivery' })
  async collectCash(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: CollectCashDto,
  ) {
    return this.orderService.collectCash(user.id, id, body?.amount);
  }

  @Post('orders/:id/verify-delivery')
  @ApiOperation({ summary: 'Verify 4-digit Delivery PIN and complete order transactionally' })
  async verifyDelivery(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: VerifyDeliveryDto,
  ) {
    return this.orderService.verifyDelivery(user.id, id, body.otp);
  }
}
