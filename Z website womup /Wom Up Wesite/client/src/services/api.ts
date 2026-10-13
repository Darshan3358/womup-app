import type { Product, Category, HeroBanner, HomeSection, ResolvedLocation, Order, ProductVariant, CartItem } from '../types';
import { io, Socket } from 'socket.io-client';

// Detect whether running in localhost browser
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (isLocal ? 'http://localhost:5050/api/v1' : 'https://womup-app.onrender.com/api/v1');

export const TRACKING_WS_URL =
  (import.meta.env.VITE_TRACKING_WS as string) ||
  (isLocal ? 'http://localhost:5050/tracking' : 'https://womup-app.onrender.com/tracking');

let tokenRefreshPromise: Promise<string | null> | null = null;

export const api = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wormup_auth_token') || localStorage.getItem('@wormup_token');
  },

  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return payload.exp * 1000 < Date.now() + 30000;
    } catch {
      return false;
    }
  },

  async ensureToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const existing = api.getToken();
    if (existing && !api.isTokenExpired(existing)) {
      return existing;
    }

    if (tokenRefreshPromise) {
      return tokenRefreshPromise;
    }

    tokenRefreshPromise = (async () => {
      try {
        let identifier = '';
        try {
          const userRaw = localStorage.getItem('wormup_customer_user');
          if (userRaw) {
            const parsed = JSON.parse(userRaw);
            identifier = parsed.email || parsed.phone || parsed.id || parsed._id || '';
          }
        } catch {}

        if (!identifier && existing) {
          try {
            const parts = existing.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              identifier = payload.email || payload.sub || '';
            }
          } catch {}
        }

        if (!identifier) {
          return existing || null;
        }

        const res = await fetch(`${API_BASE}/auth/token-for-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.accessToken) {
            localStorage.setItem('wormup_auth_token', data.accessToken);
            return data.accessToken;
          }
        }
      } catch (err) {
        console.warn('[api] Failed to refresh/ensure token:', err);
      } finally {
        tokenRefreshPromise = null;
      }
      return api.getToken();
    })();

    return tokenRefreshPromise;
  },

  async get<T = any>(endpoint: string): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      let token = await api.ensureToken();
      let res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('wormup_auth_token');
        token = await api.ensureToken();
        if (token) {
          res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data: data.data || data, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async post<T = any>(endpoint: string, body?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      let token = await api.ensureToken();
      let res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body || {}),
      });

      if (res.status === 401) {
        localStorage.removeItem('wormup_auth_token');
        token = await api.ensureToken();
        if (token) {
          res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body || {}),
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data: data.data || data, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async patch<T = any>(endpoint: string, body?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      let token = await api.ensureToken();
      let res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body || {}),
      });

      if (res.status === 401) {
        localStorage.removeItem('wormup_auth_token');
        token = await api.ensureToken();
        if (token) {
          res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body || {}),
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data: data.data || data, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async delete<T = any>(endpoint: string, body?: any): Promise<{ success: boolean; data?: T; message?: string }> {
    try {
      let token = await api.ensureToken();
      let res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (res.status === 401) {
        localStorage.removeItem('wormup_auth_token');
        token = await api.ensureToken();
        if (token) {
          res = await fetch(`${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data: data.data || data, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
};

/**
 * Authoritative Server Cart API (Exact same as Customer App CartService)
 * Interacts with MongoDB Atlas collections `carts` and `products`
 */
export const ServerCartApi = {
  async getCart(areaId?: string, storeId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (areaId) params.append('areaId', areaId);
    if (storeId) params.append('storeId', storeId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/cart${qs}`);
    return res.success ? res.data : null;
  },

  async setLocation(areaId?: string, storeId?: string): Promise<any> {
    const res = await api.post('/cart/set-location', { areaId, storeId });
    return res.success ? res.data : null;
  },

  async addItem(productId: string, quantity: number = 1, variantId?: string): Promise<any> {
    const res = await api.post('/cart/items', { productId, quantity, variantId });
    return res.success ? res.data : null;
  },

  async updateQuantity(productId: string, delta: number): Promise<any> {
    const res = await api.patch(`/cart/items/${productId}`, { delta });
    return res.success ? res.data : null;
  },

  async removeItem(productId: string): Promise<any> {
    const res = await api.delete(`/cart/items/${productId}`);
    return res.success ? res.data : null;
  },

  async clearCart(): Promise<boolean> {
    const res = await api.delete('/cart');
    return res.success;
  },

  async applyCoins(coins: number): Promise<any> {
    const res = await api.post('/cart/apply-coins', { coins });
    return res.success ? res.data : null;
  },

  async toggleCoins(useCoins: boolean): Promise<any> {
    const res = await api.post('/cart/toggle-coins', { useCoins });
    return res.success ? res.data : null;
  },

  async applyCoupon(couponCode: string): Promise<any> {
    const res = await api.post('/cart/apply-coupon', { couponCode });
    return res.success ? res.data : null;
  },
};

/**
 * Authoritative Server Wishlist API
 * Syncs user wishlist with MongoDB Atlas
 */
export const ServerWishlistApi = {
  async getWishlist(): Promise<Product[]> {
    const res = await api.get<any[]>('/users/wishlist');
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(mapRawItemToProduct);
    }
    return [];
  },

  async toggleWishlist(productId: string): Promise<{ isInWishlist: boolean; items: Product[] }> {
    const res = await api.post<any>('/users/wishlist/toggle', { productId });
    if (res.success && res.data) {
      return {
        isInWishlist: !!res.data.isInWishlist,
        items: Array.isArray(res.data.items) ? res.data.items.map(mapRawItemToProduct) : [],
      };
    }
    return { isInWishlist: false, items: [] };
  },

  async clearWishlist(): Promise<boolean> {
    const res = await api.delete('/users/wishlist');
    return res.success;
  },
};

/**
 * Replicates the authoritative mapping from the Customer App (productService.ts)
 */
export function mapRawItemToProduct(item: any): Product {
  const variants: ProductVariant[] = Array.isArray(item.variants)
    ? item.variants.map((v: any) => ({
        id: v.id || v._id || `${item._id}_v`,
        label: v.label || `${v.quantity || ''} ${v.unit || ''}`.trim() || '1 unit',
        price: Number(v.price ?? v.sellingPrice ?? item.sellingPrice ?? item.price ?? 0),
        mrp: Number(v.mrp ?? item.mrp ?? 0),
        discountPercent: Number(v.discountPercent ?? item.discountPercent ?? 0),
        stock: Number(v.stock ?? 100),
        isAvailable: v.isAvailable !== false,
        isDefault: !!v.isDefault,
      }))
    : [];

  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const effectiveSellingPrice = defaultVariant ? defaultVariant.price : Number(item.sellingPrice ?? item.price ?? 0);
  const effectiveMrp = defaultVariant ? defaultVariant.mrp : Number(item.mrp ?? item.oldPrice ?? effectiveSellingPrice);
  const effectiveDiscount = defaultVariant
    ? (defaultVariant.discountPercent || 0)
    : Number(item.discountPercent ?? item.discount ?? 0);
  const effectiveLabel = defaultVariant ? defaultVariant.label : (item.quantityLabel || item.unit || '1 unit');

  const catObj = item.categoryId;
  const catIdStr = catObj?._id ? catObj._id.toString() : (catObj ? catObj.toString() : (item.category || ''));
  const catSlug = catObj?.slug || item.categorySlug || (typeof item.category === 'string' ? item.category.toLowerCase().replace(/\s+/g, '-') : 'groceries');
  const catName = catObj?.name || item.category || 'Groceries';

  const mainImage = item.imageUrl || item.image || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
  const galleryImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [mainImage];

  return {
    id: item._id || item.id,
    _id: item._id || item.id,
    slug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
    name: item.name || 'WomUp Item',
    brand: item.brand || 'Farm Fresh',
    category: catName,
    categoryId: catIdStr,
    categorySlug: catSlug,
    categoryName: catName,
    subCategoryId: item.subCategoryId,
    price: effectiveSellingPrice,
    sellingPrice: effectiveSellingPrice,
    oldPrice: effectiveMrp,
    mrp: effectiveMrp,
    discount: effectiveDiscount,
    discountPercent: effectiveDiscount,
    unit: effectiveLabel,
    quantityLabel: effectiveLabel,
    image: mainImage,
    imageUrl: mainImage,
    gallery: galleryImages,
    images: galleryImages,
    description: item.description || '',
    specifications: item.specifications || {},
    rating: Number(Number(item.rating || 4.8).toFixed(1)),
    reviewCount: Number(item.reviewCount || 45),
    inStock: !item.isOutOfStock && (defaultVariant ? (defaultVariant.stock ?? 100) > 0 : (item.stock ?? 100) > 0),
    stock: defaultVariant ? defaultVariant.stock : (item.stock || 100),
    isPopular: !!item.isPopular,
    isDeal: !!item.isDeal,
    deliveryMinutes: item.deliveryMinutes || 9,
    shoppingCoins: item.shoppingCoins || 10,
    shelfLocation: item.shelfLocation,
    barcode: item.barcode,
    variants: variants.length > 0 ? variants : undefined,
  };
}

/**
 * Fetch live Home Sections from MongoDB Atlas backend
 */
export async function fetchHomeSections(params: { storeId?: string; areaId?: string } = {}): Promise<{
  hero: HeroBanner[];
  categories: Category[];
  sections: HomeSection[];
}> {
  const queryParts: string[] = [];
  if (params.storeId) queryParts.push(`storeId=${encodeURIComponent(params.storeId)}`);
  if (params.areaId) queryParts.push(`areaId=${encodeURIComponent(params.areaId)}`);
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const res = await fetch(`${API_BASE}/home/sections${qs}`);
  if (!res.ok) {
    throw new Error(`Failed to load home sections: ${res.statusText}`);
  }
  const json = await res.json();
  const data = json.data || {};

  const hero: HeroBanner[] = (data.hero || []).map((h: any) => ({
    id: h._id || h.id,
    _id: h._id,
    title: h.title || 'Fast 9-Min Delivery',
    imageUrl: h.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    videoUrl: h.videoUrl,
    placement: h.placement,
    targetType: h.targetType,
    targetId: h.targetId,
    sortOrder: h.sortOrder || 1,
  }));

  const categories: Category[] = (data.categories || []).map((c: any) => ({
    id: c._id || c.id,
    _id: c._id,
    name: c.name,
    slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
    icon: c.icon || '🛍️',
    image: c.image || c.imageUrl,
    imageUrl: c.imageUrl || c.image,
    bgColor: c.bgColor || '#F8F2FF',
    itemCount: c.itemCount || c.productCount || 0,
    productCount: c.productCount || c.itemCount || 0,
    sortOrder: c.sortOrder || 1,
  }));

  const sections: HomeSection[] = (data.sections || []).map((sec: any) => ({
    id: sec.id || sec._id || 'sec',
    title: sec.title || 'Featured Products',
    subtitle: sec.subtitle || 'Fresh & delivered fast',
    icon: sec.icon,
    viewAllFilter: sec.viewAllFilter,
    categoryName: sec.categoryName,
    products: (sec.products || []).map(mapRawItemToProduct),
  }));

  return { hero, categories, sections };
}

/**
 * Fetch full live catalog from backend with category, search and area filtering
 */
export const isValidMongoId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[a-f\d]{24}$/i.test(id);
};

export async function fetchProducts(params: {
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  areaId?: string;
  storeId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.categorySlug && params.categorySlug !== 'all') query.append('category', params.categorySlug);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.search) query.append('search', params.search);
  if (params.areaId && isValidMongoId(params.areaId)) query.append('areaId', params.areaId);
  if (params.storeId && isValidMongoId(params.storeId)) query.append('storeId', params.storeId);
  if (params.page) query.append('page', String(params.page));
  query.append('limit', String(params.limit || 50));

  const res = await fetch(`${API_BASE}/products?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }
  const json = await res.json();
  const rawList = Array.isArray(json.data?.items)
    ? json.data.items
    : Array.isArray(json.data)
    ? json.data
    : [];

  return rawList.map(mapRawItemToProduct);
}

/**
 * Fetch a single product by ID with area-specific pricing
 */
export async function fetchProductById(
  id: string,
  params: { areaId?: string; storeId?: string } = {}
): Promise<Product | null> {
  if (!id) return null;
  const query = new URLSearchParams();
  if (params.areaId && isValidMongoId(params.areaId)) query.append('areaId', params.areaId);
  if (params.storeId && isValidMongoId(params.storeId)) query.append('storeId', params.storeId);
  const qs = query.toString() ? `?${query.toString()}` : '';

  try {
    const res = await fetch(`${API_BASE}/products/${id}${qs}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product ${id}: ${res.statusText}`);
    }
    const json = await res.json();
    const raw = json.data;
    if (!raw) return null;
    return mapRawItemToProduct(raw);
  } catch (err) {
    console.warn(`[fetchProductById] Error fetching ${id}:`, err);
    return null;
  }
}

/**
 * Fetch all categories directly from backend
 */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.statusText}`);
  }
  const json = await res.json();
  const raw = Array.isArray(json.data) ? json.data : [];
  return raw.map((c: any) => ({
    id: c._id || c.id,
    _id: c._id,
    name: c.name,
    slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
    icon: c.icon || '🛒',
    image: c.image || c.imageUrl,
    imageUrl: c.imageUrl || c.image,
    bgColor: c.bgColor || '#F8F2FF',
    itemCount: c.itemCount || c.productCount || 0,
    productCount: c.productCount || c.itemCount || 0,
    sortOrder: c.sortOrder || 1,
  }));
}

/**
 * Hyperlocal location resolution for dark store routing
 */
export async function resolveLocation(latitude?: number, longitude?: number): Promise<ResolvedLocation> {
  const res = await fetch(`${API_BASE}/location/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: latitude ?? 23.1288,
      longitude: longitude ?? 72.5507,
    }),
  });

  if (!res.ok) {
    throw new Error(`Location resolve failed: ${res.statusText}`);
  }
  const json = await res.json();
  const data = json.data || {};

  return {
    serviceable: data.serviceable !== false,
    areaId: data.areaId || '6aac257b8f337240651ef43c',
    areaName: data.areaName || 'Chandlodiya - Tragad',
    storeId: data.storeId || '6aac257b8f337240651ef43b',
    storeName: data.storeName || 'Wom Up Chandlodiya - Tragad Dark Store',
    storeCode: data.storeCode || 'STORE-CHANDLODIYA_TRAGAD',
    city: data.city || 'Ahmedabad',
    deliveryMinutes: data.deliveryMinutes || 9,
    distanceKm: data.distanceKm,
    message: data.message,
  };
}

