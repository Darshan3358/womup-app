import { LocalVendor, LocalTransaction, CoinLedgerItem } from '../types/localShop.types';
import { api } from '../../services/api';

export interface BackendCategoryItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  bgColor?: string;
  iconColor?: string;
  sortOrder?: number;
}

export const LocalShopApi = {
  // 1. Fetch nearby shops from live MongoDB vendors collection
  async getNearbyShops(
    category?: string,
    query?: string,
    lat?: number,
    lng?: number,
  ): Promise<LocalVendor[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All' && category !== 'More') {
        params.append('category', category);
      }
      if (query && query.trim() !== '') {
        params.append('query', query.trim());
      }
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lng !== undefined) params.append('lng', lng.toString());

      const url = `/local-shops${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await api.get<any>(url);

      if (res.success && res.data?.vendors && Array.isArray(res.data.vendors)) {
        return res.data.vendors;
      }
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[LocalShopApi] Failed to fetch live nearby shops:', err);
    }

    return [];
  },

  // 2. Fetch live categories from backend
  async getCategories(): Promise<BackendCategoryItem[]> {
    try {
      const res = await api.get<any>('/local-shops/categories');
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[LocalShopApi] Failed to fetch categories:', err);
    }

    return [
      { name: 'Vegetables', slug: 'vegetables', icon: 'carrot', bgColor: '#D1FAE5', iconColor: '#10B981' },
      { name: 'Grocery', slug: 'grocery', icon: 'cart-outline', bgColor: '#FCE7F3', iconColor: '#EC4899' },
      { name: 'Medical', slug: 'medical', icon: 'medical-outline', bgColor: '#E0F2FE', iconColor: '#0284C7' },
      { name: 'Salon', slug: 'salon', icon: 'cut-outline', bgColor: '#FFEDD5', iconColor: '#EA580C' },
      { name: 'Garments', slug: 'garments', icon: 'shirt-outline', bgColor: '#F3E8FF', iconColor: '#9333EA' },
      { name: 'More', slug: 'more', icon: 'grid-outline', bgColor: '#F1F5F9', iconColor: '#64748B' },
    ];
  },

  // 3. Fetch single vendor detail from DB
  async getShopDetail(vendorId: string): Promise<LocalVendor | undefined> {
    try {
      const res = await api.get<any>(`/local-shops/${vendorId}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`[LocalShopApi] Failed to fetch shop detail for ${vendorId}:`, err);
    }
    return undefined;
  },

  // 3b. Fetch vendor by QR vendor code (e.g., VND001)
  async getVendorByCode(vendorCode: string): Promise<LocalVendor | undefined> {
    try {
      const res = await api.get<any>(`/vendor/by-code/${vendorCode}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`[LocalShopApi] Failed to fetch vendor by code ${vendorCode}:`, err);
    }
    return undefined;
  },

  // 3c. Submit Real Counter Collection Request (triggers vendor app modal)
  async submitCollectionRequest(payload: {
    vendorCode: string;
    vendorId?: string;
    amount: number;
    paymentMethod: string;
    coinsUsed?: number;
    walletUsed?: number;
    cashToCollect?: number;
    upiAmount?: number;
    coinsEarned?: number;
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
  }) {
    return api.post<any>('/local-shops/collection-requests', {
      vendorCode: payload.vendorCode,
      vendorId: payload.vendorId,
      billAmount: payload.amount,
      paymentMethod: payload.paymentMethod,
      coinsUsed: payload.coinsUsed,
      walletUsed: payload.walletUsed,
      cashToCollect: payload.cashToCollect,
      upiAmount: payload.upiAmount,
      coinsEarned: payload.coinsEarned,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerId: payload.customerId,
    });
  },


  // 4. Process Offline In-Store Payment (SRS Notebook Flows)
  async payVendorQR(payload: {
    vendorId: string;
    amount: number;
    paymentMethod: 'COIN' | 'WALLET' | 'CASH' | 'UPI';
    coinsUsed?: number;
    customerId?: string;
    customerPhone?: string;
  }): Promise<{
    success: boolean;
    transaction: LocalTransaction;
    coinsEarned: number;
    cashPaid?: number;
    coinsUsed?: number;
    message?: string;
  }> {
    try {
      const res = await api.post<any>('/local-shops/verify-payment', {
        vendorId: payload.vendorId,
        billAmount: payload.amount,
        paymentMethod: payload.paymentMethod,
        coinsUsed: payload.coinsUsed,
        customerId: payload.customerId,
        customerPhone: payload.customerPhone,
      });

      if (res.success && res.data) {
        const tx = res.data.transaction;
        const formattedTx: LocalTransaction = {
          id: tx.id || `tx_loc_${Date.now()}`,
          orderNumber: tx.orderNumber,
          vendorId: tx.vendorId,
          vendorName: tx.vendorName,
          vendorCategory: tx.vendorCategory || 'Local Vendor',
          amount: tx.billAmount,
          coinsEarned: res.data.coinsEarned || 0,
          paymentMethod: payload.paymentMethod,
          status: 'SUCCESS',
          date: 'Just now',
          qrScanned: true,
        };

        return {
          success: true,
          transaction: formattedTx,
          coinsEarned: res.data.coinsEarned || 0,
          cashPaid: res.data.cashPaid,
          coinsUsed: res.data.coinsUsed,
          message: res.data.message || 'Payment verified successfully',
        };
      }
    } catch (err: any) {
      console.error('[LocalShopApi] QR payment error:', err);
      return {
        success: false,
        coinsEarned: 0,
        transaction: {
          id: `tx_err_${Date.now()}`,
          orderNumber: '#WML-ERR',
          vendorId: payload.vendorId,
          vendorName: 'Unknown Vendor',
          vendorCategory: 'Local Vendor',
          amount: payload.amount,
          coinsEarned: 0,
          paymentMethod: payload.paymentMethod,
          status: 'FAILED',
          date: 'Just now',
        },
        message: err?.message || 'Payment processing failed',
      };
    }

    return {
      success: false,
      coinsEarned: 0,
      transaction: {
        id: `tx_err_${Date.now()}`,
        orderNumber: '#WML-ERR',
        vendorId: payload.vendorId,
        vendorName: 'Unknown Vendor',
        vendorCategory: 'Local Vendor',
        amount: payload.amount,
        coinsEarned: 0,
        paymentMethod: payload.paymentMethod,
        status: 'FAILED',
        date: 'Just now',
      },
      message: 'Failed to record transaction',
    };
  },

  // 5. Get Coin Balance from /users/me
  async getCoinBalance(): Promise<number> {
    try {
      const res = await api.get<any>('/users/me');
      if (res.success && res.data) {
        return res.data.shoppingCoins ?? 2000;
      }
    } catch {}
    return 2000;
  },

  // 5b. Get Detailed Wallet Balances (Shopping Coins + App Download Income)
  async getCustomerWalletData(): Promise<{
    shoppingCoins: number;
    appDownloadIncome: number;
    availableIncome: number;
  }> {
    try {
      const res = await api.get<any>('/users/wallet-summary');
      if (res.success && res.data) {
        return {
          shoppingCoins: res.data.shoppingCoins ?? 2000,
          appDownloadIncome: res.data.appDownloadIncome ?? 0,
          availableIncome: res.data.availableIncome ?? 0,
        };
      }
    } catch {}
    return {
      shoppingCoins: 2000,
      appDownloadIncome: 500,
      availableIncome: 500,
    };
  },

  // 6. Get Past Local Orders
  async getLocalOrders(): Promise<LocalTransaction[]> {
    return [];
  },

  // 7. Get Coin Ledger History
  async getCoinHistory(): Promise<CoinLedgerItem[]> {
    return [];
  },
};
