import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

const routeCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 600000; // 10 minutes cache

@ApiTags('tracking')
@Controller('api/v1/tracking')
export class TrackingController {
  @Get('route')
  @ApiOperation({ summary: 'Proxy to OSRM to get real road coordinates, distance and ETA' })
  @ApiQuery({ name: 'from', required: true, example: '23.1128,72.5427' })
  @ApiQuery({ name: 'to', required: true, example: '23.1288,72.5507' })
  async getRoute(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Query parameters "from" and "to" in "lat,lng" format are required');
    }

    const [fromLat, fromLng] = from.split(',').map((n) => parseFloat(n.trim()));
    const [toLat, toLng] = to.split(',').map((n) => parseFloat(n.trim()));

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      throw new BadRequestException('Invalid coordinates format. Use "lat,lng"');
    }

    const cacheKey = `${fromLat.toFixed(3)},${fromLng.toFixed(3)}_${toLat.toFixed(3)},${toLng.toFixed(3)}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { success: true, cached: true, data: cached.data };
    }

    try {
      // OSRM expects {lng},{lat};{lng},{lat}
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes && json.routes[0]) {
          const route = json.routes[0];
          // OSRM coordinates are [lng, lat] -> convert to [lat, lng]
          const coordinates = (route.geometry?.coordinates || []).map(
            ([lng, lat]: [number, number]) => [lat, lng],
          );
          const distanceKm = Number(((route.distance || 0) / 1000).toFixed(2));
          // Quick commerce bike average speed ~20-22 km/h
          const durationMinutes = Math.max(1, Math.round((distanceKm / 22) * 60));

          const steps = (route.legs?.[0]?.steps || []).map((s: any) => ({
            instruction: s.maneuver?.type ? `${s.maneuver.type} ${s.name || ''}`.trim() : s.name,
            distance: Math.round(s.distance || 0),
            name: s.name || '',
          }));

          const data = {
            coordinates,
            distanceKm,
            durationMinutes,
            steps,
          };

          routeCache.set(cacheKey, { data, ts: Date.now() });
          return { success: true, data };
        }
      }
    } catch {
      // Fallback on network/timeout error
    }

    // High fidelity Fallback (Haversine calculation)
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

    // 5 interpolated points for smooth fallback route
    const coordinates = [
      [fromLat, fromLng],
      [fromLat + (toLat - fromLat) * 0.25, fromLng + (toLng - fromLng) * 0.25],
      [fromLat + (toLat - fromLat) * 0.5, fromLng + (toLng - fromLng) * 0.5],
      [fromLat + (toLat - fromLat) * 0.75, fromLng + (toLng - fromLng) * 0.75],
      [toLat, toLng],
    ];

    const fallbackData = {
      coordinates,
      distanceKm,
      durationMinutes,
      steps: [],
    };

    return { success: true, fallback: true, data: fallbackData };
  }
}
