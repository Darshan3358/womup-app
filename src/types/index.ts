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

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  subCategoryId?: string;
  image?: ImageSourcePropType;
  imageUrl?: string;
  quantityLabel: string;
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
  type: 'Home' | 'Work' | 'Other';
  fullName: string;
  phoneNumber: string;
  houseFlat: string;
  areaLandmark: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: ImageSourcePropType;
}

export interface Order {
  id: string;
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
  deliveryPartner?: {
    name: string;
    phone: string;
    avatar?: string;
  };
}

export interface UserProfile {
  fullName: string;
  phoneNumber: string;
  email: string;
  referralCode?: string;
  shoppingCoins: number;
  savedAddresses: Address[];
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
  | 'C26_Account';
