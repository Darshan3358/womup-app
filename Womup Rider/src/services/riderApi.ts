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
  : 'https://womup-app-uquz.onrender.com/api/v1';

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

  // --- AUTHENTICATION & ONBOARDING (EMAIL-BASED OTP & PASSWORD) ---
  static async sendOtp(email: string): Promise<{ success: boolean; verificationId?: string; message: string; debugOtp?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const json = await res.json();
      const data = this.unwrapData<any>(json);
      if (res.ok) {
        return {
          success: true,
          verificationId: data?.verificationId || json?.verificationId,
          message: data?.message || json?.message || `OTP sent to ${cleanEmail}`,
          debugOtp: data?.debugOtp || json?.debugOtp,
        };
      }
      throw new Error(data?.message || json?.message || 'Failed to send OTP to email');
    } catch (err: any) {
      // Fallback endpoint
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const json = await res.json();
      const data = this.unwrapData<any>(json);
      if (res.ok) {
        return {
          success: true,
          verificationId: data?.verificationId || json?.verificationId,
          message: data?.message || json?.message || `OTP sent to ${cleanEmail}`,
        };
      }
      throw new Error(data?.message || json?.message || err.message);
    }
  }

  static async verifyOtp(
    email: string,
    otp: string,
    verificationId?: string,
  ): Promise<{ token: string; rider: RiderProfile; isNewRider?: boolean; verificationId?: string; email?: string; registrationToken?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        otp: otp.trim(),
        verificationId,
      }),
    });
    const json = await res.json();
    const data = this.unwrapData<any>(json);

    if (res.ok) {
      const token = data?.accessToken || json?.accessToken;
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

        const riderData = data?.rider || json?.rider;
        const profile: RiderProfile = {
          id: riderData?.partnerCode || riderData?.riderCode || riderData?.id || 'RDR-001',
          name: riderData?.fullName || riderData?.name || 'Delivery Partner',
          phone: riderData?.mobile || riderData?.phone || riderData?.phoneNumber || '',
          email: riderData?.email || cleanEmail,
          city: riderData?.cityName || riderData?.city || 'Ahmedabad',
          hubId: riderData?.hubId || null,
          hubName: riderData?.hubName || 'Satellite Hub Dark Store',
          vehicleType: riderData?.vehicleType || 'BIKE',
          vehicleNumber: riderData?.vehicleNumber || '',
          rating: riderData?.rating ?? 5.0,
          completedDeliveries: riderData?.totalDeliveries ?? 0,
          status: riderData?.status === 'APPROVED' || riderData?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
          isOnline: riderData?.isOnline ?? true,
        };
        await this.setStorage(STORAGE_KEYS.PROFILE, profile);
        return { token, rider: profile, isNewRider: false };
      }

      // If no token returned yet, it means OTP is verified and rider needs to complete registration steps
      return {
        token: '',
        rider: null as any,
        isNewRider: true,
        verificationId: data?.verificationId || json?.verificationId || verificationId,
        registrationToken: data?.registrationToken || json?.registrationToken,
        email: cleanEmail,
      };
    }

    throw new Error(data?.message || json?.message || 'Invalid OTP code. Please enter the 6-digit code sent to your email.');
  }

  static async loginWithPassword(email: string, password: string): Promise<{ token: string; rider: RiderProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
      }),
    });

    const json = await res.json();
    const data = this.unwrapData<any>(json);

    if (res.ok && (data?.accessToken || json?.accessToken)) {
      const token = data?.accessToken || json?.accessToken;
      this.token = token;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

      const riderData = data?.rider || json?.rider;
      const profile: RiderProfile = {
        id: riderData?.partnerCode || riderData?.riderCode || riderData?.id || 'RDR-001',
        name: riderData?.fullName || riderData?.name || 'Delivery Partner',
        phone: riderData?.mobile || riderData?.phone || riderData?.phoneNumber || '',
        email: riderData?.email || cleanEmail,
        city: riderData?.cityName || riderData?.city || 'Ahmedabad',
        hubId: riderData?.hubId || null,
        hubName: riderData?.hubName || null,
        vehicleType: riderData?.vehicleType || 'BIKE',
        vehicleNumber: riderData?.vehicleNumber || '',
        rating: riderData?.averageRating || riderData?.rating || 5.0,
        completedDeliveries: riderData?.totalDeliveries ?? 0,
        status: 'ACTIVE',
        isOnline: riderData?.isOnline ?? true,
      };

      await this.setStorage(STORAGE_KEYS.PROFILE, profile);
      return { token, rider: profile };
    }

    throw new Error(data?.message || json?.message || 'Invalid email or password');
  }

  static async loginWithEmailOtp(email: string, otp: string): Promise<{ token: string; rider: RiderProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: otp.trim() }),
    });

    const json = await res.json();
    const data = this.unwrapData<any>(json);

    if (res.ok && (data?.accessToken || json?.accessToken)) {
      const token = data?.accessToken || json?.accessToken;
      this.token = token;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

      const riderData = data?.rider || json?.rider;
      const profile: RiderProfile = {
        id: riderData?.partnerCode || riderData?.riderCode || riderData?.id,
        name: riderData?.fullName || riderData?.name || 'Delivery Partner',
        phone: riderData?.mobile || riderData?.phone || '',
        email: riderData?.email || cleanEmail,
        city: riderData?.cityName || riderData?.city || 'Ahmedabad',
        hubId: riderData?.hubId || null,
        hubName: riderData?.hubName || null,
        vehicleType: riderData?.vehicleType || 'BIKE',
        vehicleNumber: riderData?.vehicleNumber || '',
        rating: 5.0,
        completedDeliveries: 0,
        status: 'ACTIVE',
        isOnline: true,
      };

      await this.setStorage(STORAGE_KEYS.PROFILE, profile);
      return { token, rider: profile };
    }

    throw new Error(data?.message || json?.message || 'Invalid OTP code.');
  }

  static async forgotPassword(email: string): Promise<{ message: string; verificationId?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const json = await res.json();
    const data = this.unwrapData<any>(json);
    if (res.ok) {
      return {
        message: data?.message || json?.message || 'Password reset OTP sent to email',
        verificationId: data?.verificationId,
      };
    }
    throw new Error(data?.message || json?.message || 'Failed to request password reset');
  }

  static async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      }),
    });
    const json = await res.json();
    const data = this.unwrapData<any>(json);
    if (res.ok) {
      return { message: data?.message || json?.message || 'Password reset successfully' };
    }
    throw new Error(data?.message || json?.message || 'Failed to reset password');
  }

  static async fetchCities(): Promise<Array<{ id: string; name: string; code: string; status?: string }>> {
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/location/cities`);
      if (res.ok) {
        const json = await res.json();
        const cities = json.data || json;
        if (Array.isArray(cities) && cities.length > 0) {
          return cities.map((c: any) => ({
            id: c.id || c._id?.toString() || c.code,
            name: c.name,
            code: c.code,
            status: c.status || 'Active',
          }));
        }
      }
    } catch (err) {
      console.warn('[RiderApiService] Failed to fetch cities from backend, using fallback', err);
    }

    return [
      { id: 'city_ahm', name: 'Ahmedabad', code: 'AHM', status: 'Active' },
      { id: 'city_sur', name: 'Surat', code: 'SUR', status: 'Active' },
      { id: 'city_bdq', name: 'Vadodara', code: 'BDQ', status: 'Active' },
      { id: 'city_raj', name: 'Rajkot', code: 'RAJ', status: 'Active' },
      { id: 'city_gan', name: 'Gandhinagar', code: 'GAN', status: 'Active' },
    ];
  }

  static async fetchAreas(cityId?: string): Promise<Array<{ id: string; name: string; code?: string }>> {
    try {
      const q = cityId ? `?cityId=${encodeURIComponent(cityId)}` : '';
      const res = await fetch(`${this.getApiBaseUrl()}/location/areas${q}`);
      if (res.ok) {
        const json = await res.json();
        const areas = json.data || json;
        if (Array.isArray(areas) && areas.length > 0) {
          return areas.map((a: any) => ({
            id: a.id || a._id?.toString() || a.name,
            name: a.name,
            code: a.code,
          }));
        }
      }
    } catch (err) {
      console.warn('[RiderApiService] Failed to fetch areas, using fallback', err);
    }

    return [
      { id: 'area_1', name: 'Chandlodiya - Tragad', code: 'AREA-CHANDLODIYA_TRAGAD' },
      { id: 'area_2', name: 'Satellite Hub', code: 'AREA-SATELLITE' },
      { id: 'area_3', name: 'Vastrapur - Bodakdev', code: 'AREA-VASTRAPUR' },
      { id: 'area_4', name: 'Ghatlodiya - Memnagar', code: 'AREA-GHATLODIYA' },
      { id: 'area_5', name: 'Navrangpura - C.G. Road', code: 'AREA-NAVRANGPURA' },
    ];
  }

  static async registerRider(data: {
    registrationToken?: string;
    verificationId?: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    mobile?: string;
    password?: string;
    city: string;
    cityId?: string;
    cityName?: string;
    areaId?: string;
    areaName?: string;
    vehicleType: string;
    vehicleNumber: string;
    drivingLicense?: string;
    drivingLicenseNumber?: string;
    dlImageUrl?: string;
    address?: string;
    aadharNumber?: string;
    aadharFrontUrl?: string;
    aadharBackUrl?: string;
    profilePhotoUrl?: string;
    rcNumber?: string;
    rcImageUrl?: string;
    vehicleInsuranceUrl?: string;
    vehicleModelYear?: string;
    hubId?: string;
    shiftPreference?: string;
    emergencyContact?: string;
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  }): Promise<{ token: string; rider: RiderProfile }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanMobile = (data.mobile || data.phoneNumber || '9876543210').trim().replace(/\s+/g, '').replace(/^\+91/, '');
    const chosenCity = data.cityName || data.city || 'Ahmedabad';
    const chosenArea = data.areaName || 'Chandlodiya - Tragad';

    const payload = {
      registrationToken: data.registrationToken,
      verificationId: data.verificationId,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      mobile: cleanMobile,
      phoneNumber: cleanMobile,
      password: data.password || 'secure123',
      city: chosenCity,
      cityName: chosenCity,
      cityId: data.cityId,
      areaName: chosenArea,
      areaId: data.areaId,
      vehicleType: data.vehicleType || 'BIKE',
      vehicleNumber: data.vehicleNumber.trim().toUpperCase(),
      drivingLicense: (data.drivingLicense || data.drivingLicenseNumber || '').trim().toUpperCase(),
      dlImageUrl: data.dlImageUrl,
      address: data.address?.trim(),
      aadharNumber: data.aadharNumber,
      aadharFrontUrl: data.aadharFrontUrl,
      aadharBackUrl: data.aadharBackUrl,
      profilePhotoUrl: data.profilePhotoUrl,
      rcNumber: data.rcNumber,
      rcImageUrl: data.rcImageUrl,
      vehicleInsuranceUrl: data.vehicleInsuranceUrl,
      vehicleModelYear: data.vehicleModelYear,
      hubId: data.hubId,
      shiftPreference: data.shiftPreference,
      emergencyContact: data.emergencyContact,
      bankName: data.bankName,
      bankBranch: data.bankBranch,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      upiId: data.upiId,
    };

    const res = await fetch(`${this.getApiBaseUrl()}/rider/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    const responseData = this.unwrapData<any>(json);

    if (res.ok && (responseData?.accessToken || json?.accessToken)) {
      const token = responseData?.accessToken || json?.accessToken;
      this.token = token;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

      const riderData = responseData?.rider || json?.rider;
      const profile: RiderProfile = {
        id: riderData?.riderCode || riderData?.partnerCode || riderData?.id || 'RDR-001',
        name: riderData?.fullName || riderData?.name || data.fullName,
        phone: riderData?.mobile || riderData?.phone || `+91${cleanMobile}`,
        email: riderData?.email || cleanEmail,
        city: riderData?.cityName || riderData?.city || chosenCity,
        hubId: riderData?.hubId || null,
        hubName: chosenArea || riderData?.hubName || 'Satellite Hub Dark Store',
        vehicleType: (riderData?.vehicleType || data.vehicleType) as any,
        vehicleNumber: riderData?.vehicleNumber || data.vehicleNumber,
        rating: 5.0,
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch (e) {}
    }, 6000);

    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/me`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
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
        verificationStatus: remoteProfile.verificationStatus || (remoteProfile.status === 'APPROVED' ? 'VERIFIED' : remoteProfile.status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        isOnline: remoteProfile.isOnline ?? false,
      };
      await this.setStorage(STORAGE_KEYS.PROFILE, mapped);
      return mapped;
    } catch (err: any) {
      clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch (e) {}
    }, 6000);

    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/active-order`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
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
    const cleanInput = (packageCode || '').trim();
    if (!cleanInput) {
      throw new Error('Please enter the Bag Barcode printed on the sealed tote bag.');
    }

    const current = await this.getActiveDelivery();
    if (current?.bagBarcode) {
      const expected = current.bagBarcode.trim().toUpperCase();
      if (expected && cleanInput.toUpperCase() !== expected) {
        throw new Error(`Invalid bag barcode "${cleanInput}". Expected barcode is ${expected}.`);
      }
    }

    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/pickup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ packageCode: cleanInput }),
    });

    if (!res.ok) {
      let errMsg = 'Verification failed: Invalid bag barcode.';
      try {
        const errData = await res.json();
        if (errData?.message) {
          errMsg = errData.message;
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errMsg);
    }

    const updated = await res.json().catch(() => null);
    if (updated && updated.id) {
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, updated);
      return updated;
    }

    if (current) {
      current.stepStatus = 'OUT_FOR_DELIVERY';
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, current);
      return current;
    }
    throw new Error('Delivery not found');
  }

  static async collectCash(orderId: string, amount?: number): Promise<boolean> {
    try {
      const headers = await this.getAuthHeader();
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/orders/${orderId}/collect-cash`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const current = await this.getActiveDelivery();
        if (current) {
          current.cashCollected = true;
          if (typeof amount === 'number') current.cashCollectedAmount = amount;
          await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, current);
        }
        return true;
      }
    } catch (e) {
      console.warn('Failed to call backend collect-cash:', e);
    }
    const current = await this.getActiveDelivery();
    if (current) {
      current.cashCollected = true;
      if (typeof amount === 'number') current.cashCollectedAmount = amount;
      await this.setStorage(STORAGE_KEYS.ACTIVE_DELIVERY, current);
    }
    return true;
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
        const base = serverBreakdown?.basePay ?? current.payoutAmount ?? 20;
        const bonus = 0; // Incentives removed completely
        const tip = typeof serverBreakdown?.tip === 'number' ? serverBreakdown.tip : (current.tip ?? 0);
        const total = serverBreakdown?.total ?? (base + tip);

        const history = await this.getSettlementHistory();
        history.unshift({
          id: `ST-${Date.now().toString().slice(-4)}`,
          date: 'Just Now',
          orderNumber: current.orderNumber,
          baseAmount: base,
          bonus: 0,
          tip: tip,
          total: total,
          status: 'SETTLED',
        });
        await this.setStorage(STORAGE_KEYS.SETTLEMENTS, history);

        // Update summary
        const summary = await this.getSettlementSummary();
        summary.todayCompleted += 1;
        summary.basePayout = (summary.basePayout || 0) + base;
        summary.incentives = 0;
        summary.incentivesEarned = 0;
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
    if (
      !coords ||
      typeof coords.latitude !== 'number' ||
      isNaN(coords.latitude) ||
      typeof coords.longitude !== 'number' ||
      isNaN(coords.longitude)
    ) {
      return false;
    }

    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/location`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: Number(coords.latitude),
          longitude: Number(coords.longitude),
          speed: Math.max(0, Number(coords.speed) || 0),
          heading: Math.max(0, Math.min(360, Number(coords.heading) || 0)),
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
  static async getRiderWallet(): Promise<{
    balance: number;
    pendingTransfer: number;
    lifetimeEarnings: number;
    bankAccount: RiderBankAccount | null;
    transactions: {
      id: string;
      title: string;
      timestamp: string;
      amount: number;
      type: 'EARNING' | 'TIP' | 'INCENTIVE' | 'WITHDRAWAL';
    }[];
  }> {
    const defaultData = {
      balance: 0,
      pendingTransfer: 0,
      lifetimeEarnings: 0,
      bankAccount: null,
      transactions: [],
    };

    if (!(await this.hasValidToken())) {
      return defaultData;
    }
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/wallet`, { headers });
      if (res.status === 401) {
        await this.clearAuth();
        return defaultData;
      }
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any>(raw);
        if (data) {
          return {
            balance: typeof data.balance === 'number' ? data.balance : Number(data.balance) || 0,
            pendingTransfer: typeof data.pendingTransfer === 'number' ? data.pendingTransfer : Number(data.pendingTransfer) || 0,
            lifetimeEarnings: typeof data.lifetimeEarnings === 'number' ? data.lifetimeEarnings : Number(data.lifetimeEarnings) || 0,
            bankAccount: data.bankAccount || null,
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
          };
        }
      }
    } catch {
      // ignore
    }
    return defaultData;
  }

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

  static async getPaymentInfo(): Promise<{
    adminUpiId: string;
    adminUpiName: string;
    supportPhone: string;
    riderOwesAdmin: number;
    totalCodCollected: number;
    totalEarnings: number;
    cashLimit: number;
    isOrderBlocked: boolean;
    hasPendingVerification: boolean;
    pendingRequest?: {
      id: string;
      amount: number;
      utrNumber: string;
      status: string;
      requestedAt: string;
    } | null;
  }> {
    const defaultInfo = {
      adminUpiId: 'wormup@okicici',
      adminUpiName: 'WormUp Technologies Pvt Ltd',
      supportPhone: '+91 98765 43210',
      riderOwesAdmin: 0,
      totalCodCollected: 0,
      totalEarnings: 0,
      cashLimit: 500,
      isOrderBlocked: false,
      hasPendingVerification: false,
      pendingRequest: null,
    };
    if (!(await this.hasValidToken())) return defaultInfo;
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/payment-info`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any>(raw);
        if (data) {
          return {
            adminUpiId: data.adminUpiId || 'wormup@okicici',
            adminUpiName: data.adminUpiName || 'WormUp Technologies Pvt Ltd',
            supportPhone: data.supportPhone || '+91 98765 43210',
            riderOwesAdmin: Number(data.riderOwesAdmin) || 0,
            totalCodCollected: Number(data.totalCodCollected) || 0,
            totalEarnings: Number(data.totalEarnings) || 0,
            cashLimit: Number(data.cashLimit) || 500,
            isOrderBlocked: Boolean(data.isOrderBlocked),
            hasPendingVerification: Boolean(data.hasPendingVerification),
            pendingRequest: data.pendingRequest || null,
          };
        }
      }
    } catch {
      // ignore
    }
    return defaultInfo;
  }

  static async submitSettlementProof(
    amount: number,
    utrNumber: string
  ): Promise<{ success: boolean; message: string; request?: any }> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount, utrNumber }),
      });
      const raw = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          message: raw.message || 'Settlement request submitted successfully!',
          request: raw.request,
        };
      }
      return {
        success: false,
        message: raw.message || 'Failed to submit settlement request. Please check UTR and try again.',
      };
    } catch {
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
      };
    }
  }

  static async getMySettlementRequests(): Promise<any[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/settlements/my-requests`, { headers });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<any[]>(raw);
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
      if (data && (data.bankName || data.accountNumber || data.accountNumberFull)) {
        return {
          bankName: data.bankName || '',
          accountNumberMasked: data.maskedAccount || data.accountNumberMasked || '•••• ' + (data.last4 || ''),
          accountNumberFull: data.accountNumberFull || data.accountNumber || '',
          ifscCode: data.ifsc || data.ifscCode || '',
          accountHolderName: data.accountHolderName || '',
          upiId: data.upiId || '',
          isVerified: data.verificationStatus === 'VERIFIED',
          verificationStatus: data.verificationStatus || 'PENDING',
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
          upiId: data.upiId,
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
        const data = this.unwrapData<any[]>(raw);
        if (Array.isArray(data)) {
          return data.map((d) => ({
            id: d.id,
            type: d.type,
            title: d.title,
            documentNumberMasked: d.documentNumberMasked,
            fileUrl: d.fileUrl || d.url || '',
            url: d.url || d.fileUrl || '',
            backUrl: d.backUrl || '',
            status: d.status,
            issuedAt: d.issuedAt,
            expiresAt: d.expiresAt,
            rejectionReason: d.rejectionReason,
          }));
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  static async updateDocument(id: string, updates: Partial<RiderDocument>): Promise<RiderDocument[]> {
    const headers = await this.getAuthHeader();
    try {
      const res = await fetch(`${this.getApiBaseUrl()}/delivery/documents/${id}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: updates.fileUrl,
          documentNumber: updates.documentNumberMasked,
        }),
      });
      if (res.ok) {
        const raw = await res.json();
        const data = this.unwrapData<RiderDocument[]>(raw);
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Failed to save document to backend:', e);
    }
    return this.getDocuments();
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
