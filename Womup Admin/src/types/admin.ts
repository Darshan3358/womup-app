export type CustomerStatus = 'Active' | 'Blocked';
export type CustomerType = 'Individual' | 'Corporate';

export interface CustomerAddress {
  id: string;
  label: string; // e.g. 'Home', 'Office'
  address: string;
  zone: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  zoneId: string;
  zoneName: string;
  address: string;
  addresses: CustomerAddress[];
  status: CustomerStatus;
  spend: number;
  totalOrders: number;
  avatar: string;
  walletBalance: number;
  shoppingCoinBalance: number;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  createdAt: string;
}

export interface DeliveryPartnerItem {
  id: string;
  partnerCode: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  hubName: string;
  hubId?: string;
  city: string;
  vehicleType: string;
  vehicleNumber: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  verificationStatus: string;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  acceptanceRate: number;
  completionRate: number;
  avgDeliveryMinutes: number;
  joinedDate: string;
}

export interface SubCategoryItem {
  id: string;
  _id?: string;
  categoryId?: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  defaultShelfAisle?: string;
  sortOrder?: number;
  isActive: boolean;
  productCount?: number;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  slug: string;
  icon?: string;
  iconUrl?: string;
  bgColor?: string;
  description?: string;
  itemCount?: number;
  productCount?: number;
  subCategoryCount?: number;
  subCategories?: SubCategoryItem[];
  sortOrder?: number;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PricingCategory = string;

export interface PriceHistoryEntry {
  id: string;
  oldBasePrice: number;
  newBasePrice: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  oldMrp: number;
  newMrp: number;
  changedBy: string;
  changedAt: string;
  zoneName?: string;
  notes?: string;
}

export interface ProductVariantItem {
  id: string;
  productId: string;
  sku: string;
  weightOrVolume: string; // e.g. "250 g", "500 g", "1 kg", "2 kg"
  sellingPrice: number; // default/catalog fallback price
  mrp: number;
  discountPercent?: number;
  stock?: number;
  isDefault?: boolean;
  isActive?: boolean;
  basePrice?: number;
}

export interface AreaPricingRecord {
  id: string;
  productId: string;
  variantId: string;
  areaId: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  stock?: number;
  isAvailable?: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  category: PricingCategory;
  categoryId?: string;
  basePrice: number;
  sellingPrice: number;
  mrp: number;
  stockKg: number;
  image?: string;
  imageUrl?: string;
  images?: string[];
  cloudinaryPublicId?: string;
  brand?: string;
  description?: string;
  isActive?: boolean;
  variants?: ProductVariantItem[];
  priceHistory?: PriceHistoryEntry[];
  shelfLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  state?: string;
  status: 'Active' | 'Inactive';
  sortOrder?: number;
  areaCount?: number;
  storeCount?: number;
  activeStoreCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Zone {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  darkStore: string;
  address?: string;
  city?: string;
  cityName?: string;
  cityId?: string | null;
  isActive?: boolean;
  activeOrders: number;
  gmvSharePercent: number;
  hasActiveStore?: boolean;
  maxStores?: number;
  currentStoreCount?: number;
  availableSlots?: number;
  isFull?: boolean;
  storeRoutingStrategy?: string;
  assignedStores?: Array<{
    id: string;
    _id?: string;
    name: string;
    code: string;
    loginId?: string;
    address?: string;
  }>;
  assignedStore?: {
    id: string;
    _id?: string;
    name: string;
    code: string;
    loginId?: string;
    address?: string;
  } | null;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  defaultDeliveryMinutes?: number;
  pincodes?: string[];
  sortOrder?: number;
}

export type OrderStage =
  | 'Order Placed'
  | 'Payment Confirmed'
  | 'Order Accepted'
  | 'Picker Assigned'
  | 'Picking'
  | 'Picking Completed'
  | 'Packed'
  | 'Rider Assigned'
  | 'Ready for Dispatch'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantityKg: number;
  pricePerKg: number;
  subtotal: number;
}

export interface OrderAuditStep {
  stage: OrderStage;
  timestamp: string;
  actor?: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g. #WMP10234
  storeId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  zoneName: string;
  darkStore: string;
  cityId?: string;
  cityName?: string;
  areaId?: string;
  areaName?: string;
  paymentMethod?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStage;
  pickerId?: string;
  pickerName?: string;
  riderId?: string;
  riderName?: string;
  timeAgo: string;
  timestamp: string;
  timeline: OrderAuditStep[];
  cancelReason?: string;
  isRefunded?: boolean;
  refundAmount?: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  sku?: string;
  name: string;
  packSize?: string;
  category: string;
  darkStoreId: string;
  darkStoreName: string;
  availableKg: number;
  reservedKg: number;
  lowStockThreshold?: number;
  expiryDate?: string;
  status: 'Healthy' | 'Low Stock' | 'Expired';
  shelfLocation?: string;
}

export interface DarkStoreItem {
  id: string;
  name: string;
  code: string;
  loginId?: string;
  address?: string;
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
  lastLoginAt?: string;
  coordinates?: [number, number];
  createdAt?: string;
}

export interface StockAdjustment {
  id: string;
  itemName: string;
  type: 'Spoilage' | 'Shrinkage' | 'Discrepancy';
  quantityKg: number;
  reason: string;
  darkStoreName: string;
  timestamp: string;
  adminName: string;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'Picker' | 'Rider';
  zone: string;
  darkStore: string;
  cityId?: string;
  cityName?: string;
  areaId?: string;
  areaName?: string;
  storeId?: string;
  status: 'On Duty' | 'Off Duty';
  activeOrdersCount: number;
  rating: number;
  avatar: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  scheduledAt: string;
  targetAudience: string;
  isEnabled: boolean;
  subject: string;
  message: string;
  status: 'Scheduled' | 'Completed' | 'Draft';
  sentCount?: number;
}

export interface ShoppingCoinRule {
  id: string;
  ruleName: string;
  minOrderValue: number;
  rewardCoins: number;
  maxUsagePerOrder: number;
  expiryDays: number;
}

export interface CoinLedgerItem {
  id: string;
  userName: string;
  type: 'Earned' | 'Used' | 'Expired' | 'Adjusted';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface PrintOrder {
  id: string;
  printOrderNumber: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  originalFileName?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  fileSize?: string;
  pageCount: number;
  numberOfCopies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperQuality: string;
  binding: string;
  bindingPrice: number;
  pricePerPage: number;
  totalAmount: number;
  deliveryAddress: string;
  deliverySlot?: string;
  status: 'PENDING' | 'PRINTING' | 'PRINTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'PURGED';
  isDocumentPurged?: boolean;
  createdAt: string;
  timestamp?: string;
}

export type PayoutScope = 'GLOBAL' | 'CITY' | 'AREA';

export interface PayoutRateItem {
  id: string;
  _id?: string;
  scope: PayoutScope;
  cityId?: string | null;
  cityName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  ratePerKm: number;
  minimumPayout: number;
  maximumPayout: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayoutStats {
  totalRates: number;
  activeOverridesCount: number;
  globalRatePerKm: number;
  rateRangeText: string;
  minRate: number;
  maxRate: number;
}

export interface StoreWalletItem {
  storeId: string;
  storeName: string;
  city: string;
  area: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalCommission: number;
  commissionRate: number;
  settlementCycle: string;
  lastSettlementAt?: string | null;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    verified: boolean;
  };
  isActive: boolean;
}

export interface RiderWalletItem {
  riderId: string;
  partnerCode: string;
  name: string;
  phone: string;
  balance: number;
  lifetimeEarnings: number;
  codPending: number;
  settlementCycle: string;
  lastSettlementAt?: string | null;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    verified: boolean;
  };
  todaySettlement: {
    basePay: number;
    tip: number;
    incentive: number;
    total: number;
  };
  isActive: boolean;
}

export interface PlatformWalletData {
  todayRevenue: number;
  todayHandling: number;
  todayCommission: number;
  todayOrdersCount: number;
  lifetime: {
    totalRevenue: number;
    handlingFees: number;
    commissions: number;
    netProfit: number;
  };
}

export interface WalletTransactionItem {
  id: string;
  walletType: 'STORE' | 'RIDER' | 'PLATFORM';
  walletId: string;
  orderId?: string;
  orderNumber?: string;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface WalletsSummaryData {
  stores: {
    count: number;
    totalBalance: number;
    totalGross: number;
    totalCommission: number;
  };
  riders: {
    count: number;
    totalBalance: number;
    totalLifetime: number;
    totalTips: number;
    totalBasePay: number;
  };
  platform: {
    handlingFees: number;
    commissions: number;
    totalRevenue: number;
    netProfit: number;
  };
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

