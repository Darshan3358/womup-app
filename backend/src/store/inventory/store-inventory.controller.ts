import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreInventoryService } from './store-inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  StockAdjustmentDto,
  RestockDto,
  UpdateShelfLocationDto,
  StoreAddProductDto,
} from './dto/store-inventory.dto';

@ApiTags('Store App Operations')
@Controller(['api/v1/store/inventory', 'store/inventory'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoreInventoryController {
  constructor(private readonly storeInventoryService: StoreInventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get store inventory list with search and stock filters' })
  async getInventory(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.storeInventoryService.getInventory(
      req.user.id,
      search,
      filter,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products currently at or below low stock threshold' })
  async getLowStock(@Request() req: any) {
    return this.storeInventoryService.getLowStock(req.user.id);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get inventory audit logs timeline' })
  async getLogs(
    @Request() req: any,
    @Query('productId') productId?: string,
  ) {
    return this.storeInventoryService.getLogs(req.user.id, productId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Adjust stock quantity for damages, returns, or manual count' })
  async adjustStock(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    return this.storeInventoryService.adjustStock(req.user.id, productId, dto);
  }

  @Post(':productId/restock')
  @ApiOperation({ summary: 'Add restocked inventory units from batch' })
  async restock(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() dto: RestockDto,
  ) {
    return this.storeInventoryService.restock(req.user.id, productId, dto);
  }

  @Patch(':productId/shelf')
  @ApiOperation({ summary: 'Update shelf location for a product in this dark store' })
  async updateShelfLocation(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateShelfLocationDto,
  ) {
    return this.storeInventoryService.updateShelfLocation(req.user.id, productId, dto);
  }

  @Post('add-product')
  @ApiOperation({ summary: 'Add a new product to master catalog and store inventory' })
  async addProduct(
    @Request() req: any,
    @Body() dto: StoreAddProductDto,
  ) {
    return this.storeInventoryService.addProduct(req.user.id, dto);
  }
}

