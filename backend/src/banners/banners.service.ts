import { Injectable } from '@nestjs/common';
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
}