/**
 * Authoritative Order Placement (POST /orders)
 */
export async function placeLiveOrder(payload: {
  storeId?: string;
  areaId?: string;
  paymentMethod: string;
  deliveryInstructions?: string;
  tip?: number;
  deliveryFee?: number;
  address: {
    houseFlat?: string;
    street?: string;
    areaLandmark?: string;
    city?: string;
    pincode?: string;
    label?: string;
    fullName?: string;
    phoneNumber?: string;
  };
  items: {
    productId: string;
    quantity: number;
    name: string;
    price: number;
    mrp?: number;
    imageUrl?: string;
    quantityLabel?: string;
  }[];
}): Promise<Order> {
  const token = localStorage.getItem('wormup_auth_token');
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Failed to place order on server');
  }

  const json = await res.json();
  const ord = json.data || json;
  return mapServerOrderToClient(ord);
}

/**
 * Fetch customer order history directly from MongoDB Atlas
 */
export async function fetchLiveOrders(page = 1, limit = 20): Promise<Order[]> {
  const token = localStorage.getItem('wormup_auth_token');
  const res = await fetch(`${API_BASE}/orders?page=${page}&limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.statusText}`);
  }
  const json = await res.json();
  const rawList = Array.isArray(json.data?.orders)
    ? json.data.orders
    : Array.isArray(json.data?.items)
    ? json.data.items
    : Array.isArray(json.data)
    ? json.data
    : [];

  return rawList.map(mapServerOrderToClient);
}

