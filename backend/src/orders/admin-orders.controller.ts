import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from '../common/enums/order-status.enum';

@ApiTags('Admin Operations')
@Controller('api/v1/admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin view of all orders across dark stores' })
  async getAllOrders(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAllForAdmin(status, page, limit);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin manual override of order status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status as OrderStatus,
      'ADMIN',
      user.id,
      body.notes || 'Status updated by Admin',
    );
  }
}
