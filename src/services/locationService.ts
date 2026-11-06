import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { api } from './api';
import { StorageService } from './storageService';

export interface ResolvedArea {
  areaId: string;
  areaName: string;
  city: string;
  cityName?: string;
  cityId?: string;
  deliveryMinutes: number;
  serviceable?: boolean;
  success?: boolean;
  storeId?: string;
  storeName?: string;
  storeCode?: string;
  pincode?: string;
  pincodes?: string[];
  distanceKm?: number;
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
  source?: 'GPS' | 'IP' | 'MANUAL';
  accuracy?: number;
  timestamp?: number;
}

const AREA_CACHE_KEY = '@wormup_resolved_area';
const AREA_CACHE_TTL_MS = 5 * 60 * 1000; // Fresh 5-minute TTL for hyperlocal routing

interface CachedAreaEntry {
  area: ResolvedArea;
  lat?: number;
  lng?: number;
  ts: number;
}

const _areaMemoryCache = new Map<string, CachedAreaEntry>();
const _inFlightAreaRequests = new Map<string, Promise<ResolvedArea | null>>();
const _reverseGeocodeCache = new Map<string, { data: DetectedLocation; ts: number }>();
const _inFlightReverseGeocode = new Map<string, Promise<DetectedLocation>>();
const LATLNG_API_KEY = process.env.EXPO_PUBLIC_LATLNG_API_KEY || 'latlng_n9sfznbawci4hcvi732i2y0op64lu655';

