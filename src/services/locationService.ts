import { api } from './api';
import { StorageService } from './storageService';

export interface ResolvedArea {
  areaId: string;
  areaName: string;
  city: string;
  deliveryMinutes: number;
}

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  readableAddress: string;
  shortAddress: string;
  street: string;
  areaLandmark: string;
  city: string;
  pincode: string;
}

const AREA_CACHE_KEY = '@wormup_resolved_area';
const AREA_CACHE_TTL_MS = 30 * 60 * 1000; // Re-resolve every 30 minutes

let _cachedArea: ResolvedArea | null = null;

export const LocationService = {
  /**
   * Resolve GPS coordinates to a delivery area via the backend.
   * Results are cached in memory + AsyncStorage so subsequent calls are instant.
   */
  async resolveArea(lat?: number, lng?: number): Promise<ResolvedArea | null> {
    // 1. Return in-memory cache (fastest)
    if (_cachedArea) return _cachedArea;

    // 2. Try AsyncStorage cache
    try {
      const stored = await StorageService.getItem<{ area: ResolvedArea; ts: number } | null>(
        AREA_CACHE_KEY,
        null,
      );
      if (stored && Date.now() - stored.ts < AREA_CACHE_TTL_MS) {
        _cachedArea = stored.area;
        return stored.area;
      }
    } catch (_) {}

    // 3. Call backend to resolve
    try {
      const res = await api.post<any>('/location/resolve', {
        latitude: lat ?? null,
        longitude: lng ?? null,
      });
      if (res.success && res.data?.areaId) {
        const area: ResolvedArea = {
          areaId: res.data.areaId,
          areaName: res.data.areaName,
          city: res.data.city,
          deliveryMinutes: res.data.deliveryMinutes ?? 9,
        };
        _cachedArea = area;
        StorageService.saveItem(AREA_CACHE_KEY, { area, ts: Date.now() });
        return area;
      }
    } catch (e) {
      console.warn('[LocationService] resolveArea failed:', e);
    }
    return null;
  },

  /** Invalidate cache (call when user changes delivery address) */
  clearCache() {
    _cachedArea = null;
    StorageService.removeItem(AREA_CACHE_KEY);
  },

  /** Get currently cached area without making a network call */
  getCached(): ResolvedArea | null {
    return _cachedArea;
  },

  /**
   * Auto-detect GPS coordinates and resolve delivery address & area
   */
  async getCurrentLocation(): Promise<DetectedLocation | null> {
    let lat = 23.0141;
    let lng = 72.5067;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        // Fallback to default GPS coordinates
      }
    }

    const resolved = await this.resolveArea(lat, lng);
    const areaName = resolved?.areaName || 'Prahlad Nagar';

    return {
      latitude: lat,
      longitude: lng,
      readableAddress: `${areaName}, Ahmedabad, Gujarat`,
      shortAddress: areaName,
      street: 'Prahlad Nagar Garden Road',
      areaLandmark: areaName,
      city: resolved?.city || 'Ahmedabad',
      pincode: '380015',
    };
  },
};
