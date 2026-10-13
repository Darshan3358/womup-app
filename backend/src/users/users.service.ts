import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-__v').exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: UpdateUserDto) {
    const currentUser = await this.userModel.findById(userId).exec();
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updateOps: any = { $set: {} };
    if (updateData.name !== undefined) updateOps.$set.name = updateData.name;
    if (updateData.email !== undefined) updateOps.$set.email = updateData.email;
    if (updateData.avatar !== undefined) updateOps.$set.avatar = updateData.avatar;
    if (updateData.hideSensitiveItems !== undefined) updateOps.$set.hideSensitiveItems = updateData.hideSensitiveItems;
    if (updateData.preferredCityId !== undefined) updateOps.$set.preferredCityId = updateData.preferredCityId;
    if (updateData.preferredCityName !== undefined) updateOps.$set.preferredCityName = updateData.preferredCityName;

    if (updateData.birthday) {
      updateOps.$set.birthday = updateData.birthday;
      // Award 50 bonus shopping coins on first-time birthday save
      if (!currentUser.birthday) {
        updateOps.$inc = { shoppingCoins: 50 };
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateOps, { new: true })
      .select('-__v')
      .exec();

    return user;
  }

  async getWishlist(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const items = await this.productModel.find({ _id: { $in: user.wishlist || [] } }).exec();
    return items;
  }

  async toggleWishlist(userId: string, productId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const resolvedId = product ? product._id : (Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : null);
    if (!resolvedId) {
      throw new NotFoundException('Product not found for wishlist');
    }

    const prodIdStr = resolvedId.toString();
    const existingIndex = user.wishlist.findIndex(
      (id) => id && id.toString() === prodIdStr,
    );

    let isInWishlist = false;
    if (existingIndex > -1) {
      user.wishlist.splice(existingIndex, 1);
      isInWishlist = false;
    } else {
      user.wishlist.unshift(resolvedId);
      isInWishlist = true;
    }

    await user.save();
    const items = await this.productModel.find({ _id: { $in: user.wishlist } }).exec();
    const result = {
      action: isInWishlist ? 'ADDED' : 'REMOVED',
      isInWishlist,
      items,
    };

    // Emit live cross-device update to user's web and mobile apps
    this.trackingGateway.emitWishlistUpdated(userId, items);

    return result;
  }

  async clearWishlist(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $set: { wishlist: [] } });
    this.trackingGateway.emitWishlistUpdated(userId, []);
    return { items: [] };
  }
}
