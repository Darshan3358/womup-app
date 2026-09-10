import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check product availability across dark store inventory' })
  async checkStock(
    @Body() body: { storeId: string; items: { productId: string; quantity: number }[] },
  ) {
    return this.inventoryService.checkStock(body.storeId, body.items);
  }

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create 10-minute temporary inventory reservation during checkout initiation' })
  @ApiResponse({ status: 201, description: 'Reservation ID and TTL' })
  async reserve(
    @CurrentUser() user: any,
    @Body() body: { storeId: string; items: { productId: string; quantity: number }[] },
  ) {
    return this.inventoryService.reserveInventory(body.storeId, user.id, body.items);
  }

  @Post('release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually release reservation on cancelled/abandoned checkout' })
  async release(@Body('reservationId') reservationId: string) {
    return this.inventoryService.releaseReservation(reservationId);
  }
}
