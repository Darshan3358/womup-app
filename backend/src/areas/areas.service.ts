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
      // If area already has a defined polygon, spatial $geoIntersects is authoritative
      const hasPolygon =
        (area.polygon?.coordinates && area.polygon.coordinates.length > 0) ||
        (area.geometry?.coordinates && area.geometry.coordinates.length > 0);

      // Only evaluate circular radius for areas without configured GeoJSON polygons
      if (!hasPolygon && area.centerLat && area.centerLng) {
        const dist = haversineKm(lat, lng, area.centerLat, area.centerLng);
        const maxRadius = area.radiusKm || 3.0;
        if (dist <= maxRadius && dist < minDist) {
          minDist = dist;
          nearest = area;
        }
      }
    }

    return nearest;
  }

  async detectArea(
    latitude: number,
    longitude: number,
    cityId?: string,
    areaId?: string,
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
    pincode?: string;
    pincodes?: string[];
    storeId?: string;
    storeName?: string;
    storeCode?: string;
    serviceable?: boolean;
    status?: string;
    deliveryMinutes?: number;
    distanceKm?: number;
    maxDistanceKm?: number;
    location?: {
      areaId?: string;
      areaName?: string;
      city?: string;
      pincode?: string;
      pincodes?: string[];
    };
    serviceability?: {
      available: boolean;
      status: string;
      message: string;
      nearestStore?: {
        id?: string;
        name: string;
        distanceKm: number;
        maxDistanceKm: number;
      };
    };
  }> {
    let lat = Number(latitude);
    let lng = Number(longitude);

    let area: any = null;

    // Direct lookup by areaId if explicitly provided
    if (areaId) {
      if (Types.ObjectId.isValid(areaId)) {
        area = await this.areaModel.findOne({ _id: new Types.ObjectId(areaId), isActive: true }).exec();
      } else {
        area = await this.areaModel.findOne({
          $or: [
            { code: areaId },
            { name: new RegExp(`^${areaId.replace(/[–—]/g, '-')}$`, 'i') },
            { name: new RegExp(areaId.replace(/[–—]/g, '-'), 'i') },
          ],
          isActive: true,
        }).exec();
      }

      if (area && (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0)) {
        lat = Number(area.centerLat || 23.08);
        lng = Number(area.centerLng || 72.54);
      }
    }

    if (!area) {
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

      if (matchingAreas.length > 0) {
        // Pick the most specific area whose center is closest to requested coordinate
        matchingAreas.sort((a, b) => {
          const distA = Math.hypot((a.centerLat || 0) - lat, (a.centerLng || 0) - lng);
          const distB = Math.hypot((b.centerLat || 0) - lat, (b.centerLng || 0) - lng);
          return distA - distB;
        });
        area = matchingAreas[0];
      }
    }

    // 2. Fetch all active dark stores in the city/system to evaluate admin-configured serviceRadiusKm
    const storeQuery: any = { isActive: true };
    if (cityId) {
      if (Types.ObjectId.isValid(cityId)) {
        storeQuery.$or = [{ cityId: new Types.ObjectId(cityId) }, { cityId: cityId.toString() }];
      } else {
        storeQuery.cityId = cityId;
      }
    }

    const candidateStores = await this.storeModel.find(storeQuery).exec();

    let nearestStore: any = null;
    let inRangeStore: any = null;
    let minDistanceKm = Infinity;
    let inRangeDistanceKm = Infinity;
    let nearestStoreMaxRadiusKm = 6.0;

    for (const s of candidateStores) {
      const coords = s.location?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        const [sLng, sLat] = coords;
        if (!isNaN(sLat) && !isNaN(sLng) && sLat !== 0 && sLng !== 0) {
          const d = Number(haversineKm(lat, lng, sLat, sLng).toFixed(2));
          const maxRadius = Number(s.serviceRadiusKm) || 6.0;

          if (d < minDistanceKm) {
            minDistanceKm = d;
            nearestStore = s;
            nearestStoreMaxRadiusKm = maxRadius;
          }

          if (d <= maxRadius && d < inRangeDistanceKm) {
            inRangeDistanceKm = d;
            inRangeStore = s;
          }
        }
      }
    }

    // 3. If an active store is in range, resolve area from store's areaId if not already set by polygon
    if (!area && inRangeStore && inRangeStore.areaId) {
      area = await this.areaModel.findById(inRangeStore.areaId).exec();
    }

    // 4. Fallback to nearest area by coordinates
    if (!area) {
      area = await this.resolveAreaByCoords(lat, lng);
    }

    // 5. Fallback to nearest store's area if within system bounds
    if (!area && nearestStore && nearestStore.areaId) {
      area = await this.areaModel.findById(nearestStore.areaId).exec();
    }

    if (!area) {
      return {
        success: false,
        code: 'OUTSIDE_SERVICE_AREA',
        serviceable: false,
        status: 'LOCATION_INVALID',
        message: 'Delivery is not available at this location',
        serviceability: {
          available: false,
          status: 'LOCATION_INVALID',
          message: 'Delivery is not available at this location',
        },
      };
    }

    const areaIdStr = (area._id as any).toString();
    const cityIdStr = area.cityId ? area.cityId.toString() : undefined;
    const realPincode = (area.pincodes && area.pincodes.length > 0) ? area.pincodes[0] : ((area as any).pincode || '380061');
    const serviceable = Boolean(inRangeStore);
    const serviceabilityStatus = serviceable
      ? 'AVAILABLE'
      : (nearestStore ? 'OUT_OF_RANGE' : 'NO_ACTIVE_STORE');

    const serviceabilityMsg = serviceable
      ? 'Delivery available in your area'
      : (serviceabilityStatus === 'OUT_OF_RANGE'
          ? `Service not available in this area. Nearest active dark store is ${minDistanceKm} km away (maximum range is ${nearestStoreMaxRadiusKm} km).`
          : `Service not available in this area. No active dark store currently serves ${area.name}.`);

    return {
      success: true,
      serviceable,
      status: serviceabilityStatus,
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
      pincode: realPincode,
      pincodes: area.pincodes || [],
      storeId: serviceable && inRangeStore ? (inRangeStore._id as any).toString() : undefined,
      storeName: serviceable && inRangeStore ? inRangeStore.name : undefined,
      storeCode: serviceable && inRangeStore ? inRangeStore.code : undefined,
      deliveryMinutes: area.defaultDeliveryMinutes || 9,
      distanceKm: serviceable ? inRangeDistanceKm : (minDistanceKm < Infinity ? minDistanceKm : undefined),
      maxDistanceKm: serviceable ? (Number(inRangeStore.serviceRadiusKm) || 6.0) : (nearestStore ? nearestStoreMaxRadiusKm : undefined),
      location: {
        areaId: areaIdStr,
        areaName: area.name,
        city: area.city || 'Ahmedabad',
        pincode: realPincode,
        pincodes: area.pincodes || [],
      },
      serviceability: {
        available: serviceable,
        status: serviceabilityStatus,
        message: serviceabilityMsg,
        nearestStore: nearestStore ? {
          id: (nearestStore._id as any).toString(),
          name: nearestStore.name,
          distanceKm: minDistanceKm,
          maxDistanceKm: nearestStoreMaxRadiusKm,
        } : undefined,
      },
      message: serviceable ? undefined : serviceabilityMsg,
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