export const LocationService = {
  /**
   * Resolve GPS coordinates to a delivery area and dark store via the backend.
   * Results are coordinate-cached in memory + AsyncStorage. Pass forceRefresh = true to bypass cache.
   * Concurrent duplicate requests are automatically deduplicated in-flight.
   */
  async resolveArea(
    lat?: number,
    lng?: number,
    forceRefresh = false,
  ): Promise<ResolvedArea | null> {
    const cacheKey =
      lat !== undefined && lng !== undefined
        ? `${lat.toFixed(3)}_${lng.toFixed(3)}`
        : 'default';
    const requestKey = `${lat !== undefined ? lat.toFixed(4) : 'default'}_${lng !== undefined ? lng.toFixed(4) : 'default'}`;

    // 1. Return in-memory cache if fresh and matching coordinates
    if (!forceRefresh) {
      const mem = _areaMemoryCache.get(cacheKey);
      if (mem && Date.now() - mem.ts < AREA_CACHE_TTL_MS) {
        return mem.area;
      }
    }

    // 2. Always deduplicate concurrent in-flight requests for the exact same coordinates
    const inFlight = _inFlightAreaRequests.get(requestKey);
    if (inFlight) {
      return inFlight;
    }

    // 3. Create deduplicated in-flight promise
    const promise = (async () => {
      // Call backend for authoritative live serviceability resolution
      try {
        const res = await api.post<any>('/location/resolve', {
          latitude: typeof lat === 'number' && !isNaN(lat) ? lat : 23.0141,
          longitude: typeof lng === 'number' && !isNaN(lng) ? lng : 72.5067,
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
            city: resData.city || resData.cityName || 'Ahmedabad',
            cityName: resData.cityName || resData.city || 'Ahmedabad',
            cityId: resData.cityId,
            deliveryMinutes: resData.deliveryMinutes ?? 9,
            serviceable,
            success: Boolean(res.success),
            storeId: resData.storeId,
            storeName: resData.storeName || (serviceable ? 'Wom Up Dark Store' : undefined),
            storeCode: resData.storeCode,
            pincode: resData.pincode,
            pincodes: resData.pincodes,
            distanceKm: resData.distanceKm,
            message: resData.message,
          };

          _areaMemoryCache.set(cacheKey, { area, lat, lng, ts: Date.now() });
          StorageService.saveItem(AREA_CACHE_KEY, { area, ts: Date.now() });
          return area;
        }
      } catch (e) {
        console.warn('[LocationService] resolveArea failed:', e);
      } finally {
        _inFlightAreaRequests.delete(requestKey);
      }
      return null;
    })();

    _inFlightAreaRequests.set(requestKey, promise);
    return promise;
  },

  /** Invalidate cache (call when user changes delivery address or forces re-detection) */
  clearCache() {
    _areaMemoryCache.clear();
    _inFlightAreaRequests.clear();
    _reverseGeocodeCache.clear();
    _inFlightReverseGeocode.clear();
    StorageService.removeItem(AREA_CACHE_KEY);
  },

  /** Get currently cached area without making a network call */
  getCached(lat?: number, lng?: number): ResolvedArea | null {
    const cacheKey =
      lat !== undefined && lng !== undefined
        ? `${lat.toFixed(3)}_${lng.toFixed(3)}`
        : 'default';
    return _areaMemoryCache.get(cacheKey)?.area || null;
  },

  /**
   * Auto-detect genuine device GPS coordinates and reverse geocode to address.
   * On Web: uses navigator.geolocation (respects user permission, timeout, errors).
   * On Mobile: uses Expo Location foreground permissions and high-accuracy GPS.
   * NEVER silently uses or falls back to IP geolocation.
   * Throws descriptive errors so caller can prompt user or show error state.
   */
  async getCurrentLocation(): Promise<DetectedLocation | null> {
    let lat: number | null = null;
    let lng: number | null = null;
    let accuracy: number | undefined;
    let timestamp: number | undefined;

    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser.');
      }

      try {
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
        accuracy = pos.coords.accuracy;
        timestamp = pos.timestamp;
      } catch (e: any) {
        if (e?.code === 1) {
          throw new Error('Location permission denied. Please allow location access in your browser.');
        } else if (e?.code === 2) {
          throw new Error('Device location is unavailable. Please check system location services.');
        } else if (e?.code === 3) {
          throw new Error('Location request timed out. Please try again.');
        }
        throw new Error(e?.message || 'Unable to determine device location.');
      }
    } else {
      // Native Mobile (Android APK / iOS)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied. Please enable location access in App Settings.');
        }

        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
          throw new Error('Device GPS location services are disabled. Please turn on Location in system settings.');
        }

        let location: Location.LocationObject | null = null;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch (posErr) {
          location = await Location.getLastKnownPositionAsync();
        }

        if (location) {
          lat = location.coords.latitude;
          lng = location.coords.longitude;
          accuracy = location.coords.accuracy ?? undefined;
          timestamp = location.timestamp;
        }
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to obtain device GPS coordinates.');
      }
    }

    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    // Attempt real reverse geocoding for human-readable address & actual postal code
    const geo = await this.reverseGeocode(lat, lng);
    return {
      ...geo,
      source: 'GPS',
      accuracy,
      timestamp,
    };
  },

  /**
   * Optional approximate location suggestion derived from public IP address.
   * MUST NEVER be presented as "Live GPS" or used to calculate delivery distance.
   */
  async getApproximateIpLocation(): Promise<DetectedLocation | null> {
    try {
      const ipRes = await fetch('https://ipwho.is/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.success !== false && ipData.latitude && ipData.longitude) {
          return {
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            readableAddress: `${ipData.city || ''}, ${ipData.region || ''} ${ipData.postal || ''}`.trim(),
            shortAddress: ipData.city || '',
            street: '',
            areaLandmark: ipData.region || '',
            city: ipData.city || '',
            pincode: ipData.postal || '',
            source: 'IP',
          };
        }
      }
    } catch (ipErr) {
      console.warn('[LocationService] Approximate IP lookup failed:', ipErr);
    }
    return null;
  },

  /**
   * Reverse Geocode Real GPS coordinates to Street, Area, City, and Pincode.
   * Deduplicates concurrent in-flight requests and caches by ~100m coordinate resolution for 30 minutes.
   */
  async reverseGeocode(lat: number, lng: number): Promise<DetectedLocation> {
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const cached = _reverseGeocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
      return {
        ...cached.data,
        latitude: lat,
        longitude: lng,
      };
    }

    if (_inFlightReverseGeocode.has(cacheKey)) {
      return _inFlightReverseGeocode.get(cacheKey)!;
    }

    const task = (async (): Promise<DetectedLocation> => {
      // 1. LatLng.work High-Precision Reverse Geocoder (Primary for WOMART)
      try {
        const latlngUrl = `https://api.latlng.work/reverse?lat=${lat}&lon=${lng}`;
        const res = await fetch(latlngUrl, {
          headers: {
            'x-api-key': LATLNG_API_KEY,
            'Accept': 'application/json',
          },
        });
        if (res.ok) {
          const json = await res.json();
          const feature = json.features?.[0];
          if (feature && feature.properties) {
            const props = feature.properties;
            const name = props.name || '';
            const street = props.street || '';
            const locality = props.locality || props.suburb || props.district || '';
            const city = props.city || props.county || '';
            const postcode = props.postcode || '';

            const primaryPlace = [name, street].filter(Boolean).join(', ') || street || name;
            const areaLandmark = locality || props.county || '';
            const rawParts = [name, street, locality, city, postcode]
              .filter(Boolean)
              .map((part: any) => String(part).trim())
              .filter(Boolean);

            const dedupedParts = rawParts.filter(
              (part: string, i: number) => rawParts.findIndex((p: string) => p.toLowerCase() === part.toLowerCase()) === i
            );
            const readableAddress = dedupedParts.join(', ');
            const shortAddress = primaryPlace || locality || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            if (postcode || readableAddress) {
              const result: DetectedLocation = {
                latitude: lat,
                longitude: lng,
                readableAddress: readableAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                shortAddress,
                street: primaryPlace || shortAddress,
                areaLandmark,
                city: city,
                pincode: postcode,
              };
              _reverseGeocodeCache.set(cacheKey, { data: result, ts: Date.now() });
              return result;
            }
          }
        }
      } catch (err) {
        console.warn('[LocationService] LatLng.work reverse geocode failed, falling back:', err);
      }

      // 2. Native mobile (Android APK / iOS) - Native reverse geocoder provides direct device postal code
      if (Platform.OS !== 'web') {
        try {
          const nativeResults = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (nativeResults && nativeResults.length > 0) {
            const item = nativeResults[0];
            const postalCode = item.postalCode || '';
            const city = item.city || item.subregion || item.region || '';
            const street = item.street || item.name || '';
            const locality = item.district || item.subregion || item.city || '';
            const readableAddress = [street, locality, city, postalCode].filter(Boolean).join(', ');

            if (postalCode) {
              const result: DetectedLocation = {
                latitude: lat,
                longitude: lng,
                readableAddress: readableAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                shortAddress: locality || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                street: street || readableAddress,
                areaLandmark: locality,
                city: city,
                pincode: postalCode,
              };
              _reverseGeocodeCache.set(cacheKey, { data: result, ts: Date.now() });
              return result;
            }
          }
        } catch (err) {
          console.warn('[LocationService] Native reverse geocode failed, falling back to HTTP:', err);
        }
      }

      // 3. OpenStreetMap Nominatim - High accuracy postal code resolution for Web & fallback
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const res = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'WOMART-App/1.0 (contact@womup.in)' },
        });
        if (res.ok) {
          const d = await res.json();
          const address = d.address || {};
          const postcode = address.postcode || '';
          const city = address.city || address.town || address.village || address.state_district || address.county || '';
          const road = address.road || address.neighbourhood || address.suburb || '';
          const locality = address.suburb || address.neighbourhood || address.village || '';

          const rawParts = [road, locality, city, postcode].filter(Boolean);
          const readableAddress = d.display_name || rawParts.join(', ');

          if (postcode) {
            const result: DetectedLocation = {
              latitude: lat,
              longitude: lng,
              readableAddress: readableAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              shortAddress: locality || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              street: road || locality || '',
              areaLandmark: locality,
              city: city,
              pincode: postcode,
            };
            _reverseGeocodeCache.set(cacheKey, { data: result, ts: Date.now() });
            return result;
          }
        }
      } catch (e) {
        console.warn('[LocationService] Nominatim reverse geocode lookup failed:', e);
      }

      // 4. BigDataCloud Fallback
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

          const dedupedParts = rawParts.filter(
            (part, i) => rawParts.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === i
          );

          const shortAddress = locality || city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          const readableAddress = dedupedParts.join(', ') || shortAddress;

          const result: DetectedLocation = {
            latitude: lat,
            longitude: lng,
            readableAddress,
            shortAddress,
            street: road || shortAddress,
            areaLandmark: locality,
            city: city,
            pincode: postcode,
          };
          _reverseGeocodeCache.set(cacheKey, { data: result, ts: Date.now() });
          return result;
        }
      } catch (e) {
        console.warn('[LocationService] BigDataCloud reverse geocode lookup failed:', e);
      } finally {
        _inFlightReverseGeocode.delete(cacheKey);
      }

      // 5. Fallback with coordinates
      return {
        latitude: lat,
        longitude: lng,
        readableAddress: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        shortAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        street: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        areaLandmark: '',
        city: '',
        pincode: '',
      };
    })();

    _inFlightReverseGeocode.set(cacheKey, task);
    return task;
  },
};
