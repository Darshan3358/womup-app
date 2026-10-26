import { api } from '../services/api';
import { StorageService } from '../services/storageService';

export interface AreaOption {
  id?: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  storeName: string;
  storeId?: string;
  pincode: string;
  pincodes?: string[];
}

/**
 * Initial offline baseline (fallback before network or when offline).
 * As soon as the app starts, syncAreasFromBackend() replaces this with live MongoDB data.
 */
const INITIAL_AREAS: AreaOption[] = [
  { name: 'Prahlad Nagar', city: 'Ahmedabad', lat: 23.0125, lng: 72.5082, storeName: 'Wom Up Prahlad Nagar Dark Store', pincode: '380015' },
  { name: 'Chandlodiya - Tragad', city: 'Ahmedabad', lat: 23.1288, lng: 72.5587, storeName: 'Wom Up Chandlodiya - Tragad Dark Store', pincode: '382481' },
  { name: 'Chandlodia', city: 'Ahmedabad', lat: 23.1288, lng: 72.5587, storeName: 'Wom Up Chandlodiya - Tragad Dark Store', pincode: '382481' },
  { name: 'Tragad', city: 'Ahmedabad', lat: 23.1288, lng: 72.5587, storeName: 'Wom Up Chandlodiya - Tragad Dark Store', pincode: '382470' },
  { name: 'Ghatlodia', city: 'Ahmedabad', lat: 23.0750, lng: 72.5350, storeName: 'Wom Up Ghatlodia Dark Store', pincode: '380061' },
  { name: 'Satellite', city: 'Ahmedabad', lat: 23.0304, lng: 72.5178, storeName: 'Wom Up Satellite Dark Store', pincode: '380015' },
  { name: 'Navrangpura', city: 'Ahmedabad', lat: 23.0365, lng: 72.5611, storeName: 'Wom Up Navrangpura Dark Store', pincode: '380009' },
  { name: 'Bopal', city: 'Ahmedabad', lat: 23.0336, lng: 72.4646, storeName: 'Wom Up Bopal Dark Store', pincode: '380058' },
  { name: 'SG Highway', city: 'Ahmedabad', lat: 23.0300, lng: 72.5050, storeName: 'Wom Up SG Highway Dark Store', pincode: '380054' },
  { name: 'Thaltej', city: 'Ahmedabad', lat: 23.0500, lng: 72.5160, storeName: 'Wom Up Thaltej Dark Store', pincode: '380059' },
  { name: 'Vastrapur', city: 'Ahmedabad', lat: 23.0350, lng: 72.5293, storeName: 'Wom Up Vastrapur Dark Store', pincode: '380015' },
  { name: 'Maninagar', city: 'Ahmedabad', lat: 22.9978, lng: 72.6033, storeName: 'Wom Up Maninagar Dark Store', pincode: '380008' },
  { name: 'Paldi', city: 'Ahmedabad', lat: 23.0129, lng: 72.5632, storeName: 'Wom Up Paldi Dark Store', pincode: '380007' },
  { name: 'Ramol', city: 'Ahmedabad', lat: 22.9850, lng: 72.6450, storeName: 'Wom Up Ramol Dark Store', pincode: '382449' },
  { name: 'Hathijan / Vatva side', city: 'Ahmedabad', lat: 22.9650, lng: 72.6350, storeName: 'Wom Up Vatva Dark Store', pincode: '382440' },
  { name: 'Lambha', city: 'Ahmedabad', lat: 22.9450, lng: 72.5950, storeName: 'Wom Up Lambha Dark Store', pincode: '382440' },
  { name: 'Isanpur', city: 'Ahmedabad', lat: 22.9820, lng: 72.5980, storeName: 'Wom Up Isanpur Dark Store', pincode: '382443' },
];

/**
 * Live dynamic areas list. Mutated in-place so all external imports immediately see updates.
 */
export const AHMEDABAD_AREAS: AreaOption[] = [...INITIAL_AREAS];

let _isSyncing = false;
let _hasLoadedFromStorage = false;

/**
 * Returns the current active list of areas (dynamic from MongoDB).
 */
export const getDynamicAreas = (): AreaOption[] => {
  return AHMEDABAD_AREAS;
};

/**
 * Synchronizes areas and stores directly from the Backend / MongoDB.
 * 1. Immediately loads cached areas from AsyncStorage (instant render).
 * 2. Fetches fresh live areas from GET /api/v1/location/areas.
 * 3. Updates AHMEDABAD_AREAS and caches to AsyncStorage for offline support.
 */
