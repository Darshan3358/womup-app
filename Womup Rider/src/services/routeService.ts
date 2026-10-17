export interface RouteData {
  coordinates: [number, number][]; // [lat, lng] points
  distanceKm: number;
  durationMinutes: number;
  steps?: {
    instruction: string;
    distance: number;
    name?: string;
  }[];
}

class RouteService {
  private cache = new Map<string, { data: RouteData; ts: number }>();
  private readonly CACHE_TTL_MS = 30000; // 30 seconds

  async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<RouteData> {
    const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}_${toLat.toFixed(4)},${toLng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const host =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';

    // 1. Try Backend Route Proxy
    try {
      const url = `http://${host}:5050/api/v1/tracking/route?from=${fromLat},${fromLng}&to=${toLat},${toLng}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.coordinates?.length) {
          this.cache.set(cacheKey, { data: json.data, ts: Date.now() });
          return json.data;
        }
      }
    } catch {
      // Backend unreachable or offline, fallback to direct OSRM
    }

    // 2. Direct OSRM Fallback
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      if (res.ok) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes && json.routes[0]) {
          const route = json.routes[0];
          const coordinates: [number, number][] = (route.geometry?.coordinates || []).map(
            ([lng, lat]: [number, number]) => [lat, lng],
          );
          const distanceKm = Number(((route.distance || 0) / 1000).toFixed(2));
          const durationMinutes = Math.max(1, Math.round((distanceKm / 22) * 60));

          const data: RouteData = {
            coordinates,
            distanceKm,
            durationMinutes,
            steps: [],
          };
          this.cache.set(cacheKey, { data, ts: Date.now() });
          return data;
        }
      }
    } catch {
      // Offline fallback
    }

    // 3. Fallback: Haversine distance with 5-point interpolated curve
    const R = 6371;
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLon = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Number((R * c).toFixed(2));
    const durationMinutes = Math.max(1, Math.round((distanceKm / 20) * 60));

    const coordinates: [number, number][] = [
      [fromLat, fromLng],
      [fromLat + (toLat - fromLat) * 0.25, fromLng + (toLng - fromLng) * 0.25],
      [fromLat + (toLat - fromLat) * 0.5, fromLng + (toLng - fromLng) * 0.5],
      [fromLat + (toLat - fromLat) * 0.75, fromLng + (toLng - fromLng) * 0.75],
      [toLat, toLng],
    ];

    const fallbackData: RouteData = {
      coordinates,
      distanceKm,
      durationMinutes,
      steps: [],
    };
    return fallbackData;
  }
}

export const routeService = new RouteService();
