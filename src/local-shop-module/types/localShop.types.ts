export interface LocalVendor {
  id: string;
  name: string;
  storeName?: string;
  category: string;
  coinPercentage: number;
  shoppingCoinPercent?: number;
  badgeColor?: string;
  buttonColor?: string;
  pillBgColor?: string;
  verified?: boolean;
  address: string;
  phone?: string;
  timings?: string;
  distanceKm: number;
  rating: number;
  reviewCount?: number;
  image: string;
  imageUrl?: string;
  products?: LocalProduct[];
}

export interface LocalProduct {
  id: string;
  name: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  category: string;
}

export interface LocalCartItem {
  product: LocalProduct;
  quantity: number;
  vendorId: string;
  vendorName: string;
  coinPercentage: number;
}

export interface LocalTransaction {
  id: string;
  orderNumber: string;
  orderId?: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  amount: number;
  coinsEarned: number;
  coinsUsed?: number;
  cashPaid?: number;
  paymentMethod: 'UPI' | 'WALLET' | 'CARD' | 'CASH' | 'COIN';
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'VERIFIED' | 'COMPLETED';
  date: string;
  createdAt?: string;
  qrScanned?: boolean;
}

export interface CoinLedgerItem {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED';
  coins: number;
  vendorName: string;
  description: string;
  date: string;
  balanceAfter: number;
}
