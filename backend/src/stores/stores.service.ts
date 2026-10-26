import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
import { Area, AreaDocument } from '../areas/schemas/area.schema';

import { TrackingGateway } from '../tracking/tracking.gateway';

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
  private cachedStores: any[] = [];
  private cachedAreas: Map<string, any> = new Map();
  private cacheExpiresAt = 0;

  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  private async getCachedStoresAndAreas(): Promise<{ stores: any[]; areas: Map<string, any> }> {
    const now = Date.now();
    if (this.cachedStores.length > 0 && now < this.cacheExpiresAt) {
      return { stores: this.cachedStores, areas: this.cachedAreas };
    }

    try {
      const [stores, areas] = await Promise.all([
        this.storeModel.find({ isActive: true }).lean().exec(),
        this.areaModel.find().lean().exec(),
      ]);

      const areaMap = new Map<string, any>();
      for (const a of areas) {
        areaMap.set(a._id.toString(), a);
      }

      this.cachedStores = stores || [];
      this.cachedAreas = areaMap;
      this.cacheExpiresAt = now + 60000; // 60s in-memory cache
      return { stores: this.cachedStores, areas: areaMap };
    } catch {
      return { stores: this.cachedStores, areas: this.cachedAreas };
    }
  }

  invalidateCache() {
    this.cacheExpiresAt = 0;
  }

  async findAll() {
    const docs = await this.storeModel.find({ isActive: true }).lean().exec();
    return docs.map((s: any) => ({
      ...s,
      id: s.id || (s._id ? s._id.toString() : ''),
      status: s.status || (s.isActive !== false ? 'ACTIVE' : 'PENDING'),
      isActive: s.isActive !== undefined ? s.isActive : true,
      coordinates: s.coordinates || s.location?.coordinates || [72.5714, 23.0225],
    }));
  }

  async getNearbyLocalStores(lat?: number, lng?: number, radiusKm: number = 5) {
    const userLat = lat ? Number(lat) : 23.1288;
    const userLng = lng ? Number(lng) : 72.5507;
    const radiusInMeters = (radiusKm || 5) * 1000;

    let stores: any[] = [];
    try {
      stores = await this.storeModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [userLng, userLat] },
            distanceField: 'distanceInMeters',
            maxDistance: radiusInMeters,
            key: 'location',
            query: {
              isActive: true,
              isOnline: { $ne: false },
            },
            spherical: true,
          },
        },
        { $sort: { distanceInMeters: 1 } },
      ]);
    } catch {
      const allActive = await this.storeModel.find({
        isActive: true,
        isOnline: { $ne: false },
      }).lean();

      stores = allActive
        .map((s: any) => {
          const sLng = s.location?.coordinates?.[0] ?? 72.5507;
          const sLat = s.location?.coordinates?.[1] ?? 23.1288;
          const distKm = haversineDistanceKm(userLat, userLng, sLat, sLng);
          return {
            ...s,
            distanceInMeters: distKm * 1000,
          };
        })
        .filter((s: any) => s.distanceInMeters <= radiusInMeters)
        .sort((a: any, b: any) => a.distanceInMeters - b.distanceInMeters);
    }

    return stores.map((s: any) => ({
      ...s,
      id: s.id || (s._id ? s._id.toString() : ''),
      distanceKm: s.distanceInMeters !== undefined ? Number((s.distanceInMeters / 1000).toFixed(1)) : 0,
      isOnline: s.isOnline ?? true,
    }));
  }

  async adminGetStores(query?: { status?: string; search?: string }) {
    const filter: any = {};
    if (query?.status && query.status !== 'All') {
      filter.status = query.status.toUpperCase();
    }
    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { address: { $regex: query.search, $options: 'i' } },
      ];
    }
    const docs = await this.storeModel.find(filter).sort({ createdAt: -1 }).lean().exec();
    return docs.map((s: any) => ({
      ...s,
      id: s.id || (s._id ? s._id.toString() : ''),
      status: s.status || (s.isActive !== false ? 'ACTIVE' : 'PENDING'),
      isActive: s.isActive !== undefined ? s.isActive : true,
      coordinates: s.coordinates || s.location?.coordinates || [72.5714, 23.0225],
    }));
  }

  async adminGetPendingStores() {
    const docs = await this.storeModel.find({
      $or: [{ status: 'PENDING' }, { status: '1' }, { isActive: false }],
    }).sort({ createdAt: -1 }).lean().exec();
    return docs.map((s: any) => ({
      ...s,
      id: s.id || (s._id ? s._id.toString() : ''),
      status: s.status || 'PENDING',
      isActive: s.isActive !== undefined ? s.isActive : false,
      coordinates: s.coordinates || s.location?.coordinates || [72.5714, 23.0225],
    }));
  }

  async adminApproveStore(id: string, adminId?: string) {
    const store = await this.storeModel.findById(id);
    if (!store) throw new NotFoundException('Store not found');

    store.status = 'ACTIVE';
    store.isActive = true;
    store.isOnShift = true;
    store.approvedAt = new Date();
    if (adminId) store.approvedBy = adminId;
    store.rejectionReason = '';

    const code = store.code || `STORE-${store.name.replace(/\s+/g, '_').toUpperCase()}`;
    store.code = code;
    store.qrLink = `womup://store/${code}`;
    store.qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=womup://store/${code}`;

    await store.save();
    this.invalidateCache();

    if (this.trackingGateway) {
      this.trackingGateway.emitStoreApproved(store._id.toString(), {
        storeId: store._id.toString(),
        name: store.name,
        code: store.code,
        status: 'ACTIVE',
        isActive: true,
        qrLink: store.qrLink,
        qrCodeImageUrl: store.qrCodeImageUrl,
      });
    }

    return {
      success: true,
      message: 'Dark store approved and activated successfully',
      data: store,
    };
  }

  async adminRejectStore(id: string, reason?: string, adminId?: string) {
    const store = await this.storeModel.findById(id);
    if (!store) throw new NotFoundException('Store not found');

    store.status = 'REJECTED';
    store.isActive = false;
    store.isOnShift = false;
    store.rejectionReason = reason || 'Incomplete or invalid documents';
    if (adminId) store.approvedBy = adminId;

    await store.save();
    this.invalidateCache();

    if (this.trackingGateway) {
      this.trackingGateway.emitKycRejected('store', store._id.toString(), {
        storeId: store._id.toString(),
        status: 'REJECTED',
        reason: store.rejectionReason,
      });
    }

    return {
      success: true,
      message: `Store rejected: ${store.rejectionReason}`,
      data: store,
    };
  }

  async findById(id: string) {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  /**
   * Ultra-fast Hyperlocal Serviceability Engine (<1ms in RAM):
   * 1. Evaluates customer coordinates against cached active dark stores.
   * 2. Checks exact haversine distance against each store's serviceRadiusKm.
   * 3. Selects closest store within radius limit.
   */
  async checkServiceability(lat: number, lng: number) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        message: 'Invalid coordinates provided.',
      };
    }

    try {
      const { stores, areas } = await this.getCachedStoresAndAreas();

      const candidateStores = [];
      for (const store of stores) {
        const storeCoords = store.location?.coordinates;
        if (!storeCoords || storeCoords.length < 2) continue;

        const storeLng = storeCoords[0];
        const storeLat = storeCoords[1];
        const dist = haversineDistanceKm(lat, lng, storeLat, storeLng);
        candidateStores.push({ store, dist });
      }

      candidateStores.sort((a, b) => a.dist - b.dist);

      let matchedStore: any = null;
      let shortestDistance = Infinity;

      for (const item of candidateStores) {
        const radiusLimit = item.store.serviceRadiusKm || 4.0;
        if (item.dist <= radiusLimit) {
          matchedStore = item.store;
          shortestDistance = item.dist;
          break;
        }
      }

      if (!matchedStore) {
        return {
          serviceable: false,
          estimatedDeliveryMinutes: 0,
          message: 'Delivery is currently not available in your selected location.',
        };
      }

      const areaKey = matchedStore.areaId ? matchedStore.areaId.toString() : '';
      const matchedArea = areaKey ? areas.get(areaKey) : null;
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
    } catch (err: any) {
      return {
        serviceable: false,
        estimatedDeliveryMinutes: 0,
        message: 'Location service temporarily unavailable.',
      };
    }
  }
}
