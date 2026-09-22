import { Platform } from 'react-native';
import { StorageService } from './storageService';

// Automatically detect host based on environment
const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isLocalWeb ? 'http://localhost:5050/api/v1' : 'https://womup-app.onrender.com/api/v1');

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private isRefreshing = false;

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ success: boolean; data?: T; message?: string }> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized by attempting to refresh token
      if (
        res.status === 401 &&
        !endpoint.includes('/auth/refresh-token') &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/verify-otp') &&
        !endpoint.includes('/auth/register')
      ) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed && this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryRes = await fetch(url, { ...options, headers });
          const retryJson = await retryRes.json();
          if (!retryRes.ok) {
            return {
              success: false,
              message: retryJson.message || `Request failed with status ${retryRes.status}`,
            };
          }
          return retryJson;
        }
      }

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: json.message || `Request failed with status ${res.status}`,
        };
      }
      return json;
    } catch (err: any) {
      console.warn(`[API Connection Error] ${endpoint}:`, err.message);
      return {
        success: false,
        message: err.message || 'Network connection failed',
      };
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing) return false;
    this.isRefreshing = true;
    try {
      const refreshToken = await StorageService.getItem<string | null>(
        StorageService.KEYS.REFRESH_TOKEN,
        null
      );
      if (!refreshToken) {
        this.isRefreshing = false;
        return false;
      }

      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        this.isRefreshing = false;
        return false;
      }

      const data = await refreshRes.json();
      if (data && data.accessToken) {
        this.setToken(data.accessToken);
        await StorageService.saveItem(StorageService.KEYS.AUTH_TOKEN, data.accessToken);
        if (data.refreshToken) {
          await StorageService.saveItem(StorageService.KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        this.isRefreshing = false;
        return true;
      }
    } catch (e) {
      console.warn('[Auto Refresh Token Failed]:', e);
    } finally {
      this.isRefreshing = false;
    }
    return false;
  }

  // HTTP Helpers
  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<{ success: boolean; data?: T; message?: string }> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      console.warn(`[API Upload Error] ${endpoint}:`, err.message);
      return { success: false, message: err.message || 'Upload failed' };
    }
  }
}

export const api = new ApiClient();
