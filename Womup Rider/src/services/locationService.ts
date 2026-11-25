import * as Location from 'expo-location';
import { LocationCoordinates } from '../types/rider.types';
import { RiderApiService } from './riderApi';

export interface HubLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

export const AHMEDABAD_HUBS: HubLocation[] = [
  {
    id: '6aac257b8f337240651ef43b',
    name: 'Chandlodiya - Tragad Dark Store',
    latitude: 23.1128,
    longitude: 72.5427,
    address: 'Shop 10-14, Shukan Hub, Near Chandlodiya Crossing & Tragad Rd',
  },
  {
    id: '6aa277a7fc02997cbe281ac4',
    name: 'Ghatlodia Dark Store',
    latitude: 23.06,
    longitude: 72.543,
    address: 'Ghatlodia, Ahmedabad',
  },
  {
    id: '6aa277a7fc02997cbe281ac2',
    name: 'Satellite Dark Store',
    latitude: 23.0267,
    longitude: 72.5074,
    address: 'Satellite, Ahmedabad',
  },
  {
    id: '6a9ffe87d4a21fe082fbbe2c',
    name: 'Ahmedabad Central Dark Store',
    latitude: 23.02,
    longitude: 72.515,
    address: 'Near Corporate Road, Prahlad Nagar',
  },
  {
    id: '6aa277a7fc02997cbe281ac1',
    name: 'Prahlad Nagar Dark Store',
    latitude: 23.0141,
    longitude: 72.5067,
    address: 'Prahlad Nagar, Ahmedabad',
  },
  {
    id: '6aa277a7fc02997cbe281ac3',
    name: 'Navrangpura Dark Store',
    latitude: 23.0395,
    longitude: 72.5603,
    address: 'Navrangpura, Ahmedabad',
  },
  {
    id: '6aa277a7fc02997cbe281ac5',
    name: 'Bopal Dark Store',
    latitude: 23.035,
    longitude: 72.475,
    address: 'Bopal, Ahmedabad',
  },
  {
    id: '6aa277a8fc02997cbe281ac6',
    name: 'SG Highway Dark Store',
    latitude: 23.03,
    longitude: 72.505,
    address: 'SG Highway, Ahmedabad',
  },
  {
    id: '6aa277a8fc02997cbe281ac7',
    name: 'Thaltej Dark Store',
    latitude: 23.05,
    longitude: 72.51,
    address: 'Thaltej, Ahmedabad',
  },
  {
    id: '6aa27940fc02997cbe281af6',
    name: 'Vastrapur Dark Store',
    latitude: 23.035,
    longitude: 72.529,
    address: 'Vastrapur Lake Road, Ahmedabad',
  },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export type GpsPermissionStatus = 'granted' | 'denied' | 'unavailable' | 'checking';

export interface GpsDetectionResult {
  coords: LocationCoordinates | null;
  permissionStatus: GpsPermissionStatus;
  error?: string;
}

export class LocationTrackerService {
  private static timer: ReturnType<typeof setInterval> | null = null;
  private static currentLatitude: number | null = null;
  private static currentLongitude: number | null = null;
  private static lastSentLat: number | null = null;
  private static lastSentLng: number | null = null;
  private static lastSentTime = 0;
  private static isSimulated = false;
  private static hasSetLocation = false;
  private static isPaused = false;
  private static lastPermissionStatus: GpsPermissionStatus = 'checking';

  static isLocationSet(): boolean {
    return this.hasSetLocation && this.currentLatitude !== null && this.currentLongitude !== null;
  }

  static isUsingSimulatedLocation(): boolean {
    return this.isSimulated;
  }

  static getPermissionStatus(): GpsPermissionStatus {
    return this.lastPermissionStatus;
  }

  static pauseTracking(): void {
    this.isPaused = true;
  }

  static resumeTracking(): void {
    this.isPaused = false;
  }

  static clearLocation(): void {
    this.hasSetLocation = false;
    this.currentLatitude = null;
    this.currentLongitude = null;
    this.lastSentLat = null;
    this.lastSentLng = null;
    this.lastSentTime = 0;
    this.isSimulated = false;
    this.isPaused = false;
  }

  static getNearestHub(
    lat: number = LocationTrackerService.currentLatitude ?? 23.115,
    lng: number = LocationTrackerService.currentLongitude ?? 72.545
  ): { hub: HubLocation; distanceKm: number } {
    let nearest = AHMEDABAD_HUBS[0];
    let minDistance = Infinity;

    for (const h of AHMEDABAD_HUBS) {
      const dist = calculateDistanceKm(lat, lng, h.latitude, h.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = h;
      }
    }

    return { hub: nearest, distanceKm: minDistance };
  }

  private static addressCache = new Map<string, string>();

  static async getAddressForCoords(
    lat: number = LocationTrackerService.currentLatitude ?? 23.115,
    lng: number = LocationTrackerService.currentLongitude ?? 72.545
  ): Promise<string> {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.addressCache.has(key)) {
      return this.addressCache.get(key)!;
    }
    try {
      const res = await fetch(`https://api.latlng.work/reverse?lat=${lat}&lon=${lng}`, {
        headers: {
          'x-api-key': 'latlng_n9sfznbawci4hcvi732i2y0op64lu655',
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const props = json.features?.[0]?.properties;
        if (props) {
          const parts = [
            props.name || props.street,
            props.locality || props.suburb || props.district,
            props.city || props.county || 'Ahmedabad',
            props.postcode,
          ].filter(Boolean);
          if (parts.length > 0) {
            const addr = parts.join(', ');
            this.addressCache.set(key, addr);
            return addr;
          }
        }
      }
    } catch {}

    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geo && geo.length > 0) {
        const item = geo[0];
        const parts = [
          item.name || item.street,
          item.district || item.subregion,
          item.city || 'Ahmedabad',
          item.postalCode,
        ].filter(Boolean);
        if (parts.length > 0) {
          const addr = parts.join(', ');
          this.addressCache.set(key, addr);
          return addr;
        }
      }
    } catch {
      // fallback to formatted GPS coordinates rather than a hardcoded store address
    }
    return `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  static async detectRealGps(forceFresh = false): Promise<LocationCoordinates | null> {
    const result = await this.detectRealGpsWithStatus(forceFresh);
    return result.coords;
  }

  static async detectRealGpsWithStatus(forceFresh = false): Promise<GpsDetectionResult> {
    // Web browser geolocation first when available so maximumAge: 0 is honored
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            this.currentLatitude = pos.coords.latitude;
            this.currentLongitude = pos.coords.longitude;
            this.isSimulated = false;
            this.hasSetLocation = true;
            this.lastPermissionStatus = 'granted';
            const coords: LocationCoordinates = {
              latitude: this.currentLatitude,
              longitude: this.currentLongitude,
              accuracy: pos.coords.accuracy || 15,
              heading: pos.coords.heading ?? 0,
              speed: pos.coords.speed ?? 0,
              timestamp: Date.now(),
            };
            RiderApiService.sendLocationTelemetry(coords).catch(() => {});
            resolve({ coords, permissionStatus: 'granted' });
          },
          (geoErr) => {
            const denied = geoErr?.code === 1;
            const status: GpsPermissionStatus = denied ? 'denied' : 'unavailable';
            this.lastPermissionStatus = status;
            resolve({
              coords: null,
              permissionStatus: status,
              error: denied
                ? 'Location permission denied. Please allow browser location access.'
                : geoErr?.message || 'Unable to fetch GPS signal.',
            });
          },
          { timeout: 8000, enableHighAccuracy: true, maximumAge: forceFresh ? 0 : 5000 }
        );
      });
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.lastPermissionStatus = 'denied';
        return {
          coords: null,
          permissionStatus: 'denied',
          error: 'Location permission denied. Enable device location permission.',
        };
      }

      this.lastPermissionStatus = 'granted';
      const pos = await Location.getCurrentPositionAsync({
        accuracy: forceFresh ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      this.currentLatitude = pos.coords.latitude;
      this.currentLongitude = pos.coords.longitude;
      this.isSimulated = false;
      this.hasSetLocation = true;

      const coords: LocationCoordinates = {
        latitude: this.currentLatitude,
        longitude: this.currentLongitude,
        accuracy: pos.coords.accuracy ?? 10,
        heading: pos.coords.heading ?? 0,
        speed: pos.coords.speed ?? 0,
        timestamp: Date.now(),
      };

      RiderApiService.sendLocationTelemetry(coords).catch(() => {});
      return { coords, permissionStatus: 'granted' };
    } catch (err: any) {
      this.lastPermissionStatus = 'unavailable';
      return {
        coords: null,
        permissionStatus: 'unavailable',
        error: err?.message || 'GPS sensor unavailable.',
      };
    }
  }

  static async setSimulatedLocation(lat: number, lng: number): Promise<LocationCoordinates> {
    this.currentLatitude = lat;
    this.currentLongitude = lng;
    this.isSimulated = true;
    this.hasSetLocation = true;

    const coords: LocationCoordinates = {
      latitude: lat,
      longitude: lng,
      accuracy: 5.0,
      timestamp: Date.now(),
    };

    await RiderApiService.sendLocationTelemetry(coords);
    return coords;
  }

  static startTracking(onLocationUpdate?: (coords: LocationCoordinates) => void) {
    if (this.timer) return;

    // Send initial location if available
    const initialCoords = this.getCurrentCoordinates();
    if (initialCoords) {
      this.lastSentLat = initialCoords.latitude;
      this.lastSentLng = initialCoords.longitude;
      this.lastSentTime = Date.now();
      RiderApiService.sendLocationTelemetry(initialCoords).catch(() => {});
      if (onLocationUpdate) onLocationUpdate(initialCoords);
    }

    // Stream GPS telemetry every 5 seconds while online (Swiggy/Uber standard)
    this.timer = setInterval(async () => {
      // Pause network telemetry if app is in background or paused
      if (this.isPaused) return;

      // If not in manual test simulation mode, read fresh device/browser GPS
      if (!this.isSimulated) {
        try {
          await this.detectRealGpsWithStatus(false);
        } catch {
          // ignore transient GPS poll failure, keep last known
        }
      }

      const coords = this.getCurrentCoordinates();
      if (coords) {
        if (onLocationUpdate) {
          onLocationUpdate(coords);
        }

        // Throttle network dispatch: only send if moved > ~20m or 30s elapsed
        const now = Date.now();
        const latDiff = this.lastSentLat !== null ? Math.abs(coords.latitude - this.lastSentLat) : 999;
        const lngDiff = this.lastSentLng !== null ? Math.abs(coords.longitude - this.lastSentLng) : 999;
        const isSignificantMove = latDiff > 0.0002 || lngDiff > 0.0002;
        const isHeartbeatDue = now - this.lastSentTime >= 30000;

        if (isSignificantMove || isHeartbeatDue) {
          this.lastSentLat = coords.latitude;
          this.lastSentLng = coords.longitude;
          this.lastSentTime = now;
          await RiderApiService.sendLocationTelemetry(coords);
        }
      }
    }, 10000);
  }

  static stopTracking() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  static getCurrentCoordinates(): LocationCoordinates | null {
    if (!this.hasSetLocation || this.currentLatitude === null || this.currentLongitude === null) {
      return null;
    }
    return {
      latitude: this.currentLatitude,
      longitude: this.currentLongitude,
      accuracy: 5.0,
      timestamp: Date.now(),
    };
  }
}
