import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
  SubCategory,
  SubCategoryDocument,
} from './schemas/category.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { clearHomeCache } from '../home/home-cache';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,
    private readonly moduleRef: ModuleRef,
  ) {}

  private notifyCategoryChange(type: string, details?: any) {
    try {
      clearHomeCache();
      const gateway = this.moduleRef.get(TrackingGateway, { strict: false });
      gateway?.server?.emit('catalog:updated', {
        type,
        ...details,
        timestamp: new Date().toISOString(),
      });
      gateway?.server?.emit('categories:updated', {
        type,
        ...details,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    const categories = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    // Enrich with product counts and subcategories
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const catId = cat._id;
        const subCats = await this.subCategoryModel
          .find({ categoryId: catId })
          .sort({ sortOrder: 1, name: 1 })
          .exec();

        let productCount = 0;
        try {
          productCount = await this.categoryModel.db.collection('products').countDocuments({
            $or: [
              { categoryId: catId },
              { categoryId: catId.toString() },
              { category: cat.name },
            ],
          });
        } catch (_) {}

        return {
          ...cat.toObject(),
          id: cat._id.toString(),
          productCount,
          subCategoryCount: subCats.length,
          subCategories: subCats.map((s) => ({
            ...s.toObject(),
            id: s._id.toString(),
          })),
        };
      })
    );

    return enriched;
  }

  async findById(id: string) {
    let query: any = {};
    if (Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new Types.ObjectId(id) }, { slug: id }, { code: id }] };
    } else {
      query = { $or: [{ slug: id }, { code: id }] };
    }

    const category = await this.categoryModel.findOne(query).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: {
    name: string;
    code?: string;
    slug?: string;
    icon?: string;
    bgColor?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Category name is required');
    }

    const name = dto.name.trim();
    const slug = (dto.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const code = (dto.code || slug.toUpperCase().replace(/-/g, '_')).trim();

    const existing = await this.categoryModel.findOne({
      $or: [{ code }, { slug }, { name }],
    }).exec();

    if (existing) {
      throw new BadRequestException(`Category with code "${code}" or name "${name}" already exists`);
    }

    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || isNaN(sortOrder)) {
      const highest = await this.categoryModel.findOne().sort({ sortOrder: -1 }).exec();
      sortOrder = highest ? (highest.sortOrder || 0) + 1 : 1;
    }

    const newCat = new this.categoryModel({
      name,
      code,
      slug,
      icon: dto.icon || 'shopping-bag',
      bgColor: dto.bgColor || '#EEF9F3',
      description: dto.description?.trim() || '',
      sortOrder,
      isActive: dto.isActive !== false,
      itemCount: 0,
    });

    const saved = await newCat.save();
    this.notifyCategoryChange('CATEGORY_CREATED', { categoryId: saved._id.toString(), name: saved.name });
    return saved;
  }

  async update(id: string, dto: Partial<Category>) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.bgColor !== undefined) category.bgColor = dto.bgColor;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.sortOrder !== undefined) category.sortOrder = Number(dto.sortOrder);
    if (dto.isActive !== undefined) category.isActive = Boolean(dto.isActive);

    const saved = await category.save();
    this.notifyCategoryChange('CATEGORY_UPDATED', { categoryId: saved._id.toString(), name: saved.name });
    return saved;
  }

  async toggleStatus(id: string, isActive?: boolean) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.isActive = isActive !== undefined ? Boolean(isActive) : !category.isActive;
    const saved = await category.save();
    this.notifyCategoryChange('CATEGORY_STATUS_TOGGLED', { categoryId: saved._id.toString(), isActive: saved.isActive });
    return saved;
  }

  async delete(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Safety check: block if products assigned
    let productCount = 0;
    try {
      productCount = await this.categoryModel.db.collection('products').countDocuments({
        $or: [
          { categoryId: category._id },
          { categoryId: category._id.toString() },
          { category: category.name },
        ],
      });
    } catch (_) {}

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${category.name}". It has ${productCount} products assigned. Move or delete those products first, or use Deactivate instead.`
      );
    }

    // Delete subcategories
    await this.subCategoryModel.deleteMany({ categoryId: category._id }).exec();
    await this.categoryModel.deleteOne({ _id: category._id }).exec();

    this.notifyCategoryChange('CATEGORY_DELETED', { categoryId: id });
    return { success: true, message: `Category "${category.name}" permanently deleted.` };
  }

  // --- SUBCATEGORIES ---

  async findSubcategories(categoryId: string) {
    let query: any = {};
    if (Types.ObjectId.isValid(categoryId)) {
      query = { categoryId: new Types.ObjectId(categoryId) };
    } else {
      const parent = await this.categoryModel.findOne({ slug: categoryId }).exec();
      if (!parent) return [];
      query = { categoryId: parent._id };
    }

    return this.subCategoryModel.find(query).sort({ sortOrder: 1, name: 1 }).exec();
  }

  async createSubcategory(categoryId: string, dto: {
    name: string;
    slug?: string;
    icon?: string;
    defaultShelfAisle?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const parent = await this.findById(categoryId);
    const name = dto.name.trim();
    const slug = (dto.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const existing = await this.subCategoryModel.findOne({
      categoryId: parent._id,
      $or: [{ name }, { slug }],
    }).exec();

    if (existing) {
      throw new BadRequestException(`Sub-category "${name}" already exists under ${parent.name}`);
    }

    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || isNaN(sortOrder)) {
      const highest = await this.subCategoryModel.findOne({ categoryId: parent._id }).sort({ sortOrder: -1 }).exec();
      sortOrder = highest ? (highest.sortOrder || 0) + 1 : 1;
    }

    const newSub = new this.subCategoryModel({
      categoryId: parent._id,
      name,
      slug,
      icon: dto.icon || 'grid',
      defaultShelfAisle: dto.defaultShelfAisle?.trim() || '',
      sortOrder,
      isActive: dto.isActive !== false,
      itemCount: 0,
    });

    const saved = await newSub.save();
    this.notifyCategoryChange('SUBCATEGORY_CREATED', { subCategoryId: saved._id.toString(), parentCategoryId: parent._id.toString() });
    return saved;
  }

  async updateSubcategory(subId: string, dto: Partial<SubCategory>) {
    const sub = await this.subCategoryModel.findById(subId).exec();
    if (!sub) {
      throw new NotFoundException('Sub-category not found');
    }

    if (dto.name !== undefined) sub.name = dto.name.trim();
    if (dto.slug !== undefined) sub.slug = dto.slug.trim().toLowerCase();
    if (dto.icon !== undefined) sub.icon = dto.icon;
    if (dto.defaultShelfAisle !== undefined) sub.defaultShelfAisle = dto.defaultShelfAisle;
    if (dto.sortOrder !== undefined) sub.sortOrder = Number(dto.sortOrder);
    if (dto.isActive !== undefined) sub.isActive = Boolean(dto.isActive);

    const saved = await sub.save();
    this.notifyCategoryChange('SUBCATEGORY_UPDATED', { subCategoryId: saved._id.toString() });
    return saved;
  }

  async deleteSubcategory(subId: string) {
    const sub = await this.subCategoryModel.findById(subId).exec();
    if (!sub) {
      throw new NotFoundException('Sub-category not found');
    }

    let productCount = 0;
    try {
      productCount = await this.subCategoryModel.db.collection('products').countDocuments({
        $or: [
          { subCategoryId: sub._id },
          { subCategoryId: sub._id.toString() },
          { subCategory: sub.name },
        ],
      });
    } catch (_) {}

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete sub-category "${sub.name}". It has ${productCount} products assigned. Reassign products first.`
      );
    }

    await this.subCategoryModel.deleteOne({ _id: sub._id }).exec();
    this.notifyCategoryChange('SUBCATEGORY_DELETED', { subCategoryId: subId });
    return { success: true, message: `Sub-category "${sub.name}" deleted.` };
  }
}
