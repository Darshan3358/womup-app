export interface Category {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  imageUrl?: string;
  bgColor?: string;
  bgPastel?: string;
  accentColor?: string;
  itemCount?: number;
  productCount?: number;
  subCategoryCount?: number;
  subCategories?: any[];
  sortOrder?: number;
  description?: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  stock?: number;
  isAvailable?: boolean;
  isDefault?: boolean;
  size?: string;
  oldPrice?: number;
}

export interface Product {
  id: string;
  _id?: string;
  slug?: string;
  name: string;
  brand: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  subCategoryId?: string;
  price: number;
  sellingPrice?: number;
  oldPrice?: number;
  mrp?: number;
  discount?: number;
  discountPercent?: number;
  unit: string;
  quantityLabel?: string;
  image: string;
  imageUrl?: string;
  gallery?: string[];
  images?: string[];
  description: string;
  specifications?: Record<string, string>;
  nutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock?: number;
  stockCount?: number;
  isPopular?: boolean;
  isDeal?: boolean;
  isVegetarian?: boolean;
  deliveryMinutes?: number;
  shoppingCoins?: number;
  variants?: ProductVariant[];
  badge?: string;
  shelfLocation?: string;
  barcode?: string;
  storeId?: string;
  storeName?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  storeName?: string;
}

export interface Deal {
  id: string;
  title: string;
  discountText: string;
  categorySlug: string;
  image: string;
  badge: string;
  gradient: string;
}

export interface HeroBanner {
  id: string;
  _id?: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  placement?: string;
  targetType?: string;
  targetId?: string;
  sortOrder?: number;
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  viewAllFilter?: string;
  categoryName?: string;
  products: Product[];
}

export interface ResolvedLocation {
  serviceable: boolean;
  areaId: string;
  areaName: string;
  storeId?: string;
  storeName?: string;
  storeCode?: string;
  city: string;
  deliveryMinutes: number;
  distanceKm?: number;
  message?: string;
}

export interface DarkStore {
  id: string;
  _id?: string;
  name: string;
  code: string;
  city: string;
  areaId: string;
  deliveryRadiusKm: number;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit?: string;
  quantityLabel?: string;
}

export interface DeliveryPartner {
  id?: string;
  _id?: string;
  name: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  vehicleNumber?: string;
  rating?: number;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  coinDiscount: number;
  couponDiscount: number;
  total: number;
  totalAmount?: number;
  status: 'PLACED' | 'ACCEPTED' | 'PACKING' | 'PACKED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryPin: string;
  deliveryOtp?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | any;
  deliverySlot: string;
  paymentMethod: string;
  paymentStatus?: string;
  storeName: string;
  createdAt: string;
  eta: string;
  estimatedArrival?: string;
  deliveryPartner?: DeliveryPartner;
  deliveryPartnerId?: any;
  cancellationReason?: string;
  priceAdjustments?: any[];
}

export interface CoinTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'EARNED' | 'REDEEMED';
  date: string;
  storeName?: string;
}

export interface UserAddress {
  id: string;
  label: string;
  houseFlat?: string;
  street?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  address: string;
  isDefault: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  coinBalance: number;
  city: string;
  area: string;
  addresses: UserAddress[];
}
