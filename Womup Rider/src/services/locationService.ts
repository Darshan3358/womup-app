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
    latitude: 23.115,
    longitude: 72.545,
    address: 'Shukan Hub, Near Chandlodiya Crossing & Tragad Rd',
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

export class LocationTrackerService {
  private static timer: ReturnType<typeof setInterval> | null = null;
  private static currentLatitude: number | null = null;
  private static currentLongitude: number | null = null;
  private static isSimulated = false;
  private static hasSetLocation = false;

  static isLocationSet(): boolean {
    return this.hasSetLocation && this.currentLatitude !== null && this.currentLongitude !== null;
  }

  static clearLocation(): void {
    this.hasSetLocation = false;
    this.currentLatitude = null;
    this.currentLongitude = null;
    this.isSimulated = false;
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

  static async getAddressForCoords(
    lat: number = LocationTrackerService.currentLatitude ?? 23.115,
    lng: number = LocationTrackerService.currentLongitude ?? 72.545
  ): Promise<string> {
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
          return parts.join(', ');
        }
      }
    } catch {
      // fallback
    }
    const nearest = this.getNearestHub(lat, lng);
    return nearest.hub.address;
  }

  static async detectRealGps(): Promise<LocationCoordinates | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
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

        await RiderApiService.sendLocationTelemetry(coords);
        return coords;
      }
    } catch (err) {
      // Fallback to browser geolocation on web
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              this.currentLatitude = pos.coords.latitude;
              this.currentLongitude = pos.coords.longitude;
              this.isSimulated = false;
              this.hasSetLocation = true;
              const coords: LocationCoordinates = {
                latitude: this.currentLatitude,
                longitude: this.currentLongitude,
                accuracy: pos.coords.accuracy || 15,
                timestamp: Date.now(),
              };
              await RiderApiService.sendLocationTelemetry(coords);
              resolve(coords);
            },
            () => resolve(null),
            { timeout: 5000, enableHighAccuracy: false }
          );
        });
      }
    }
    return null;
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
      RiderApiService.sendLocationTelemetry(initialCoords).catch(() => {});
      if (onLocationUpdate) onLocationUpdate(initialCoords);
    }

    // Stream GPS telemetry every 15 seconds while online
    this.timer = setInterval(async () => {
      // If not simulated and location is set, try reading device GPS
      if (!this.isSimulated && this.hasSetLocation) {
        try {
          const pos = await Location.getLastKnownPositionAsync();
          if (pos?.coords) {
            this.currentLatitude = pos.coords.latitude;
            this.currentLongitude = pos.coords.longitude;
          }
        } catch {
          // ignore error, keep last known
        }
      } else if (this.isSimulated && this.currentLatitude !== null && this.currentLongitude !== null) {
        // Small realistic micro-jitter if simulated
        this.currentLatitude += (Math.random() - 0.5) * 0.0001;
        this.currentLongitude += (Math.random() - 0.5) * 0.0001;
      }

      const coords = this.getCurrentCoordinates();
      if (coords) {
        await RiderApiService.sendLocationTelemetry(coords);
        if (onLocationUpdate) {
          onLocationUpdate(coords);
        }
      }
    }, 15000);
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
