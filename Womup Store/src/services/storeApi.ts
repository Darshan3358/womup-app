import AsyncStorage from '@react-native-async-storage/async-storage';

const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isLocalWeb ? 'http://localhost:5050/api/v1/store' : 'https://womup-app-uquz.onrender.com/api/v1/store');

const LOCATION_API_BASE_URL =
  isLocalWeb ? 'http://localhost:5050/api/v1/location' : 'https://womup-app-uquz.onrender.com/api/v1/location';

export const TOKEN_STORAGE_KEY = '@womup_store_access_token';
export const STAFF_STORAGE_KEY = '@womup_store_staff';

export class StoreApiService {
  private static async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    const resJson = await response.json();

    if (!response.ok) {
      const msg = resJson.message || `API Error: ${response.status}`;
      throw new Error(msg);
    }

    // Auto-unwrap NestJS TransformInterceptor envelope
    if (resJson && resJson.data !== undefined) {
      return resJson.data as T;
    }
    return resJson as T;
  }

  // Master Location APIs (for Registration)
  static async getCities(): Promise<any[]> {
    try {
      const response = await fetch(`${LOCATION_API_BASE_URL}/cities`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch cities');
      }
      return json.data || json || [];
    } catch (err: any) {
      console.warn('[StoreApiService] getCities error:', err.message);
      return [];
    }
  }

  static async getAreasByCity(cityId: string): Promise<any[]> {
    try {
      const response = await fetch(`${LOCATION_API_BASE_URL}/areas?cityId=${encodeURIComponent(cityId)}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch areas');
      }
      return json.data || json || [];
    } catch (err: any) {
      console.warn('[StoreApiService] getAreasByCity error:', err.message);
      return [];
    }
  }

  // Auth APIs
  static async registerStore(payload: {
    storeName: string;
    ownerName: string;
    phone: string;
    email: string;
    cityId: string;
    areaId: string;
    password: string;
    fullAddress?: string;
    landmark?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    storeLicense?: string;
    ownerAadharFront?: string;
    ownerAadharBack?: string;
    shopPhoto?: string;
    openingTime?: string;
    closingTime?: string;
    serviceRadius?: number;
    deliveryTime?: number;
    initialStaffCount?: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      store: {
        id: string;
        name: string;
        code: string;
        loginId: string;
        city: string;
        areaName: string;
        ownerName: string;
        email: string;
        phone: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async loginWithStoreCredentials(loginId: string, password: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId: loginId.trim(), password }),
    });

    if (data?.token) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    }
    if (data?.store) {
      await AsyncStorage.setItem('@womup_store_session', JSON.stringify(data.store));
    }
    return data;
  }

  static async logout() {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(STAFF_STORAGE_KEY);
    await AsyncStorage.removeItem('@womup_store_session');
  }

  static async sendOtp(email: string) {
    return this.request<{ success: boolean; message: string; expiresInSeconds: number }>(
      '/auth/send-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      },
    );
  }

  static async verifyOtp(email: string, otp: string) {
    const data = await this.request<any>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
    });

    if (data?.accessToken) {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    }
    if (data?.staff) {
      await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(data.staff));
    }
    return data;
  }

  static async getMe() {
    return this.request<{
      staff: any;
      store: any;
      performance?: any;
    }>('/me');
  }

  static async updateShift(isOnShift: boolean) {
    return this.request<{
      success: boolean;
      isOnShift: boolean;
      shiftStartedAt?: string;
    }>('/me/shift', {
      method: 'PATCH',
      body: JSON.stringify({ isOnShift }),
    });
  }

  static async getPerformance() {
    return this.request<any>('/me/performance');
  }

  static async getHistory() {
    return this.request<any[]>('/me/history');
  }

  // Order Operations
  static async getIncomingOrders() {
    return this.request<any[]>('/orders/incoming');
  }

  static async getPickingOrders() {
    return this.request<any[]>('/orders/picking');
  }

  static async getReadyOrders() {
    return this.request<any[]>('/orders/ready');
  }

  static async getCompletedOrders() {
    return this.request<any[]>('/orders/history');
  }

  static async getOrderDetail(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  static async acceptOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  static async pickItem(orderId: string, itemId: string, scannedBarcode: string) {
    return this.request<any>(`/orders/${orderId}/items/${itemId}/pick`, {
      method: 'POST',
      body: JSON.stringify({ scannedBarcode }),
    });
  }

  static async outOfStock(orderId: string, itemId: string, reason: string, substituteProductId?: string) {
    return this.request<any>(`/orders/${orderId}/items/${itemId}/out-of-stock`, {
      method: 'POST',
      body: JSON.stringify({ reason, substituteProductId }),
    });
  }

  static async packComplete(orderId: string, bagBarcode?: string, weight?: number, itemCount?: number) {
    return this.request<any>(`/orders/${orderId}/pack-complete`, {
      method: 'POST',
      body: JSON.stringify({ bagBarcode, weight, itemCount }),
    });
  }

  static async readyForPickup(orderId: string, shelfSlot: string) {
    return this.request<any>(`/orders/${orderId}/ready-for-pickup`, {
      method: 'POST',
      body: JSON.stringify({ shelfSlot }),
    });
  }

  static async handover(orderId: string, bagBarcode: string, riderBagBarcode?: string) {
    return this.request<any>(`/orders/${orderId}/handover`, {
      method: 'POST',
      body: JSON.stringify({ bagBarcode, riderBagBarcode }),
    });
  }

  // Inventory Operations
  static async getInventory(search?: string, filter?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.request<any[]>(`/inventory?${params.toString()}`);
  }

  static async adjustStock(productId: string, delta: number, reason: string, changeType?: string, variantId?: string) {
    return this.request<any>(`/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ delta, reason, changeType, variantId }),
    });
  }

  static async updateShelfLocation(productId: string, shelfLocation: string) {
    return this.request<any>(`/inventory/${productId}/shelf`, {
      method: 'PATCH',
      body: JSON.stringify({ shelfLocation: shelfLocation.trim().toUpperCase() }),
    });
  }

  static async addProduct(payload: {
    name: string;
    category?: string;
    brand?: string;
    description?: string;
    imageUrl?: string;
    variants?: { packSize?: string; sellingPrice?: number; mrp?: number; sku?: string }[];
    initialStock?: number;
    shelfLocation?: string;
  }) {
    return this.request<any>('/inventory/add-product', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async restock(productId: string, quantity: number, batchNumber?: string) {
    return this.request<any>(`/inventory/${productId}/restock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, batchNumber }),
    });
  }

  static async getInventoryLogs(productId?: string) {
    const query = productId ? `?productId=${productId}` : '';
    return this.request<any[]>(`/inventory/logs${query}`);
  }

  static async getStoreLeaderboard() {
    return this.request<any>('/orders/performance/leaderboard');
  }

  static async getAvailableStores() {
    return this.request<any[]>('/orders/stores/available');
  }

  static async generateBagBarcode(orderId: string) {
    return this.request<{ success: boolean; bagBarcode: string }>(`/orders/${orderId}/bag-barcode`, {
      method: 'POST',
    });
  }

  static async uploadImage(asset: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string> {
    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
    const fileName = asset.fileName || `store_prod_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    const formData = new FormData();
    if (isWeb) {
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const mediaBaseUrl = API_BASE_URL.replace(/\/store\/?$/, '');
    const endpoints = [
      `${mediaBaseUrl}/media/upload?folder=wormup/products`,
      `${mediaBaseUrl}/upload/image?folder=wormup/products`,
    ];

    let lastError: any = null;
    for (const url of endpoints) {
      try {
        const resJson = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url);
          if (headers) {
            Object.entries(headers).forEach(([k, v]) => {
              if (k.toLowerCase() !== 'content-type') xhr.setRequestHeader(k, v);
            });
          }
          xhr.onload = () => {
            let data: any;
            try { data = JSON.parse(xhr.responseText); } catch { data = { text: xhr.responseText }; }
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data?.message || data?.error || `Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during file upload'));
          xhr.timeout = 60000;
          xhr.send(formData);
        });

        const cloudUrl =
          resJson?.url ||
          resJson?.secure_url ||
          resJson?.data?.url ||
          resJson?.data?.secure_url;
        if (cloudUrl) return cloudUrl;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Failed to upload image to server');
  }
}
