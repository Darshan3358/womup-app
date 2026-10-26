export type VendorTab =
  | 'Dashboard'
  | 'QRCode'
  | 'Transactions'
  | 'Wallet'
  | 'Analytics'
  | 'Settings';

export interface VendorProfile {
  id: string;
  vendorCode: string;
  storeName: string;
  ownerName: string;
  ownerPhone: string;
  categoryName: string;
  address: string;
  city: string;
  pincode: string;
  shoppingCoinPercent: number;
  platformCommissionPercent: number;
  openingTime: string;
  closingTime: string;
  isOpenNow: boolean;
  isOnline?: boolean;
  rating: number;
  totalReviews: number;
  totalTransactions: number;
  monthlyRevenue: number;
  upiId: string;
  qrCodeUrl?: string;
  walletBalance: number;
  pendingBalance: number;
  isVerified: boolean;
  isActive: boolean;

  // ── tbl_vendor SQL Fields ──
  vendorStatus?: number; // 1: Pending, 2: Active, 3: Rejected
  vendorRejectReason?: string;
  isBlocked?: number;
  isSuspended?: number;
  blockReason?: string;
  vendorFirmName?: string;
  vendorOwnerName?: string;
  vendorBalance?: number;
  vendorAdminBalance?: number;
  vendorPayableToAdmin?: number;
  businessType?: string;
  vendorGstNo?: string;
  vendorMobile?: string;
  vendorAlternateMobile?: string;
  vendorEmail?: string;
  vendorAadharNo?: string;
  businessAddress?: string;
  businessLandmark?: string;
  businessPincode?: string;
  talukaId?: string;
  districtId?: string;
  stateId?: string;
  countryId?: string;
  bankName?: string;
  bankBranch?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankAccount?: {
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  cancelledChequeImage?: string;
  vendorAadharFrontImage?: string;
  vendorAadharBackImage?: string;
  gstCertificateImage?: string;
  tradeLicenseImage?: string;
  panCardImage?: string;
  businessCardImage?: string;
  shopPhotoImage?: string;
  ownerPhotoImage?: string;
  latitude?: number;
  longitude?: number;
  vendorLat?: number;
  vendorLong?: number;
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
}

export interface CollectionRequest {
  id: string;
  vendorId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  billAmount: number;
  coinsUsed: number;
  walletUsed: number;
  cashToCollect: number;
  upiAmount: number;
  coinsEarned: number;
  platformCommission: number;
  vendorPayout: number;
  paymentMethod: 'COINS' | 'COIN' | 'WALLET' | 'CASH' | 'UPI';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  requestedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface VendorTransaction {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  billAmount: number;
  coinsUsed: number;
  cashPaid: number;
  coinsEarned: number;
  vendorPayout: number;
  platformCommission: number;
  paymentMethod: 'COINS' | 'WALLET' | 'CASH' | 'UPI';
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
  date: string;
  time?: string;
}

export interface SettlementRecord {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  utrNumber: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
  date: string;
}

export interface VendorStats {
  todayCollection: number;
  todayGrowthPercent: number;
  orderCount: number;
  coinsSettled: number;
  cashCollected: number;
  pendingCount: number;
}
