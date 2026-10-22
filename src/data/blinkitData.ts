import { COLORS } from '../theme/colors';
import { ProductVariantPriced } from '../types';

export interface BlinkitProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  description?: string;
  sellingPrice: number;
  mrp: number;
  discountBadge?: string;
  isPriceDrop?: boolean;
  deliveryMinutes: number;
  rating: number;
  reviewCount: number;
  stockUrgency?: string;
  stock: number;
  imageUrl: string;
  galleryImages?: string[];
  imageType?: string;
  attributes?: { label: string; value: string }[];
  bankOffer?: {
    bank: string;
    text: string;
    code: string;
    effectivePrice: number;
  };
  specifications?: Record<string, string>;
  variants?: ProductVariantPriced[];
}


export interface BlinkitCategoryCard {
  id: string;
  title: string;
  countBadge: string;
  imageUrls: [string, string, string, string]; // 4 quadrant real product images
  itemTypes?: [string, string, string, string];
}

export interface BlinkitIconTile {
  id: string;
  title: string;
  titleTop?: string;
  titleBottom?: string;
  imageUrl: string;
  localImage?: any;
  bgColor?: string;
  tag?: string;
}

// Hero product for PDP (Citizen Raincoat matching Screenshot 5)
export const BLINKIT_RAINCOAT_PRODUCT: BlinkitProduct = {
  id: 'citizen_raincoat_1',
  name: 'Citizen Raincoat With Zip - Free Size (Transparent)',
  brand: 'Citizen',
  category: 'Monsoon Store',
  packSize: '1 pc',
  sellingPrice: 329,
  mrp: 449,
  isPriceDrop: true,
  discountBadge: '₹120 OFF',
  deliveryMinutes: 10,
  rating: 4.2,
  reviewCount: 827,
  stockUrgency: '3 left',
  stock: 3,
  imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
  galleryImages: [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=600&q=80',
  ],
  attributes: [
    { label: 'Size', value: 'Free Size' },
    { label: 'Fabric', value: 'PVC' },
    { label: 'Top Closure', value: 'Zip' },
    { label: 'Pack Size', value: '1 pc' },
  ],
  bankOffer: {
    bank: 'AU',
    text: 'Buy at ₹313',
    code: 'AUCC30',
    effectivePrice: 313,
  },
  specifications: {
    'Brand': 'Citizen',
    'Material': 'High-Grade Waterproof PVC',
    'Top Closure': 'Sturdy Front Zip + Snap Flap',
    'Hood': 'Integrated Drawstring Hood',
    'Pockets': '2 Front Cargo Pockets',
    'Maintenance': 'Wipe clean with damp cloth',
    'Country of Origin': 'India',
  },
};

// Live product collections - initialized as empty arrays (all data fetched dynamically from MongoDB backend APIs)
export const PEOPLE_ALSO_BOUGHT: BlinkitProduct[] = [];
export const ORDER_AGAIN_PRODUCTS: BlinkitProduct[] = [];
export const DEALS_OF_THE_DAY_PRODUCTS: BlinkitProduct[] = [];
export const FAST_DELIVERY_PRODUCTS: BlinkitProduct[] = [];
export const FRESH_VEG_FRUITS_PRODUCTS: BlinkitProduct[] = [];
export const DAIRY_BREAD_EGGS_PRODUCTS: BlinkitProduct[] = [];
export const BESTSELLERS_PRODUCTS: BlinkitProduct[] = [];
export const NEW_ARRIVALS_PRODUCTS: BlinkitProduct[] = [];
export const UNDER_50_PRODUCTS: BlinkitProduct[] = [];

export interface BestSellerCategoryGroup {
  id: string;
  title: string;
  categoryIds: string[];
}

