import {
  VendorProfile,
  CollectionRequest,
  VendorTransaction,
  VendorStats,
} from '../types/vendor';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app.onrender.com/api/v1';
};

const API_BASE = getApiBaseUrl();

export interface VendorWalletData {
  availableBalance: number;
  pendingBalance: number;
  pendingCount: number;
  bankAccount: {
    bankName: string;
    accountMasked: string;
    ifsc: string;
    isPrimary: boolean;
  };
  recentSettlements: Array<{
    id: string;
    date: string;
    amount: number;
    utrNumber: string;
    status: string;
  }>;
}

export interface VendorAnalyticsData {
  monthlyGmv: number;
  growthPercent: number;
  orderCount: number;
  paymentSplit: {
    coins: number;
    cash: number;
    wallet: number;
    upi: number;
  };
  topCustomers: Array<{
    name: string;
    phone?: string;
    totalSpent: number;
    visitCount: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

export const VendorApi = {
  // 1. Vendor Login
  async login(loginId: string, password?: string): Promise<{ success: boolean; vendor?: VendorProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, vendor: data.data };
      }
      return { success: false, error: data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend' };
    }
  },

  // 2. Fetch Profile
  async getProfile(vendorCode?: string): Promise<VendorProfile | null> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/auth/me?vendorCode=${vendorCode}` : `${API_BASE}/vendor/auth/me`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch {}
    return null;
  },

  // 3. Fetch Real-time Dashboard Stats
  async getDashboardStats(vendorCode?: string): Promise<{ success: boolean; data: VendorStats & { pendingRequests: CollectionRequest[] } }> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/dashboard-stats?vendorCode=${vendorCode}` : `${API_BASE}/vendor/dashboard-stats`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, data: data.data };
      }
    } catch {}
    return {
      success: false,
      data: {
        todayCollection: 0,
        todayGrowthPercent: 0,
        orderCount: 0,
        coinsSettled: 0,
        cashCollected: 0,
        pendingCount: 0,
        pendingRequests: [],
      },
    };
  },

  // 4. Fetch Pending Collection Requests
  async getPendingRequests(vendorCode?: string): Promise<CollectionRequest[]> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/collection-requests?vendorCode=${vendorCode}` : `${API_BASE}/vendor/collection-requests`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data.data;
    } catch {}
    return [];
  },

  // 5. Accept/Verify Collection Request
  async verifyCollection(requestId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/collection-requests/${requestId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to verify collection' };
    }
  },

  // 6. Reject Collection Request
  async rejectCollection(requestId: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/collection-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to reject collection' };
    }
  },

  // 7. Fetch Real Transactions History
  async getTransactions(filter?: 'today' | 'yesterday' | 'all', search?: string, vendorCode?: string): Promise<VendorTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (vendorCode) params.append('vendorCode', vendorCode);
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/vendor/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data.data;
    } catch {}
    return [];
  },

  // 8. Fetch Real Wallet & Settlements
  async getWallet(vendorCode?: string): Promise<VendorWalletData | null> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/wallet?vendorCode=${vendorCode}` : `${API_BASE}/vendor/wallet`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch {}
    return null;
  },

  // 9. Withdraw to Bank
  async withdrawToBank(amount: number, vendorCode?: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/wallet/withdraw?vendorCode=${vendorCode}` : `${API_BASE}/vendor/wallet/withdraw`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to process withdrawal' };
    }
  },

  // 10. Fetch Real Analytics
  async getAnalytics(vendorCode?: string): Promise<VendorAnalyticsData | null> {
    try {
      const url = vendorCode ? `${API_BASE}/vendor/analytics?vendorCode=${vendorCode}` : `${API_BASE}/vendor/analytics`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch {}
    return null;
  },
};
