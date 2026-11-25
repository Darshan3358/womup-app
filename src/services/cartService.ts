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

export const getDynamicDeliveryFeeCacheKey = (params: {
  storeId?: string;
  cityName?: string;
  areaName?: string;
  distanceKm?: number;
  deliveryAddress?: any;
  items?: any[];
}): string => {
  const lat = params.deliveryAddress?.latitude ?? params.deliveryAddress?.lat ?? '';
  const lng = params.deliveryAddress?.longitude ?? params.deliveryAddress?.lng ?? '';
  const city = (params.cityName || '').trim().toLowerCase();
  const area = (params.areaName || '').trim().toLowerCase();
  const store = (params.storeId || '').trim();
  const itemsFingerprint = (params.items || [])
    .map((i: any) => {
      const pId = String(i.productId || i.product?.id || i.id || i.name || '').trim();
      const vId = String(i.variantId || i.product?.selectedVariantId || '').trim();
      const qty = Number(i.quantity) || 1;
      return `${pId}:${vId}:${qty}`;
    })
    .sort()
    .join('|');

  return `${city}_${area}_${store}_${lat}_${lng}_${params.distanceKm || ''}_${itemsFingerprint}`;
};

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

  /**
   * Single source of truth for building delivery fee calculation parameters
   * across FloatingCartPill, BlinkitCartScreen, and BlinkitCheckoutScreen.
   * Ensures identical coordinates, area, city, storeId, and cache keys.
   */
  buildDeliveryFeeParams(opts: {
    items: any[];
    selectedAddress?: any;
    matchedArea?: any;
    currentAreaName?: string | null;
    currentCityName?: string | null;
    currentStoreId?: string | null;
    explicitAreaText?: string | null;
  }) {
    const addr = opts.selectedAddress;
    const addrLat = Number(addr?.latitude);
    const addrLng = Number(addr?.longitude);
    const hasValidAddrCoords = Number.isFinite(addrLat) && Number.isFinite(addrLng) && addrLat !== 0 && addrLng !== 0;

    const areaLat = Number(opts.matchedArea?.lat);
    const areaLng = Number(opts.matchedArea?.lng);
    const hasValidAreaCoords = Number.isFinite(areaLat) && Number.isFinite(areaLng) && areaLat !== 0 && areaLng !== 0;

    const activeLat = hasValidAddrCoords ? addrLat : (hasValidAreaCoords ? areaLat : 23.0125);
    const activeLng = hasValidAddrCoords ? addrLng : (hasValidAreaCoords ? areaLng : 72.5082);

    const areaKey = (
      opts.explicitAreaText ||
      addr?.areaLandmark ||
      (addr as any)?.area ||
      opts.matchedArea?.name ||
      opts.currentAreaName ||
      'Prahlad Nagar'
    ).trim();

    const cityKey = (addr?.city || opts.currentCityName || 'Ahmedabad').trim();

    const feeItems = (opts.items || []).map((item: any) => ({
      id: item.product?.id || item.id || item.productId,
      productId: item.product?.id || item.productId || item.id,
      name: item.product?.name || item.name,
      price: item.product?.sellingPrice ?? item.sellingPrice ?? item.price ?? 0,
      sellingPrice: item.product?.sellingPrice ?? item.sellingPrice ?? item.price ?? 0,
      mrp: item.product?.mrp ?? item.mrp ?? 0,
      quantity: item.quantity || 1,
      variantId: item.product?.selectedVariantId || item.variantId,
    }));

    return {
      items: feeItems,
      cityName: cityKey,
      areaName: areaKey,
      storeId: opts.currentStoreId || undefined,
      deliveryAddress: {
        latitude: activeLat,
        longitude: activeLng,
        area: areaKey,
        city: cityKey,
      },
    };
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

  async setExactQuantityOnServer(productId: string, quantity: number, variantId?: string, areaId?: string, storeId?: string): Promise<any> {
    const res = await api.post<any>('/cart/update', { productId, quantity, variantId, areaId, storeId });
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
    const cacheKey = getDynamicDeliveryFeeCacheKey(params);

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

    // 3. Create single shared promise — uses centralized api client (correct URL + auth header).
    // Do NOT bind a single caller's AbortSignal to the shared HTTP request so unmounting Pill
    // does not abort the request for Cart/Checkout.
    let sharedPromise = _inFlightRequests.get(cacheKey);
    if (!sharedPromise || params.forceRefresh) {
      sharedPromise = (async () => {
        try {
          const res = await api.post<any>('/cart/calculate', params);
          if (res.success && res.data) {
            _feeCache.set(cacheKey, { data: res.data, ts: Date.now() });
            return res.data;
          }
        } catch (err: any) {
          if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
            throw err;
          }
          console.warn('[CartService] /api/v1/cart/calculate failed, using fallback:', err);
        } finally {
          _inFlightRequests.delete(cacheKey);
        }

        // Offline fallback matching configured global Admin defaults (₹5/km, min ₹20, max ₹80):
        const dist = params.distanceKm || 2.6;
        const rate = 5;
        const minPayout = 20;
        const maxPayout = 80;
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

      return fallbackData;
    })();
    }

    _inFlightRequests.set(cacheKey, sharedPromise);
    return sharedPromise;
  },

  getCachedDeliveryFee(params?: {
    storeId?: string;
    cityName?: string;
    areaName?: string;
    distanceKm?: number;
    deliveryAddress?: any;
    items?: Array<any>;
  }): any | null {
    if (params) {
      const cacheKey = getDynamicDeliveryFeeCacheKey(params);
      const cached = _feeCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < 60000) {
        return cached.data;
      }
    }
    return null;
  },
};
