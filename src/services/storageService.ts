import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CART: '@wormup_cart',
  USER: '@wormup_user',
  ORDERS: '@wormup_orders',
  COINS: '@wormup_coins',
  ONBOARDING_DONE: '@wormup_onboarding_done',
  SELECTED_ADDRESS: '@wormup_selected_address',
};

export const StorageService = {
  async saveItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error saving to storage', e);
    }
  },

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('Error reading from storage', e);
      return defaultValue;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Error removing from storage', e);
    }
  },

  KEYS,
};
