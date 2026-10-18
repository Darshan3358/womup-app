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

// "People also bought" cross-sell products
export const PEOPLE_ALSO_BOUGHT: BlinkitProduct[] = [
  {
    id: 'rec_1',
    name: 'Waterproof Phone Pouch with Lanyard',
    brand: 'ProShield',
    category: 'Monsoon',
    packSize: '1 pc',
    sellingPrice: 99,
    mrp: 199,
    discountBadge: '₹100 OFF',
    deliveryMinutes: 10,
    rating: 4.4,
    reviewCount: 1240,
    stockUrgency: '4 left',
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_2',
    name: 'Citizen Backpack Rain Cover (Waterproof)',
    brand: 'Citizen',
    category: 'Monsoon',
    packSize: 'Free Size',
    sellingPrice: 199,
    mrp: 349,
    discountBadge: '₹150 OFF',
    deliveryMinutes: 11,
    rating: 4.3,
    reviewCount: 980,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_3',
    name: 'Dettol Instant Hand Sanitizer Original',
    brand: 'Dettol',
    category: 'Personal Care',
    packSize: '50 ml',
    sellingPrice: 50,
    mrp: 60,
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 5420,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_4',
    name: 'Auto-Open Windproof 3-Fold Umbrella',
    brand: 'SunRain',
    category: 'Monsoon',
    packSize: '1 pc',
    sellingPrice: 349,
    mrp: 599,
    discountBadge: '₹250 OFF',
    deliveryMinutes: 10,
    rating: 4.5,
    reviewCount: 3100,
    stockUrgency: '5 left',
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_5',
    name: 'Silicone Waterproof Reusable Shoe Covers',
    brand: 'DryStep',
    category: 'Monsoon',
    packSize: '1 Pair (L)',
    sellingPrice: 189,
    mrp: 299,
    discountBadge: '₹110 OFF',
    deliveryMinutes: 10,
    rating: 4.1,
    reviewCount: 430,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'rec_6',
    name: 'Odomos Naturals Mosquito Repellent Spray',
    brand: 'Odomos',
    category: 'Personal Care',
    packSize: '100 ml',
    sellingPrice: 120,
    mrp: 145,
    deliveryMinutes: 10,
    rating: 4.7,
    reviewCount: 4110,
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=500&q=80',
  },
];

// Order Again Bestsellers (Screenshot 2)
export const ORDER_AGAIN_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'oa_1',
    name: 'Amul Gold Full Cream Fresh Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 35,
    mrp: 35,
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 8430,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'oa_2',
    name: 'Fresh Green Coriander (Dhaniya)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '100 g',
    sellingPrice: 14,
    mrp: 18,
    deliveryMinutes: 9,
    rating: 4.5,
    reviewCount: 2310,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'oa_3',
    name: 'Amul Probiotic Masti Buttermilk (Chhas)',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '400 ml',
    sellingPrice: 15,
    mrp: 15,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 6520,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'oa_4',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    brand: 'Fortune',
    category: 'Staples',
    packSize: '1 L',
    sellingPrice: 128,
    mrp: 160,
    discountBadge: '₹32 OFF',
    deliveryMinutes: 10,
    rating: 4.7,
    reviewCount: 4210,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  },
];

