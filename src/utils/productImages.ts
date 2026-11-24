/**
 * Complete 34-Product Cloudinary Image URL Mapping - WOMUP
 * Direct verified Cloudinary CDN URLs for all 34 catalog products
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  // 1. VEGETABLES
  'potato.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503349/womup/products/potato.png',
  'onion.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503350/womup/products/onion.png',
  'tomato.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503352/womup/products/tomato.png',
  'lady-fingers.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503358/womup/products/lady-fingers.png',
  'cabbage.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503361/womup/products/cabbage.png',
  'ginger.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503363/womup/products/ginger.png',
  'guwar.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503364/womup/products/guwar.png',
  'lemon.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503365/womup/products/lemon.png',
  'bottle-gourd.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503366/womup/products/bottle-gourd.png',
  'parwal.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503369/womup/products/parwal.png',
  'beetroot.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503370/womup/products/beetroot.png',

  // 2. FRUITS
  'apple.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503372/womup/products/apple.png',
  'banana.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503373/womup/products/banana.png',
  'orange.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503375/womup/products/orange.png',
  'pineapple.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503377/womup/products/pineapple.png',
  'muskmelon.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503378/womup/products/muskmelon.png',
  'papaya.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503380/womup/products/papaya.png',
  'kiwi.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503381/womup/products/kiwi.png',
  'watermelon.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503383/womup/products/watermelon.png',

  // 3. ATTA, RICE & DAL
  'aashirvaad-atta.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503384/womup/products/aashirvaad-atta.png',
  'basmati-rice.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503386/womup/products/basmati-rice.png',
  'tata-salt.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503387/womup/products/tata-salt.png',
  'sunflower-oil.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503388/womup/products/sunflower-oil.png',

  // 4. DAIRY, BREAD & EGGS
  'paneer.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503390/womup/products/paneer.png',
  'curd.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503391/womup/products/curd.png',
  'amul-tata-milk.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503392/womup/products/amul-tata-milk.png',
  'bread.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503394/womup/products/bread.png',
  'amul-butter-milk.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503395/womup/products/amul-butter-milk.png',

  // 5. BEAUTY & PERSONAL CARE
  'shampoo.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503398/womup/products/shampoo.png',
  'hair-oil.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503399/womup/products/hair-oil.png',
  'conditioner.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503400/womup/products/conditioner.png',
  'body-spray.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503402/womup/products/body-spray.png',
  'body-perfume.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503404/womup/products/body-perfume.png',
  'hair-colour.png': 'https://res.cloudinary.com/dp6ukil0g/image/upload/v1795503406/womup/products/hair-colour.png',
};

export const getHttpProductImage = (slugOrFilename?: string | null): string | null => {
  if (!slugOrFilename) return null;
  const key = slugOrFilename.endsWith('.png') ? slugOrFilename : `${slugOrFilename}.png`;
  return PRODUCT_IMAGES[key] || null;
};
