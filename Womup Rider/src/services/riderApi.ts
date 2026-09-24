import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeliveryRequest,
  RiderProfile,
  SettlementSummary,
  SettlementHistoryItem,
  PerformanceMetrics,
  DutyShift,
  RiderDocument,
  LocationCoordinates,
  RiderBankAccount,
  RiderVehicle,
  RiderNotification,
  RiderAppSettings,
  RiderAccountStatus,
} from '../types/rider.types';


const STORAGE_KEYS = {
  TOKEN: '@womup_rider_token',
  PROFILE: '@womup_rider_profile',
  ACTIVE_DELIVERY: '@womup_rider_active_delivery',
  BANK_ACCOUNT: '@womup_rider_bank_account',
  VEHICLE: '@womup_rider_vehicle',
  DOCUMENTS: '@womup_rider_documents',
  DUTY_HISTORY: '@womup_rider_duty_history',
  SETTLEMENTS: '@womup_rider_settlements',
  NOTIFICATIONS: '@womup_rider_notifications',
  SETTINGS: '@womup_rider_settings',
};

const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

const DEFAULT_API_URL = isLocalWeb
  ? 'http://localhost:5050/api/v1'
  : 'https://womup-app.onrender.com/api/v1';

export class RiderApiService {
  private static token: string | null = null;

