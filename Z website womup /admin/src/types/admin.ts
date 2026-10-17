export type CustomerStatus = 'Active' | 'Blocked';
export type CustomerType = 'Individual' | 'Corporate';

export interface CustomerAddress {
  id?: string;
  label?: string;
  address?: string;
  zone?: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email: string;
  type?: CustomerType;
  zoneId?: string;
  zoneName?: string;
  address?: string;
  addresses?: CustomerAddress[];
  status?: CustomerStatus;
  spend?: number;
  totalOrders?: number;
  avatar?: string;
  walletBalance?: number;
  shoppingCoinBalance?: number;
  kycStatus?: 'Verified' | 'Pending' | 'Rejected';
  createdAt?: string;
  firstName?: string;
  surname?: string;
  fatherHusbandName?: string;
  gender?: string;
  birthdate?: string;
  birthDate?: string;
  landmark?: string;
  village?: string;
  pincode?: string;
  sponsorId?: string;
  sponsorName?: string;
  referralCode?: string;
  parentReferralCode?: string;
  userCode?: string;
  myReferralCode?: string;
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  paymentStatus?: number;
  isBlocked?: number;
  isSuspended?: number;
  adminNotes?: string;
  aadhaarNumber?: string;
  aadhaarFrontImage?: string;
  customer_image_aadhar_front?: string;
  aadhaarBackImage?: string;
  customer_image_aadhar_back?: string;
  kycSubmittedAt?: string;
  kycRejectReason?: string;
}

export interface DeliveryPartnerItem {
  id: string;
  _id?: string;
  partnerCode?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  hubName?: string;
  hubId?: string;
  city?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  verificationStatus?: string;
  isOnline?: boolean;
  rating?: number;
  totalDeliveries?: number;
  completedDeliveries?: number;
  activeDeliveries?: number;
  acceptanceRate?: number;
  completionRate?: number;
  avgDeliveryMinutes?: number;
  joinedDate?: string;
  documents?: {
    profilePhoto?: string | null;
    profilePhotoUrl?: string | null;
    dlNumber?: string | null;
    dlFront?: string | null;
    dlFrontUrl?: string | null;
    dlBack?: string | null;
    dlBackUrl?: string | null;
    rcNumber?: string | null;
    rcFront?: string | null;
    rcFrontUrl?: string | null;
    rcBack?: string | null;
    rcBackUrl?: string | null;
    aadhaarNumber?: string | null;
    aadhaarFront?: string | null;
    aadhaarFrontUrl?: string | null;
    aadhaarBack?: string | null;
    aadhaarBackUrl?: string | null;
    insuranceNumber?: string | null;
    insurance?: string | null;
    insuranceUrl?: string | null;
  };
  bankAccount?: {
    bankName?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    branchName?: string | null;
    upiId?: string | null;
    isVerified?: boolean;
  };
  bankDetails?: {
    bankName?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    branchName?: string | null;
    upiId?: string | null;
    isVerified?: boolean;
  };
}


export interface SubCategoryItem {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
  productCount?: number;
}

export interface CategoryItem {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  slug: string;
  icon?: string;
  iconUrl?: string;
  image?: string;
  imageUrl?: string;
  bgColor?: string;
  description?: string;
  itemCount?: number;
  productCount?: number;
  subCategoryCount?: number;
  subCategories?: SubCategoryItem[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductItem {
  id: string;
  _id?: string;
  name: string;
  category?: string;
  categoryId?: string;
  basePrice?: number;
  sellingPrice: number;
  mrp: number;
  discountPercent?: number;
  stock: number;
  availableStock?: number;
  sku?: string;
  imageUrl?: string;
  image?: string;
  quantityLabel?: string;
  unit?: string;
  brand?: string;
  shelfLocation?: string;
  description?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  variants?: ProductVariantItem[];
  createdAt?: string;
}

export interface ProductVariantItem {
  id: string;
  _id?: string;
  productId: string;
  sku?: string;
  weightOrVolume?: string;
  mrp?: number;
  sellingPrice: number;
  discountPercent?: number;
  stock?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface AreaPricingRecord {
  id: string;
  _id?: string;
  productId: string;
  variantId: string;
  areaId: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  stock?: number;
  isAvailable?: boolean;
}

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  userId?: string;
  storeId?: string;
  storeName?: string;
  items: OrderItem[];
  totalAmount: number;
  finalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'COD' | 'FAILED';
  status: 'PLACED' | 'PACKING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress?: string;
  deliveryPartnerId?: any;
  deliveryPartnerName?: string;
  riderName?: string;
  riderPhone?: string;
  riderId?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface DarkStoreItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  loginId?: string;
  plainPassword?: string;
  address: string;
  phone?: string;
  city?: string;
  cityName?: string;
  cityId?: string | null;
  pincode?: string;
  areaId?: string | null;
  areaName?: string | null;
  isActive?: boolean;
  isOnShift?: boolean;
  isOnline?: boolean;
  staffOnShift?: number;
  staffTotal?: number;
  orderCount?: number;
  pendingOrders?: number;
  riderCount?: number;
  serviceRadiusKm?: number;
  estimatedDeliveryMinutes?: number;
  coordinates?: [number, number];
  openingTime?: string;
  closingTime?: string;
  createdAt?: string;
}

export interface AreaItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  cityName?: string;
  cityId?: string;
  pincodes?: string[];
  radiusKm?: number;
  defaultDeliveryMinutes?: number;
  maxStores?: number;
  activeStoreCount?: number;
  isActive?: boolean;
  surgeMultiplier?: number;
  baseDeliveryFee?: number;
}

export interface CityItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  state?: string;
  isActive?: boolean;
  areaCount?: number;
  storeCount?: number;
}

export interface PayoutRateItem {
  id: string;
  vehicleType: string;
  baseFare: number;
  perKmRate: number;
  peakHourBonus: number;
  rainSurgeBonus: number;
}

export interface CoinLedgerItem {
  id: string;
  userId: string;
  userName?: string;
  type: 'CREDIT' | 'DEBIT' | 'BONUS' | 'SPEND';
  coins: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface MarketingCampaign {
  id: string;
  _id?: string;
  name?: string;
  title: string;
  targetAudience: string;
  subject?: string;
  discountCode?: string;
  discountPercent?: number;
  scheduledAt?: string;
  isEnabled?: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | string;
  startDate?: string;
  endDate?: string;
}

export interface VendorAdminItem {
  id: string;
  _id?: string;
  vendorCode: string;
  storeName: string;
  ownerName: string;
  ownerPhone: string;
  categoryId?: string;
  categoryName: string;
  address: string;
  city: string;
  cityId?: string;
  pincode: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  shoppingCoinPercent: number;
  minCoinPercent?: number;
  maxCoinPercent?: number;
  platformCommissionPercent?: number;
  openingTime?: string;
  closingTime?: string;
  isOpenNow?: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  rating?: number;
  totalReviews?: number;
  totalTransactions?: number;
  monthlyRevenue?: number;
  upiId?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  isVerified?: boolean;
  bankAccount?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorCategoryItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  bgColor?: string;
  sortOrder?: number;
  isActive?: boolean;
}