export const syncAreasFromBackend = async (): Promise<AreaOption[]> => {
  // 1. Initial cached storage load (run once)
  if (!_hasLoadedFromStorage) {
    try {
      const cached = await StorageService.getItem<AreaOption[]>(StorageService.KEYS.AREAS, []);
      if (Array.isArray(cached) && cached.length > 0) {
        AHMEDABAD_AREAS.splice(0, AHMEDABAD_AREAS.length, ...cached);
      }
    } catch (e) {
      console.warn('[areas] Failed to load cached areas from storage:', e);
    } finally {
      _hasLoadedFromStorage = true;
    }
  }

  // 2. Prevent concurrent network fetches
  if (_isSyncing) return AHMEDABAD_AREAS;
  _isSyncing = true;

  try {
    const res = await api.get<any[]>('/location/areas');
    const rawAreas = res?.data || (Array.isArray(res) ? res : null);

    if (Array.isArray(rawAreas) && rawAreas.length > 0) {
      const parsedList: AreaOption[] = [];

      for (const item of rawAreas) {
        if (!item || !item.name) continue;
        const lat = Number(item.centerLat) || 23.0125;
        const lng = Number(item.centerLng) || 72.5082;
        const storeName =
          item.assignedStore?.storeName ||
          item.darkStore ||
          (item.assignedStores && item.assignedStores[0]?.storeName) ||
          `Wom Up ${item.name} Dark Store`;
        const storeId =
          item.assignedStore?.storeId ||
          item.hubStoreId ||
          (item.assignedStores && item.assignedStores[0]?.storeId);
        const pincode =
          item.pincode ||
          (Array.isArray(item.pincodes) && item.pincodes.length > 0 ? item.pincodes[0] : '') ||
          '';

        parsedList.push({
          id: item.id || item._id,
          name: item.name,
          city: item.city || item.cityName || 'Ahmedabad',
          lat,
          lng,
          storeName,
          storeId,
          pincode,
          pincodes: item.pincodes || (pincode ? [pincode] : []),
        });

        // Add special compound alias for Chandlodia / Tragad if not already explicitly present
        if (item.name.toLowerCase() === 'chandlodia' && !rawAreas.some((a: any) => a.name.toLowerCase().includes('tragad'))) {
          parsedList.push({
            id: item.id || item._id,
            name: 'Chandlodiya - Tragad',
            city: item.city || 'Ahmedabad',
            lat: 23.1288,
            lng: 72.5587,
            storeName,
            storeId,
            pincode: pincode || '382481',
            pincodes: item.pincodes || ['382481'],
          });
        }
      }

      if (parsedList.length > 0) {
        // Mutate array in-place so all imports receive the latest live data
        AHMEDABAD_AREAS.splice(0, AHMEDABAD_AREAS.length, ...parsedList);
        // Save to AsyncStorage for offline support
        await StorageService.saveItem(StorageService.KEYS.AREAS, parsedList);
      }
    }
  } catch (err) {
    console.warn('[areas] Live areas sync failed, using cached/initial areas:', err);
  } finally {
    _isSyncing = false;
  }

  return AHMEDABAD_AREAS;
};

/**
 * Intelligent fuzzy matcher against the live dynamic areas list.
 */
export const matchAreaByName = (query?: string | null): AreaOption | null => {
  if (!query || query.trim().length < 3) return null;
  const rawLower = query.toLowerCase().trim();

  // Normalize common phonetic variations
  const normalized = rawLower
    .replace(/prahalad/g, 'prahlad')
    .replace(/chandlodiy?a/g, 'chandlodiya')
    .replace(/ghatlodiy?a/g, 'ghatlodia');

  // Sort candidate areas by name length descending so specific combinations (e.g. Chandlodiya - Tragad) match first
  const sortedAreas = [...AHMEDABAD_AREAS].sort((a, b) => b.name.length - a.name.length);

  // 1. Direct or substring match
  const directMatch = sortedAreas.find((a) => {
    const aName = a.name.toLowerCase();
    const aNorm = aName.replace(/prahalad/g, 'prahlad').replace(/chandlodiy?a/g, 'chandlodiya');
    return (
      rawLower.includes(aName) ||
      aName.includes(rawLower) ||
      normalized.includes(aNorm) ||
      aNorm.includes(normalized)
    );
  });
  if (directMatch) return directMatch;

  // 2. Token / word-level match (e.g. "prahlad" or "makarba" in "BLOCK - A Prahalad Nagar makarba")
  const tokens = normalized.split(/[\s,–—\-\/]+/).filter((t) => t.length >= 4);
  for (const token of tokens) {
    const tokenMatch = sortedAreas.find((a) => {
      const aNorm = a.name.toLowerCase().replace(/prahalad/g, 'prahlad').replace(/chandlodiy?a/g, 'chandlodiya');
      return aNorm.includes(token) || token.includes(aNorm.split(' ')[0]);
    });
    if (tokenMatch) return tokenMatch;
  }

  // 3. Compact match without spaces
  const compactQuery = normalized.replace(/[^a-z0-9]/g, '');
  const compactMatch = sortedAreas.find((a) => {
    const compactName = a.name.toLowerCase().replace(/prahalad/g, 'prahlad').replace(/[^a-z0-9]/g, '');
    return compactQuery.includes(compactName) || compactName.includes(compactQuery);
  });
  if (compactMatch) return compactMatch;

  // 4. Pincode match if query has 6-digit postal code
  const pincodeMatch = query.match(/\b(38\d{4}|39\d{4})\b/);
  if (pincodeMatch) {
    const pCode = pincodeMatch[0];
    const matchByPin = sortedAreas.find((a) => a.pincode === pCode || (a.pincodes && a.pincodes.includes(pCode)));
    if (matchByPin) return matchByPin;
  }

  return null;
};
