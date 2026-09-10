import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';

@Injectable()
export class StoresService {
  constructor(@InjectModel(Store.name) private storeModel: Model<StoreDocument>) {}

  async findAll() {
    return this.storeModel.find({ isActive: true }).exec();
  }

  async findById(id: string) {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async checkServiceability(lat: number, lng: number) {
    // GeoJSON coordinates are [longitude, latitude]
    const stores = await this.storeModel.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: 10000, // 10 km max query boundary
        },
      },
    }).exec();

    if (!stores || stores.length === 0) {
      // Fallback: If no GPS match, return primary flagship store for development
      const defaultStore = await this.storeModel.findOne({ isActive: true }).exec();
      if (defaultStore) {
        return {
          serviceable: true,
          estimatedDeliveryMinutes: defaultStore.estimatedDeliveryMinutes || 9,
          storeId: defaultStore._id.toString(),
          storeName: defaultStore.name,
          deliveryFee: 0,
          isSimulatedCoverage: true,
        };
      }
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        message: 'Delivery is currently not available in your selected location.',
      };
    }

    const nearestStore = stores[0];
    return {
      serviceable: true,
      estimatedDeliveryMinutes: nearestStore.estimatedDeliveryMinutes || 9,
      storeId: nearestStore._id.toString(),
      storeName: nearestStore.name,
      deliveryFee: 0,
      isSimulatedCoverage: false,
    };
  }
}