// Grouped Best Seller cards mapped to real MongoDB categories
export const BEST_SELLER_GROUPS: BestSellerCategoryGroup[] = [
  {
    id: 'bs_veg',
    title: 'Vegetables & Fruits',
    categoryIds: [
      '6aa2712acb3d55073acc2101', // Vegetables
      '6aa2712acb3d55073acc2102', // Fruits
      'vegetables',
      'fruits',
    ],
  },
  {
    id: 'bs_chips',
    title: 'Chips & Namkeen',
    categoryIds: [
      '6aa2712bcb3d55073acc2106', // Snacks
      'snacks',
    ],
  },
  {
    id: 'bs_dairy',
    title: 'Dairy, Bread & Eggs',
    categoryIds: [
      '6aa2712acb3d55073acc2103', // Dairy
      '6aa2712bcb3d55073acc2104', // Bakery
      'dairy',
      'bakery',
    ],
  },
  {
    id: 'bs_oil',
    title: 'Oil, Ghee & Masala',
    categoryIds: [
      '6aa11866c6c3e5984e2ef5ea', // Cooking Essentials
      'cooking-essentials',
      'cooking',
    ],
  },
  {
    id: 'bs_bakery',
    title: 'Bakery & Biscuits',
    categoryIds: [
      '6aa2712bcb3d55073acc2104', // Bakery
      '6aa2712bcb3d55073acc2106', // Snacks
      'bakery',
      'snacks',
    ],
  },
  {
    id: 'bs_drinks',
    title: 'Drinks & Juices',
    categoryIds: [
      '6aa2712bcb3d55073acc2105', // Beverages
      'beverages',
    ],
  },
];

export const resolveCategoryGroup = (groupOrTileId: string, title?: string): string[] => {
  const normTitle = (title || '').toLowerCase().trim();
  const found = BEST_SELLER_GROUPS.find(
    (g) => g.id === groupOrTileId || g.title.toLowerCase() === normTitle,
  );
  if (found) return found.categoryIds;

  // Title-based matching for category tiles
  if (normTitle.includes('vegetable') || normTitle.includes('fruit')) {
    return ['6aa2712acb3d55073acc2101', '6aa2712acb3d55073acc2102', 'vegetables', 'fruits'];
  }
  if (normTitle.includes('dairy') || normTitle.includes('milk') || normTitle.includes('egg') || normTitle.includes('bread')) {
    return ['6aa2712acb3d55073acc2103', '6aa2712bcb3d55073acc2104', 'dairy', 'bakery'];
  }
  if (normTitle.includes('atta') || normTitle.includes('rice') || normTitle.includes('dal') || normTitle.includes('oil') || normTitle.includes('ghee') || normTitle.includes('masala')) {
    return ['6aa11866c6c3e5984e2ef5ea', 'cooking-essentials'];
  }
  if (normTitle.includes('chip') || normTitle.includes('snack') || normTitle.includes('namkeen') || normTitle.includes('crisp')) {
    return ['6aa2712bcb3d55073acc2106', 'snacks'];
  }
  if (normTitle.includes('drink') || normTitle.includes('juice') || normTitle.includes('beverage')) {
    return ['6aa2712bcb3d55073acc2105', 'beverages'];
  }
  if (normTitle.includes('bakery') || normTitle.includes('biscuit')) {
    return ['6aa2712bcb3d55073acc2104', '6aa2712bcb3d55073acc2106', 'bakery', 'snacks'];
  }

  return [groupOrTileId];
};

// Bestsellers Rail 2x2 Category Cards with Real Online Photos (Screenshot 1)
export const BESTSELLER_CATEGORY_CARDS_ROW1: BlinkitCategoryCard[] = [
  {
    id: 'bs_veg',
    title: 'Vegetables & Fruits',
    countBadge: '+149 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=250&q=80', // Coriander
      'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=250&q=80', // Onion
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=250&q=80', // Potato
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=250&q=80', // Banana
    ],
  },
  {
    id: 'bs_chips',
    title: 'Chips & Namkeen',
    countBadge: '+388 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=250&q=80', // Chips
      'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=250&q=80', // Nachos
      'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=250&q=80', // Popcorn
      'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=250&q=80', // Pretzels
    ],
  },
  {
    id: 'bs_dairy',
    title: 'Dairy, Bread & Eggs',
    countBadge: '+15 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=250&q=80', // Milk
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=250&q=80', // Bread
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=250&q=80', // Eggs
      'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=250&q=80', // Cheese
    ],
  },
];

