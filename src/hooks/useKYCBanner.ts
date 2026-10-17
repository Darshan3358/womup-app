import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../services/api';
import io, { Socket } from 'socket.io-client';

export type BannerVariant = 'WARNING' | 'INFO' | 'SUCCESS' | 'ERROR';

export interface KYCBannerData {
  bannerType: BannerVariant;
  kycStatus: number; // 0=NotSubmitted, 1=UnderReview, 2=Verified, 3=Rejected
  title: string;
  subtitle: string;
  ctaText: string;
  ctaAction: 'OPEN_KYC' | 'VIEW_STATUS' | 'VIEW_WALLET' | 'RESUBMIT';
  icon: 'alert-circle' | 'clock' | 'check-circle' | 'x-circle';
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  isDismissible: boolean;
  rejectionReason?: string;
  approvedAt?: string;
}

const DISMISS_KEY = '@womup_kyc_banner_dismissed';

export const useKYCBanner = () => {
  const { user } = useApp();
  const { isAuthenticated } = useAuth();
  const [bannerData, setBannerData] = useState<KYCBannerData | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Derive initial banner from local user state
  const deriveFromUser = useCallback((): KYCBannerData => {
    const kycStatus = (user as any)?.customerKycStatus ?? (user?.aadhaarVerified ? 2 : (user?.verificationStatus === 'PENDING' ? 1 : 0));
    const isVerified = (user as any)?.customerIsVerify === 1 || user?.aadhaarVerified || kycStatus === 2;

    if (isVerified) {
      return {
        bannerType: 'SUCCESS',
        kycStatus: 2,
        title: 'KYC Verified · Income Unlocked',
        subtitle: user?.sponsorCode && user?.sponsorCode !== 'WORMUP001' ? '₹20 bonus credited to sponsor' : 'All income features unlocked',
        ctaText: 'View Wallet',
        ctaAction: 'VIEW_WALLET',
        icon: 'check-circle',
        backgroundColor: '#DCFCE7',
        borderColor: '#86EFAC',
        textColor: '#166534',
        isDismissible: true,
      };
    }

    if (kycStatus === 1 || user?.verificationStatus === 'PENDING') {
      return {
        bannerType: 'INFO',
        kycStatus: 1,
        title: 'KYC Under Review',
        subtitle: 'Verification in 24 hours',
        ctaText: 'View Status',
        ctaAction: 'VIEW_STATUS',
        icon: 'clock',
        backgroundColor: '#DBEAFE',
        borderColor: '#93C5FD',
        textColor: '#1E40AF',
        isDismissible: false,
      };
    }

    if (kycStatus === 3 || user?.verificationStatus === 'REJECTED') {
      return {
        bannerType: 'ERROR',
        kycStatus: 3,
        title: 'KYC Rejected · Resubmit',
        subtitle: `Reason: ${(user as any)?.customerAadharRejectionReason || 'Document not clear'}`,
        ctaText: 'Resubmit',
        ctaAction: 'RESUBMIT',
        icon: 'x-circle',
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        textColor: '#991B1B',
        isDismissible: false,
      };
    }

    // Default: Not submitted (Warning)
    return {
      bannerType: 'WARNING',
      kycStatus: 0,
      title: 'Complete KYC · Unlock ₹20',
      subtitle: 'Verify Aadhaar in 2 minutes',
      ctaText: 'Verify Now',
      ctaAction: 'OPEN_KYC',
      icon: 'alert-circle',
      backgroundColor: '#FEF3C7',
      borderColor: '#FCD34D',
      textColor: '#B45309',
      isDismissible: false,
    };
  }, [user]);

  // Fetch live banner configuration from backend
  const fetchBanner = useCallback(async () => {
    if (!isAuthenticated) {
      setBannerData(null);
      setIsVisible(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<any>('/users/dashboard-banner');
      if (res.success && res.data) {
        setBannerData(res.data);

        // Check 3-day auto hide for verified status
        if (res.data.bannerType === 'SUCCESS' && res.data.approvedAt) {
          const approvedTime = new Date(res.data.approvedAt).getTime();
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (Date.now() - approvedTime > threeDaysMs) {
            setIsVisible(false);
            setLoading(false);
            return;
          }
        }

        // Check if dismissed in this session
        const dismissed = await AsyncStorage.getItem(DISMISS_KEY);
        if (dismissed === 'true' && res.data.isDismissible) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setBannerData(deriveFromUser());
        setIsVisible(true);
      }
    } catch {
      setBannerData(deriveFromUser());
      setIsVisible(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, deriveFromUser]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  // Real-time WebSocket listener for immediate banner status change
  useEffect(() => {
    if (!isAuthenticated) return;

    let socket: Socket | null = null;
    try {
      socket = io('https://womup-app.onrender.com', { transports: ['websocket'] });
      socket.on('customer_kyc_approved', () => {
        fetchBanner();
      });
      socket.on('kyc_rejected', () => {
        fetchBanner();
      });
    } catch (_) {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated, fetchBanner]);

  const dismissBanner = async () => {
    setIsVisible(false);
    await AsyncStorage.setItem(DISMISS_KEY, 'true');
  };

  return {
    bannerData,
    isVisible,
    loading,
    refreshBanner: fetchBanner,
    dismissBanner,
  };
};
