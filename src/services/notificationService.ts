import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InAppNotification {
  _id: string;
  id?: string;
  title: string;
  body: string;
  type: string;
  role?: string;
  deepLink?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

class NotificationService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('@womup_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getNotifications(page = 1, limit = 20): Promise<{ notifications: InAppNotification[]; unreadCount: number }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        headers,
      });
      const json = await res.json();
      const payload = json?.data || json;
      return {
        notifications: payload?.notifications || [],
        unreadCount: payload?.unreadCount || 0,
      };
    } catch (e) {
      console.warn('[NotificationService] getNotifications error:', e);
      return { notifications: [], unreadCount: 0 };
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      return data?.success !== false;
    } catch (e) {
      console.warn('[NotificationService] markAsRead error:', e);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      return data?.success !== false;
    } catch (e) {
      console.warn('[NotificationService] markAllAsRead error:', e);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      return data?.success !== false;
    } catch (e) {
      console.warn('[NotificationService] deleteNotification error:', e);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
