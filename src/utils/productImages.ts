/**
 * Complete 34-Product Public HTTP Image URL Mapping - WOMUP
 * Direct verified public HTTP image URLs for all 34 catalog products
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  // 1. VEGETABLES
  'potato.png': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=90',
  'onion.png': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=1200&q=90',
  'tomato.png': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1200&q=90',
  'lady-fingers.png': 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=1200&q=90',
  'cabbage.png': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=1200&q=90',
  'ginger.png': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=1200&q=90',
  'guwar.png': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Cyamopsis_tetragonoloba_%28guar%2C_cluster_bean%29_%28SaatPilot%29.jpg',
  'lemon.png': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=1200&q=90',
  'bottle-gourd.png': 'https://organicmandya.com/cdn/shop/files/BottleGourd.jpg?v=1757077759&width=1200',
  'parwal.png': 'https://cdn.pixabay.com/photo/2021/08/15/18/52/pointed-gourd-6548622_1280.jpg',
  'beetroot.png': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&q=90',

  // 2. FRUITS
  'apple.png': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=1200&q=90',
  'banana.png': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=1200&q=90',
  'orange.png': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=1200&q=90',
  'pineapple.png': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1200&q=90',
  'muskmelon.png': 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&q=90',
  'papaya.png': 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=1200&q=90',
  'kiwi.png': 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=1200&q=90',
  'watermelon.png': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&q=90',

  // 3. ATTA, RICE & DAL
  'aashirvaad-atta.png': 'https://cdn.quicklly.com/upload_images/product/1774640383-aashirvaad-whole-wheat-atta.png',
  'basmati-rice.png': 'https://www.asiacontinental.co.uk/cdn/shop/files/daawat_28f6e7a0-26d3-4cfd-a7d6-52c0ee86d0c7_884x.png?v=1764417808',
  'tata-salt.png': 'https://budgetbazaar.online/wp-content/uploads/2023/01/BBP2017.jpg',
  'sunflower-oil.png': 'https://tiimg.tistatic.com/fp/1/007/765/100-percent-natural-no-added-preservative-healthy-oil-plastic-bottle-336.jpg',

  // 4. DAIRY, BREAD & EGGS
  'paneer.png': 'https://static.wixstatic.com/media/73207d_2c527437f55247a9b32074217083dead~mv2.png/v1/fill/w_1507%2Ch_1507%2Cal_c/Paneer.png',
  'curd.png': 'https://images.unsplash.com/photo-1570797197190-8e003a00c846?w=1200&q=90',
  'amul-tata-milk.png': 'https://rukminim2.flixcart.com/image/612/612/xif0q/milk/r/w/0/500-cow-milk-pouch-plain-amul-original-imah2hrzzpz2hmeh.jpeg?q=70',
  'bread.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=90',
  'amul-butter-milk.png': 'https://rkbazar.in/cdn/shop/files/32522_6bd89349-d650-439c-8279-0d817bc340e2_1200x1200.webp?v=1745996327',

  // 5. BEAUTY & PERSONAL CARE
  'shampoo.png': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1200&q=90',
  'hair-oil.png': 'https://www.mydermastore.in/upload/2609231226113885.jpg',
  'conditioner.png': 'https://isima.com/cdn/shop/files/PDP_Mobile_Suavisima_1_A.png?v=1749128770&width=1920',
  'body-spray.png': 'https://static.beautytocare.com/cdn-cgi/image/f%3Dauto/media/catalog/product/b/-/b-u-heartbeat-48h-deodorant-body-spray-150ml.jpg',
  'body-perfume.png': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&q=90',
  'hair-colour.png': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&q=90',
};

export const getHttpProductImage = (slugOrFilename?: string | null): string | null => {
  if (!slugOrFilename) return null;
  const key = slugOrFilename.endsWith('.png') ? slugOrFilename : `${slugOrFilename}.png`;
  return PRODUCT_IMAGES[key] || null;
};
