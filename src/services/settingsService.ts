import { api } from './api';

export interface UserSettingsData {
  personalizedFeeds: boolean;
  anonymousAnalytics: boolean;
  hideSensitiveItems: boolean;
  searchHistoryEnabled: boolean;
  notificationPrefs: {
    liveOrderTracking: boolean;
    whatsappInvoices: boolean;
    exclusiveOffers: boolean;
    orderUpdates: boolean;
    pushNotifications: boolean;
    emailMarketing: boolean;
  };
}

export interface PaymentMethodItem {
  _id?: string;
  id?: string;
  type: 'UPI' | 'CARD' | 'COD';
  upiId?: string;
  isDefault: boolean;
  verified: boolean;
  label: string;
}

export interface UserPaymentMethodsData {
  methods: PaymentMethodItem[];
  codEnabled: boolean;
  preferredMethod: string;
}

export interface UserRewardsData {
  shoppingCoins: number;
  scratchCardAvailable: boolean;
  lastScratchAt?: string;
  scratchStreak: number;
  totalCoinsEarned: number;
  tier: string;
}

export interface CouponItem {
  code: string;
  title: string;
  description: string;
  minOrderValue: number;
  discount: number;
  validUntil: string;
  tag: string;
}

export const SettingsService = {
  // 1 & 2. Privacy & Notifications
  async getSettings(): Promise<UserSettingsData> {
    const res = await api.get<UserSettingsData>('/user/settings');
    return (res.data || res) as UserSettingsData;
  },

  async updatePrivacy(data: Partial<UserSettingsData>): Promise<any> {
    const res = await api.patch('/user/settings/privacy', data);
    return res.data || res;
  },

  async updateNotifications(prefs: Partial<UserSettingsData['notificationPrefs']>): Promise<any> {
    const res = await api.patch('/user/settings/notifications', prefs);
    return res.data || res;
  },

  async clearHistory(): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/user/settings/clear-history', {});
    return (res.data || res) as any;
  },

  async downloadDataArchive(): Promise<{ success: boolean; message: string }> {
    const res = await api.get('/user/settings/download-data');
    return (res.data || res) as any;
  },

  // 3. Birthday
  async updateBirthday(birthday: string): Promise<{ success: boolean; birthday: string; coinsAwarded: number; newCoinBalance: number; message: string }> {
    const res = await api.patch('/user/profile/birthday', { birthday });
    return (res.data || res) as any;
  },

  // 4. Payment Methods (UPI & COD)
  async getPaymentMethods(): Promise<UserPaymentMethodsData> {
    const res = await api.get<UserPaymentMethodsData>('/user/payment-methods');
    return (res.data || res) as UserPaymentMethodsData;
  },

  async addPaymentMethod(dto: { type: string; upiId?: string; label?: string; isDefault?: boolean }): Promise<UserPaymentMethodsData> {
    const res = await api.post('/user/payment-methods', dto);
    return (res.data || res) as UserPaymentMethodsData;
  },

  async setDefaultPaymentMethod(methodId: string): Promise<UserPaymentMethodsData> {
    const res = await api.patch(`/user/payment-methods/${methodId}/default`, {});
    return (res.data || res) as UserPaymentMethodsData;
  },

  async deletePaymentMethod(methodId: string): Promise<UserPaymentMethodsData> {
    const res = await api.delete(`/user/payment-methods/${methodId}`);
    return (res.data || res) as UserPaymentMethodsData;
  },

  async toggleCod(codEnabled: boolean): Promise<UserPaymentMethodsData> {
    const res = await api.patch('/user/payment-methods/cod', { codEnabled });
    return (res.data || res) as UserPaymentMethodsData;
  },

  async verifyUpi(upiId: string): Promise<{ verified: boolean; upiId: string; accountHolder: string; bank: string; message: string }> {
    const res = await api.post('/user/payment-methods/verify-upi', { upiId });
    return (res.data || res) as any;
  },

  // 5. Gift Cards & Vouchers
  async validateGiftCard(code: string): Promise<any> {
    const res = await api.post('/gift-cards/validate', { code });
    return res.data || res;
  },

  async redeemGiftCard(code: string): Promise<{ success: boolean; amount: number; newWalletBalance: number; message: string }> {
    const res = await api.post('/gift-cards/redeem', { code });
    return (res.data || res) as any;
  },

  async getGiftCardHistory(): Promise<any[]> {
    const res = await api.get('/user/gift-card-history');
    return (res.data || res) as any[];
  },

  // 6. Rewards & Daily Scratch Card
  async getRewards(): Promise<UserRewardsData> {
    const res = await api.get<UserRewardsData>('/user/rewards');
    return (res.data || res) as UserRewardsData;
  },

  async scratchCard(): Promise<{ success: boolean; coinsEarned: number; newTotal: number; streak: number; message: string }> {
    const res = await api.post('/user/rewards/scratch', {});
    return (res.data || res) as any;
  },

  async getCoupons(): Promise<CouponItem[]> {
    const res = await api.get<CouponItem[]>('/user/rewards/coupons');
    return (res.data || res) as CouponItem[];
  },

  async getRewardsHistory(): Promise<any[]> {
    const res = await api.get('/user/rewards/history');
    return (res.data || res) as any[];
  },

  async redeemCoins(coins: number): Promise<{ success: boolean; coinsRedeemed: number; remainingCoins: number; discountApplied: number; message: string }> {
    const res = await api.post('/user/rewards/coins/redeem', { coins });
    return (res.data || res) as any;
  },
};
