import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InAppNotification {
  _id: string;
  id?: string;
  title: string;
  message?: string;
  body?: string;
  type: string;
  role?: string;
  recipientType?: string;
  recipientId?: string;
  orderId?: string;
  entityType?: string;
  entityId?: string;
  actionType?: string;
  deepLink?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  notifications: InAppNotification[];
  unreadCount: number;
  total?: number;
  page?: number;
  totalPages?: number;
}

class NotificationService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('@womup_auth_token');
    const userRaw = await AsyncStorage.getItem('@womup_user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const userId = user?._id || user?.id || '';

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { 'x-user-id': userId } : {}),
    };
  }

  async getNotifications(page = 1, limit = 20): Promise<NotificationResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try { controller.abort(); } catch (_) {}
      }, 7000);

      const res = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { notifications: [], unreadCount: 0 };
      }

      const json = await res.json();
      const payload = json?.data || json;
      const rawList = payload?.notifications || [];

      // Normalize notifications so title, message, body, id are always clean
      const normalized: InAppNotification[] = rawList.map((n: any) => ({
        ...n,
        id: n.id || n._id,
        _id: n._id || n.id,
        message: n.message || n.body || '',
        body: n.body || n.message || '',
      }));

      return {
        notifications: normalized,
        unreadCount: payload?.unreadCount ?? 0,
        total: payload?.total ?? normalized.length,
        page: payload?.page ?? page,
        totalPages: payload?.totalPages ?? 1,
      };
    } catch (e) {
      console.warn('[NotificationService] getNotifications error:', e);
      return { notifications: [], unreadCount: 0 };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers });
      if (!res.ok) return 0;
      const json = await res.json();
      return json?.data?.count ?? json?.count ?? 0;
    } catch (e) {
      console.warn('[NotificationService] getUnreadCount error:', e);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
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
        method: 'PATCH',
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
