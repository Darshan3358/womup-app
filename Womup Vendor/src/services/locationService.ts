import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  pincode?: string;
  areaName?: string;
}

// Popular offline presets for instant search in Ahmedabad/Gujarat
const LOCAL_PRESETS: Array<{ name: string; lat: number; lng: number; pincode: string }> = [
  { name: 'Chandlodiya, Ahmedabad', lat: 23.0815, lng: 72.5441, pincode: '382481' },
  { name: 'Prahlad Nagar, Ahmedabad', lat: 23.0125, lng: 72.5113, pincode: '380015' },
  { name: 'SG Highway, Bodakdev', lat: 23.0478, lng: 72.5178, pincode: '380054' },
  { name: 'Navrangpura, Ahmedabad', lat: 23.0365, lng: 72.5611, pincode: '380009' },
  { name: 'Satellite, Ahmedabad', lat: 23.0289, lng: 72.5284, pincode: '380015' },
  { name: 'Vastrapur, Ahmedabad', lat: 23.0354, lng: 72.5258, pincode: '380052' },
  { name: 'Bopal, Ahmedabad', lat: 23.0338, lng: 72.4641, pincode: '380058' },
  { name: 'Gota, Ahmedabad', lat: 23.1098, lng: 72.5422, pincode: '382481' },
  { name: 'Maninagar, Ahmedabad', lat: 22.9972, lng: 72.6026, pincode: '380008' },
  { name: 'Shukan Hub, Chandlodiya', lat: 23.1288, lng: 72.5507, pincode: '382481' },
  { name: 'Drive-In Road, Thaltej', lat: 23.0512, lng: 72.5298, pincode: '380054' },
];

export const LocationService = {
  // 1. Get current GPS device position with fallbacks
  async getCurrentPosition(): Promise<{ success: boolean; coords?: { latitude: number; longitude: number }; error?: string }> {
    try {
      // Check native / expo-location first
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (location?.coords) {
          return {
            success: true,
            coords: {
              latitude: Number(location.coords.latitude.toFixed(6)),
              longitude: Number(location.coords.longitude.toFixed(6)),
            },
          };
        }
      }
    } catch (e: any) {
      console.warn('Expo location error, attempting browser fallback:', e?.message);
    }

    // Web / browser geolocation fallback
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              success: true,
              coords: {
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
              },
            });
          },
          (err) => {
            // Default to Ahmedabad Chandlodiya / Shukan Hub on denial
            resolve({
              success: true,
              coords: { latitude: 23.1288, longitude: 72.5507 },
            });
          },
          { timeout: 8000 },
        );
      });
    }

    // Default fallback
    return {
      success: true,
      coords: { latitude: 23.1288, longitude: 72.5507 },
    };
  },

  // 2. Search location by text query
  async searchLocation(query: string): Promise<Array<{ label: string; latitude: number; longitude: number; pincode?: string }>> {
    if (!query || query.trim().length < 2) return [];

    const qLower = query.toLowerCase().trim();
    const matchedPresets = LOCAL_PRESETS.filter((p) => p.name.toLowerCase().includes(qLower));

    if (matchedPresets.length > 0) {
      return matchedPresets.map((p) => ({
        label: p.name,
        latitude: p.lat,
        longitude: p.lng,
        pincode: p.pincode,
      }));
    }

    // Try online free geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Gujarat, India')}&format=json&limit=5`,
        { headers: { 'User-Agent': 'WomupVendorPartnerApp/1.0' } },
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          label: item.display_name.split(',').slice(0, 3).join(', '),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
      }
    } catch {}

    return [];
  },

  // 3. Reverse geocode coordinates to get address
  async reverseGeocode(latitude: number, longitude: number): Promise<{ address?: string; city?: string; pincode?: string }> {
    // 1. LatLng.work High-Precision Reverse Geocoder
    try {
      const res = await fetch(`https://api.latlng.work/reverse?lat=${latitude}&lon=${longitude}`, {
        headers: {
          'x-api-key': 'latlng_n9sfznbawci4hcvi732i2y0op64lu655',
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const props = json.features?.[0]?.properties;
        if (props) {
          const name = props.name || '';
          const street = props.street || '';
          const locality = props.locality || props.suburb || props.district || '';
          const city = props.city || props.county || 'Ahmedabad';
          const postcode = props.postcode || '';
          const addr = [name, street, locality].filter(Boolean).join(', ') || street || name || locality;

          if (postcode || addr) {
            return {
              address: addr,
              city,
              pincode: postcode || '382470',
            };
          }
        }
      }
    } catch {}

    // 2. Native Expo Location fallback
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const item = results[0];
        return {
          address: `${item.name || ''} ${item.street || ''}`.trim(),
          city: item.city || item.subregion || 'Ahmedabad',
          pincode: item.postalCode || '380015',
        };
      }
    } catch {}

    // Fallback based on nearest preset
    let nearest = LOCAL_PRESETS[0];
    let minD = 999999;
    for (const p of LOCAL_PRESETS) {
      const d = Math.hypot(p.lat - latitude, p.lng - longitude);
      if (d < minD) {
        minD = d;
        nearest = p;
      }
    }

    return {
      address: nearest.name,
      city: 'Ahmedabad',
      pincode: nearest.pincode,
    };
  },
};