export const BESTSELLER_CATEGORY_CARDS_ROW2: BlinkitCategoryCard[] = [
  {
    id: 'bs_oil',
    title: 'Oil, Ghee & Masala',
    countBadge: '+210 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=250&q=80', // Oil
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=250&q=80', // Ghee
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=250&q=80', // Spices
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=250&q=80', // Turmeric
    ],
  },
  {
    id: 'bs_bakery',
    title: 'Bakery & Biscuits',
    countBadge: '+175 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=250&q=80', // Cookies
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=250&q=80', // Biscuits
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=250&q=80', // Toast
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=250&q=80', // Cake
    ],
  },
  {
    id: 'bs_drinks',
    title: 'Drinks & Juices',
    countBadge: '+95 more',
    imageUrls: [
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=250&q=80', // Soda
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=250&q=80', // Juice
      'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=250&q=80', // Cold drink
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=250&q=80', // Mocktail
    ],
  },
];

// 4-Column Main Category Grid (Grocery) with Authentic Transparent 3D Assets
export const MAIN_CATEGORY_GRID: BlinkitIconTile[] = [
  { id: 'cat_veg', title: 'Vegetables & Fruits', imageUrl: '', localImage: require('../../assets/cat_1_trans.png'), bgColor: '#ECF5F7' },
  { id: 'cat_atta', title: 'Atta, Rice & Dal', imageUrl: '', localImage: require('../../assets/cat_4_trans.png'), bgColor: '#FDF7EE' },
  { id: 'cat_oil', title: 'Oil, Ghee & Masala', imageUrl: '', localImage: require('../../assets/cat_4_trans.png'), bgColor: '#FCF6F0' },
  { id: 'cat_dairy', title: 'Dairy, Bread & Eggs', imageUrl: '', localImage: require('../../assets/cat_3_trans.png'), bgColor: '#F3F4FC' },
  { id: 'cat_bakery', title: 'Bakery & Biscuits', imageUrl: '', localImage: require('../../assets/cat_5_trans.png'), bgColor: '#F7F1FC' },
  { id: 'cat_dryfruits', title: 'Dry Fruits & Cereals', imageUrl: '', localImage: require('../../assets/cat_2_trans.png'), bgColor: '#FCF6F0' },
  { id: 'cat_meat', title: 'Chicken, Meat & Fish', imageUrl: '', localImage: require('../../assets/cat_11_trans.png'), bgColor: '#EAF1FD' },
  { id: 'cat_kitchen', title: 'Kitchenware & Appliances', imageUrl: '', localImage: require('../../assets/cat_7_trans.png'), bgColor: '#EAF1FD' },
];

// Snacks & Drinks Section with Authentic Transparent 3D Assets
export const SNACKS_DRINKS_GRID: BlinkitIconTile[] = [
  { id: 'snk_chips', title: 'Chips & Crisps', imageUrl: '', localImage: require('../../assets/cat_2_trans.png'), bgColor: '#FCF6F0' },
  { id: 'snk_drinks', title: 'Cold Drinks & Juices', imageUrl: '', localImage: require('../../assets/cat_6_trans.png'), bgColor: '#FCF2F2' },
  { id: 'snk_chocolates', title: 'Chocolates & Candies', imageUrl: '', localImage: require('../../assets/cat_5_trans.png'), bgColor: '#F7F1FC' },
  { id: 'snk_noodles', title: 'Noodles & Pasta', imageUrl: '', localImage: require('../../assets/cat_11_trans.png'), bgColor: '#EAF1FD' },
];

