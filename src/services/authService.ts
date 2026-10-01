import { UserProfile, Address } from '../types';
import { api } from './api';
import { StorageService } from './storageService';

export const INITIAL_ADDRESS: Address = {
  id: '',
  type: 'Home',
  fullName: '',
  phoneNumber: '',
  houseFlat: '',
  areaLandmark: '',
  city: '',
  pincode: '',
  isDefault: true,
};

export const INITIAL_USER: UserProfile = {
  fullName: '',
  phoneNumber: '',
  email: '',
  referralCode: '',
  shoppingCoins: 0,
  savedAddresses: [],
};

export const AuthService = {
  async sendOtp(email: string): Promise<{ success: boolean; verificationId?: string; message?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await api.post<any>('/auth/send-otp', { email: normalizedEmail });
    if (res.success && res.data?.verificationId) {
      return {
        success: true,
        verificationId: res.data.verificationId,
        message: res.data.message || 'OTP sent successfully',
      };
    }
    return {
      success: false,
      message: res.message || 'Failed to send OTP',
    };
  },

  async verifyOtp(
    verificationId: string,
    otp: string,
  ): Promise<{ success: boolean; isNewUser?: boolean; user?: any; token?: string; message?: string }> {
    const res = await api.post<any>('/auth/verify-otp', { verificationId, otp });
    if (res.success && res.data) {
      if (res.data.accessToken) {
        api.setToken(res.data.accessToken);
        await StorageService.saveItem(StorageService.KEYS.AUTH_TOKEN, res.data.accessToken);
        if (res.data.refreshToken) {
          await StorageService.saveItem(StorageService.KEYS.REFRESH_TOKEN, res.data.refreshToken);
        }
      }
      return {
        success: true,
        isNewUser: res.data.isNewUser,
        user: res.data.user,
        token: res.data.accessToken,
        message: res.data.message,
      };
    }
    return {
      success: false,
      message: res.message || 'Failed to verify OTP',
    };
  },

  async register(
    verificationId: string,
    name: string,
    phone?: string,
    referralCode?: string,
    preferredCityId?: string,
    preferredCityName?: string,
  ): Promise<{ success: boolean; user?: any; token?: string; message?: string }> {
    const res = await api.post<any>('/auth/register', {
      verificationId,
      name,
      phone,
      referralCode,
      preferredCityId,
      preferredCityName,
    });
    if (res.success && res.data) {
      if (res.data.accessToken) {
        api.setToken(res.data.accessToken);
        await StorageService.saveItem(StorageService.KEYS.AUTH_TOKEN, res.data.accessToken);
        if (res.data.refreshToken) {
          await StorageService.saveItem(StorageService.KEYS.REFRESH_TOKEN, res.data.refreshToken);
        }
      }
      return {
        success: true,
        user: res.data.user,
        token: res.data.accessToken,
        message: res.data.message,
      };
    }
    return {
      success: false,
      message: res.message || 'Registration failed',
    };
  },

  async getCities(): Promise<{ id: string; name: string; code: string; state?: string }[]> {
    try {
      const res = await api.get<any>('/location/cities');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((c: any) => ({
          id: c._id || c.id,
          name: c.name,
          code: c.code,
          state: c.state || 'Gujarat',
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch cities from API:', e);
    }
    return [
      { id: 'city_ahm', name: 'Ahmedabad', code: 'AHM', state: 'Gujarat' },
      { id: 'city_sur', name: 'Surat', code: 'SUR', state: 'Gujarat' },
      { id: 'city_bdq', name: 'Vadodara', code: 'BDQ', state: 'Gujarat' },
      { id: 'city_raj', name: 'Rajkot', code: 'RAJ', state: 'Gujarat' },
      { id: 'city_gan', name: 'Gandhinagar', code: 'GAN', state: 'Gujarat' },
    ];
  },

  _profilePromise: null as Promise<UserProfile | null> | null,

  async getProfile(): Promise<UserProfile | null> {
    const token = api.getToken();
    if (!token) {
      return null;
    }

    if (this._profilePromise) {
      return this._profilePromise;
    }

    this._profilePromise = (async () => {
      try {
        const res = await api.get<any>('/users/me');
        if (res.success && res.data) {
          return {
            fullName: res.data.name || '',
            phoneNumber: res.data.phone || '',
            email: res.data.email || '',
            referralCode: res.data.referralCode || '',
            shoppingCoins: res.data.shoppingCoins || 0,
            savedAddresses: [],
            birthday: res.data.birthday || undefined,
            preferredCityId: res.data.preferredCityId ? res.data.preferredCityId.toString() : undefined,
            preferredCityName: res.data.preferredCityName || undefined,
          };
        }
        return null;
      } finally {
        this._profilePromise = null;
      }
    })();

    return this._profilePromise;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    api.setToken(null);
    await StorageService.removeItem(StorageService.KEYS.AUTH_TOKEN);
    await StorageService.removeItem(StorageService.KEYS.REFRESH_TOKEN);
    await StorageService.removeItem(StorageService.KEYS.USER);
  },
};

export const generateRandomIndianMobile = (): string => {
  const prefixes = ['98', '99', '97', '96', '95', '94', '93', '91', '90', '88', '89', '87'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const remaining = Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8);
  return `${prefix}${remaining}`;
};

