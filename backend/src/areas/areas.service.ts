import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from './schemas/area.schema';
import { AreaPricing, AreaPricingDocument } from './schemas/area-pricing.schema';

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
  ) {}

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

    // If no zone matches exactly, return the closest active area as fallback
    if (!nearest && activeAreas.length > 0) {
      let closestDist = Infinity;
      for (const area of activeAreas) {
        const dist = haversineKm(lat, lng, area.centerLat, area.centerLng);
        if (dist < closestDist) {
          closestDist = dist;
          nearest = area;
        }
      }
    }

    return nearest;
  }

  async getDefaultArea(): Promise<AreaDocument | null> {
    return this.areaModel.findOne({ isActive: true }).sort({ sortOrder: 1 }).exec();
  }

  async getAllAreas() {
    return this.areaModel.find({ isActive: true }).sort({ sortOrder: 1 }).exec();
  }

  /** Get area-specific pricing for a batch of variantIds */
  async getPricingForVariants(
    variantIds: Types.ObjectId[],
    areaId: Types.ObjectId,
  ): Promise<Map<string, AreaPricingDocument>> {
    const records = await this.areaPricingModel
      .find({ variantId: { $in: variantIds }, areaId })
      .exec();
    const map = new Map<string, AreaPricingDocument>();
    for (const r of records) {
      map.set(r.variantId.toString(), r);
    }
    return map;
  }
}