// Exact Deals of the Day matching SRS Section 7.4
export const DEALS_OF_THE_DAY_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'deal_tomato',
    name: 'Fresh Tomato',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '250 g',
    sellingPrice: 7,
    mrp: 10,
    discountBadge: '30% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3120,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '250 g', price: 7, mrp: 10, discountPercent: 30, stock: 50, isAvailable: true, isDefault: true },
      { id: 'v2', label: '500 g', price: 13, mrp: 15, discountPercent: 13, stock: 50, isAvailable: true, isDefault: false },
      { id: 'v3', label: '1 kg', price: 25, mrp: 30, discountPercent: 16, stock: 50, isAvailable: true, isDefault: false },
      { id: 'v4', label: '2 kg', price: 48, mrp: 58, discountPercent: 17, stock: 50, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_fortune_oil',
    name: 'Fortune Sunflower Oil',
    brand: 'Fortune',
    category: 'Cooking Essentials',
    packSize: '1 L',
    sellingPrice: 65,
    mrp: 78,
    discountBadge: '17% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 1450,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '500 ml', price: 35, mrp: 42, discountPercent: 16, stock: 30, isAvailable: true, isDefault: false },
      { id: 'v2', label: '1 L', price: 65, mrp: 78, discountPercent: 17, stock: 30, isAvailable: true, isDefault: true },
      { id: 'v3', label: '2 L', price: 128, mrp: 155, discountPercent: 17, stock: 30, isAvailable: true, isDefault: false },
      { id: 'v4', label: '5 L', price: 310, mrp: 375, discountPercent: 17, stock: 20, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_oats',
    name: 'Oats',
    brand: 'Quaker',
    category: 'Breakfast',
    packSize: '500 g',
    sellingPrice: 89,
    mrp: 102,
    discountBadge: '12% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 890,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '500 g', price: 89, mrp: 102, discountPercent: 12, stock: 25, isAvailable: true, isDefault: true },
      { id: 'v2', label: '1 kg', price: 169, mrp: 199, discountPercent: 15, stock: 25, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_paneer',
    name: 'Paneer',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '200 g',
    sellingPrice: 72,
    mrp: 80,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 2420,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '200 g', price: 72, mrp: 80, discountPercent: 10, stock: 40, isAvailable: true, isDefault: true },
      { id: 'v2', label: '500 g', price: 175, mrp: 195, discountPercent: 10, stock: 40, isAvailable: true, isDefault: false },
      { id: 'v3', label: '1 kg', price: 340, mrp: 380, discountPercent: 10, stock: 40, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_banana',
    name: 'Banana',
    brand: 'Farm Fresh',
    category: 'Fruits',
    packSize: '1 kg',
    sellingPrice: 28,
    mrp: 32,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 1840,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '1 pc', price: 6, mrp: 7, discountPercent: 14, stock: 60, isAvailable: true, isDefault: false },
      { id: 'v2', label: '1 kg', price: 28, mrp: 32, discountPercent: 14, stock: 60, isAvailable: true, isDefault: true },
    ],
  },
  {
    id: 'deal_amul_milk',
    name: 'Amul Taaza Toned Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 27,
    mrp: 28,
    discountBadge: '4% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 5200,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '500 ml', price: 27, mrp: 28, discountPercent: 4, stock: 80, isAvailable: true, isDefault: true },
      { id: 'v2', label: '1 L', price: 54, mrp: 56, discountPercent: 4, stock: 50, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_lays_chips',
    name: "Lay's Magic Masala Chips",
    brand: "Lay's",
    category: 'Snacks',
    packSize: '50 g',
    sellingPrice: 18,
    mrp: 20,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 3890,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '50 g', price: 18, mrp: 20, discountPercent: 10, stock: 45, isAvailable: true, isDefault: true },
      { id: 'v2', label: '90 g', price: 32, mrp: 35, discountPercent: 9, stock: 30, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_dairy_milk',
    name: 'Cadbury Dairy Milk Silk',
    brand: 'Cadbury',
    category: 'Chocolates',
    packSize: '60 g',
    sellingPrice: 75,
    mrp: 90,
    discountBadge: '17% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 4620,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '60 g', price: 75, mrp: 90, discountPercent: 17, stock: 35, isAvailable: true, isDefault: true },
      { id: 'v2', label: '150 g', price: 165, mrp: 195, discountPercent: 15, stock: 20, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_maggi_noodles',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Maggi',
    category: 'Instant Food',
    packSize: '70 g',
    sellingPrice: 12,
    mrp: 14,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 7850,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '70 g', price: 12, mrp: 14, discountPercent: 14, stock: 100, isAvailable: true, isDefault: true },
      { id: 'v2', label: '4 x 70 g', price: 46, mrp: 56, discountPercent: 18, stock: 60, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_coca_cola',
    name: 'Coca-Cola Refreshing Can',
    brand: 'Coca-Cola',
    category: 'Cold Drinks',
    packSize: '300 ml',
    sellingPrice: 38,
    mrp: 40,
    discountBadge: '5% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3410,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '300 ml', price: 38, mrp: 40, discountPercent: 5, stock: 50, isAvailable: true, isDefault: true },
      { id: 'v2', label: '750 ml', price: 42, mrp: 45, discountPercent: 7, stock: 40, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_aloo_bhujia',
    name: "Haldiram's Aloo Bhujia",
    brand: "Haldiram's",
    category: 'Snacks',
    packSize: '200 g',
    sellingPrice: 48,
    mrp: 55,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 2980,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '200 g', price: 48, mrp: 55, discountPercent: 13, stock: 40, isAvailable: true, isDefault: true },
      { id: 'v2', label: '400 g', price: 92, mrp: 105, discountPercent: 12, stock: 30, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'deal_greek_yogurt',
    name: 'Epigamia Greek Yogurt Blueberry',
    brand: 'Epigamia',
    category: 'Dairy',
    packSize: '90 g',
    sellingPrice: 45,
    mrp: 50,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 1650,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '90 g', price: 45, mrp: 50, discountPercent: 10, stock: 30, isAvailable: true, isDefault: true },
      { id: 'v2', label: '2 x 90 g', price: 88, mrp: 100, discountPercent: 12, stock: 20, isAvailable: true, isDefault: false },
    ],
  },
];

