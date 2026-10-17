import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from './schemas/area.schema';
import { AreaPricing, AreaPricingDocument } from './schemas/area-pricing.schema';
import { City, CityDocument } from './schemas/city.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';

/** Haversine formula: distance in km between two GPS points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class AreasService {
  constructor(
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
    @InjectModel(AreaPricing.name) private areaPricingModel: Model<AreaPricingDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async getAllCities() {
    return this.cityModel.find({ status: 'Active' }).sort({ sortOrder: 1, name: 1 }).exec();
  }

  async resolveAreaByCoords(lat: number, lng: number): Promise<AreaDocument | null> {
    const activeAreas = await this.areaModel.find({ isActive: true }).exec();
    let nearest: AreaDocument | null = null;
    let minDist = Infinity;

    for (const area of activeAreas) {
      const dist = haversineKm(lat, lng, area.centerLat, area.centerLng);
      if (dist <= area.radiusKm && dist < minDist) {
        minDist = dist;
        nearest = area;
      }
    }

    // If no zone matches within radius, only allow fallback if within operational buffer (max 10 km)
    if (!nearest && activeAreas.length > 0) {
      let closestDist = Infinity;
      let candidate: AreaDocument | null = null;
      for (const area of activeAreas) {
        const dist = haversineKm(lat, lng, area.centerLat, area.centerLng);
        const maxBufferKm = Math.max(10, (area.radiusKm || 5) * 1.5);
        if (dist <= maxBufferKm && dist < closestDist) {
          closestDist = dist;
          candidate = area;
        }
      }
      nearest = candidate;
    }

    return nearest;
  }

  async detectArea(
    latitude: number,
    longitude: number,
    cityId?: string,
  ): Promise<{
    success: boolean;
    code?: string;
    message?: string;
    area?: {
      id: string;
      name: string;
      cityId?: string;
    };
    areaId?: string;
    areaName?: string;
    city?: string;
    cityName?: string;
    cityId?: string;
    storeId?: string;
    storeName?: string;
    storeCode?: string;
    serviceable?: boolean;
    deliveryMinutes?: number;
    distanceKm?: number;
  }> {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return {
        success: false,
        code: 'INVALID_COORDINATES',
        message: 'Valid city and coordinates are required (lat: -90..90, lng: -180..180)',
      };
    }

    // 1. Point-in-Polygon Query using $geoIntersects
    // GeoJSON point coordinates are strictly [longitude, latitude]
    const query: any = {
      $or: [
        {
          geometry: {
            $geoIntersects: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
            },
          },
        },
        {
          polygon: {
            $geoIntersects: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
            },
          },
        },
      ],
      isActive: true,
    };

    if (cityId) {
      if (Types.ObjectId.isValid(cityId)) {
        query.cityId = new Types.ObjectId(cityId);
      } else {
        query.cityId = cityId;
      }
    }

    const matchingAreas = await this.areaModel.find(query).exec();

    let area: any = null;
    if (matchingAreas.length > 0) {
      // Pick the most specific area whose center is closest to requested coordinate
      matchingAreas.sort((a, b) => {
        const distA = Math.hypot((a.centerLat || 0) - lat, (a.centerLng || 0) - lng);
        const distB = Math.hypot((b.centerLat || 0) - lat, (b.centerLng || 0) - lng);
        return distA - distB;
      });
      area = matchingAreas[0];
    }

    // 2. Fallback to nearest area by coordinates if point is near border
    if (!area) {
      area = await this.resolveAreaByCoords(lat, lng);
    }

    if (!area) {
      return {
        success: false,
        code: 'OUTSIDE_SERVICE_AREA',
        message: 'Delivery is not available at this location',
      };
    }

    // 3. Resolve assigned Dark Store strictly within the detected delivery area
    let candidateStores = await this.storeModel.find({
      $or: [
        { areaId: area._id },
        { areaId: (area._id as any).toString() },
        ...(area.hubStoreId ? [{ _id: area.hubStoreId }] : []),
      ],
      isActive: true,
    }).exec();

    let store: any = null;
    let distKm: number | undefined = undefined;

    if (candidateStores.length > 0) {
      if (candidateStores.length === 1) {
        store = candidateStores[0];
      } else {
        // Score multiple stores in the same area by closest distance to customer coordinates
        let bestDist = Infinity;
        let bestStore = candidateStores[0];
        for (const s of candidateStores) {
          const coords = s.location?.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            const d = haversineKm(lat, lng, coords[1], coords[0]);
            if (d < bestDist) {
              bestDist = d;
              bestStore = s;
            }
          }
        }
        store = bestStore;
      }

      if (store?.location?.coordinates && Array.isArray(store.location.coordinates) && store.location.coordinates.length >= 2) {
        distKm = Number(haversineKm(lat, lng, store.location.coordinates[1], store.location.coordinates[0]).toFixed(1));
      }
    }

    const areaIdStr = (area._id as any).toString();
    const cityIdStr = area.cityId ? area.cityId.toString() : undefined;
    const serviceable = Boolean(store);

    return {
      success: true,
      serviceable,
      area: {
        id: areaIdStr,
        name: area.name,
        cityId: cityIdStr,
      },
      areaId: areaIdStr,
      areaName: area.name,
      city: area.city || 'Ahmedabad',
      cityName: (area as any).cityName || area.city || 'Ahmedabad',
      cityId: cityIdStr,
      storeId: store ? (store._id as any).toString() : undefined,
      storeName: store ? store.name : undefined,
      storeCode: store ? store.code : undefined,
      deliveryMinutes: area.defaultDeliveryMinutes || 9,
      distanceKm: distKm,
      message: serviceable ? undefined : `No active Dark Store serving ${area.name}`,
    };
  }

  async getDefaultArea(): Promise<AreaDocument | null> {
    return this.areaModel.findOne({ isActive: true }).sort({ sortOrder: 1 }).exec();
  }

  async getAllAreas(cityId?: string) {
    const query: any = { isActive: true };
    if (cityId) {
      if (Types.ObjectId.isValid(cityId)) {
        query.$or = [{ cityId: new Types.ObjectId(cityId) }, { cityId: cityId.toString() }];
      } else {
        query.cityId = cityId;
      }
    }

    const [areas, activeStores] = await Promise.all([
      this.areaModel.find(query).sort({ sortOrder: 1, name: 1 }).exec(),
      this.storeModel.find({ isActive: true }, { areaId: 1, name: 1, code: 1 }).exec(),
    ]);

    const storeCountMap = new Map<string, Array<{ storeId: string; storeName: string; storeCode?: string }>>();
    for (const store of activeStores) {
      if (store.areaId) {
        const key = store.areaId.toString();
        const existing = storeCountMap.get(key) || [];
        existing.push({
          storeId: store._id.toString(),
          storeName: store.name,
          storeCode: store.code,
        });
        storeCountMap.set(key, existing);
      }
    }

    return areas.map((area) => {
      const areaObj = area.toObject();
      const areaIdStr = area._id.toString();
      const assignedList = storeCountMap.get(areaIdStr) || [];
      const storeCount = assignedList.length;
      const maxStores = Math.max(1, Number(areaObj.maxStores) || 1);
      const slotsLeft = Math.max(0, maxStores - storeCount);
      const isFull = storeCount >= maxStores;

      return {
        ...areaObj,
        id: areaIdStr,
        maxStores,
        currentStoreCount: storeCount,
        slotsLeft,
        isFull,
        isAvailable: !isFull,
        hasActiveStore: storeCount > 0,
        status: isFull ? 'ASSIGNED' : 'AVAILABLE',
        assignedStores: assignedList,
        assignedStore: assignedList[0] || null,
      };
    });
  }

  async getPricingForVariants(
    variantIds: Types.ObjectId[],
    areaId: Types.ObjectId | string,
  ): Promise<Map<string, AreaPricingDocument>> {
    const variantIdStrings = variantIds.map((v) => v.toString());
    const areaQueries: any[] = [{ areaId: areaId.toString() }];
    if (Types.ObjectId.isValid(areaId.toString())) {
      areaQueries.push({ areaId: new Types.ObjectId(areaId.toString()) });
    }
    const records = await this.areaPricingModel
      .find({
        variantId: { $in: [...variantIds, ...variantIdStrings] },
        $or: areaQueries,
      })
      .exec();
    const map = new Map<string, AreaPricingDocument>();
    for (const r of records) {
      map.set(r.variantId.toString(), r);
    }
    return map;
  }
}
