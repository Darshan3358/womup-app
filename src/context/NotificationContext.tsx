import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';
import { notificationService, InAppNotification } from '../services/notificationService';
import { pushService } from '../services/pushService';
import { NotificationBanner, BannerNotificationData } from '../components/NotificationBanner';
import { useToast } from '../hooks/useToast';

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  whatsappInvoices: boolean;
  emailReceipts: boolean;
  dndEnabled: boolean;
}

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  activeBanner: BannerNotificationData | null;
  preferences: NotificationPreferences;
  showBanner: (notification: BannerNotificationData) => void;
  dismissBanner: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>;
  registerPushToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeBanner, setActiveBanner] = useState<BannerNotificationData | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotions: true,
    whatsappInvoices: true,
    emailReceipts: true,
    dndEnabled: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const toast = useToast();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(1, 30);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      console.warn('[NotificationContext] Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerPushToken = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem('@womup_user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id || user?.id;
      if (userId) {
        await pushService.registerDeviceToken(userId);
      }
    } catch (e) {
      console.warn('[NotificationContext] Failed to register push token:', e);
    }
  }, []);

  // Connect WebSocket & listen to real-time events across ecosystem
  useEffect(() => {
    let active = true;

    const setupSocket = async () => {
      try {
        const userRaw = await AsyncStorage.getItem('@womup_user');
        const user = userRaw ? JSON.parse(userRaw) : null;
        const userId = user?._id || user?.id;

        const socket = io(`${SOCKET_BASE_URL}/tracking`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[NotificationSocket] 🟢 Connected:', socket.id);
          if (userId) {
            socket.emit('join_order', { orderId: `user_${userId}` });
          }
        });

        // 1. Generic in-app notification event
        socket.on('in_app_notification', (data: any) => {
          if (!active) return;
          console.log('[NotificationSocket] 🔔 In-App Event:', data);

          const bannerData: BannerNotificationData = {
            id: data.id || `notif_${Date.now()}`,
            title: data.title || 'WormUp Alert',
            body: data.body || '',
            type: data.type || 'ORDER_STATUS',
            role: data.role || 'CUSTOMER',
            deepLink: data.deepLink,
            data: data.data,
          };

          setActiveBanner(bannerData);
          setUnreadCount((prev) => prev + 1);

          // Add to local state list
          setNotifications((prev) => [
            {
              _id: bannerData.id,
              title: bannerData.title,
              body: bannerData.body,
              type: bannerData.type || 'ORDER_STATUS',
              isRead: false,
              createdAt: new Date().toISOString(),
              data: bannerData.data,
            },
            ...prev,
          ]);

          // Also trigger subtle toast feedback
          toast.showInfo(bannerData.body, bannerData.title);
        });

        // 2. Order status updated event
        socket.on('order_status_updated', (data: any) => {
          if (!active) return;
          const title = data.status === 'DELIVERED' ? '✅ Delivered' : '📦 Order Updated';
          const body = data.message || `Order status is now ${data.status}`;
          toast.showSuccess(body, title);
        });

        // 3. Rider assigned event
        socket.on('rider_assigned', (data: any) => {
          if (!active) return;
          const riderName = data.riderName || 'Rohit';
          toast.showInfo(`${riderName} is heading to the store.`, '🛵 Rider Assigned');
        });

        // 4. Wallet & Coins updated
        socket.on('wallet_updated', (data: any) => {
          if (!active) return;
          toast.showSuccess(`New balance: ₹${data.balance || 0}`, '💰 Wallet Update');
        });

        socket.on('coins_credited', (data: any) => {
          if (!active) return;
          toast.showSuccess(`₹${data.coins || 2000} Shopping Coins added!`, '🎁 Coins Credited');
        });

        // 5. KYC Status updated
        socket.on('kyc_status_updated', (data: any) => {
          if (!active) return;
          if (data.status === 'VERIFIED' || data.status === 2) {
            toast.showSuccess('Income features unlocked!', '✅ KYC Verified');
          } else if (data.status === 'REJECTED' || data.status === 3) {
            toast.showError(data.reason || 'Tap to resubmit documents', '❌ KYC Rejected');
          }
        });
      } catch (err) {
        console.warn('[NotificationSocket] Setup error:', err);
      }
    };

    setupSocket();
    loadNotifications();
    registerPushToken();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [loadNotifications, registerPushToken, toast]);

  const showBanner = (notification: BannerNotificationData) => {
    setActiveBanner(notification);
  };

  const dismissBanner = () => {
    setActiveBanner(null);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.warn('[NotificationContext] markAsRead error:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('[NotificationContext] markAllAsRead error:', e);
    }
  };

  const updatePreferences = async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const userToken = await AsyncStorage.getItem('@womup_auth_token');
      const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
        },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data?.success) {
        setPreferences((prev) => ({ ...prev, ...prefs }));
        toast.showSuccess('Notification preferences saved');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[NotificationContext] updatePreferences error:', e);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        activeBanner,
        preferences,
        showBanner,
        dismissBanner,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        updatePreferences,
        registerPushToken,
      }}
    >
      {children}
      <NotificationBanner
        notification={activeBanner}
        onDismiss={dismissBanner}
        onPress={(n) => {
          console.log('[NotificationBanner] Clicked:', n.deepLink || n.title);
          // Handled via deep-linking
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
