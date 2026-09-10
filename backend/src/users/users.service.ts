import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
}
