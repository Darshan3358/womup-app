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

export const getLocalProductAsset = (urlOrName?: string | null): any => {
  if (!urlOrName) return null;
  const filename = urlOrName.split('/').pop()?.split('?')[0]?.toLowerCase();
  if (filename && LOCAL_PRODUCT_ASSETS[filename]) {
    return LOCAL_PRODUCT_ASSETS[filename];
  }
  const cleanKey = urlOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const candidate = `${cleanKey}.png`;
  if (LOCAL_PRODUCT_ASSETS[candidate]) {
    return LOCAL_PRODUCT_ASSETS[candidate];
  }
  return null;
};