/**
 * Fetch single order details
 */
export async function fetchOrderDetails(orderId: string): Promise<Order> {
  const token = localStorage.getItem('wormup_auth_token');
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch order: ${res.statusText}`);
  }
  const json = await res.json();
  return mapServerOrderToClient(json.data || json);
}

/**
 * Cancel an order before dispatch
 */
export async function cancelLiveOrder(orderId: string, reason?: string): Promise<boolean> {
  const token = localStorage.getItem('wormup_auth_token');
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reason: reason || 'Cancelled by customer' }),
  });
  return res.ok;
}

/**
 * Map raw MongoDB Atlas cart item to client CartItem
 */
export function mapServerCartItemToClient(raw: any): CartItem {
  const p = raw.product || {};
  const pId = (p.id || p._id || raw.productId || '').toString();
  const sellingPrice = Number(p.sellingPrice ?? p.price ?? 0);
  const mrp = Number(p.mrp ?? p.oldPrice ?? sellingPrice);
  const discPercent =
    p.discountPercent || (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);
  const img =
    p.imageUrl ||
    p.image ||
    (Array.isArray(p.images) && p.images[0]) ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
  const unit = p.quantityLabel || p.unit || '1 unit';

  const product: Product = {
    id: pId,
    _id: pId,
    name: p.name || 'WomUp Item',
    brand: p.brand || 'Farm Fresh',
    category: p.category || 'Groceries',
    price: sellingPrice,
    sellingPrice: sellingPrice,
    mrp: mrp,
    oldPrice: mrp,
    discount: discPercent,
    discountPercent: discPercent,
    unit: unit,
    quantityLabel: unit,
    image: img,
    imageUrl: img,
    description: p.description || '',
    rating: Number(p.rating || 4.8),
    reviewCount: Number(p.reviewCount || 35),
    inStock: p.stock !== undefined ? p.stock > 0 : true,
    stock: p.stock ?? 100,
    shoppingCoins: p.shoppingCoins || 10,
    deliveryMinutes: p.deliveryMinutes || 9,
  };

  const vObj = raw.variant ? {
    id: raw.variant.id || raw.variant._id,
    label: raw.variant.label || raw.variant.weightOrVolume || unit,
    price: Number(raw.variant.price ?? raw.variant.sellingPrice ?? sellingPrice),
    mrp: Number(raw.variant.mrp ?? mrp),
  } : undefined;

  const finalProduct = vObj
    ? {
        ...product,
        price: vObj.price,
        sellingPrice: vObj.price,
        mrp: vObj.mrp,
        unit: vObj.label,
        quantityLabel: vObj.label,
      }
    : product;

  return {
    product: finalProduct,
    quantity: Number(raw.quantity || 1),
    selectedVariant: vObj,
    storeName: 'Wom Up Navrangpura Dark Store',
  };
}

/**
 * Smart product image resolver to ensure every ordered product always displays a rich thumbnail
 */
export function getProductImageFallback(name: string, existingImg?: string): string {
  if (existingImg && existingImg.trim() && existingImg.startsWith('http')) {
    return existingImg;
  }
  const n = (name || '').toLowerCase();
  if (n.includes('milk') || n.includes('amul') || n.includes('dairy') || n.includes('dahi') || n.includes('paneer') || n.includes('curd')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80';
  }
  if (n.includes('apple') || n.includes('seb')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80';
  }
  if (n.includes('tomato') || n.includes('tamatar')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80';
  }
  if (n.includes('potato') || n.includes('aloo')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80';
  }
  if (n.includes('onion') || n.includes('pyaz')) {
    return 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&q=80';
  }
  if (n.includes('bread') || n.includes('toast') || n.includes('pav')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
  }
  if (n.includes('egg') || n.includes('anda')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80';
  }
  if (n.includes('rice') || n.includes('chawal') || n.includes('basmati')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80';
  }
  if (n.includes('atta') || n.includes('flour') || n.includes('aashirvaad')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80';
  }
  if (n.includes('banana') || n.includes('kela')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
}

/**
 * Map raw MongoDB Atlas order object to frontend Order interface
 */
export function mapServerOrderToClient(item: any): Order {
  const id = item._id || item.id;
  const orderNumber = item.orderNumber || `#W${(id || '').slice(-8).toUpperCase()}`;

  const items = (item.items || []).map((it: any) => {
    const rawImg = it.imageUrl || it.image || '';
    const resolvedImg = getProductImageFallback(it.name, rawImg);
    return {
      productId: it.productId?._id || it.productId || '',
      name: it.name || it.title || 'Grocery Item',
      price: it.unitPrice || it.price || 0,
      quantity: it.quantity || 1,
      image: resolvedImg,
      imageUrl: resolvedImg,
      unit: it.quantityLabel || '1 unit',
      quantityLabel: it.quantityLabel || '1 unit',
    };
  });

  const subtotal = item.itemSubtotal || item.pricing?.subtotal || item.subtotal || 0;
  const deliveryFee = item.deliveryFee ?? item.pricing?.deliveryFee ?? 0;
  const platformFee = item.handlingFee ?? item.pricing?.handlingFee ?? item.platformFee ?? 5;
  const coinDiscount = item.coinsDiscount || item.pricing?.coinsUsed || 0;
  const couponDiscount = item.couponDiscount || item.pricing?.discount || 0;
  const total = item.totalAmount || item.pricing?.total || item.total || (subtotal + deliveryFee + platformFee - coinDiscount - couponDiscount);

  const rawAddr = item.deliveryAddress || item.address;
  let formattedAddress = 'Ahmedabad, Gujarat';
  if (rawAddr) {
    if (typeof rawAddr === 'string') {
      formattedAddress = rawAddr;
    } else {
      const parts = [
        rawAddr.houseNumber || rawAddr.houseFlat,
        rawAddr.street,
        rawAddr.landmark || rawAddr.areaLandmark,
        rawAddr.city,
        rawAddr.pincode,
      ].filter(Boolean);
      formattedAddress = parts.join(', ') || 'Ahmedabad, Gujarat';
    }
  }

  // Delivery partner resolution matching S24_OrderTrackingScreen
  let partner: any = undefined;
  if (item.deliveryPartnerId && typeof item.deliveryPartnerId === 'object') {
    const rawName = (item.deliveryPartnerId.fullName || item.deliveryPartnerId.name || '').trim();
    if (
      rawName &&
      rawName.toLowerCase() !== 'delivery partner' &&
      rawName.toLowerCase() !== 'assigning...' &&
      !rawName.toLowerCase().includes('rohit')
    ) {
      partner = {
        id: item.deliveryPartnerId._id,
        name: rawName,
        phone: item.deliveryPartnerId.phoneNumber || item.deliveryPartnerId.phone || '',
        vehicleNumber: item.deliveryPartnerId.vehicleNumber || 'Electric Scooter',
        rating: item.deliveryPartnerId.rating || 5,
      };
    }
  } else if (item.deliveryPartner && item.deliveryPartner.name) {
    const rawName = (item.deliveryPartner.name || '').trim();
    if (
      rawName &&
      rawName.toLowerCase() !== 'delivery partner' &&
      rawName.toLowerCase() !== 'assigning...' &&
      !rawName.toLowerCase().includes('rohit')
    ) {
      partner = item.deliveryPartner;
    }
  }

  return {
    id,
    _id: id,
    orderNumber,
    items,
    subtotal,
    deliveryFee,
    platformFee,
    coinDiscount,
    couponDiscount,
    total,
    totalAmount: total,
    status: item.status || 'PLACED',
    deliveryPin: item.deliveryPin || item.deliveryOtp || '4821',
    deliveryOtp: item.deliveryOtp || item.deliveryPin || '4821',
    customerName: rawAddr?.fullName || item.customerName || 'Customer',
    customerPhone: rawAddr?.phoneNumber || item.customerPhone || '+91 98765 43210',
    deliveryAddress: formattedAddress,
    deliverySlot: item.deliverySlot || 'Instant 9 Minutes',
    paymentMethod: item.paymentMethod || 'UPI',
    paymentStatus: item.paymentStatus || 'COMPLETED',
    storeName: item.storeId?.name || item.storeName || 'Wom Up Navrangpura Dark Store',
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Just now',
    eta: item.estimatedArrival ? 'Arriving in 9 mins' : '9 mins',
    estimatedArrival: item.estimatedArrival,
    deliveryPartner: partner,
    cancellationReason: item.cancellationReason,
    priceAdjustments: item.priceAdjustments || [],
  };
}

