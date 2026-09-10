import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CancelOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@ApiTags('Orders (Customer)')
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Place a new order (Authoritative server pricing, protected with Idempotency-Key)' })
  @ApiHeader({ name: 'idempotency-key', required: false, description: 'Unique UUID to prevent duplicate submissions' })
  @ApiResponse({ status: 201, description: 'Order created with live 9-min tracking' })
  async createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get customer order history with pagination' })
  async getOrderHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getOrderHistory(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single order details and live tracking state' })
  async getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order before packing/dispatch with automatic refund' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, user.id, body.reason);
  }
}
