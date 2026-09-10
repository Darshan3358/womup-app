import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List and search products with area-specific pricing' })
  @ApiQuery({ name: 'areaId', required: false, description: 'GPS-resolved area ID for area-specific prices' })
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
    return this.productsService.findAll({ areaId, categoryId, categoryIds, search, brand, minPrice, maxPrice, discount, rating, sort, page, limit });
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular / bestseller products with area pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  async getPopular(@Query('areaId') areaId?: string) {
    return this.productsService.findPopular(10, areaId);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get special discount deal products with area pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  async getDeals(@Query('areaId') areaId?: string) {
    return this.productsService.findDeals(10, areaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail with variants and area-specific pricing' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiResponse({ status: 200, description: 'Product with variants and pricing' })
  async getProductById(@Param('id') id: string, @Query('areaId') areaId?: string) {
    return this.productsService.findById(id, areaId);
  }
}
