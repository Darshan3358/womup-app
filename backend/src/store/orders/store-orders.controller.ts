import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreOrdersService } from './store-orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  PickItemDto,
  OutOfStockDto,
  PackCompleteDto,
  ReadyForPickupDto,
  HandoverDto,
} from './dto/store-order.dto';

@ApiTags('Store App Operations')
@Controller(['api/v1/store/orders', 'store/orders'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoreOrdersController {
  constructor(private readonly storeOrdersService: StoreOrdersService) {}

  @Get('incoming')
  @ApiOperation({ summary: 'Get incoming PLACED orders queue (FIFO order)' })
  async getIncomingOrders(@Request() req: any) {
    return this.storeOrdersService.getIncomingOrders(req.user.id);
  }

  @Get('picking')
  @ApiOperation({ summary: 'Get currently active PACKING orders with pick progress' })
  async getPickingOrders(@Request() req: any) {
    return this.storeOrdersService.getPickingOrders(req.user.id);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get PACKED orders awaiting rider handover' })
  async getReadyOrders(@Request() req: any) {
    return this.storeOrdersService.getReadyOrders(req.user.id);
  }

  @Get('performance/leaderboard')
  @ApiOperation({ summary: 'Get store picker leaderboard and metrics' })
  async getLeaderboard(@Request() req: any) {
    return this.storeOrdersService.getStoreLeaderboard(req.user.id);
  }

  @Get('stores/available')
  @ApiOperation({ summary: 'Get active dark stores for staff hub selection' })
  async getAvailableStores() {
    return this.storeOrdersService.getAvailableStores();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed/delivered past orders for dark store' })
  async getOrderHistory(@Request() req: any) {
    return this.storeOrdersService.getOrderHistory(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details and item picklist with shelf slots' })
  async getOrderDetail(@Request() req: any, @Param('id') orderId: string) {
    return this.storeOrdersService.getOrderDetail(req.user.id, orderId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept incoming order and begin picking' })
  async acceptOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.storeOrdersService.acceptOrder(req.user.id, orderId);
  }

  @Post(':id/items/:itemId/pick')
  @ApiOperation({ summary: 'Scan barcode and mark item as picked' })
  async pickItem(
    @Request() req: any,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: PickItemDto,
  ) {
    return this.storeOrdersService.pickItem(
      req.user.id,
      orderId,
      itemId,
      dto.scannedBarcode,
    );
  }

  @Post(':id/items/:itemId/out-of-stock')
  @ApiOperation({ summary: 'Mark item out-of-stock and trigger automatic customer refund' })
  async itemOutOfStock(
    @Request() req: any,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: OutOfStockDto,
  ) {
    return this.storeOrdersService.itemOutOfStock(
      req.user.id,
      orderId,
      itemId,
      dto,
    );
  }

  @Post(':id/pack-complete')
  @ApiOperation({ summary: 'Complete picking, seal bag, and generate bag barcode' })
  async packComplete(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() dto: PackCompleteDto,
  ) {
    return this.storeOrdersService.packComplete(req.user.id, orderId, dto);
  }

  @Post(':id/bag-barcode')
  @ApiOperation({ summary: 'Generate bag barcode for order packing' })
  async generateBagBarcode(
    @Param('id') orderId: string,
  ) {
    return this.storeOrdersService.generateBagBarcode(orderId);
  }

  @Post(':id/ready-for-pickup')
  @ApiOperation({ summary: 'Place packed bag on shelf slot and notify delivery riders' })
  async readyForPickup(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() dto: ReadyForPickupDto,
  ) {
    return this.storeOrdersService.readyForPickup(
      req.user.id,
      orderId,
      dto.shelfSlot,
    );
  }

  @Post(':id/handover')
  @ApiOperation({ summary: 'Scan rider bag barcode and handover order (OUT_FOR_DELIVERY)' })
  async handover(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() dto: HandoverDto,
  ) {
    return this.storeOrdersService.handover(req.user.id, orderId, dto);
  }
}
