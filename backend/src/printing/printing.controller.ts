import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrintingService } from './printing.service';
import { PrintQuoteDto, CreatePrintOrderDto } from './dto/print.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Document Printing Service')
@Controller('api/v1/printing')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get dynamic print store services, paper qualities, and rate options' })
  @ApiResponse({ status: 200, description: 'Print services configuration' })
  getConfig() {
    return this.printingService.getPrintServicesConfig();
  }

  @Post('quote')
  @ApiOperation({ summary: 'Calculate instant print quote for document parameters (starting at ₹3/page)' })
  @ApiResponse({ status: 200, description: 'Calculated quote & GSM specification' })
  getQuote(@Body() dto: PrintQuoteDto) {
    return this.printingService.calculateQuote(dto);
  }

  @Post('orders')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create print order with private document storage key' })
  @ApiResponse({ status: 201, description: 'Print order created with 10-minute fulfillment tracking' })
  async createPrintOrder(@CurrentUser() user: any, @Body() dto: CreatePrintOrderDto) {
    return this.printingService.createPrintOrder(user?.id, dto);
  }

  @Get('orders')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer print orders' })
  async getMyPrintOrders(@CurrentUser() user: any) {
    return this.printingService.getMyPrintOrders(user?.id);
  }

  @Get('my-orders')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer print orders (alias)' })
  async getMyOrdersAlias(@CurrentUser() user: any) {
    return this.printingService.getMyPrintOrders(user?.id);
  }

  @Get('orders/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get print order details by ID or order number' })
  async getOrderDetail(@Param('id') id: string) {
    return this.printingService.getPrintOrderById(id);
  }

  @Post('orders/:id/purge')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purge document post delivery to ensure customer document privacy' })
  async purgeDocument(@Param('id') id: string) {
    return this.printingService.purgeDocument(id);
  }
}
