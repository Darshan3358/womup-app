export type RiderAccountStatus =
  | 'REGISTERED'
  | 'KYC_PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'REJECTED'
  | 'PENDING'
  | 'PENDING_VERIFICATION' // backwards-compatibility alias
  | 'SUSPENDED'; // backwards-compatibility alias

export type AuthScreenState =
  | 'SPLASH'
  | 'LOGIN'
  | 'OTP'
  | 'REGISTER'
  | 'KYC'
  | 'APPROVAL_PENDING'
  | 'AUTHENTICATED';

export type DutyStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';

export type DeliveryStepStatus =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'GOING_TO_STORE'
  | 'ARRIVED_AT_STORE'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_AT_CUSTOMER'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type DocumentType =
  | 'DRIVING_LICENSE'
  | 'VEHICLE_RC'
  | 'INSURANCE'
  | 'AADHAAR_PAN'
  | 'PROFILE_PHOTO';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface RiderDocument {
  id: string;
  type: DocumentType;
  title: string;
  documentNumberMasked?: string;
  fileUrl?: string;
  status: DocumentStatus;
  issuedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
}

export interface DeliveryOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface DeliveryRequest {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeCoordinates: { latitude: number; longitude: number };
  customerName: string;
  customerAddress: string;
  customerCoordinates: { latitude: number; longitude: number };
  customerPhone: string;
  deliveryInstructions?: string;
  distanceKm: number;
  etaMinutes: number;
  itemCount: number;
  items: DeliveryOrderItem[];
  hasPrintJob?: boolean;
  orderAmount: number;
  paymentMethod: 'ONLINE_PAID' | 'COD' | 'ONLINE' | 'WALLET' | 'UPI' | 'CARD' | string;
  paymentStatus: 'PAID' | 'PENDING_COD' | 'PENDING' | 'COMPLETED' | string;
  payoutAmount: number;
  tip?: number;
  offeredAt: string;
  storePhone?: string;
  acceptedAt?: string;
  assignedAt?: string;
  createdAt?: string;
  expiresInSeconds: number;
  stepStatus: DeliveryStepStatus;
  deliveryOtp?: string;
  stageIndex?: number;
  statusHistory?: Array<{
    stage?: string;
    status?: string;
    timestamp?: string;
    completed?: boolean;
    notes?: string;
  }>;
  isFromOwnHub?: boolean;
  distanceToStoreKm?: number;
  ratePerKm?: number;
  rateSource?: 'AREA' | 'CITY' | 'GLOBAL' | string;
  basePayout?: number;
  bagBarcode?: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  hubId?: string | null;
  hubName?: string | null;
  city: string;
  vehicleType: 'BIKE' | 'EV_SCOOTER' | 'BICYCLE';
  vehicleNumber: string;
  rating: number;
  completedDeliveries: number;
  status: RiderAccountStatus;
  isOnline: boolean;
  suspensionReason?: string;
}

export interface SettlementSummary {
  todayCompleted: number;
  basePayout: number;
  incentives: number;
  tips: number;
  adjustments: number;
  netPayableToday: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingTransfer: number;
  incentivesEarned?: number;
  tipsCollected?: number;
}

export interface SettlementHistoryItem {
  id: string;
  date: string;
  orderNumber: string;
  baseAmount: number;
  tip: number;
  bonus: number;
  total: number;
  status: 'SETTLED' | 'PENDING' | 'PROCESSING';
}

export interface PerformanceMetrics {
  acceptanceRate: number; // e.g. 94%
  completionRate: number; // e.g. 99%
  avgDeliveryMinutes: number; // e.g. 11.8
  customerRating: number; // e.g. 4.88
  totalDeliveries: number;
  onTimeRate: number;
  cancelledDeliveries: number;
}

export interface DutyShift {
  id: string;
  date: string;
  onlineTime: string;
  offlineTime: string;
  totalActiveMinutes: number;
  deliveriesCompleted: number;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface RiderBankAccount {
  bankName: string;
  accountNumberMasked: string;
  accountNumberFull?: string;
  ifscCode: string;
  accountHolderName: string;
  upiId?: string;
  isVerified: boolean;
}

export interface RiderVehicle {
  vehicleType: 'EV_SCOOTER' | 'BIKE' | 'BICYCLE';
  vehicleNumber: string;
  model: string;
  insurancePolicyMasked: string;
  batteryPercentage?: number;
  isInspected: boolean;
}

export interface RiderNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'SYSTEM' | 'PAYOUT' | 'SAFETY';
  timestamp: string;
  isRead: boolean;
}

export interface RiderAppSettings {
  orderAlertRingtone: boolean;
  highAccuracyGps: boolean;
  defaultNavApp: 'Google Maps' | 'Apple Maps' | 'Waze';
  autoAcceptOrders: boolean;
  vibrateOnDispatch: boolean;
}

export type RiderTabKey = 'Home' | 'Deliveries' | 'Earnings' | 'Help' | 'More';

export type RiderSubScreenKey =
  | 'None'
  | 'DeliveryDetails'
  | 'BatchDelivery'
  | 'Performance'
  | 'DutyHistory'
  | 'Notifications'
  | 'Support'
  | 'Profile'
  | 'Documents'
  | 'VehicleDetails'
  | 'BankSettlement'
  | 'Settings';


