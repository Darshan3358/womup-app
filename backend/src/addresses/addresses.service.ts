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

    // Ephemeral GPS / "Current" locations should never be persisted as saved addresses
    if (dto.label === 'Current') {
      const existing = await this.addressModel.findOne({ userId: uId }).sort({ isDefault: -1, createdAt: -1 });
      return existing || null;
    }

    // Check for existing duplicate address for this user
    const coords = dto.coordinates || [72.5714, 23.0225];
    const existing = await this.addressModel.findOne({
      userId: uId,
      $or: [
        {
          houseNumber: dto.houseNumber?.trim(),
          street: dto.street?.trim(),
          pincode: dto.pincode?.trim(),
        },
        {
          'location.coordinates.0': { $gte: coords[0] - 0.0002, $lte: coords[0] + 0.0002 },
          'location.coordinates.1': { $gte: coords[1] - 0.0002, $lte: coords[1] + 0.0002 },
          label: dto.label,
        },
      ],
    });

    if (existing) {
      if (dto.isDefault) {
        await this.addressModel.updateMany({ userId: uId }, { isDefault: false });
        existing.isDefault = true;
      }
      if (dto.houseNumber) existing.houseNumber = dto.houseNumber;
      if (dto.street) existing.street = dto.street;
      if (dto.landmark) existing.landmark = dto.landmark;
      if (dto.city) existing.city = dto.city;
      if (dto.pincode) existing.pincode = dto.pincode;
      if (coords && coords.length === 2) {
        existing.location = { type: 'Point', coordinates: coords };
      }
      return existing.save();
    }

    // If marked as default, unset other addresses
    if (dto.isDefault) {
      await this.addressModel.updateMany({ userId: uId }, { isDefault: false });
    } else {
      const count = await this.addressModel.countDocuments({ userId: uId });
      if (count === 0) {
        dto.isDefault = true; // First address defaults to default
      }
    }

    const toSave: any = {
      userId: uId,
      ...dto,
      location: {
        type: 'Point',
        coordinates: coords,
      },
    };
    if (dto.areaId && Types.ObjectId.isValid(dto.areaId)) {
      toSave.areaId = new Types.ObjectId(dto.areaId);
    }
    if (dto.storeId && Types.ObjectId.isValid(dto.storeId)) {
      toSave.storeId = new Types.ObjectId(dto.storeId);
    }
    return this.addressModel.create(toSave);
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