// ⚡ 9-Minute Delivery Fast-Moving Essentials
export const FAST_DELIVERY_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'fast_milk',
    name: 'Amul Taaza Toned Fresh Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 27,
    mrp: 28,
    discountBadge: '4% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 9400,
    stock: 85,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_bread',
    name: 'Harvest Gold White Sandwich Bread',
    brand: 'Harvest Gold',
    category: 'Bakery',
    packSize: '400 g',
    sellingPrice: 30,
    mrp: 32,
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3210,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_eggs',
    name: 'Farm Fresh White Table Eggs',
    brand: 'Eggoz',
    category: 'Dairy',
    packSize: '6 pcs',
    sellingPrice: 48,
    mrp: 55,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 4210,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_curd',
    name: 'Amul Masti Dahi Pouch',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '400 g',
    sellingPrice: 35,
    mrp: 35,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 5120,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_maggi',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Maggi',
    category: 'Instant Food',
    packSize: '70 g',
    sellingPrice: 12,
    mrp: 14,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 7850,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_chips',
    name: "Lay's Magic Masala Potato Chips",
    brand: "Lay's",
    category: 'Snacks',
    packSize: '50 g',
    sellingPrice: 18,
    mrp: 20,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 3890,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_butter',
    name: 'Amul Pasteurized Salted Butter',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '100 g',
    sellingPrice: 56,
    mrp: 60,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 6800,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fast_coriander',
    name: 'Fresh Green Coriander (Dhaniya)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '100 g',
    sellingPrice: 14,
    mrp: 18,
    discountBadge: '22% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 2310,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
  },
];

// 🌱 Fresh Vegetables & Fruits Row
export const FRESH_VEG_FRUITS_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'veg_tomato',
    name: 'Fresh Red Hybrid Tomato',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '500 g',
    sellingPrice: 13,
    mrp: 15,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3120,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '250 g', price: 7, mrp: 8, discountPercent: 12, stock: 60, isAvailable: true, isDefault: false },
      { id: 'v2', label: '500 g', price: 13, mrp: 15, discountPercent: 13, stock: 60, isAvailable: true, isDefault: true },
      { id: 'v3', label: '1 kg', price: 25, mrp: 30, discountPercent: 16, stock: 60, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'veg_onion',
    name: 'Fresh Regular Nasik Onion',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '1 kg',
    sellingPrice: 32,
    mrp: 38,
    discountBadge: '15% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 4210,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '1 kg', price: 32, mrp: 38, discountPercent: 15, stock: 80, isAvailable: true, isDefault: true },
      { id: 'v2', label: '2 kg', price: 62, mrp: 75, discountPercent: 17, stock: 80, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'veg_potato',
    name: 'Fresh Jyoti Potato (Aloo)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '1 kg',
    sellingPrice: 26,
    mrp: 30,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 5120,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '1 kg', price: 26, mrp: 30, discountPercent: 13, stock: 90, isAvailable: true, isDefault: true },
      { id: 'v2', label: '2 kg', price: 50, mrp: 60, discountPercent: 16, stock: 90, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'veg_banana',
    name: 'Robusta Golden Bananas',
    brand: 'Farm Fresh',
    category: 'Fruits',
    packSize: '1 kg (5-6 pcs)',
    sellingPrice: 28,
    mrp: 32,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 1840,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'veg_capsicum',
    name: 'Fresh Green Capsicum (Shimla Mirch)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '250 g',
    sellingPrice: 22,
    mrp: 26,
    discountBadge: '15% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 1650,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'veg_apple',
    name: 'Shimla Royal Delicious Apples',
    brand: 'Farm Fresh',
    category: 'Fruits',
    packSize: '4 pcs (approx 550g)',
    sellingPrice: 110,
    mrp: 140,
    discountBadge: '21% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 2190,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'veg_carrot',
    name: 'Fresh Red Delhi Carrots (Gajar)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '500 g',
    sellingPrice: 24,
    mrp: 30,
    discountBadge: '20% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 1420,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'veg_lemon',
    name: 'Juicy Yellow Nimbu (Lemon)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '4 pcs',
    sellingPrice: 16,
    mrp: 20,
    discountBadge: '20% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 2980,
    stock: 65,
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=400&q=80',
  },
];

