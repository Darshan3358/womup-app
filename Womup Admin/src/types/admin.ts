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

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  bgColor?: string;
  itemCount?: number;
  sortOrder?: number;
  isActive: boolean;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Zone {
  id: string;
  name: string;
  code?: string;
  darkStore: string;
  address?: string;
  city?: string;
  isActive?: boolean;
  activeOrders: number;
  gmvSharePercent: number;
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
}

export interface DarkStoreItem {
  id: string;
  name: string;
  code: string;
  loginId?: string;
  address?: string;
  city?: string;
  pincode?: string;
  areaId?: string;
  areaName?: string;
  isActive?: boolean;
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

