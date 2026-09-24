import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { api } from './api';
import { StorageService } from './storageService';

export interface ResolvedArea {
  areaId: string;
  areaName: string;
  city: string;
  deliveryMinutes: number;
  serviceable?: boolean;
  storeId?: string;
  storeName?: string;
  storeCode?: string;
  message?: string;
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
const AREA_CACHE_TTL_MS = 5 * 60 * 1000; // Fresh 5-minute TTL for hyperlocal routing

let _cachedArea: ResolvedArea | null = null;

export const LocationService = {
  /**
   * Resolve GPS coordinates to a delivery area and dark store via the backend.
   * Results are cached in memory + AsyncStorage. Pass forceRefresh = true to bypass cache.
   */
  async resolveArea(
    lat?: number,
    lng?: number,
    forceRefresh = false,
  ): Promise<ResolvedArea | null> {
    // 1. Skip cache if forceRefresh is requested
    if (!forceRefresh) {
      if (_cachedArea) return _cachedArea;

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
    }

    // 2. Call backend for authoritative live serviceability resolution
    try {
      const res = await api.post<any>('/location/resolve', {
        latitude: lat ?? null,
        longitude: lng ?? null,
      });
      const resData = (res && (res as any).data) ? (res as any).data : res;
      if (res && res.success && resData) {
        const serviceable =
          resData.serviceable !== undefined
            ? Boolean(resData.serviceable)
            : Boolean(resData.areaId || resData.storeId);

        const area: ResolvedArea = {
          areaId: resData.areaId || '',
          areaName: resData.areaName || 'Ahmedabad Hub',
          city: resData.city || 'Ahmedabad',
          deliveryMinutes: resData.deliveryMinutes ?? 9,
          serviceable,
          storeId: resData.storeId,
          storeName: resData.storeName || (serviceable ? 'Wom Up Dark Store' : undefined),
          storeCode: resData.storeCode,
          message: resData.message,
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

  /** Invalidate cache (call when user changes delivery address or forces re-detection) */
  clearCache() {
    _cachedArea = null;
    StorageService.removeItem(AREA_CACHE_KEY);
  },

  /** Get currently cached area without making a network call */
  getCached(): ResolvedArea | null {
    return _cachedArea;
  },

  /**
   * Auto-detect GPS coordinates and resolve delivery address & area.
   * Throws explicit error or returns null if location is denied or unavailable.
   * NEVER silently falls back to hardcoded coordinates.
   */
  async getCurrentLocation(): Promise<DetectedLocation | null> {
    let lat: number | null = null;
    let lng: number | null = null;

    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser.');
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } else {
      // Native Mobile (Android APK / iOS)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission was denied. Please allow location access in your device settings.');
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error('Device location (GPS) is disabled. Please turn on location services in device settings.');
      }

      let location: Location.LocationObject | null = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (e) {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        throw new Error('Unable to retrieve GPS coordinates. Please move to an open area and try again.');
      }

      lat = location.coords.latitude;
      lng = location.coords.longitude;
    }

    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid GPS coordinates received from device.');
    }

    // Attempt real reverse geocoding for human-readable address
    return this.reverseGeocode(lat, lng);
  },

  /**
   * Reverse Geocode Real GPS coordinates to Street, Area, City, and Pincode.
   * Does NOT invent fake addresses if the external geocoding service is unavailable.
   */
  async reverseGeocode(lat: number, lng: number): Promise<DetectedLocation> {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const locality = data.locality || data.principalSubdivision || data.city || '';
        const city = data.city || data.principalSubdivision || '';
        const postcode = data.postcode || '';
        const road = data.localityInfo?.administrative?.[3]?.name || locality || '';

        const rawParts = [road, locality, city]
          .filter(Boolean)
          .map((part) => String(part).trim())
          .filter(Boolean);

        // Deduplicate case-insensitively while preserving natural hierarchy
        const dedupedParts = rawParts.filter(
          (part, i) => rawParts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === i
        );

        const shortAddress = locality || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const readableAddress = dedupedParts.join(', ') || shortAddress;

        return {
          latitude: lat,
          longitude: lng,
          readableAddress,
          shortAddress,
          street: road || shortAddress,
          areaLandmark: locality,
          city: city || 'Ahmedabad',
          pincode: postcode,
        };
      }
    } catch (e) {
      console.warn('[LocationService] Reverse geocode lookup failed:', e);
    }

    // Honest fallback: Real GPS coordinates without fabricating fake street names
    return {
      latitude: lat,
      longitude: lng,
      readableAddress: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      shortAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      street: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      areaLandmark: '',
      city: 'Ahmedabad',
      pincode: '',
    };
  },
};