// 🥛 Dairy, Bread & Eggs Essentials
export const DAIRY_BREAD_EGGS_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'dairy_milk_gold',
    name: 'Amul Gold Full Cream Fresh Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 35,
    mrp: 35,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 8430,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_paneer',
    name: 'Amul Fresh Malai Paneer',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '200 g',
    sellingPrice: 72,
    mrp: 80,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 2420,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
    variants: [
      { id: 'v1', label: '200 g', price: 72, mrp: 80, discountPercent: 10, stock: 40, isAvailable: true, isDefault: true },
      { id: 'v2', label: '500 g', price: 175, mrp: 195, discountPercent: 10, stock: 40, isAvailable: true, isDefault: false },
    ],
  },
  {
    id: 'dairy_bread',
    name: 'Harvest Gold 100% Atta Bread',
    brand: 'Harvest Gold',
    category: 'Bakery',
    packSize: '400 g',
    sellingPrice: 45,
    mrp: 50,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 3890,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_butter',
    name: 'Amul Butter - Pasteurized Salted',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '100 g',
    sellingPrice: 56,
    mrp: 60,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 6800,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_eggs_pack',
    name: 'Eggoz Brown Farm Fresh Eggs',
    brand: 'Eggoz',
    category: 'Dairy',
    packSize: '6 pcs',
    sellingPrice: 65,
    mrp: 75,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3410,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_cheese',
    name: 'Amul Processed Cheese Slices',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '10 Slices (200 g)',
    sellingPrice: 135,
    mrp: 145,
    discountBadge: '7% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 4230,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_buttermilk',
    name: 'Amul Probiotic Masti Buttermilk (Chhas)',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '400 ml',
    sellingPrice: 15,
    mrp: 15,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 6520,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dairy_yogurt_epigamia',
    name: 'Epigamia Greek Yogurt Blueberry',
    brand: 'Epigamia',
    category: 'Dairy',
    packSize: '90 g',
    sellingPrice: 45,
    mrp: 50,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 1650,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
  },
];

// ⭐ Bestsellers (Rated 4.5+ loved by 1000+ customers)
export const BESTSELLERS_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'bs_maggi',
    name: 'Maggi 2-Minute Masala Noodles Pack',
    brand: 'Maggi',
    category: 'Instant Food',
    packSize: '4 x 70 g',
    sellingPrice: 46,
    mrp: 56,
    discountBadge: '18% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 7850,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_amul_milk',
    name: 'Amul Taaza Toned Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 27,
    mrp: 28,
    discountBadge: '4% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 9200,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_oil',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    brand: 'Fortune',
    category: 'Cooking Essentials',
    packSize: '1 L',
    sellingPrice: 65,
    mrp: 78,
    discountBadge: '17% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 1450,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_silk',
    name: 'Cadbury Dairy Milk Silk Chocolate',
    brand: 'Cadbury',
    category: 'Chocolates',
    packSize: '60 g',
    sellingPrice: 75,
    mrp: 90,
    discountBadge: '17% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 4620,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_lays',
    name: "Lay's Spanish Tomato Tango Chips",
    brand: "Lay's",
    category: 'Snacks',
    packSize: '50 g',
    sellingPrice: 18,
    mrp: 20,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 5210,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_bhujia',
    name: "Haldiram's Nagpur Aloo Bhujia",
    brand: "Haldiram's",
    category: 'Snacks',
    packSize: '200 g',
    sellingPrice: 48,
    mrp: 55,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 2980,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_coke',
    name: 'Coca-Cola Refreshing Chilled Can',
    brand: 'Coca-Cola',
    category: 'Cold Drinks',
    packSize: '300 ml',
    sellingPrice: 38,
    mrp: 40,
    discountBadge: '5% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3410,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bs_salt',
    name: 'Tata Salt Vacuum Evaporated Iodised',
    brand: 'Tata',
    category: 'Staples',
    packSize: '1 kg',
    sellingPrice: 28,
    mrp: 30,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 8900,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
  },
];

