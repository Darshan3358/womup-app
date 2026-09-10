import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
  SubCategory,
  SubCategoryDocument,
} from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,
  ) {}

  async findAll() {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findById(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findSubcategories(categoryId: string) {
    return this.subCategoryModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .exec();
  }
}
