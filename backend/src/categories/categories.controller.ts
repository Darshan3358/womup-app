import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active product categories' })
  @ApiResponse({ status: 200, description: 'Category list' })
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories for a parent category' })
  async getSubcategories(@Param('id') id: string) {
    return this.categoriesService.findSubcategories(id);
  }
}