// Beauty & Personal Care Section with Authentic Transparent 3D Assets
export const BEAUTY_GRID: BlinkitIconTile[] = [
  { id: 'bt_bath', title: 'Bath & Body', imageUrl: '', localImage: require('../../assets/cat_8_trans.png'), bgColor: '#FAF2FB' },
  { id: 'bt_hair', title: 'Hair Care', imageUrl: '', localImage: require('../../assets/cat_8_trans.png'), bgColor: '#FAF2FB' },
  { id: 'bt_skin', title: 'Skin Care', imageUrl: '', localImage: require('../../assets/cat_8_trans.png'), bgColor: '#FAF2FB' },
  { id: 'bt_baby', title: 'Baby Care', imageUrl: '', localImage: require('../../assets/cat_9_trans.png'), bgColor: '#F5F0FC' },
];

// Household Essentials Section with Authentic Transparent 3D Assets
export const HOUSEHOLD_GRID: BlinkitIconTile[] = [
  { id: 'hh_home', title: 'Household Essentials', imageUrl: '', localImage: require('../../assets/cat_7_trans.png'), bgColor: '#EAF1FD' },
  { id: 'hh_clean', title: 'Personal Care', imageUrl: '', localImage: require('../../assets/cat_8_trans.png'), bgColor: '#FAF2FB' },
  { id: 'hh_pet', title: 'Pet Care', imageUrl: '', localImage: require('../../assets/cat_10_trans.png'), bgColor: '#EFF9F6' },
  { id: 'hh_frozen', title: 'Frozen Foods', imageUrl: '', localImage: require('../../assets/cat_11_trans.png'), bgColor: '#EAF1FD' },
];

// Stores in Spotlight with 3D Cutout Illustrations & Authentic Pastel Backgrounds matching Blinkit
export const STORES_IN_SPOTLIGHT: BlinkitIconTile[] = [
  {
    id: 'store_monsoon',
    title: 'Monsoon Store',
    titleTop: 'Monsoon',
    titleBottom: 'Store',
    imageUrl: 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?auto=format&fit=crop&w=300&q=80',
    localImage: require('../../assets/spotlight_monsoon_store.jpg'),
    bgColor: '#DCEBFA',
  },
  {
    id: 'store_travel',
    title: 'Travel Store',
    titleTop: 'Travel',
    titleBottom: 'Store',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=300&q=80',
    localImage: require('../../assets/spotlight_travel_store.jpg'),
    bgColor: '#D9F3E5',
  },
  {
    id: 'store_hobby',
    title: 'Hobby Store',
    titleTop: 'Hobby',
    titleBottom: 'Store',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80',
    localImage: require('../../assets/spotlight_hobby_store.jpg'),
    bgColor: '#F0E5FC',
  },
  {
    id: 'store_sports',
    title: 'Sports Store',
    titleTop: 'Sports',
    titleBottom: 'Store',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=300&q=80',
    localImage: require('../../assets/spotlight_sports_store.jpg'),
    bgColor: '#DCF3DC',
  },
];

// Picks for your lifestyle (2 rows x 4 cols) with Real Online Images
export const LIFESTYLE_PICKS: BlinkitIconTile[] = [
  { id: 'ls_spiritual', title: 'Spiritual Needs', imageUrl: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.cardBackground },
  { id: 'ls_pet', title: 'Pet Store', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.lightBlueLavender },
  { id: 'ls_fashion', title: 'Fashion Basics', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.lightPink },
  { id: 'ls_toys', title: 'Toy Store', imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.cardBackground },
  { id: 'ls_books', title: 'Book Store', imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.lightBlueLavender },
  { id: 'ls_pharma', title: 'Pharma Store', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.lightPink },
  { id: 'ls_egifts', title: 'E-Gifts Store', imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.cardBackground },
  { id: 'ls_jewellery', title: 'Jewellery Store', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80', bgColor: COLORS.lightBlueLavender },
];
