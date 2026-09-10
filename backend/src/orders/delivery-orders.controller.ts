import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderStatus } from '../common/enums/order-status.enum';

@ApiTags('Delivery Partner Operations')
@Controller('api/v1/delivery/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DELIVERY_PARTNER, Role.ADMIN)
@ApiBearerAuth()
export class DeliveryOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Delivery partner updates order status: ASSIGNED, OUT_FOR_DELIVERY, or DELIVERED' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status as OrderStatus,
      'DELIVERY_PARTNER',
      user.id,
      body.notes,
    );
  }
}
