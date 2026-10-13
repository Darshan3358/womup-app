export interface AreaOption {
  name: string;
  city: string;
  lat: number;
  lng: number;
  storeName: string;
  pincode: string;
}

export const AHMEDABAD_AREAS: AreaOption[] = [
  { name: 'Chandlodiya - Tragad', city: 'Ahmedabad', lat: 23.1288, lng: 72.5507, storeName: 'Wom Up Chandlodiya - Tragad Dark Store', pincode: '382481' },
  { name: 'Thaltej', city: 'Ahmedabad', lat: 23.0500, lng: 72.5160, storeName: 'Wom Up Thaltej Dark Store', pincode: '380054' },
  { name: 'Navrangpura', city: 'Ahmedabad', lat: 23.0365, lng: 72.5611, storeName: 'Wom Up Navrangpura Dark Store', pincode: '380009' },
  { name: 'Satellite', city: 'Ahmedabad', lat: 23.0304, lng: 72.5178, storeName: 'Wom Up Satellite Dark Store', pincode: '380015' },
  { name: 'Prahlad Nagar', city: 'Ahmedabad', lat: 23.0125, lng: 72.5082, storeName: 'Wom Up Prahlad Nagar Dark Store', pincode: '380015' },
  { name: 'Vastrapur', city: 'Ahmedabad', lat: 23.0350, lng: 72.5293, storeName: 'Wom Up Vastrapur Dark Store', pincode: '380015' },
  { name: 'Bopal', city: 'Ahmedabad', lat: 23.0336, lng: 72.4646, storeName: 'Wom Up Bopal Dark Store', pincode: '380058' },
  { name: 'Ghatlodia', city: 'Ahmedabad', lat: 23.0750, lng: 72.5350, storeName: 'Wom Up Ghatlodia Dark Store', pincode: '380061' },
  { name: 'SG Highway', city: 'Ahmedabad', lat: 23.0300, lng: 72.5050, storeName: 'Wom Up SG Highway Dark Store', pincode: '380054' },
];

export const matchAreaByName = (query?: string | null): AreaOption | null => {
  if (!query || query.trim().length < 3) return null;
  const lower = query.toLowerCase().trim();
  return AHMEDABAD_AREAS.find((a) => {
    const aName = a.name.toLowerCase();
    return lower.includes(aName) || aName.includes(lower);
  }) || null;
};
