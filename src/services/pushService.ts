import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const TOKEN_STORAGE_KEY = '@womup_push_token';

export interface PushTokenPayload {
  userId?: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  appVersion?: string;
}

export type DeepLinkHandler = (data: {
  screen?: string;
  orderId?: string;
  jobId?: string;
  paymentId?: string;
  type?: string;
}) => void;

class PushService {
  private registeredToken: string | null = null;
  private deepLinkHandler: DeepLinkHandler | null = null;

  setDeepLinkHandler(handler: DeepLinkHandler) {
    this.deepLinkHandler = handler;
  }

  async registerDeviceToken(userId?: string): Promise<string | null> {
    try {
      // Generate or retrieve mock/real device push token
      let token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        token = `womup_push_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
      this.registeredToken = token;

      // Sync with backend if user is authenticated
      if (userId) {
        await this.sendTokenToBackend({
          userId,
          token,
          platform: Platform.OS as 'android' | 'ios' | 'web',
          appVersion: '1.0.0',
        });
      }

      return token;
    } catch (error) {
      console.warn('[PushService] Failed to register push token:', error);
      return null;
    }
  }

  async sendTokenToBackend(payload: PushTokenPayload): Promise<boolean> {
    try {
      const userToken = await AsyncStorage.getItem('@womup_auth_token');
      const response = await fetch(`${API_BASE_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const res = await response.json();
      return res?.success !== false;
    } catch (e) {
      console.warn('[PushService] sendTokenToBackend error:', e);
      return false;
    }
  }

  handleNotificationReceived(notification: any, showToast?: (msg: string, title?: string) => void) {
    const title = notification?.title || 'WOMART Alert';
    const body = notification?.body || notification?.message || '';

    if (showToast && body) {
      showToast(body, title);
    }
  }

  handleNotificationTapped(notificationData: any) {
    if (this.deepLinkHandler && notificationData) {
      this.deepLinkHandler(notificationData);
    }
  }
}

export const pushService = new PushService();
