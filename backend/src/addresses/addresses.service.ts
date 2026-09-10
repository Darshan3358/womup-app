import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  async findAllByUser(userId: string) {
    return this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async create(userId: string, dto: CreateAddressDto) {
    const uId = new Types.ObjectId(userId);

    // If marked as default, unset other addresses
    if (dto.isDefault) {
      await this.addressModel.updateMany({ userId: uId }, { isDefault: false });
    } else {
      const count = await this.addressModel.countDocuments({ userId: uId });
      if (count === 0) {
        dto.isDefault = true; // First address defaults to default
      }
    }

    const coords = dto.coordinates || [72.5714, 23.0225];
    return this.addressModel.create({
      userId: uId,
      ...dto,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    });
  }

  async setDefault(userId: string, addressId: string) {
    const uId = new Types.ObjectId(userId);
    const aId = new Types.ObjectId(addressId);

    await this.addressModel.updateMany({ userId: uId }, { isDefault: false });
    const address = await this.addressModel.findOneAndUpdate(
      { _id: aId, userId: uId },
      { isDefault: true },
      { new: true },
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async delete(userId: string, addressId: string) {
    if (!Types.ObjectId.isValid(addressId) || !Types.ObjectId.isValid(userId)) {
      return { deleted: true };
    }
    const uId = new Types.ObjectId(userId);
    const aId = new Types.ObjectId(addressId);

    await this.addressModel.deleteOne({ _id: aId, userId: uId });
    return { deleted: true };
  }
}
