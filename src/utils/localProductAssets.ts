import { PRODUCT_IMAGES } from './productImages';

/**
 * 34 Local Bundled Product Assets
 * Guarantees instant 0ms offline rendering for the entire fresh 34-product catalogue
 */
export const LOCAL_PRODUCT_ASSETS: Record<string, any> = {
  // 1. Vegetables
  'potato.png': require('../../assets/products/potato.png'),
  'onion.png': require('../../assets/products/onion.png'),
  'tomato.png': require('../../assets/products/tomato.png'),
  'lady-fingers.png': require('../../assets/products/lady-fingers.png'),
  'cabbage.png': require('../../assets/products/cabbage.png'),
  'ginger.png': require('../../assets/products/ginger.png'),
  'guwar.png': require('../../assets/products/guwar.png'),
  'lemon.png': require('../../assets/products/lemon.png'),
  'bottle-gourd.png': require('../../assets/products/bottle-gourd.png'),
  'parwal.png': require('../../assets/products/parwal.png'),
  'beetroot.png': require('../../assets/products/beetroot.png'),

  // 2. Fruits
  'apple.png': require('../../assets/products/apple.png'),
  'banana.png': require('../../assets/products/banana.png'),
  'orange.png': require('../../assets/products/orange.png'),
  'pineapple.png': require('../../assets/products/pineapple.png'),
  'muskmelon.png': require('../../assets/products/muskmelon.png'),
  'papaya.png': require('../../assets/products/papaya.png'),
  'kiwi.png': require('../../assets/products/kiwi.png'),
  'watermelon.png': require('../../assets/products/watermelon.png'),

  // 3. Atta, Rice & Dal
  'aashirvaad-atta.png': require('../../assets/products/aashirvaad-atta.png'),
  'basmati-rice.png': require('../../assets/products/basmati-rice.png'),
  'tata-salt.png': require('../../assets/products/tata-salt.png'),
  'sunflower-oil.png': require('../../assets/products/sunflower-oil.png'),

  // 4. Dairy, Bread & Eggs
  'paneer.png': require('../../assets/products/paneer.png'),
  'curd.png': require('../../assets/products/curd.png'),
  'amul-tata-milk.png': require('../../assets/products/amul-tata-milk.png'),
  'bread.png': require('../../assets/products/bread.png'),
  'amul-butter-milk.png': require('../../assets/products/amul-butter-milk.png'),

  // 5. Beauty & Personal Care
  'shampoo.png': require('../../assets/products/shampoo.png'),
  'hair-oil.png': require('../../assets/products/hair-oil.png'),
  'conditioner.png': require('../../assets/products/conditioner.png'),
  'body-spray.png': require('../../assets/products/body-spray.png'),
  'body-perfume.png': require('../../assets/products/body-perfume.png'),
  'hair-colour.png': require('../../assets/products/hair-colour.png'),
};

// Reverse lookup index: URL -> assetKey (e.g. 'https://images.unsplash.com/...': 'watermelon.png')
const URL_TO_ASSET_KEY = new Map<string, string>();
for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
  if (url) {
    URL_TO_ASSET_KEY.set(url.trim(), key);
    const noQuery = url.split('?')[0].trim();
    URL_TO_ASSET_KEY.set(noQuery, key);
  }
}

