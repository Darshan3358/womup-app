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
  private isRefreshing = false;
  private refreshCooldownUntil: number = 0; // Cooldown timestamp to prevent 401 refresh loops
  private inFlightGetRequests: Map<string, Promise<any>> = new Map();

  setToken(token: string | null) {
    this.token = token;
    if (!token) {
      this.refreshCooldownUntil = 0;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Main HTTP request entry point with in-flight GET de-duplication,
   * single-retry limit, circuit breaker, and automatic session cleanup.
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & { _isRetry?: boolean } = {},
  ): Promise<{ success: boolean; data?: T; message?: string }> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const cacheKey = `${endpoint}_${this.token || 'anon'}`;

    // De-duplicate concurrent in-flight GET requests (prevents 10+ components spamming simultaneously)
    if (isGet && !options._isRetry && this.inFlightGetRequests.has(cacheKey)) {
      return this.inFlightGetRequests.get(cacheKey)!;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);

    if (isGet && !options._isRetry) {
      this.inFlightGetRequests.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        this.inFlightGetRequests.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit & { _isRetry?: boolean } = {},
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized with strict cycle break:
      // 1. If already retried once -> DO NOT retry again! Immediately clear session.
      // 2. If endpoint is auth/refresh-token or auth/login -> DO NOT attempt refresh.
      // 3. If refresh cooldown is active -> DO NOT attempt refresh, clear session.
      if (res.status === 401) {
        const isAuthEndpoint =
          endpoint.includes('/auth/refresh-token') ||
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/verify-otp') ||
          endpoint.includes('/auth/register');

        if (options._isRetry || isAuthEndpoint) {
          await this.handleSessionExpired();
          return {
            success: false,
            message: 'Session expired or invalid credentials.',
          };
        }

        // Check if refresh is on cooldown (prevents rapid retry loops)
        if (Date.now() < this.refreshCooldownUntil) {
          await this.handleSessionExpired();
          return {
            success: false,
            message: 'Session expired. Please log in again.',
          };
        }

        const refreshed = await this.tryRefreshToken();
        if (refreshed && this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
          // Retry ONCE with _isRetry: true to prevent any further recursion
          return this.request<T>(endpoint, {
            ...options,
            headers,
            _isRetry: true,
          });
        } else {
          // Refresh failed -> Set 30s cooldown and clear expired session
          this.refreshCooldownUntil = Date.now() + 30000;
          await this.handleSessionExpired();
          return {
            success: false,
            message: 'Session expired. Please log in again.',
          };
        }
      }

      let json: any = null;
      try {
        json = await res.json();
      } catch (_) {
        // Non-JSON response (e.g. 502 Bad Gateway HTML)
        return {
          success: res.ok,
          message: res.ok ? 'Success' : `Request failed with status ${res.status}`,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          message: json?.message || `Request failed with status ${res.status}`,
        };
      }
      return json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out. Please try again.',
        };
      }
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

  /**
   * Immediate cleanup of expired credentials across memory and persistent storage
   */
  private async handleSessionExpired(): Promise<void> {
    this.token = null;
    try {
      await StorageService.removeItem(StorageService.KEYS.AUTH_TOKEN);
      await StorageService.removeItem(StorageService.KEYS.REFRESH_TOKEN);
      await StorageService.removeItem(StorageService.KEYS.USER);
    } catch (_) {}
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
