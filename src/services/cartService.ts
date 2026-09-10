import { CartItem } from '../types';
import { api } from './api';

export interface CartSummary {
  subtotalMrp: number;
  subtotalSelling: number;
  productDiscount: number;
  shoppingCoinDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  totalPayable: number;
  totalSavings: number;
  totalCoinsEarnable: number;
}

export const CartService = {
  calculateSummary(
    items: CartItem[],
    appliedCoins = 0,
    appliedCouponDiscount = 0
  ): CartSummary {
    let subtotalMrp = 0;
    let subtotalSelling = 0;
    let totalCoinsEarnable = 0;

    items.forEach((item) => {
      subtotalMrp += item.product.mrp * item.quantity;
      subtotalSelling += item.product.sellingPrice * item.quantity;
      totalCoinsEarnable += item.product.shoppingCoins * item.quantity;
    });

    const productDiscount = Math.max(0, subtotalMrp - subtotalSelling);
    const deliveryFee = subtotalSelling > 200 || subtotalSelling === 0 ? 0 : 30;

    // 1 SC = ₹1 discount, max 20% of order value or available coins
    const maxUsableCoins = Math.floor(subtotalSelling * 0.2);
    const effectiveCoins = Math.min(appliedCoins, maxUsableCoins);

    const totalPayable = Math.max(
      0,
      subtotalSelling - effectiveCoins - appliedCouponDiscount + deliveryFee
    );

    const totalSavings = productDiscount + effectiveCoins + appliedCouponDiscount;

    return {
      subtotalMrp,
      subtotalSelling,
      productDiscount,
      shoppingCoinDiscount: effectiveCoins,
      couponDiscount: appliedCouponDiscount,
      deliveryFee,
      totalPayable,
      totalSavings,
      totalCoinsEarnable,
    };
  },

  // Authoritative server API methods
  async getServerCart(): Promise<any> {
    const res = await api.get<any>('/cart');
    return res.success ? res.data : null;
  },

  async addItemToServer(productId: string, quantity: number = 1): Promise<any> {
    const res = await api.post<any>('/cart/items', { productId, quantity });
    return res.success ? res.data : null;
  },

  async updateQuantityOnServer(productId: string, delta: number): Promise<any> {
    const res = await api.patch<any>(`/cart/items/${productId}`, { delta });
    return res.success ? res.data : null;
  },

  async removeItemFromServer(productId: string): Promise<boolean> {
    const res = await api.delete<any>(`/cart/items/${productId}`);
    return res.success;
  },

  async clearServerCart(): Promise<boolean> {
    const res = await api.delete<any>('/cart');
    return res.success;
  },

  async applyCoinsOnServer(coins: number): Promise<any> {
    const res = await api.post<any>('/cart/apply-coins', { coins });
    return res.success ? res.data : null;
  },

  async applyCouponOnServer(couponCode: string): Promise<any> {
    const res = await api.post<any>('/cart/apply-coupon', { couponCode });
    return res.success ? res.data : null;
  },
};
