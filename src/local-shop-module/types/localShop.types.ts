export interface LocalVendor {
  id: string;
  name: string;
  category: 'Vegetables' | 'Grocery' | 'Medical' | 'Salon' | 'Garments' | 'More';
  coinPercentage: number;
  badgeColor: string;
  buttonColor: string;
  pillBgColor: string;
  verified: boolean;
  address: string;
  phone: string;
  timings: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  image: string;
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
  paymentMethod: 'UPI' | 'WALLET' | 'CARD' | 'CASH';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
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