/**
 * Live WebSocket tracking listener
 */
export function subscribeToOrderTracking(
  orderId: string,
  onUpdate: (data: { status?: string; riderLocation?: { lat: number; lng: number }; message?: string }) => void
): () => void {
  try {
    const socket: Socket = io(TRACKING_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join_order', { orderId });
      socket.emit('join_order_room', orderId);
    });

    socket.on('order_status', (data: any) => {
      onUpdate(data);
    });

    socket.on('order_status_updated', (data: any) => {
      onUpdate(data);
    });

    socket.on('rider_location', (loc: any) => {
      const lat = loc?.lat ?? loc?.latitude;
      const lng = loc?.lng ?? loc?.longitude;
      if (lat !== undefined && lng !== undefined) {
        onUpdate({ riderLocation: { lat, lng } });
      }
    });

    socket.on('rider_location_update', (loc: any) => {
      const lat = loc?.lat ?? loc?.latitude;
      const lng = loc?.lng ?? loc?.longitude;
      if (lat !== undefined && lng !== undefined) {
        onUpdate({ riderLocation: { lat, lng } });
      }
    });

    socket.on('update_delivery_location', (loc: any) => {
      const lat = loc?.lat ?? loc?.latitude;
      const lng = loc?.lng ?? loc?.longitude;
      if (lat !== undefined && lng !== undefined) {
        onUpdate({ riderLocation: { lat, lng } });
      }
    });

    socket.on('delivery.location.updated', (loc: any) => {
      const lat = loc?.lat ?? loc?.latitude;
      const lng = loc?.lng ?? loc?.longitude;
      if (lat !== undefined && lng !== undefined) {
        onUpdate({ riderLocation: { lat, lng } });
      }
    });

    return () => {
      socket.emit('leave_order', { orderId });
      socket.disconnect();
    };
  } catch (err) {
    console.warn('[TrackingWS] Connection skipped:', err);
    return () => {};
  }
}

