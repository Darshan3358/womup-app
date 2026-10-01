import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller(['api/v1/categories', 'api/admin/categories'])
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product categories (active or all)' })
  @ApiResponse({ status: 200, description: 'Category list' })
  async getCategories(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  async createCategory(@Body() body: any) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.categoriesService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle category active status' })
  async toggleCategoryStatus(
    @Param('id') id: string,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.categoriesService.toggleStatus(id, isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category if empty' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }

  // --- Subcategories ---

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories for a parent category' })
  async getSubcategories(@Param('id') id: string) {
    return this.categoriesService.findSubcategories(id);
  }

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Add subcategory' })
  async createSubcategory(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.categoriesService.createSubcategory(id, body);
  }

  @Patch(':id/subcategories/:subId')
  @ApiOperation({ summary: 'Update subcategory' })
  async updateSubcategory(
    @Param('subId') subId: string,
    @Body() body: any,
  ) {
    return this.categoriesService.updateSubcategory(subId, body);
  }

  @Delete(':id/subcategories/:subId')
  @ApiOperation({ summary: 'Delete subcategory if empty' })
  async deleteSubcategory(@Param('subId') subId: string) {
    return this.categoriesService.deleteSubcategory(subId);
  }
}
