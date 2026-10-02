export type AuthStep = 'SPLASH' | 'LOGIN' | 'REGISTER' | 'OTP' | 'STORE_SELECT' | 'AUTHENTICATED';
export type CurrentTab = 'Dashboard' | 'Incoming' | 'Picking' | 'Ready' | 'Inventory' | 'History' | 'Profile';
export type SubScreen =
  | null
  | 'OrderDetail'
  | 'PickingCore'
  | 'Packing'
  | 'HandoverScan'
  | 'Performance'
  | 'InventoryLogs'
  | 'ShiftHistory'
  | 'AddProduct';

export interface StoreStaffProfile {
  id: string;
  userId: string;
  storeId: string;
  employeeCode: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: 'PICKER' | 'PACKER' | 'STORE_MANAGER';
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  isOnShift: boolean;
  activeOrderId?: string | null;
  totalOrdersPicked: number;
  avgPickTimeSeconds: number;
  accuracy: number;
  status: string;
}

export interface StoreHub {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  pincode: string;
  cityName?: string;
  areaName?: string;
  areaId?: string;
  cityId?: string;
  loginId?: string;
  ownerName?: string;
  phone?: string;
}

export interface PickItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unit: string;
  shelfLocation: string; // e.g. "A2-R3"
  barcode: string;
  status: 'PENDING' | 'PICKED' | 'OUT_OF_STOCK' | 'SUBSTITUTED';
  substituteProductId?: string;
  pickedAt?: string;
  notes?: string;
}

export interface PickList {
  _id?: string;
  orderId: string;
  storeId: string;
  pickerId?: string;
  items: PickItem[];
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startedAt?: string;
  completedAt?: string;
  packedAt?: string;
  readyAt?: string;
  bagBarcode?: string;
  shelfSlot?: string;
  exceptionCount: number;
  pickDurationSeconds: number;
}

export interface StoreOrder {
  orderId: string;
  id?: string;
  _id?: string;
  orderNumber: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  placedAt: string;
  timeAgo: string;
  priority: 'HIGH' | 'NORMAL';
  items: {
    productId?: string;
    name: string;
    quantity: number;
    quantityLabel?: string;
    imageUrl?: string;
    shelfLocation?: string;
    barcode?: string;
    unitPrice?: number;
    subtotal?: number;
  }[];
  bagBarcode?: string;
  shelfSlot?: string;
  assignedRider?: {
    id?: string;
    name: string;
    phone: string;
    vehicleNumber: string;
  } | null;
  deliverySlot?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: any;
  deliveredAt?: string;
  progress?: {
    pickedCount: number;
    totalCount: number;
    percentage: number;
  };
}

export interface InventoryItem {
  productId: string;
  name: string;
  brand?: string;
  imageUrl: string;
  quantityLabel: string;
  sellingPrice: number;
  availableQty: number;
  reservedQty: number;
  threshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  shelfLocation: string;
  sku: string;
}

export interface InventoryLogItem {
  id: string;
  changeType: 'PICK' | 'RESTOCK' | 'DAMAGE' | 'RETURN' | 'ADJUSTMENT';
  delta: number;
  reason: string;
  beforeQty: number;
  afterQty: number;
  productName: string;
  staffName: string;
  timestamp: string;
}

export interface StorePerformance {
  todayPicked: number;
  avgPickTime?: string | null;
  avgPickTimeSeconds: number;
  accuracy: string | number;
  currentStreak: number;
  totalOrdersPicked?: number;
}
