import { Product, FilterSortState, Category, SubCategory, ProductVariantPriced } from '../types';
import { api } from './api';
import { StorageService } from './storageService';

// ---------------------------------------------------------------------------
// Simple TTL caches (in-memory + offline persistence)
// ---------------------------------------------------------------------------
const CACHE_KEYS = {
  CACHED_PRODUCTS: '@wormup_cached_products',
};

// In-memory cache holding real products loaded from API or local disk persistence
let cachedProducts: Product[] = [];
let cachedCategories: Category[] = [];

// Initialize memory cache from persistent disk storage on app startup
(async () => {
  try {
    const saved = await StorageService.getItem<Product[]>(CACHE_KEYS.CACHED_PRODUCTS, []);
    if (Array.isArray(saved) && saved.length > 0 && cachedProducts.length === 0) {
      cachedProducts = saved;
    }
  } catch {}
})();

let _categoryCacheEntry: { data: Category[]; ts: number } | null = null;
const CATEGORY_TTL_MS = 5 * 60 * 1000; // 5 minutes

const _homeSectionCache = new Map<string, { data: any; ts: number }>();
const HOME_SECTION_TTL_MS = 30 * 1000; // 30 seconds per store+area combo
let _activeStoreScopeKey = '';

export function mapRawItemToProduct(item: any): Product {
  const variants: ProductVariantPriced[] = Array.isArray(item.variants)
    ? item.variants.map((v: any) => ({
        id: v.id || v._id || `${item._id}_v`,
        label: v.label || `${v.quantity || ''} ${v.unit || ''}`.trim() || '1 unit',
        price: Number(v.price ?? v.sellingPrice ?? item.sellingPrice ?? 0),
        mrp: Number(v.mrp ?? item.mrp ?? 0),
        discountPercent: Number(v.discountPercent ?? item.discountPercent ?? 0),
        stock: Number(v.stock !== undefined && v.stock !== null ? v.stock : 100),
        isAvailable: v.isAvailable !== false,
        isDefault: !!v.isDefault,
      }))
    : [];

  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const effectiveSellingPrice = defaultVariant ? defaultVariant.price : (item.sellingPrice ?? 0);
  const effectiveMrp = defaultVariant ? defaultVariant.mrp : (item.mrp ?? effectiveSellingPrice);
  const effectiveDiscount = defaultVariant ? defaultVariant.discountPercent : (item.discountPercent ?? 0);
  const effectiveLabel = defaultVariant ? defaultVariant.label : (item.quantityLabel || '1 unit');

  const catObj = item.categoryId;
  const catIdStr = catObj?._id ? catObj._id.toString() : (catObj ? catObj.toString() : (item.category || 'cooking'));
  const catName = (typeof catObj === 'object' && catObj?.name) ? catObj.name : (item.category || item.categoryName || '');
  const catSlug = (typeof catObj === 'object' && catObj?.slug) ? catObj.slug : (item.categorySlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

  return {
    id: item._id || item.id,
    name: item.name,
    brand: item.brand,
    categoryId: catIdStr,
    categorySlug: catSlug,
    categoryName: catName,
    subCategoryId: item.subCategoryId,
    imageUrl: item.imageUrl || item.image || (Array.isArray(item.images) && item.images[0]) || '',
    quantityLabel: effectiveLabel,
    mrp: effectiveMrp,
    sellingPrice: effectiveSellingPrice,
    discountPercent: effectiveDiscount,
    shoppingCoins: item.shoppingCoins || 10,
    rating: Number(Number(item.rating || 4.8).toFixed(1)),
    reviewCount: item.reviewCount || 0,
    stock: defaultVariant
      ? defaultVariant.stock
      : item.stock !== undefined && item.stock !== null
      ? Number(item.stock)
      : 100,
    isPopular: item.isPopular || false,
    isDeal: item.isDeal || false,
    deliveryMinutes: item.deliveryMinutes || 9,
    description: item.description || '',
    specifications: item.specifications || {},
    variants,
  };
}

export const ProductService = {
  // --- Live API Methods (Fetching directly from MongoDB Atlas) ---
  async fetchHomeSections(
    params: { storeId?: string; areaId?: string } = {},
    signal?: AbortSignal,
  ): Promise<{
    hero: any[];
    categories: any[];
    sections: {
      id: string;
      title: string;
      subtitle: string;
      icon: string;
      viewAllFilter?: string;
      viewAllLink?: string;
      categoryName?: string;
      products: Product[];
    }[];
  } | null> {
    const scopeKey = `${params.storeId || ''}_${params.areaId || ''}`;
    if (scopeKey !== _activeStoreScopeKey) {
      _activeStoreScopeKey = scopeKey;
      _homeSectionCache.clear();
      cachedProducts = [];
      StorageService.removeItem(CACHE_KEYS.CACHED_PRODUCTS).catch(() => {});
    }

    const queryParts: string[] = [];
    if (params.storeId) queryParts.push(`storeId=${encodeURIComponent(params.storeId)}`);
    if (params.areaId) queryParts.push(`areaId=${encodeURIComponent(params.areaId)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const cacheKey = `home${qs}`;

    // Return cached result if still fresh (TTL: 30 seconds per store+area)
    const cached = _homeSectionCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < HOME_SECTION_TTL_MS) {
      return cached.data;
    }

    try {
      let res = await api.request<any>(`/home/sections${qs}`, { method: 'GET', signal });

      // Only fallback to unscoped /home/sections when no store/area filter was requested
      if ((!res.success || !res.data?.sections || res.data.sections.length === 0) && !params.storeId && !params.areaId && qs) {
        res = await api.request<any>('/home/sections', { method: 'GET' });
      }

      if (res.success && res.data?.sections) {
        const result = {
          hero: res.data.hero || [],
          categories: res.data.categories || [],
          sections: res.data.sections.map((sec: any) => ({
            ...sec,
            products: (sec.products || []).map(mapRawItemToProduct),
          })),
        };
        _homeSectionCache.set(cacheKey, { data: result, ts: Date.now() });

        // Update cachedProducts flat array for the active store scope
        const allProds: Product[] = [];
        const seen = new Set<string>();
        for (const sec of result.sections) {
          for (const p of sec.products) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              allProds.push(p);
            }
          }
        }
        cachedProducts = allProds;
        if (allProds.length > 0) {
          StorageService.saveItem(CACHE_KEYS.CACHED_PRODUCTS, allProds).catch(() => {});
        } else if (params.storeId) {
          StorageService.removeItem(CACHE_KEYS.CACHED_PRODUCTS).catch(() => {});
        }

        return result;
      }
    } catch (e) {
      console.warn('[ProductService] fetchHomeSections network error:', e);
    }

    // Secondary fallback: synthesize home sections from real cached catalog if available
    const fallbackItems = cachedProducts;
    if (fallbackItems && fallbackItems.length > 0) {
      const vegNames = ['potato', 'onion', 'tomato', 'lady fingers', 'cabbage', 'ginger', 'guwar', 'lemon', 'bottle gourd', 'parwal', 'beetroot'];
      const fruitNames = ['apple', 'banana', 'orange', 'pineapple', 'muskmelon', 'papaya', 'kiwi', 'watermelon'];
      const attaNames = ['aashirvaad atta', 'basmati rice', 'tata salt', 'sunflower oil'];
      const dairyNames = ['paneer', 'curd', 'milk', 'bread', 'butter milk', 'dahi'];
      const personalCareNames = ['shampoo', 'hair oil', 'conditioner', 'body spray', 'body perfume', 'hair colour'];

      const isVeg = (p: Product) => {
        if (p.categoryId === '6aa2712acb3d55073acc2101' || p.categorySlug === 'vegetables') return true;
        const name = (p.name || '').toLowerCase();
        return vegNames.some((v) => name.includes(v)) && !fruitNames.some((f) => name.includes(f));
      };
      const isFruit = (p: Product) => {
        if (p.categoryId === '6aa2712acb3d55073acc2102' || p.categorySlug === 'fruits') return true;
        const name = (p.name || '').toLowerCase();
        return fruitNames.some((f) => name.includes(f));
      };
      const isAtta = (p: Product) => {
        if (p.categoryId === '6b046011e457907227bc34cb' || p.categorySlug === 'atta-rice-dal') return true;
        const name = (p.name || '').toLowerCase();
        return (attaNames.some((a) => name.includes(a)) || name.includes('atta') || name.includes('rice') || name.includes('salt') || name.includes('sunflower')) && !name.includes('hair');
      };
      const isDairy = (p: Product) => {
        if (p.categoryId === '6b046011e457907227bc34cc' || p.categorySlug === 'dairy-bread-eggs') return true;
        const name = (p.name || '').toLowerCase();
        return dairyNames.some((d) => name.includes(d));
      };
      const isPC = (p: Product) => {
        if (p.categoryId === '6b046012e457907227bc34cd' || p.categorySlug === 'beauty-personal-care') return true;
        const name = (p.name || '').toLowerCase();
        return personalCareNames.some((pc) => name.includes(pc)) || name.includes('shampoo') || name.includes('perfume') || name.includes('spray') || name.includes('colour') || name.includes('conditioner') || name.includes('hair');
      };

      const synthSections = [
        {
          id: 'deals',
          title: 'Deals of the Day',
          subtitle: 'Save big on daily essentials',
          icon: '🔥',
          products: fallbackItems.filter((p) => p.mrp > p.sellingPrice).slice(0, 10),
        },
        {
          id: 'fast_delivery',
          title: 'Fresh Grocery & Essentials',
          subtitle: 'Freshly stocked for fast doorstep delivery',
          icon: '⚡',
          products: fallbackItems.slice(0, 10),
        },
        {
          id: 'fresh_vegetables',
          title: 'Fresh Vegetables',
          subtitle: 'Farm fresh, delivered directly to your doorstep',
          icon: '🥕',
          products: fallbackItems.filter(isVeg),
        },
        {
          id: 'fresh_fruits',
          title: 'Fresh Fruits',
          subtitle: 'Juicy, sweet seasonal fruits',
          icon: '🍎',
          products: fallbackItems.filter(isFruit),
        },
        {
          id: 'fresh_veggies',
          title: 'Fresh Vegetables & Fruits',
          subtitle: 'Farm fresh, delivered directly to your doorstep',
          icon: '🌱',
          products: fallbackItems.filter((p) => isVeg(p) || isFruit(p)),
        },
        {
          id: 'atta_rice_dal',
          title: 'Atta, Rice & Dal',
          subtitle: 'Daily kitchen staples & cooking essentials',
          icon: '🌾',
          products: fallbackItems.filter(isAtta),
        },
        {
          id: 'dairy_bread',
          title: 'Dairy, Bread & Eggs',
          subtitle: 'Start your day right',
          icon: '🥛',
          products: fallbackItems.filter(isDairy),
        },
        {
          id: 'beauty_personal_care',
          title: 'Beauty & Personal Care',
          subtitle: 'Grooming & self-care essentials',
          icon: '✨',
          products: fallbackItems.filter(isPC),
        },
        {
          id: 'bestsellers',
          title: 'Bestsellers',
          subtitle: 'Loved by 1000+ customers',
          icon: '⭐',
          products: fallbackItems.filter((p) => p.rating >= 4.5).slice(0, 10),
        },
        {
          id: 'new_arrivals',
          title: 'New Arrivals',
          subtitle: 'Just landed in our stores',
          icon: '🆕',
          products: fallbackItems.slice(0, 10),
        },
        {
          id: 'under_50',
          title: 'Under ₹50',
          subtitle: 'Everyday savings',
          icon: '💰',
          products: fallbackItems.filter((p) => p.sellingPrice <= 50).slice(0, 10),
        },
      ];

      return {
        hero: [],
        categories: cachedCategories,
        sections: synthSections,
      };
    }

    return null;
  },

  clearHomeCache(clearCatalog: boolean = false) {
    _homeSectionCache.clear();
    if (clearCatalog) {
      cachedProducts = [];
      StorageService.removeItem(CACHE_KEYS.CACHED_PRODUCTS).catch(() => {});
    }
  },

  async fetchProducts(params: {
    areaId?: string;
    storeId?: string;
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Product[]> {
    const scopeKey = `${params.storeId || ''}_${params.areaId || ''}`;
    if (scopeKey !== _activeStoreScopeKey) {
      _activeStoreScopeKey = scopeKey;
      _homeSectionCache.clear();
      cachedProducts = [];
      StorageService.removeItem(CACHE_KEYS.CACHED_PRODUCTS).catch(() => {});
    }

    const queryParts: string[] = [];
    if (params.areaId) queryParts.push(`areaId=${encodeURIComponent(params.areaId)}`);
    if (params.storeId) queryParts.push(`storeId=${encodeURIComponent(params.storeId)}`);
    if (params.categoryId) queryParts.push(`categoryId=${encodeURIComponent(params.categoryId)}`);
    if (params.categoryIds && params.categoryIds.length > 0) {
      queryParts.push(`categoryIds=${encodeURIComponent(params.categoryIds.join(','))}`);
    }
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
    if (params.minPrice !== undefined) queryParts.push(`minPrice=${params.minPrice}`);
    if (params.maxPrice !== undefined) queryParts.push(`maxPrice=${params.maxPrice}`);
    if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    queryParts.push(`limit=${params.limit || 250}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await api.get<{ items: any[] }>(`/products${queryString}`);

    if (res.success && res.data?.items) {
      const mapped: Product[] = res.data.items.map(mapRawItemToProduct);

      // Update cachedProducts when fetching general catalog (including empty scoped store catalogs)
      if (!params.categoryId && (!params.categoryIds || params.categoryIds.length === 0) && !params.search) {
        if (mapped.length > 0 || params.storeId) {
          cachedProducts = mapped;
          if (mapped.length > 0) {
            StorageService.saveItem(CACHE_KEYS.CACHED_PRODUCTS, mapped).catch(() => {});
          } else {
            StorageService.removeItem(CACHE_KEYS.CACHED_PRODUCTS).catch(() => {});
          }
        }
      }
      return mapped;
    }

    return cachedProducts;
  },

  async fetchCategories(): Promise<Category[]> {
    // Return from TTL cache if still fresh (5 minutes)
    if (_categoryCacheEntry && Date.now() - _categoryCacheEntry.ts < CATEGORY_TTL_MS) {
      return _categoryCacheEntry.data;
    }

    const res = await api.get<any[]>('/categories');
    if (res.success && Array.isArray(res.data)) {
      const mapped: Category[] = res.data.map((cat: any) => ({
        id: cat._id || cat.id || cat.slug,
        name: cat.name,
        iconName: cat.icon || 'shopping-bag',
        color: '#F562AF',
        bgColor: cat.bgColor || '#FCE1F5',
        itemCount: cat.itemCount || 0,
      }));
      _categoryCacheEntry = { data: mapped, ts: Date.now() };
      cachedCategories = mapped;
      return mapped;
    }
    return _categoryCacheEntry?.data || cachedCategories;
  },

  async fetchBanners(): Promise<any[]> {
    const res = await api.get<any[]>('/banners');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  hasCachedProducts(): boolean {
    return cachedProducts.length > 0;
  },

  // --- Synchronous methods backed by current server cache ---
  getAllProducts(): Product[] {
    return cachedProducts;
  },

  getProductById(id: string): Product | undefined {
    return cachedProducts.find((p) => p.id === id);
  },

  getProductsByCategory(categoryId: string): Product[] {
    return cachedProducts.filter((p) => p.categoryId === categoryId);
  },

  getProductsBySubCategory(subCategoryId: string): Product[] {
    return cachedProducts.filter((p) => p.subCategoryId === subCategoryId);
  },

  getDealsOfTheDay(): Product[] {
    return cachedProducts.filter((p) => p.isDeal);
  },

  getPopularProducts(): Product[] {
    return cachedProducts.filter((p) => p.isPopular);
  },

  getCategories(): Category[] {
    return cachedCategories;
  },

  getSubCategories(categoryId: string): SubCategory[] {
    const prods = cachedProducts.filter((p) => p.categoryId === categoryId);
    const subMap = new Map<string, number>();
    prods.forEach((p) => {
      const sub = p.subCategoryId || 'general';
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
    });
    return Array.from(subMap.entries()).map(([sub, count], idx) => ({
      id: `${categoryId}_sub_${idx + 1}`,
      name: sub.charAt(0).toUpperCase() + sub.slice(1).replace(/_/g, ' '),
      categoryId,
      iconName: 'grid-outline',
      itemCount: count,
    }));
  },

  searchProducts(query: string): Product[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const source = cachedProducts;
    const terms = q.split(/\s+/).filter(Boolean);
    return source.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.categoryName || p.categoryId || '').toLowerCase();
      const target = `${name} ${brand} ${desc} ${cat}`;
      return terms.every((t) => target.includes(t));
    });
  },

  async searchProductsLive(query: string, areaId?: string, storeId?: string): Promise<Product[]> {
    if (!query.trim()) return [];
    const local = this.searchProducts(query);
    try {
      const server = await this.fetchProducts({
        search: query.trim(),
        areaId,
        storeId,
        limit: 100,
      });
      if (storeId) {
        return server;
      }
      const map = new Map<string, Product>();
      local.forEach((p) => map.set(p.id, p));
      server.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    } catch {
      return local;
    }
  },

  filterAndSortProducts(products: Product[], filters: FilterSortState): Product[] {
    let result = [...products];

    if (filters.category) {
      result = result.filter((p) => p.categoryId === filters.category);
    }

    if (filters.brand) {
      result = result.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }

    result = result.filter(
      (p) => p.sellingPrice >= filters.priceRange[0] && p.sellingPrice <= filters.priceRange[1]
    );

    if (filters.rating) {
      result = result.filter((p) => p.rating >= (filters.rating || 0));
    }

    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    if (filters.discountRange) {
      result = result.filter((p) => p.discountPercent >= (filters.discountRange || 0));
    }

    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'discount':
        result.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case 'popularity':
      default:
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  },
};
