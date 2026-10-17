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
  shoppingCoins: 2000,
  savedAddresses: [],
  verificationStatus: 'NON_VERIFIED',
  pendingIncome: 0,
  availableIncome: 0,
  appDownloadIncome: 0,
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

  async checkRegistrationTiming(): Promise<{
    allowed: boolean;
    currentHourIST: number;
    currentTimeIST: string;
    message: string;
  }> {
    try {
      const res = await api.get<any>('/auth/registration-timing');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Failed to check registration timing:', e);
    }
    // Fallback client-side IST calculation
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    let istHours = (utcHours + 5 + Math.floor((utcMinutes + 30) / 60)) % 24;
    const allowed = !(istHours >= 22 || istHours < 6);
    return {
      allowed,
      currentHourIST: istHours,
      currentTimeIST: `${istHours.toString().padStart(2, '0')}:00 IST`,
      message: allowed
        ? 'Registration is open.'
        : 'New user registrations are closed between 10:00 PM and 6:00 AM IST.',
    };
  },

  async checkPincode(pincode: string): Promise<{
    serviceable: boolean;
    pincode: string;
    city?: string;
    state?: string;
    areaNames?: string[];
    message: string;
  }> {
    try {
      const res = await api.get<any>(`/auth/check-pincode?pincode=${encodeURIComponent(pincode.trim())}`);
      if (res.success && res.data) {
        return res.data;
      }
      return {
        serviceable: false,
        pincode,
        message: res.message || 'Service is not available in this pincode yet.',
      };
    } catch (err: any) {
      return {
        serviceable: false,
        pincode,
        message: err?.message || 'Error checking pincode serviceability',
      };
    }
  },

  async validateSponsor(sponsorCode: string): Promise<{
    valid: boolean;
    sponsorCode: string;
    sponsorName: string;
    isCompanyRoot?: boolean;
    message: string;
  }> {
    try {
      const code = sponsorCode.trim();
      const res = await api.get<any>(`/auth/validate-sponsor?code=${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        return res.data;
      }
      return {
        valid: false,
        sponsorCode: code,
        sponsorName: '',
        message: res.message || 'Invalid Sponsor ID',
      };
    } catch (err: any) {
      return {
        valid: false,
        sponsorCode,
        sponsorName: '',
        message: err?.message || 'Error validating Sponsor ID',
      };
    }
  },

  async register(
    verificationId: string,
    name: string,
    phone?: string,
    referralCode?: string,
    preferredCityId?: string,
    preferredCityName?: string,
    pincode?: string,
    city?: string,
    fullNameAsPerAadhaar?: string,
    sponsorCode?: string,
  ): Promise<{ success: boolean; user?: any; token?: string; message?: string }> {
    const res = await api.post<any>('/auth/register', {
      verificationId,
      name,
      phone,
      referralCode: referralCode || sponsorCode,
      sponsorCode: sponsorCode || referralCode,
      preferredCityId,
      preferredCityName,
      pincode,
      city: city || preferredCityName,
      fullNameAsPerAadhaar,
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

  async verifyAadhaar(
    aadhaarOrPayload: string | {
      aadhaarNumber: string;
      fullNameAsPerAadhaar?: string;
      frontImage?: string;
      backImage?: string;
      bankName?: string;
      branchName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
      bankProofImage?: string;
    },
    fullNameAsPerAadhaar?: string,
    frontImage?: string,
    backImage?: string,
  ): Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }> {
    let payload: any = {};
    if (typeof aadhaarOrPayload === 'string') {
      payload = {
        aadhaarNumber: aadhaarOrPayload,
        fullNameAsPerAadhaar,
        customer_image_aadhar_front: frontImage,
        customer_image_aadhar_back: backImage,
        aadhaarFrontImage: frontImage,
        aadhaarBackImage: backImage,
      };
    } else {
      payload = {
        aadhaarNumber: aadhaarOrPayload.aadhaarNumber,
        fullNameAsPerAadhaar: aadhaarOrPayload.fullNameAsPerAadhaar,
        customer_image_aadhar_front: aadhaarOrPayload.frontImage,
        customer_image_aadhar_back: aadhaarOrPayload.backImage,
        aadhaarFrontImage: aadhaarOrPayload.frontImage,
        aadhaarBackImage: aadhaarOrPayload.backImage,
        bankName: aadhaarOrPayload.bankName,
        branchName: aadhaarOrPayload.branchName,
        accountHolderName: aadhaarOrPayload.accountHolderName,
        accountNumber: aadhaarOrPayload.accountNumber,
        ifscCode: aadhaarOrPayload.ifscCode,
        upiId: aadhaarOrPayload.upiId,
        bankProofImage: aadhaarOrPayload.bankProofImage,
        passbookImage: aadhaarOrPayload.bankProofImage,
      };
    }

    const res = await api.post<any>('/users/verify-aadhaar', payload);
    if (res.success && res.data) {
      return {
        success: true,
        user: res.data.user,
        message: res.data.message || 'KYC & Bank details submitted successfully',
      };
    }
    return {
      success: false,
      message: res.message || 'Verification submission failed',
    };
  },

  async getWalletSummary(): Promise<any> {
    const res = await api.get<any>('/users/wallet-summary');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },

  async getIncomeHistory(page = 1, limit = 50): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await api.get<any>(`/users/income-history?page=${page}&limit=${limit}`);
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message || 'Failed to fetch income history' };
  },

  async withdrawIncome(amount: number, bankDetails?: any): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await api.post<any>('/users/income/withdraw', { amount, bankDetails });
    if (res.success) {
      return {
        success: true,
        message: res.message || 'Withdrawal request submitted successfully',
        data: res.data,
      };
    }
    return {
      success: false,
      message: res.message || 'Withdrawal failed',
    };
  },

  async getTeamDashboard(): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await api.get<any>('/users/team-dashboard');
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message || 'Failed to fetch team dashboard' };
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
            id: res.data._id ? res.data._id.toString() : (res.data.id || ''),
            _id: res.data._id ? res.data._id.toString() : (res.data.id || ''),
            fullName: res.data.name || '',
            phoneNumber: res.data.phone || '',
            email: res.data.email || '',
            referralCode: res.data.referralCode || res.data.sponsorCode || '',
            sponsorCode: res.data.sponsorCode || res.data.referralCode || '',
            isCompanySponsored: res.data.isCompanySponsored || false,
            shoppingCoins: res.data.shoppingCoins ?? 2000,
            pendingIncome: res.data.pendingIncome ?? 0,
            availableIncome: res.data.availableIncome ?? 0,
            appDownloadIncome: res.data.appDownloadIncome ?? 0,
            verificationStatus: res.data.verificationStatus || (res.data.aadhaarVerified ? 'VERIFIED' : 'NON_VERIFIED'),
            aadhaarVerified: res.data.aadhaarVerified || false,
            fullNameAsPerAadhaar: res.data.fullNameAsPerAadhaar || res.data.name || '',
            aadhaarNumber: res.data.aadhaarNumber || res.data.customer_aadhar_no || '',
            aadharNumber: res.data.aadhaarNumber || res.data.customer_aadhar_no || '',
            aadharFrontImage: res.data.customer_image_aadhar_front || res.data.aadharFrontImage || '',
            aadharBackImage: res.data.customer_image_aadhar_back || res.data.aadharBackImage || '',
            bankName: res.data.bankName || '',
            branchName: res.data.branchName || '',
            accountHolderName: res.data.accountHolderName || res.data.fullNameAsPerAadhaar || res.data.name || '',
            accountNumber: res.data.accountNumber || res.data.bankAccountNo || '',
            bankAccountNo: res.data.accountNumber || res.data.bankAccountNo || '',
            ifscCode: res.data.ifscCode || '',
            upiId: res.data.upiId || '',
            passbookImage: res.data.passbookImage || res.data.bankProofImage || res.data.cancelledChequeImage || '',
            bankProofImage: res.data.bankProofImage || res.data.passbookImage || res.data.cancelledChequeImage || '',
            customerKycStatus: res.data.customerKycStatus,
            registrationCity: res.data.city || res.data.preferredCityName || '',
            registrationPincode: res.data.pincode || '',
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

