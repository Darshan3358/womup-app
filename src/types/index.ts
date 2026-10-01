import { ImageSourcePropType } from 'react-native';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PICKING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED'
  | 'REFUNDED';

/** One weight/size option for a product, with area-specific pricing */
export interface ProductVariantPriced {
  id: string;
  label: string;          // "500 g" | "1 kg" | "500 ml" | "6 pcs"
  price: number;          // area-specific selling price
  mrp: number;
  discountPercent: number;
  stock: number;
  isAvailable: boolean;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  categorySlug?: string;
  categoryName?: string;
  subCategoryId?: string;
  image?: ImageSourcePropType;
  imageUrl?: string;
  quantityLabel: string;  // display label for the currently selected variant
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  shoppingCoins: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isPopular?: boolean;
  isDeal?: boolean;
  deliveryMinutes: number;
  description?: string;
  specifications?: Record<string, string>;
  variants?: ProductVariantPriced[];  // ← populated from MongoDB via area pricing
}


export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  itemCount: number;
  image?: ImageSourcePropType;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  iconName: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other' | 'Current';
  fullName: string;
  phoneNumber: string;
  houseFlat: string;
  areaLandmark: string;
  city: string;
  cityId?: string;
  areaId?: string;
  pincode: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: ImageSourcePropType;
  imageUrl?: string;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shoppingCoinsUsed: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: Address;
  deliverySlot: string;
  paymentMethod: string;
  estimatedArrival?: string;
  deliveryOtp?: string;
  deliveryPartner?: {
    id?: string;
    name: string;
    phone: string;
    vehicleNumber?: string;
    avatar?: string;
    rating?: number;
  };
  deliveryPartnerId?: {
    _id?: string;
    fullName?: string;
    phoneNumber?: string;
    vehicleNumber?: string;
    rating?: number;
  };
}

export interface UserProfile {
  fullName: string;
  phoneNumber: string;
  email: string;
  referralCode?: string;
  shoppingCoins: number;
  savedAddresses: Address[];
  birthday?: string; // "07 August 2005" — persisted in MongoDB via PATCH /users/me
  preferredCityId?: string;
  preferredCityName?: string;
}


export type PaymentType =
  | 'UPI'
  | 'CARD'
  | 'WALLET'
  | 'NET_BANKING'
  | 'COD';

export interface FilterSortState {
  sortBy: 'popularity' | 'price_asc' | 'price_desc' | 'newest' | 'discount';
  category?: string;
  brand?: string;
  priceRange: [number, number];
  rating?: number;
  inStockOnly: boolean;
  discountRange?: number;
}

export type ScreenId =
  | 'C01_Splash'
  | 'C02_Onboarding1'
  | 'C03_Onboarding2'
  | 'C04_Onboarding3'
  | 'C05_Onboarding4'
  | 'C06_MobileNumber'
  | 'C07_OtpVerification'
  | 'C08_CreateAccount'
  | 'C09_ReferralCode'
  | 'C10_LocationPermission'
  | 'C11_AddAddress'
  | 'C12_Home'
  | 'C13_Category'
  | 'C14_SubCategory'
  | 'C15_ProductListing'
  | 'C16_ProductDetails'
  | 'C17_Search'
  | 'C18_FilterSort'
  | 'C19_Cart'
  | 'C20_Checkout'
  | 'C21_ApplyShoppingCoin'
  | 'C22_Payment'
  | 'C23_OrderPlaced'
  | 'C24_OrderTracking'
  | 'C25_OrderHistory'
  | 'C26_Account'
  | 'Blinkit_Home'
  | 'Blinkit_Categories'
  | 'Blinkit_OrderAgain'
  | 'Blinkit_Print'
  | 'Blinkit_Profile'
  | 'Blinkit_Money'
  | 'Blinkit_ProductDetail'
  | 'Blinkit_Cart'
  | 'Blinkit_Checkout'
  | 'Blinkit_OrderSuccess'
  | 'Blinkit_Wishlist';

export interface BlinkitProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
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
  variants?: ProductVariantPriced[];  // ← DB-driven weight/size picker options
}

export interface BlinkitCategoryCard {
  id: string;
  title: string;
  countBadge: string;
  imageUrls: [string, string, string, string];
  itemTypes?: [string, string, string, string];
}

