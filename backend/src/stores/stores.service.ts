import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { Area, AreaDocument } from '../areas/schemas/area.schema';

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
  ) {}

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

  /**
   * Deterministic Hyperlocal Serviceability Engine:
   * 1. Finds nearest active dark stores using 2dsphere ($near).
   * 2. Checks exact haversine distance against each store's serviceRadiusKm.
   * 3. Selects the closest store whose service radius encompasses the customer GPS.
   * 4. Completely eliminates overlapping polygon ambiguity and nondeterministic store switching.
   */
  async checkServiceability(lat: number, lng: number) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        message: 'Invalid coordinates provided.',
      };
    }

    // 1. Find up to 5 nearest active stores within 12 km radius (sorted ascending by distance)
    const candidateStores = await this.storeModel
      .find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: 12000,
          },
        },
      })
      .limit(5)
      .exec();

    let matchedStore: StoreDocument | null = null;
    let shortestDistance = Infinity;

    for (const store of candidateStores) {
      const storeCoords = store.location?.coordinates;
      if (!storeCoords || storeCoords.length < 2) continue;

      const storeLng = storeCoords[0];
      const storeLat = storeCoords[1];
      const dist = haversineDistanceKm(lat, lng, storeLat, storeLng);
      const radiusLimit = store.serviceRadiusKm || 4.0;

      if (dist <= radiusLimit) {
        matchedStore = store;
        shortestDistance = dist;
        break; // candidateStores is already sorted by distance ascending ($near)
      }
    }

    // 2. If customer is outside all stores' service radiuses, return honest rejection
    if (!matchedStore) {
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        message: 'Delivery is currently not available in your selected location.',
      };
    }

    // 3. Match area if available
    let matchedArea = null;
    if (matchedStore.areaId) {
      matchedArea = await this.areaModel.findById(matchedStore.areaId).exec();
    }

    // Dynamic ETA: 6-7 min base + ~2 min per km, clamped between 8 and 15 min
    const dynamicEta = Math.max(8, Math.min(15, Math.round(5.5 + shortestDistance * 2.2)));

    return {
      serviceable: true,
      areaId: matchedArea?._id?.toString() || matchedStore.areaId?.toString() || null,
      areaName: matchedArea?.name || matchedStore.areaName || matchedStore.name,
      storeId: matchedStore._id.toString(),
      storeName: matchedStore.name,
      storeCode: matchedStore.code,
      estimatedDeliveryMinutes: dynamicEta,
      distanceKm: shortestDistance,
      deliveryFee: 0,
      message: `Fulfillable by ${matchedStore.name} in ${dynamicEta} minutes (${shortestDistance} km)`,
    };
  }
}
