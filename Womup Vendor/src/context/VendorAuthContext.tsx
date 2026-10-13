import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VendorProfile,
  VendorTab,
  CollectionRequest,
  VendorTransaction,
  VendorStats,
} from '../types/vendor';
import { VendorApi } from '../services/api';
import { vendorSocket } from '../services/socket';

const VENDOR_LOGGED_IN_KEY = '@womup_vendor_logged_in';
const VENDOR_CODE_KEY = '@womup_vendor_code';

interface VendorAuthContextType {
  vendor: VendorProfile | null;
  isLoggedIn: boolean;
  activeTab: VendorTab;
  setActiveTab: (tab: VendorTab) => void;
  pendingRequests: CollectionRequest[];
  activeModalRequest: CollectionRequest | null;
  setActiveModalRequest: (req: CollectionRequest | null) => void;
  transactions: VendorTransaction[];
  stats: VendorStats;
  isQRModalVisible: boolean;
  setIsQRModalVisible: (v: boolean) => void;
  isLoading: boolean;
  login: (loginId: string, pass?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyCollectionRequest: (id: string) => Promise<void>;
  rejectCollectionRequest: (id: string, reason?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const VendorAuthContext = createContext<VendorAuthContextType>({} as any);

export const VendorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<VendorTab>('Dashboard');
  const [pendingRequests, setPendingRequests] = useState<CollectionRequest[]>([]);
  const [activeModalRequest, setActiveModalRequest] = useState<CollectionRequest | null>(null);
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<VendorStats>({
    todayCollection: 0,
    todayGrowthPercent: 0,
    orderCount: 0,
    coinsSettled: 0,
    cashCollected: 0,
    pendingCount: 0,
  });

  // Restore authenticated session from persistent storage on boot
  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const savedAuth = await AsyncStorage.getItem(VENDOR_LOGGED_IN_KEY);
        const savedCode = (await AsyncStorage.getItem(VENDOR_CODE_KEY)) || 'VND001';

        // Only restore if user was previously logged in
        if (savedAuth === 'true' && savedCode) {
          const profile = await VendorApi.getProfile(savedCode);
          if (mounted && profile) {
            setVendor(profile);
            setIsLoggedIn(true);
          }
        } else {
          // Defaults to logged out state if no valid session
          if (mounted) {
            setVendor(null);
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.warn('Failed to restore vendor session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = useCallback(async () => {
    if (!vendor?.vendorCode) return;
    try {
      const [dashRes, txs] = await Promise.all([
        VendorApi.getDashboardStats(vendor.vendorCode),
        VendorApi.getTransactions('all', undefined, vendor.vendorCode),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats({
          todayCollection: dashRes.data.todayCollection || 0,
          todayGrowthPercent: dashRes.data.todayGrowthPercent || 0,
          orderCount: dashRes.data.orderCount || 0,
          coinsSettled: dashRes.data.coinsSettled || 0,
          cashCollected: dashRes.data.cashCollected || 0,
          pendingCount: dashRes.data.pendingCount || 0,
        });
        setPendingRequests(dashRes.data.pendingRequests || []);
      }
      setTransactions(txs || []);

      // Refresh vendor wallet balance
      const updatedProfile = await VendorApi.getProfile(vendor.vendorCode);
      if (updatedProfile) {
        setVendor(updatedProfile);
      }
    } catch (err) {
      console.warn('Failed to refresh real vendor data:', err);
    }
  }, [vendor?.vendorCode]);

  // Initial and periodic refresh (every 10 seconds for real-time consistency)
  useEffect(() => {
    if (isLoggedIn && vendor?.vendorCode) {
      refreshData();
      const interval = setInterval(refreshData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, vendor?.vendorCode, refreshData]);

  // Real-time WebSocket connection to /tracking room
  useEffect(() => {
    if (isLoggedIn && vendor?.vendorCode) {
      vendorSocket.connect(
        vendor.vendorCode,
        (newReq: CollectionRequest) => {
          console.log('[Vendor Auth] Received real customer collection request:', newReq);
          setPendingRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
          setActiveModalRequest(newReq);
          setStats((prev) => ({ ...prev, pendingCount: prev.pendingCount + 1 }));
        },
        (cancelledId: string) => {
          setPendingRequests((prev) => prev.filter((r) => r.id !== cancelledId));
          setActiveModalRequest((prev) => (prev?.id === cancelledId ? null : prev));
          setStats((prev) => ({ ...prev, pendingCount: Math.max(0, prev.pendingCount - 1) }));
        },
        (paymentData: any) => {
          console.log('[Vendor Auth] Received real-time Razorpay UPI payment:', paymentData);
          refreshData();
        },
      );
    } else {
      vendorSocket.disconnect();
    }
    return () => vendorSocket.disconnect();
  }, [isLoggedIn, vendor?.vendorCode]);

  const login = async (loginId: string, pass?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await VendorApi.login(loginId, pass);
      if (res.success && res.vendor) {
        setVendor(res.vendor);
        setIsLoggedIn(true);
        setActiveTab('Dashboard');
        // Persist session
        await AsyncStorage.setItem(VENDOR_LOGGED_IN_KEY, 'true');
        await AsyncStorage.setItem(VENDOR_CODE_KEY, res.vendor.vendorCode);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('[VendorAuthContext] Logging out vendor...');
    try {
      // 1. Disconnect WebSocket
      vendorSocket.disconnect();

      // 2. Clear persisted auth in AsyncStorage
      await AsyncStorage.removeItem(VENDOR_LOGGED_IN_KEY);
      await AsyncStorage.removeItem(VENDOR_CODE_KEY);
    } catch (e) {
      console.warn('Storage clear warning during logout:', e);
    } finally {
      // 3. Reset all in-memory states
      setVendor(null);
      setIsLoggedIn(false);
      setActiveTab('Dashboard');
      setPendingRequests([]);
      setActiveModalRequest(null);
      setTransactions([]);
      setIsQRModalVisible(false);
      console.log('[VendorAuthContext] Logged out successfully');
    }
  };

  const verifyCollectionRequest = async (id: string) => {
    const res = await VendorApi.verifyCollection(id);
    if (res.success) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      setActiveModalRequest(null);
      await refreshData();
    }
  };

  const rejectCollectionRequest = async (id: string, reason?: string) => {
    const res = await VendorApi.rejectCollection(id, reason);
    if (res.success) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      setActiveModalRequest(null);
      await refreshData();
    }
  };

  return (
    <VendorAuthContext.Provider
      value={{
        vendor,
        isLoggedIn,
        activeTab,
        setActiveTab,
        pendingRequests,
        activeModalRequest,
        setActiveModalRequest,
        transactions,
        stats,
        isQRModalVisible,
        setIsQRModalVisible,
        isLoading,
        login,
        logout,
        verifyCollectionRequest,
        rejectCollectionRequest,
        refreshData,
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
};

export const useVendor = () => useContext(VendorAuthContext);