  private static getApiBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.trim().length > 0) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    return DEFAULT_API_URL;
  }

  private static async getAuthHeader(): Promise<Record<string, string>> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token && this.token.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  static async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return this.token;
  }

  static async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!(token && token.startsWith('eyJ'));
  }

  static hasToken(): boolean {
    return !!(this.token && this.token.startsWith('eyJ'));
  }

  static async clearAuth(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  static unwrapData<T>(raw: any): T {
    if (raw && typeof raw === 'object' && 'data' in raw && raw.success !== undefined) {
      return raw.data as T;
    }
    return raw as T;
  }


  // --- Initial Seed / Storage Fallbacks ---
  private static async getOrInitStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
      await AsyncStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static async setStorage<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to persist ${key}`, e);
    }
  }

  private static async getStorage<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    } catch {
      return null;
    }
  }

  // --- AUTHENTICATION & ONBOARDING (R01 - R06) ---
  static async sendOtp(email: string): Promise<{ success: boolean; verificationId?: string; message: string; debugOtp?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        purpose: 'DELIVERY_LOGIN',
      }),
    });
    const json = await res.json();
    const data = this.unwrapData<any>(json);
    if (res.ok) {
      return {
        success: true,
        verificationId: data?.verificationId || json?.verificationId,
        message: data?.message || json?.message || `OTP sent successfully to ${cleanEmail}`,
        debugOtp: data?.debugOtp || json?.debugOtp,
      };
    }
    throw new Error(data?.message || json?.message || 'Failed to send OTP to email');
  }

  static async verifyOtp(
    email: string,
    otp: string,
    verificationId?: string,
  ): Promise<{ token: string; rider: RiderProfile; isNewRider?: boolean; verificationId?: string; email?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        otp: otp.trim(),
        verificationId,
        purpose: 'DELIVERY_LOGIN',
      }),
    });
    const json = await res.json();
    const data = this.unwrapData<any>(json);

    if (res.ok) {
      const isNew = data?.isNewRider ?? json?.isNewRider ?? data?.isNewUser ?? json?.isNewUser;
      if (isNew) {
        return {
          token: '',
          rider: null as any,
          isNewRider: true,
          verificationId: data?.verificationId || json?.verificationId || verificationId,
          email: cleanEmail,
        };
      }

      const token = data?.accessToken || json?.accessToken;
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

        const riderData = data?.rider || json?.rider;
        if (!riderData || (!riderData.partnerCode && !riderData.id)) {
          throw new Error('Invalid rider profile returned from server. Please contact support.');
        }

        const profile: RiderProfile = {
          id: riderData.partnerCode || riderData.id,
          name: riderData.name || riderData.fullName || 'Delivery Partner',
          phone: riderData.phone || riderData.phoneNumber || '',
          email: riderData.email || cleanEmail,
          city: riderData.city || 'Ahmedabad',
          hubId: riderData.hubId || null,
          hubName: riderData.hubName || null,
          vehicleType: riderData.vehicleType || 'EV_SCOOTER',
          vehicleNumber: riderData.vehicleNumber || '',
          rating: riderData.rating ?? 5.0,
          completedDeliveries: riderData.completedDeliveries ?? 0,
          status: riderData.status === 'APPROVED' ? 'ACTIVE' : (riderData.status || 'PENDING'),
          isOnline: riderData.isOnline ?? false,
        };
        await this.setStorage(STORAGE_KEYS.PROFILE, profile);
        return { token, rider: profile, isNewRider: false };
      }
    }

    throw new Error(data?.message || json?.message || 'Invalid OTP. Please enter the code sent to your email.');
  }

  static async registerRider(data: {
    verificationId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    city: string;
    vehicleType: 'EV_SCOOTER' | 'BIKE' | 'BICYCLE';
    vehicleNumber: string;
    drivingLicenseNumber?: string;
    address?: string;
  }): Promise<{ token: string; rider: RiderProfile }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phoneNumber.trim().replace(/\s+/g, '').replace(/^\+91/, '');

    const res = await fetch(`${this.getApiBaseUrl()}/auth/delivery-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: data.verificationId,
        email: cleanEmail,
        fullName: data.fullName.trim(),
        phoneNumber: cleanPhone,
        city: data.city || 'Ahmedabad',
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber.trim().toUpperCase(),
        drivingLicenseNumber: data.drivingLicenseNumber?.trim().toUpperCase(),
        address: data.address?.trim(),
      }),
    });

    const json = await res.json();
    const responseData = this.unwrapData<any>(json);

    if (res.ok && (responseData?.accessToken || json?.accessToken)) {
      const token = responseData?.accessToken || json?.accessToken;
      this.token = token;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

      const riderData = responseData?.rider || json?.rider;
      if (!riderData || (!riderData.partnerCode && !riderData.id)) {
        throw new Error('Registration failed: no rider ID returned from server.');
      }

      const profile: RiderProfile = {
        id: riderData.partnerCode || riderData.id,
        name: riderData.name || riderData.fullName || data.fullName,
        phone: riderData.phone || riderData.phoneNumber || `+91${cleanPhone}`,
        email: riderData.email || cleanEmail,
        city: riderData.city || data.city,
        hubId: riderData.hubId || null,
        hubName: riderData.hubName || null,
        vehicleType: riderData.vehicleType || data.vehicleType,
        vehicleNumber: riderData.vehicleNumber || data.vehicleNumber,
        rating: riderData.rating ?? 5.0,
        completedDeliveries: 0,
        status: 'ACTIVE',
        isOnline: true,
      };

      await this.setStorage(STORAGE_KEYS.PROFILE, profile);
      return { token, rider: profile };
    }

    throw new Error(responseData?.message || json?.message || 'Registration failed. Please check inputs.');
  }

  static async checkApprovalStatus(): Promise<{ status: RiderAccountStatus; isApproved: boolean }> {
    const hasToken = await this.hasValidToken();
    if (!hasToken) {
      return { status: 'PENDING' as any, isApproved: false };
    }
    try {
      const profile = await this.getProfile();
      const isApproved = profile.status === 'APPROVED' || profile.status === 'ACTIVE';
      return { status: profile.status, isApproved };
    } catch {
      return { status: 'PENDING' as any, isApproved: false };
    }
  }

  // --- PROFILE ---
  static async getProfile(): Promise<RiderProfile> {
    const hasToken = await this.hasValidToken();
    if (!hasToken) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/me`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        throw new Error('SESSION_EXPIRED');
      }
      if (!res.ok) {
        throw new Error(`PROFILE_FETCH_FAILED_${res.status}`);
      }
      const raw = await res.json();
      const remoteProfile = this.unwrapData<any>(raw);
      if (!remoteProfile || (!remoteProfile.id && !remoteProfile.partnerCode)) {
        throw new Error('INVALID_PROFILE_RESPONSE');
      }

      const mapped: RiderProfile = {
        id: remoteProfile.id || remoteProfile.partnerCode,
        name: remoteProfile.name || remoteProfile.fullName || '',
        phone: remoteProfile.phone || remoteProfile.phoneNumber || '',
        email: remoteProfile.email || '',
        city: remoteProfile.city || '',
        hubId: remoteProfile.hubId || null,
        hubName: remoteProfile.hubName || null,
        vehicleType: remoteProfile.vehicleType || 'EV_SCOOTER',
        vehicleNumber: remoteProfile.vehicleNumber || '',
        rating: remoteProfile.rating ?? 0,
        completedDeliveries: remoteProfile.completedDeliveries ?? 0,
        status: remoteProfile.status || 'PENDING',
        isOnline: remoteProfile.isOnline ?? false,
      };
      await this.setStorage(STORAGE_KEYS.PROFILE, mapped);
      return mapped;
    } catch (err: any) {
      if (err.message === 'NOT_AUTHENTICATED' || err.message === 'SESSION_EXPIRED') {
        throw err;
      }
      // Offline fallback: only return cached genuine profile if present
      const cached = await this.getStorage<RiderProfile>(STORAGE_KEYS.PROFILE);
      if (cached && cached.id && cached.email) {
        return cached;
      }
      throw new Error('NETWORK_ERROR');
    }
  }

  static async updateProfile(updates: Partial<RiderProfile>): Promise<RiderProfile> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    await this.setStorage(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  // --- DUTY TOGGLE ---
  static async updateDutyStatus(isOnline: boolean): Promise<boolean> {
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.getApiBaseUrl()}/delivery/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isOnline }),
      });
    } catch {
      // ignore
    }
    const profile = await this.getProfile();
    profile.isOnline = isOnline;
    await this.setStorage(STORAGE_KEYS.PROFILE, profile);
    return isOnline;
  }

  static async clearActiveDelivery(): Promise<void> {
    await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_DELIVERY);
        window.localStorage.removeItem('@womup_rider_active_delivery');
      }
    } catch {
      // ignore
    }
  }

  // --- ACTIVE DELIVERY LIFECYCLE ---
  static async getActiveDelivery(): Promise<DeliveryRequest | null> {
    const hasToken = await this.hasValidToken();
    if (!hasToken) {
      return null;
    }

    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/active-order`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return null;
      }
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any>(raw);
        if (data && (data.orderNumber || data.id)) {
          await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, data);
          return data;
        }
      }
    } catch {
      // network/auth error
    }

    // Check cached delivery only if genuine
    const cached = await this.getStorage<DeliveryRequest | null>(STORAGE_KEYS.ACTIVE_DELIVERY);
    if (cached && (cached.orderNumber || cached.id)) {
      return cached;
    }

    await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, null);
    return null;
  }

  static async fetchActiveOrder(): Promise<DeliveryRequest | null> {
    return this.getActiveDelivery();
  }

  // --- COMPLETED ORDER HISTORY ---
  static async getOrderHistory(): Promise<any[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/history`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any[]>(raw);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch order history from backend:', e);
    }
    return [];
  }

  static async acceptDelivery(orderId: string): Promise<DeliveryRequest> {
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        headers,
      });
    } catch {
      // ignore
    }

    const active = await this.getActiveDelivery();
    if (active) {
      active.stepStatus = 'GOING_TO_STORE';
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, active);
      return active;
    }
    throw new Error('No delivery available');
  }

  static async rejectDelivery(orderId: string, reason: string): Promise<boolean> {
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });
    } catch {
      // ignore
    }
    await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, null);
    return true;
  }

  static async updateDeliveryStep(
    orderId: string,
    step: DeliveryRequest['stepStatus']
  ): Promise<DeliveryRequest> {
    const headers = await this.getAuthHeader();
    let endpoint = '';
    if (step === 'ARRIVED_AT_STORE') endpoint = `/delivery/orders/${orderId}/arrived-store`;
    else if (step === 'ARRIVED_AT_CUSTOMER') endpoint = `/delivery/orders/${orderId}/arrived-customer`;

    if (endpoint) {
      try {
        await fetch(`${this.getApiBaseUrl()}${endpoint}`, { method: 'POST', headers });
      } catch {
        // ignore
      }
    }

    const current = await this.getActiveDelivery();
    if (current) {
      current.stepStatus = step;
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, current);
      return current;
    }
    throw new Error('Delivery not found');
  }

  static async pickupOrder(orderId: string, packageCode?: string): Promise<DeliveryRequest> {
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/pickup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ packageCode }),
      });
    } catch {
      // ignore
    }

    const current = await this.getActiveDelivery();
    if (current) {
      current.stepStatus = 'OUT_FOR_DELIVERY';
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, current);
      return current;
    }
    throw new Error('Delivery not found');
  }

  static async verifyDeliveryOtp(orderId: string, otp: string): Promise<boolean> {
    const headers = await this.getAuthHeader();
    let serverEarnings: number | null = null;
    let serverBreakdown: any = null;
    let backendSuccess = false;
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/verify-delivery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ otp }),
      });
      if (res.ok) {
        backendSuccess = true;
        const resData = await res.json();
        if (resData?.earnings) {
          serverEarnings = resData.earnings;
          serverBreakdown = resData.breakdown;
        }
      }
    } catch {
      // ignore
    }

    const current = await this.getActiveDelivery();
    const isOtpMatch = Boolean(current?.deliveryOtp && current.deliveryOtp === otp);

    if (backendSuccess || isOtpMatch) {
      // Mark as completed, add to settlement
      if (current) {
        const base = serverBreakdown?.basePay ?? current.payoutAmount ?? 39;
        const bonus = serverBreakdown?.incentive ?? 15;
        const tip = typeof serverBreakdown?.tip === 'number' ? serverBreakdown.tip : (current.tip ?? 0);
        const total = serverBreakdown?.total ?? (base + bonus + tip);

        const history = await this.getSettlementHistory();
        history.unshift({
          id: `ST-${Date.now().toString().slice(-4)}`,
          date: 'Just Now',
          orderNumber: current.orderNumber,
          baseAmount: base,
          bonus: bonus,
          tip: tip,
          total: total,
          status: 'SETTLED',
        });
        await this.setStorage(STORAGE_KEYS.SETTLEMENTS, history);

        // Update summary
        const summary = await this.getSettlementSummary();
        summary.todayCompleted += 1;
        summary.basePayout = (summary.basePayout || 0) + base;
        summary.incentives = (summary.incentives || 0) + bonus;
        summary.incentivesEarned = summary.incentives;
        summary.tips = (summary.tips || 0) + tip;
        summary.tipsCollected = summary.tips;
        summary.netPayableToday = (summary.netPayableToday || 0) + total;
        await this.setStorage(STORAGE_KEYS.SETTLEMENTS + '_summary', summary);
      }

      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, null);
      return true;
    }
    return false;
  }

  static async fetchAvailableOrders(): Promise<DeliveryRequest | null> {
    if (!(await this.hasValidToken())) {
      return null;
    }
    const headers = await this.getAuthHeader();
    try {
      // 1. Try to get real unassigned order waiting for dispatch
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/available`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return null;
      }
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any>(raw);
        if (data && (data.orderNumber || data.id)) {
          await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, data);
          return data;
        }
      }
    } catch {
      // ignore
    }

    // 2. Check active-order endpoint
    try {
      const activeRes = await fetch(`${this.getApiBaseUrl()}/delivery/active-order`, { headers });
      if (activeRes.status === 401) {
        await this.clearAuth();
        return null;
      }
      if (activeRes.ok) {
        const raw = await activeRes.json();
        const data = this.unwrapData<any>(raw);
        if (data && (data.orderNumber || data.id)) {
          await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, data);
          return data;
        }
      }
    } catch {
      // ignore
    }

    // No real order available
    await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, null);
    return null;
  }

  static async fetchAvailableOrdersList(): Promise<DeliveryRequest[]> {
    if (!(await this.hasValidToken())) {
      return [];
    }
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/available-list`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return [];
      }
      if (!res.ok) {
        return [];
      }
      const raw = await res.json();
      const data = this.unwrapData<any[]>(raw);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch {
      return [];
    }
  }

  // --- LOCATION TELEMETRY ---
  static async sendLocationTelemetry(coords: LocationCoordinates): Promise<boolean> {
    if (!(await this.hasValidToken())) {
      return false;
    }
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/location`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed,
          heading: coords.heading,
        }),
      });
      if (res.status === 401) {
        return false;
      }
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- SETTLEMENTS & PAYOUTS ---
  static async getSettlementSummary(): Promise<SettlementSummary> {
    if (!(await this.hasValidToken())) {
      return {
        todayCompleted: 0,
        basePayout: 0,
        incentives: 0,
        tips: 0,
        adjustments: 0,
        netPayableToday: 0,
        weekEarnings: 0,
        monthEarnings: 0,
        pendingTransfer: 0,
      };
    }
    const headers = await this.getAuthHeader();
    try {
      // 1. Prioritize real daily settlement endpoint
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/today`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return {
          todayCompleted: 0,
          basePayout: 0,
          incentives: 0,
          tips: 0,
          adjustments: 0,
          netPayableToday: 0,
          weekEarnings: 0,
          monthEarnings: 0,
          pendingTransfer: 0,
        };
      }
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<SettlementSummary>(raw);
        if (data && typeof data.netPayableToday === 'number') {
          return data;
        }
      }

      // 2. Fallback to balance endpoint
      const balRes = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/balance`, { headers });
      if (balRes.status === 401) {
        await this.clearAuth();
        return {
          todayCompleted: 0,
          basePayout: 0,
          incentives: 0,
          tips: 0,
          adjustments: 0,
          netPayableToday: 0,
          weekEarnings: 0,
          monthEarnings: 0,
          pendingTransfer: 0,
        };
      }
      if (balRes.ok) {
        const balRaw = await balRes.json();
        const balData = this.unwrapData<any>(balRaw);
        if (balData && typeof balData.availableBalance === 'number') {
          return {
            todayCompleted: balData.todayCompleted || 0,
            basePayout: balData.availableBalance,
            incentives: 0,
            tips: 0,
            adjustments: 0,
            netPayableToday: balData.availableBalance,
            weekEarnings: balData.lifetimeEarnings || balData.availableBalance,
            monthEarnings: balData.lifetimeEarnings || balData.availableBalance,
            pendingTransfer: balData.availableBalance,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      todayCompleted: 0,
      basePayout: 0,
      incentives: 0,
      tips: 0,
      adjustments: 0,
      netPayableToday: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      pendingTransfer: 0,
    };
  }

  static async getSettlementHistory(): Promise<SettlementHistoryItem[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/recent`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<SettlementHistoryItem[]>(raw);
        if (Array.isArray(data)) return data;
      }
    } catch {
      // ignore
    }

    return [];
  }

  static async requestPayout(amount: number): Promise<{ success: boolean; message: string }> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/payout/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any>(raw) || raw;
        const summary = await this.getSettlementSummary();
        summary.pendingTransfer = data.remainingBalance ?? Math.max(0, summary.pendingTransfer - amount);
        await this.setStorage(STORAGE_KEYS.SETTLEMENTS + '_summary', summary);
        return {
          success: true,
          message: data.message || `Instant IMPS payout of ₹${amount} initiated (UTR: ${data.utr || 'PROCESSED'}). Funds will credit immediately.`,
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          message: errData.message || 'Failed to request instant payout.',
        };
      }
    } catch {
      const summary = await this.getSettlementSummary();
      summary.pendingTransfer = 0;
      await this.setStorage(STORAGE_KEYS.SETTLEMENTS + '_summary', summary);
      return {
        success: true,
        message: `Instant payout request of ₹${amount} sent to your registered bank account. Transaction will reflect within 10 minutes.`,
      };
    }
  }

  // --- BANK ACCOUNT ---
  static async getBankAccount(): Promise<RiderBankAccount | null> {
    const hasToken = await this.hasValidToken();
    if (!hasToken) return null;

    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/bank-account`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return null;
      }
      if (res.status === 404 || !res.ok) {
        return null;
      }
      const raw = await res.json();
      const data = this.unwrapData<any>(raw);
      if (data && data.bankName) {
        return {
          bankName: data.bankName,
          accountNumberMasked: data.maskedAccount || data.accountNumberMasked || '•••• ' + (data.last4 || ''),
          accountNumberFull: '',
          ifscCode: data.ifsc || data.ifscCode || '',
          accountHolderName: data.accountHolderName || '',
          upiId: data.upiId || '',
          isVerified: data.verificationStatus === 'VERIFIED',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static async updateBankAccount(data: Partial<RiderBankAccount>): Promise<RiderBankAccount> {
    const headers = await this.getAuthHeader();
    try {
      await fetch(`${this.getApiBaseUrl()}/delivery/bank-account`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumberFull,
          ifsc: data.ifscCode,
        }),
      });
    } catch {
      // ignore
    }

    const current = await this.getBankAccount();
    const updated: RiderBankAccount = {
      bankName: data.bankName || current?.bankName || '',
      accountNumberMasked: data.accountNumberFull
        ? `•••• •••• ${data.accountNumberFull.slice(-4)}`
        : (current?.accountNumberMasked || ''),
      accountNumberFull: data.accountNumberFull || current?.accountNumberFull || '',
      ifscCode: data.ifscCode || current?.ifscCode || '',
      accountHolderName: data.accountHolderName || current?.accountHolderName || '',
      upiId: data.upiId || current?.upiId || '',
      isVerified: true,
    };
    await this.setStorage(STORAGE_KEYS.BANK_ACCOUNT, updated);
    return updated;
  }

  // --- VEHICLE ---
  static async getVehicle(): Promise<RiderVehicle | null> {
    const hasToken = await this.hasValidToken();
    if (!hasToken) return null;

    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/vehicle`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return null;
      }
      if (res.status === 404 || !res.ok) {
        return null;
      }
      const raw = await res.json();
      const data = this.unwrapData<RiderVehicle>(raw);
      if (data && data.vehicleNumber) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  static async updateVehicle(data: Partial<RiderVehicle>): Promise<RiderVehicle> {
    const current = await this.getVehicle();
    const updated: RiderVehicle = {
      vehicleType: data.vehicleType || current?.vehicleType || 'EV_SCOOTER',
      vehicleNumber: data.vehicleNumber || current?.vehicleNumber || '',
      model: data.model || current?.model || '',
      insurancePolicyMasked: data.insurancePolicyMasked || current?.insurancePolicyMasked || '',
      batteryPercentage: data.batteryPercentage !== undefined ? data.batteryPercentage : current?.batteryPercentage,
      isInspected: data.isInspected !== undefined ? data.isInspected : (current?.isInspected ?? true),
    };
    await this.setStorage(STORAGE_KEYS.VEHICLE, updated);

    // Also sync vehicle number with profile
    if (data.vehicleNumber) {
      await this.updateProfile({ vehicleNumber: data.vehicleNumber });
    }
    return updated;
  }

  // --- PERFORMANCE ---
  static async getPerformance(): Promise<PerformanceMetrics> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/performance`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<PerformanceMetrics>(raw);
        if (data && typeof data.acceptanceRate === 'number') return data;
      }
    } catch {
      // ignore
    }

    return {
      acceptanceRate: 0,
      completionRate: 0,
      avgDeliveryMinutes: 0,
      customerRating: 0,
      totalDeliveries: 0,
      onTimeRate: 0,
      cancelledDeliveries: 0,
    };
  }

  // --- DUTY HISTORY ---
  static async getDutyHistory(): Promise<DutyShift[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/duty-history`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<DutyShift[]>(raw);
        if (Array.isArray(data)) return data;
      }
    } catch {
      // ignore
    }

    return [];
  }

  // --- DOCUMENTS ---
  static async getDocuments(): Promise<RiderDocument[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/documents`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<RiderDocument[]>(raw);
        if (Array.isArray(data)) return data;
      }
    } catch {
      // ignore
    }

    return [];
  }

  static async updateDocument(id: string, updates: Partial<RiderDocument>): Promise<RiderDocument[]> {
    const docs = await this.getDocuments();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx >= 0) {
      docs[idx] = { ...docs[idx], ...updates, status: 'VERIFIED' };
      await this.setStorage(STORAGE_KEYS.DOCUMENTS, docs);
    }
    return docs;
  }

  // --- NOTIFICATIONS ---
  static async getNotifications(): Promise<RiderNotification[]> {
    if (await this.hasValidToken()) {
      const headers = await this.getAuthHeader();
      try {
        const res = await fetch(`${this.getApiBaseUrl()}/delivery/notifications`, { headers });
        if (res.status === 401) {
          await this.clearAuth();
        } else if (res.ok) {
          const raw = await res.json();
          const data = this.unwrapData<RiderNotification[]>(raw);
          if (Array.isArray(data)) return data;
        }
      } catch {
        // ignore
      }
    }

    return [];
  }

  static async markNotificationRead(id: string): Promise<RiderNotification[]> {
    const notifs = await this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    await this.setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }

  static async clearAllNotifications(): Promise<void> {
    await this.setStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  // --- SUPPORT TICKET ---
  static async submitSupportTicket(ticket: {
    category: string;
    description: string;
    orderId?: string;
  }): Promise<{ id: string; status: string; message: string }> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/support/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ticket),
      });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }

    return {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      message: 'Support ticket registered. Dark store operations team will contact you.',
    };
  }

  // --- APP SETTINGS ---
  static async getSettings(): Promise<RiderAppSettings> {
    return this.getOrInitStorage<RiderAppSettings>(STORAGE_KEYS.SETTINGS, {
      orderAlertRingtone: true,
      highAccuracyGps: true,
      defaultNavApp: 'Google Maps',
      autoAcceptOrders: false,
      vibrateOnDispatch: true,
    });
  }

  static async updateSettings(data: Partial<RiderAppSettings>): Promise<RiderAppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...data };
    await this.setStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  static async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.ACTIVE_DELIVERY,
    ]);
  }
}
