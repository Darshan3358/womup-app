import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';

@Injectable()
export class BannersService {
  constructor(@InjectModel(Banner.name) private bannerModel: Model<BannerDocument>) {}

  async findAll(placement?: string) {
    const query: any = { isActive: true };
    if (placement) query.placement = placement;
    return this.bannerModel.find(query).sort({ sortOrder: 1 }).exec();
  }

  async findAllForAdmin() {
    return this.bannerModel.find().sort({ sortOrder: 1, createdAt: -1 }).exec();
  }

  async create(dto: Partial<Banner>) {
    const created = new this.bannerModel({
      title: dto.title || 'Promotional Banner',
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl || '',
      placement: dto.placement || 'HOME_HERO',
      targetType: dto.targetType || '',
      targetId: dto.targetId || '',
      sortOrder: dto.sortOrder || 0,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
    return created.save();
  }

  async update(id: string, dto: Partial<Banner>) {
    const banner = await this.bannerModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async delete(id: string) {
    const res = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Banner not found');
    return { success: true, message: 'Banner deleted successfully' };
  }

  async toggleActive(id: string) {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) throw new NotFoundException('Banner not found');
    banner.isActive = !banner.isActive;
    return banner.save();
  }
}
