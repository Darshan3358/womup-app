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
  // 1. Vendor Login with Mobile or Vendor Code + Password
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

  // 1b. Send Mobile OTP
  async sendOtp(mobile: string, purpose = 'REGISTRATION'): Promise<{ success: boolean; verificationId?: string; expiresIn?: number; error?: string; devOtp?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, purpose }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, verificationId: data.data.verificationId, expiresIn: data.data.expiresIn, devOtp: data.data.devOtp };
      }
      return { success: false, error: data.message || 'Failed to send OTP' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending OTP' };
    }
  },

  // 1c. Verify Mobile OTP
  async verifyOtp(mobile: string, otp: string, verificationId?: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, verificationId }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        return { success: true, verified: true };
      }
      return { success: false, error: data.message || 'Invalid OTP' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying OTP' };
    }
  },

  // 1d. Login with Mobile + OTP
  async loginWithOtp(mobile: string, otp: string): Promise<{ success: boolean; vendor?: VendorProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, vendor: data.data };
      }
      return { success: false, error: data.message || 'OTP Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend' };
    }
  },

  // 1e. Complete 5-Step Registration
  async register(payload: any): Promise<{ success: boolean; vendor?: VendorProfile; vendorCode?: string; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return {
          success: true,
          vendor: data.data.vendor,
          vendorCode: data.data.vendorCode,
          message: data.data.message || 'Registration submitted for review',
        };
      }
      return { success: false, error: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend' };
    }
  },

  // 1f. Forgot Password
  async forgotPassword(mobile: string): Promise<{ success: boolean; message?: string; error?: string; devOtp?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.data?.message, devOtp: data.data?.devOtp };
      }
      return { success: false, error: data.message || 'Failed to send reset OTP' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  // 1g. Reset Password
  async resetPassword(mobile: string, otp: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.message || 'Failed to reset password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  // 1h. Get Verification & Approval Status
  async getStatus(identifier: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/vendor/auth/status?vendorCode=${identifier}`);
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, data: data.data };
      }
      return { success: false, error: data.message || 'Status check failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
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
