// ---------------------------------------------------------------------------
// In-memory TTL cache for home screen sections to avoid hammering MongoDB.
// Key: `${storeId || 'none'}:${areaId || 'none'}`
// ---------------------------------------------------------------------------
const _homeCache = new Map<string, { data: any; ts: number }>();
export const HOME_CACHE_TTL_MS = 30 * 1000;

export function getHomeCache(key: string) {
  const cached = _homeCache.get(key);
  if (cached && Date.now() - cached.ts < HOME_CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function setHomeCache(key: string, data: any) {
  _homeCache.set(key, { data, ts: Date.now() });
}

export function clearHomeCache() {
  _homeCache.clear();
}
