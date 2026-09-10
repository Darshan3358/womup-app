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

@ApiTags('Store Operations (Dark Store Staff)')
@Controller('api/v1/store/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STORE_STAFF, Role.ADMIN)
@ApiBearerAuth()
export class StoreOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Store updates order status to PACKING or PACKED' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status as OrderStatus,
      'STORE_STAFF',
      user.id,
      body.notes,
    );
  }
}
