export interface AreaOption {
  name: string;
  city: string;
  lat: number;
  lng: number;
  storeName: string;
  pincode: string;
}

export const AHMEDABAD_AREAS: AreaOption[] = [
  { name: 'Prahlad Nagar', city: 'Ahmedabad', lat: 23.0125, lng: 72.5082, storeName: 'Wom Up Prahlad Nagar Dark Store', pincode: '380015' },
  { name: 'Prahalad Nagar', city: 'Ahmedabad', lat: 23.0125, lng: 72.5082, storeName: 'Wom Up Prahlad Nagar Dark Store', pincode: '380015' },
  { name: 'Makarba', city: 'Ahmedabad', lat: 23.0080, lng: 72.5020, storeName: 'Wom Up Prahlad Nagar Dark Store', pincode: '380051' },
  { name: 'Satellite', city: 'Ahmedabad', lat: 23.0304, lng: 72.5178, storeName: 'Wom Up Satellite Dark Store', pincode: '380015' },
  { name: 'Navrangpura', city: 'Ahmedabad', lat: 23.0365, lng: 72.5611, storeName: 'Wom Up Navrangpura Dark Store', pincode: '380009' },
  { name: 'Ghatlodia', city: 'Ahmedabad', lat: 23.0750, lng: 72.5350, storeName: 'Wom Up Ghatlodia Dark Store', pincode: '380061' },
  { name: 'Bopal', city: 'Ahmedabad', lat: 23.0336, lng: 72.4646, storeName: 'Wom Up Bopal Dark Store', pincode: '380058' },
  { name: 'SG Highway', city: 'Ahmedabad', lat: 23.0300, lng: 72.5050, storeName: 'Wom Up SG Highway Dark Store', pincode: '380054' },
  { name: 'Thaltej', city: 'Ahmedabad', lat: 23.0500, lng: 72.5160, storeName: 'Wom Up Thaltej Dark Store', pincode: '380059' },
  { name: 'Vastrapur', city: 'Ahmedabad', lat: 23.0350, lng: 72.5293, storeName: 'Wom Up Vastrapur Dark Store', pincode: '380015' },
  { name: 'Chandlodia', city: 'Ahmedabad', lat: 23.0805, lng: 72.5480, storeName: 'Wom Up Chandlodia Dark Store', pincode: '382481' },
  { name: 'Chandlodiya - Tragad', city: 'Ahmedabad', lat: 23.1150, lng: 72.5450, storeName: 'Wom Up Chandlodia Dark Store', pincode: '382481' },
  { name: 'Tragad', city: 'Ahmedabad', lat: 23.1189, lng: 72.5630, storeName: 'Wom Up Tragad Dark Store', pincode: '382470' },
  { name: 'Maninagar', city: 'Ahmedabad', lat: 22.9978, lng: 72.6033, storeName: 'Wom Up Maninagar Dark Store', pincode: '380008' },
  { name: 'Paldi', city: 'Ahmedabad', lat: 23.0129, lng: 72.5632, storeName: 'Wom Up Paldi Dark Store', pincode: '380007' },
  { name: 'Ramol', city: 'Ahmedabad', lat: 22.9850, lng: 72.6450, storeName: 'Wom Up Ramol Dark Store', pincode: '382449' },
  { name: 'Hathijan / Vatva side', city: 'Ahmedabad', lat: 22.9650, lng: 72.6350, storeName: 'Wom Up Vatva Dark Store', pincode: '382440' },
  { name: 'Lambha', city: 'Ahmedabad', lat: 22.9450, lng: 72.5950, storeName: 'Wom Up Lambha Dark Store', pincode: '382440' },
  { name: 'Isanpur', city: 'Ahmedabad', lat: 22.9820, lng: 72.5980, storeName: 'Wom Up Isanpur Dark Store', pincode: '382443' },
];

export const matchAreaByName = (query?: string | null): AreaOption | null => {
  if (!query || query.trim().length < 3) return null;
  const rawLower = query.toLowerCase().trim();
  // Normalize common phonetic variations
  const normalized = rawLower
    .replace(/prahalad/g, 'prahlad')
    .replace(/chandlodiy?a/g, 'chandlodiya')
    .replace(/ghatlodiy?a/g, 'ghatlodia');

  // 1. Direct or substring match
  const directMatch = AHMEDABAD_AREAS.find((a) => {
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
    const tokenMatch = AHMEDABAD_AREAS.find((a) => {
      const aNorm = a.name.toLowerCase().replace(/prahalad/g, 'prahlad').replace(/chandlodiy?a/g, 'chandlodiya');
      return aNorm.includes(token) || token.includes(aNorm.split(' ')[0]);
    });
    if (tokenMatch) return tokenMatch;
  }

  // 3. Compact match without spaces
  const compactQuery = normalized.replace(/[^a-z0-9]/g, '');
  return (
    AHMEDABAD_AREAS.find((a) => {
      const compactName = a.name.toLowerCase().replace(/prahalad/g, 'prahlad').replace(/[^a-z0-9]/g, '');
      return compactQuery.includes(compactName) || compactName.includes(compactQuery);
    }) || null
  );
};