// 🆕 New Arrivals
export const NEW_ARRIVALS_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'new_juice',
    name: 'Raw Pressery Cold Pressed Valencia Orange Juice',
    brand: 'Raw Pressery',
    category: 'Cold Drinks',
    packSize: '250 ml',
    sellingPrice: 79,
    mrp: 99,
    discountBadge: '20% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 420,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'new_dip',
    name: 'Wingreens Farms Jalapeno Cheese Dip',
    brand: 'Wingreens',
    category: 'Snacks',
    packSize: '150 g',
    sellingPrice: 85,
    mrp: 99,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 310,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'new_coconut',
    name: 'Paper Boat 100% Tender Coconut Water',
    brand: 'Paper Boat',
    category: 'Cold Drinks',
    packSize: '200 ml',
    sellingPrice: 48,
    mrp: 50,
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 890,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'new_bar',
    name: 'Yoga Bar Dark Chocolate Fudge Protein Bar',
    brand: 'Yoga Bar',
    category: 'Snacks',
    packSize: '50 g',
    sellingPrice: 65,
    mrp: 80,
    discountBadge: '18% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 540,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1622484216850-2580798d7d96?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'new_tea',
    name: 'Organic India Tulsi Green Tea Classic',
    brand: 'Organic India',
    category: 'Beverages',
    packSize: '25 Tea Bags',
    sellingPrice: 175,
    mrp: 195,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 710,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'new_kombucha',
    name: 'Atmosphere Pomegranate Kombucha',
    brand: 'Atmosphere',
    category: 'Cold Drinks',
    packSize: '220 ml',
    sellingPrice: 120,
    mrp: 140,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.5,
    reviewCount: 220,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  },
];

// 💰 Under ₹50 Everyday Budget Essentials
export const UNDER_50_PRODUCTS: BlinkitProduct[] = [
  {
    id: 'u50_tomato',
    name: 'Fresh Tomato',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '500 g',
    sellingPrice: 13,
    mrp: 15,
    discountBadge: '13% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3120,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_maggi',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Maggi',
    category: 'Instant Food',
    packSize: '70 g',
    sellingPrice: 12,
    mrp: 14,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 7850,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_buttermilk',
    name: 'Amul Masti Spiced Buttermilk (Chhas)',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '400 ml',
    sellingPrice: 15,
    mrp: 15,
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 6520,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_coriander',
    name: 'Fresh Coriander (Dhaniya)',
    brand: 'Farm Fresh',
    category: 'Vegetables',
    packSize: '100 g',
    sellingPrice: 14,
    mrp: 18,
    discountBadge: '22% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 2310,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_milk',
    name: 'Amul Taaza Toned Milk',
    brand: 'Amul',
    category: 'Dairy',
    packSize: '500 ml',
    sellingPrice: 27,
    mrp: 28,
    discountBadge: '4% OFF',
    deliveryMinutes: 9,
    rating: 4.9,
    reviewCount: 9200,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_chips',
    name: "Lay's Magic Masala Chips",
    brand: "Lay's",
    category: 'Snacks',
    packSize: '50 g',
    sellingPrice: 18,
    mrp: 20,
    discountBadge: '10% OFF',
    deliveryMinutes: 9,
    rating: 4.7,
    reviewCount: 3890,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_banana',
    name: 'Banana Golden Ripe',
    brand: 'Farm Fresh',
    category: 'Fruits',
    packSize: '1 kg',
    sellingPrice: 28,
    mrp: 32,
    discountBadge: '14% OFF',
    deliveryMinutes: 9,
    rating: 4.6,
    reviewCount: 1840,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'u50_coke',
    name: 'Coca-Cola Refreshing Can',
    brand: 'Coca-Cola',
    category: 'Cold Drinks',
    packSize: '300 ml',
    sellingPrice: 38,
    mrp: 40,
    discountBadge: '5% OFF',
    deliveryMinutes: 9,
    rating: 4.8,
    reviewCount: 3410,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  },
];




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