// Name/Slug lookup index for instant fuzzy resolution
const NAME_TO_ASSET_KEY: Record<string, string> = {
  potato: 'potato.png',
  onion: 'onion.png',
  tomato: 'tomato.png',
  'lady-fingers': 'lady-fingers.png',
  ladyfinger: 'lady-fingers.png',
  ladyfingers: 'lady-fingers.png',
  bhindi: 'lady-fingers.png',
  cabbage: 'cabbage.png',
  ginger: 'ginger.png',
  guwar: 'guwar.png',
  guar: 'guwar.png',
  guvar: 'guwar.png',
  lemon: 'lemon.png',
  'bottle-gourd': 'bottle-gourd.png',
  bottlegourd: 'bottle-gourd.png',
  lauki: 'bottle-gourd.png',
  parwal: 'parwal.png',
  beetroot: 'beetroot.png',
  apple: 'apple.png',
  banana: 'banana.png',
  orange: 'orange.png',
  pineapple: 'pineapple.png',
  muskmelon: 'muskmelon.png',
  papaya: 'papaya.png',
  kiwi: 'kiwi.png',
  watermelon: 'watermelon.png',
  'aashirvaad-atta': 'aashirvaad-atta.png',
  aashirvaad: 'aashirvaad-atta.png',
  atta: 'aashirvaad-atta.png',
  'basmati-rice': 'basmati-rice.png',
  rice: 'basmati-rice.png',
  'tata-salt': 'tata-salt.png',
  salt: 'tata-salt.png',
  'sunflower-oil': 'sunflower-oil.png',
  oil: 'sunflower-oil.png',
  paneer: 'paneer.png',
  curd: 'curd.png',
  dahi: 'curd.png',
  'curd-dahi': 'curd.png',
  'amul-tata-milk': 'amul-tata-milk.png',
  milk: 'amul-tata-milk.png',
  bread: 'bread.png',
  'amul-butter-milk': 'amul-butter-milk.png',
  buttermilk: 'amul-butter-milk.png',
  chaas: 'amul-butter-milk.png',
  shampoo: 'shampoo.png',
  'hair-oil': 'hair-oil.png',
  conditioner: 'conditioner.png',
  'body-spray': 'body-spray.png',
  spray: 'body-spray.png',
  'body-perfume': 'body-perfume.png',
  perfume: 'body-perfume.png',
  'hair-colour': 'hair-colour.png',
  haircolor: 'hair-colour.png',
};

export const getLocalProductAsset = (
  urlOrName?: string | null,
  name?: string | null,
  slug?: string | null,
): any => {
  const trimmedUrl = urlOrName ? urlOrName.trim() : '';
  const isExternalUrl =
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('blob:') ||
    trimmedUrl.startsWith('file:');

  // 1. Direct URL match via reverse lookup map (Instant match for default 34 HTTP URLs)
  if (isExternalUrl) {
    const matchedKey = URL_TO_ASSET_KEY.get(trimmedUrl) || URL_TO_ASSET_KEY.get(trimmedUrl.split('?')[0]);
    if (matchedKey && LOCAL_PRODUCT_ASSETS[matchedKey]) {
      return LOCAL_PRODUCT_ASSETS[matchedKey];
    }
    // If an external URL is explicitly set and does not match the default asset map,
    // it is a custom URL set by Admin. Do NOT override it with local assets!
    return null;
  }

  // 2. Slug match (for offline/local catalog without external URLs)
  if (slug) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const candidate = `${cleanSlug}.png`;
    if (LOCAL_PRODUCT_ASSETS[candidate]) return LOCAL_PRODUCT_ASSETS[candidate];
    if (NAME_TO_ASSET_KEY[cleanSlug] && LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanSlug]]) {
      return LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanSlug]];
    }
  }

  // 3. Name match (for offline/local catalog without external URLs)
  if (name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const candidate = `${cleanName}.png`;
    if (LOCAL_PRODUCT_ASSETS[candidate]) return LOCAL_PRODUCT_ASSETS[candidate];
    if (NAME_TO_ASSET_KEY[cleanName] && LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanName]]) {
      return LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanName]];
    }
    // Partial substring match for common names
    for (const [keyPart, assetKey] of Object.entries(NAME_TO_ASSET_KEY)) {
      if (cleanName.includes(keyPart) && LOCAL_PRODUCT_ASSETS[assetKey]) {
        return LOCAL_PRODUCT_ASSETS[assetKey];
      }
    }
  }

  // 4. Filename / path match from urlOrName
  if (urlOrName) {
    const filename = urlOrName.split('/').pop()?.split('?')[0]?.toLowerCase();
    if (filename && LOCAL_PRODUCT_ASSETS[filename]) {
      return LOCAL_PRODUCT_ASSETS[filename];
    }
    const cleanKey = urlOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const candidate = `${cleanKey}.png`;
    if (LOCAL_PRODUCT_ASSETS[candidate]) {
      return LOCAL_PRODUCT_ASSETS[candidate];
    }
    if (NAME_TO_ASSET_KEY[cleanKey] && LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanKey]]) {
      return LOCAL_PRODUCT_ASSETS[NAME_TO_ASSET_KEY[cleanKey]];
    }
  }

  return null;
};
