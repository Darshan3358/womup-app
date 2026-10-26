import { CartItem } from '../types';
import { api } from './api';

export interface CartSummary {
  subtotalMrp: number;
  subtotalSelling: number;
  productDiscount: number;
  shoppingCoinDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  handlingFee?: number;
  totalPayable: number;
  totalSavings: number;
  totalCoinsEarnable: number;
}

const _feeCache = new Map<string, { data: any; ts: number }>();
const _inFlightRequests = new Map<string, Promise<any>>();

export const clearFeeCache = () => {
  _feeCache.clear();
  _inFlightRequests.clear();
};

export const CartService = {
  clearCache() {
    clearFeeCache();
  },
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
  async getServerCart(areaId?: string, storeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (areaId) params.append('areaId', areaId);
    if (storeId) params.append('storeId', storeId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get<any>(`/cart${qs}`);
    return res.success ? res.data : null;
  },

  async addItemToServer(productId: string, quantity: number = 1, variantId?: string, areaId?: string, storeId?: string): Promise<any> {
    const res = await api.post<any>('/cart/items', { productId, quantity, variantId, areaId, storeId });
    return res.success ? res.data : null;
  },

  async updateQuantityOnServer(productId: string, delta: number, variantId?: string, areaId?: string, storeId?: string): Promise<any> {
    const res = await api.patch<any>(`/cart/items/${productId}`, { delta, variantId, areaId, storeId });
    return res.success ? res.data : null;
  },

  async removeItemFromServer(productId: string, variantId?: string): Promise<boolean> {
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
    const res = await api.delete<any>(`/cart/items/${productId}${qs}`);
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

  async toggleCoinsOnServer(useCoins: boolean): Promise<any> {
    const res = await api.post<any>('/cart/toggle-coins', { useCoins });
    return res.success ? res.data : null;
  },

  async applyCouponOnServer(couponCode: string): Promise<any> {
    const res = await api.post<any>('/cart/apply-coupon', { couponCode });
    return res.success ? res.data : null;
  },

  async setCartLocation(areaId?: string, storeId?: string): Promise<any> {
    const res = await api.post<any>('/cart/set-location', { areaId, storeId });
    return res.success ? res.data : null;
  },

  /**
   * Authoritative dynamic delivery fee calculation:
   * Resolves distance (Haversine) × ratePerKm (Area > City > Global) with Floor & Cap.
   */
  async calculateDynamicDeliveryFee(
    params: {
      items?: any[];
      deliveryAddress?: any;
      storeId?: string;
      cityName?: string;
      areaName?: string;
      distanceKm?: number;
      tip?: number;
      forceRefresh?: boolean;
    },
    signal?: AbortSignal
  ): Promise<{
    deliveryFee: number;
    handlingFee: number;
    distanceKm: number;
    rateUsed: number;
    rateSource: string;
    total: number;
    itemSubtotal?: number;
    mrpTotal?: number;
    items?: any[];
    areaName?: string;
    cityName?: string;
    storeName?: string;
    storeId?: string;
    breakdown?: {
      baseFee: number;
      minimumPayout: number;
      maximumPayout: number;
      floorApplied: boolean;
      floorAdjustment?: number;
      capApplied: boolean;
      formula?: string;
      explanation?: string;
    };
  }> {
    const lat = params.deliveryAddress?.latitude ?? params.deliveryAddress?.lat ?? '';
    const lng = params.deliveryAddress?.longitude ?? params.deliveryAddress?.lng ?? '';
    const cacheKey = `${params.storeId || ''}_${params.areaName || ''}_${lat}_${lng}_${params.items?.length || 0}`;

    // 1. Check completed cache first (60s TTL) - skipped if forceRefresh is true
    if (!params.forceRefresh) {
      const cached = _feeCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 60000) {
        return cached.data;
      }
    }

    // 2. Check if identical request is already in-flight (deduplication)
    const inFlight = _inFlightRequests.get(cacheKey);
    if (inFlight && !params.forceRefresh) {
      return inFlight;
    }

    // 3. Create single shared promise — uses centralized api client (correct URL + auth header)
    const promise = (async () => {
      try {
        const res = await api.post<any>('/cart/calculate', params, undefined, { signal });
        if (res.success && res.data) {
          _feeCache.set(cacheKey, { data: res.data, ts: Date.now() });
          return res.data;
        }
      } catch (err) {
        console.warn('[CartService] /api/v1/cart/calculate failed, using fallback:', err);
      } finally {
        _inFlightRequests.delete(cacheKey);
      }

      // High fidelity fallback matching configured Admin rates:
      const dist = params.distanceKm || 2.6;
      const rate = 12;
      const minPayout = 35;
      const maxPayout = 160;
      const baseFee = Number((dist * rate).toFixed(2));
      const floorApplied = baseFee < minPayout;
      const floorAdjustment = floorApplied ? Number((minPayout - baseFee).toFixed(2)) : 0;
      const capApplied = baseFee > maxPayout;
      const finalFee = Math.round(Math.min(Math.max(baseFee, minPayout), maxPayout));

      const formulaText = floorApplied
        ? `${dist} km × ₹${rate}/km = ₹${baseFee.toFixed(2)} · ₹${minPayout} minimum applied`
        : capApplied
        ? `${dist} km × ₹${rate}/km = ₹${baseFee.toFixed(2)} · ₹${maxPayout} maximum cap applied`
        : `${dist} km × ₹${rate}/km = ₹${baseFee.toFixed(2)}`;

      const fallbackData = {
        deliveryFee: finalFee,
        handlingFee: 5,
        convenienceFee: 5,
        distanceKm: dist,
        rateUsed: rate,
        ratePerKm: rate,
        minimumFee: minPayout,
        maximumFee: maxPayout,
        rawFee: baseFee,
        rateSource: 'GLOBAL',
        areaName: params.areaName || 'Prahlad Nagar',
        cityName: params.cityName || 'Ahmedabad',
        total: (params.items?.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0) || 60) + finalFee + 5,
        breakdown: {
          baseFee,
          rawFee: baseFee,
          minimumPayout: minPayout,
          maximumPayout: maxPayout,
          floorApplied,
          floorAdjustment,
          capApplied,
          formula: formulaText,
          explanation: floorApplied
            ? `Includes ₹${floorAdjustment} minimum pay guarantee for delivery partner`
            : capApplied
            ? `Capped at maximum fee of ₹${maxPayout}`
            : `Distance-based fee at ₹${rate}/km`,
        },
      };

      _feeCache.set(cacheKey, { data: fallbackData, ts: Date.now() });
      return fallbackData;
    })();

    _inFlightRequests.set(cacheKey, promise);
    return promise;
  },

  getCachedDeliveryFee(params?: {
    storeId?: string;
    cityName?: string;
    areaName?: string;
    distanceKm?: number;
    items?: Array<{ name?: string; price?: number; mrp?: number; quantity?: number }>;
  }): any | null {
    if (params) {
      const cacheKey = `${params.storeId || ''}_${params.areaName || ''}_${params.cityName || ''}_${params.distanceKm || 3.26}_${params.items?.length || 0}`;
      const cached = _feeCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 60000) {
        return cached.data;
      }
    }
    return null;
  },
};
