import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { StoresService } from '../stores/stores.service';

@ApiTags('Products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
  ) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby products from serviceable dark store using customer GPS coordinates' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNearbyProducts(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: number,
  ) {
    const serviceability = await this.storesService.checkServiceability(Number(lat), Number(lng));
    if (!serviceability.serviceable) {
      return {
        serviceable: false,
        message: serviceability.message,
        store: null,
        items: [],
        pagination: { page: 1, limit: limit || 20, total: 0, totalPages: 0 },
      };
    }

    const result = await this.productsService.findAll({
      areaId: serviceability.areaId,
      storeId: serviceability.storeId,
      categoryId,
      limit: limit || 50,
    });

    return {
      serviceable: true,
      store: {
        id: serviceability.storeId,
        name: serviceability.storeName,
        code: serviceability.storeCode,
        eta: serviceability.estimatedDeliveryMinutes,
      },
      ...result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List and search products with area-specific pricing and store-specific stock' })
  @ApiQuery({ name: 'areaId', required: false, description: 'GPS-resolved area ID for area-specific prices' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Dark store ID for accurate inventory stock' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'categoryIds', required: false, description: 'Comma-separated category ObjectIds or slugs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'discount', required: false, type: Number })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['popularity', 'price_asc', 'price_desc', 'discount', 'newest'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProducts(
    @Query('areaId') areaId?: string,
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('categoryIds') categoryIds?: string,
    @Query('search') search?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('discount') discount?: number,
    @Query('rating') rating?: number,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll({ areaId, storeId, categoryId, categoryIds, search, brand, minPrice, maxPrice, discount, rating, sort, page, limit });
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular / bestseller products with area pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  async getPopular(@Query('areaId') areaId?: string, @Query('storeId') storeId?: string) {
    return this.productsService.findPopular(10, areaId, storeId);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get special discount deal products with area pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  async getDeals(@Query('areaId') areaId?: string, @Query('storeId') storeId?: string) {
    return this.productsService.findDeals(10, areaId, storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail with variants and area-specific pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiResponse({ status: 200, description: 'Product with variants and pricing' })
  async getProductById(@Param('id') id: string, @Query('areaId') areaId?: string, @Query('storeId') storeId?: string) {
    return this.productsService.findById(id, areaId, storeId);
  }
}