/**
 * Delivery Addresses API — matching customer app AddressService (/api/v1/addresses)
 */
export interface SavedAddressItem {
  id: string;
  _id?: string;
  type?: 'Home' | 'Work' | 'Other' | 'Current' | string;
  label: 'Home' | 'Work' | 'Other' | 'Current' | string;
  fullName?: string;
  phoneNumber?: string;
  houseFlat?: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  areaLandmark?: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  location?: {
    type?: string;
    coordinates?: number[]; // [lng, lat]
  };
}

export const AddressApi = {
  async getAddresses(): Promise<SavedAddressItem[]> {
    try {
      const res = await api.get<any>('/addresses');
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((item: any) => {
          const lat = item.location?.coordinates?.[1] || item.latitude;
          const lng = item.location?.coordinates?.[0] || item.longitude;
          const label = item.label || item.type || 'Home';
          const house = item.houseNumber || item.houseFlat || '';
          const street = item.street || item.areaLandmark || '';
          const landmark = item.landmark || '';

          const combinedText = `${house} ${street} ${landmark}`.toLowerCase();
          const isThaltej = combinedText.includes('thaltej');

          let resolvedLat = typeof lat === 'number' ? lat : (isThaltej ? 23.0500 : 23.1289);
          let resolvedLng = typeof lng === 'number' ? lng : (isThaltej ? 72.5160 : 72.5507);
          if (isThaltej && (!lat || lat > 23.10)) {
            resolvedLat = 23.0500;
            resolvedLng = 72.5160;
          }

          // Build readable address
          const addressParts = [house, street, landmark, item.city].filter(Boolean);
          const fullAddressString = addressParts.join(', ');

          return {
            id: item._id || item.id,
            _id: item._id || item.id,
            type: label,
            label,
            fullName: item.fullName || 'Customer',
            phoneNumber: item.phoneNumber || '',
            houseNumber: house,
            street,
            landmark,
            areaLandmark: isThaltej ? 'Thaltej' : (landmark || street || 'Chandlodiya - Tragad'),
            houseFlat: house || fullAddressString || `${house}, ${street}`,
            fullAddress: fullAddressString,
            city: item.city || 'Ahmedabad',
            state: item.state || 'Gujarat',
            pincode: isThaltej ? '380054' : (item.pincode || '382481'),
            isDefault: Boolean(item.isDefault),
            latitude: resolvedLat,
            longitude: resolvedLng,
            location: item.location,
          };
        });
      }
      return [];
    } catch (e) {
      console.warn('[AddressApi] getAddresses error:', e);
      return [];
    }
  },

  async createAddress(data: {
    label?: string;
    type?: string;
    fullName?: string;
    phoneNumber?: string;
    houseFlat?: string;
    houseNumber?: string;
    street?: string;
    landmark?: string;
    areaLandmark?: string;
    city?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const label = data.label || data.type || 'Home';
    const houseNumber = data.houseNumber || data.houseFlat?.split(',')?.[0]?.trim() || data.houseFlat || '101';
    const street = data.street || data.houseFlat?.split(',')?.slice(1)?.join(',')?.trim() || data.areaLandmark || 'Main Road';
    const city = data.city?.split(',')?.[0]?.trim() || 'Ahmedabad';

    const payload = {
      label,
      houseNumber,
      street,
      landmark: data.landmark || data.areaLandmark || '',
      city,
      state: 'Gujarat',
      pincode: data.pincode || '380015',
      coordinates:
        data.longitude !== undefined && data.latitude !== undefined
          ? [data.longitude, data.latitude]
          : [72.5507, 23.1289],
      isDefault: data.isDefault ?? true,
      deliveryInstructions: '',
    };

    return api.post('/addresses', payload);
  },

  async setDefaultAddress(id: string): Promise<{ success: boolean; message?: string }> {
    return api.patch(`/addresses/${id}/default`);
  },

  async deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
    return api.delete(`/addresses/${id}`);
  },
};

