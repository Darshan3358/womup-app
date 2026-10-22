const getNestApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app-uquz.onrender.com/api/v1';
};

const getStoredAdminToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('womup_admin_token');
    } catch {
      return null;
    }
  }
  return null;
};

const BASE_URL = getNestApiBaseUrl();

export interface AdminNotification {
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
  storeId?: string;
  riderId?: string;
  customerId?: string;
  entityType?: string;
  entityId?: string;
  actionType?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

class AdminNotificationService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = getStoredAdminToken();
    return {
      'Content-Type': 'application/json',
      'x-role': 'ADMIN',
      'x-user-id': 'admin',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getNotifications(page = 1, limit = 25): Promise<{ notifications: AdminNotification[]; unreadCount: number }> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${BASE_URL}/notifications?page=${page}&limit=${limit}&role=ADMIN`, { headers });
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      const json = await res.json();
      const payload = json?.data || json;
      const rawList = payload?.notifications || [];
      const normalized: AdminNotification[] = rawList.map((n: any) => ({
        ...n,
        id: n.id || n._id,
        _id: n._id || n.id,
        message: n.message || n.body || '',
      }));
      return {
        notifications: normalized,
        unreadCount: payload?.unreadCount ?? 0,
      };
    } catch (e) {
      console.warn('[AdminNotificationService] getNotifications error:', e);
      return { notifications: [], unreadCount: 0 };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${BASE_URL}/notifications/unread-count?role=ADMIN`, { headers });
      if (!res.ok) return 0;
      const json = await res.json();
      return json?.data?.count ?? json?.count ?? 0;
    } catch (e) {
      console.warn('[AdminNotificationService] getUnreadCount error:', e);
      return 0;
    }
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });
      const data = await res.json();
      return data?.success !== false;
    } catch (e) {
      console.warn('[AdminNotificationService] markAsRead error:', e);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers,
      });
      const data = await res.json();
      return data?.success !== false;
    } catch (e) {
      console.warn('[AdminNotificationService] markAllAsRead error:', e);
      return false;
    }
  }
}

export const adminNotificationService = new AdminNotificationService();
