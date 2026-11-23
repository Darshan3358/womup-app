import { Product, FilterSortState, Category, SubCategory, ProductVariantPriced } from '../types';
import { api } from './api';
import { PRODUCTS } from '../data/products';

// ---------------------------------------------------------------------------
// Simple TTL caches (in-memory, process-lifetime)
// ---------------------------------------------------------------------------
// Flat in-memory cache pre-seeded with authoritative 34 catalog products
let cachedProducts: Product[] = Array.isArray(PRODUCTS) && PRODUCTS.length > 0 ? [...PRODUCTS] : [];
let cachedCategories: Category[] = [];

let _categoryCacheEntry: { data: Category[]; ts: number } | null = null;
const CATEGORY_TTL_MS = 5 * 60 * 1000; // 5 minutes

const _homeSectionCache = new Map<string, { data: any; ts: number }>();
const HOME_SECTION_TTL_MS = 30 * 1000; // 30 seconds per store+area combo

export function mapRawItemToProduct(item: any): Product {
  const variants: ProductVariantPriced[] = Array.isArray(item.variants)
    ? item.variants.map((v: any) => ({
        id: v.id || v._id || `${item._id}_v`,
        label: v.label || `${v.quantity || ''} ${v.unit || ''}`.trim() || '1 unit',
        price: Number(v.price ?? v.sellingPrice ?? item.sellingPrice ?? 0),
        mrp: Number(v.mrp ?? item.mrp ?? 0),
        discountPercent: Number(v.discountPercent ?? item.discountPercent ?? 0),
        stock: Number(v.stock ?? 100),
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
  const catIdStr = catObj?._id ? catObj._id.toString() : (catObj ? catObj.toString() : 'cooking');
  const catSlug = catObj?.slug || '';
  const catName = catObj?.name || '';

  return {
    id: item._id || item.id,
    name: item.name,
    brand: item.brand,
    categoryId: catIdStr,
    categorySlug: catSlug,
    categoryName: catName,
    subCategoryId: item.subCategoryId,
    imageUrl: item.imageUrl,
    quantityLabel: effectiveLabel,
    mrp: effectiveMrp,
    sellingPrice: effectiveSellingPrice,
    discountPercent: effectiveDiscount,
    shoppingCoins: item.shoppingCoins || 10,
    rating: Number(Number(item.rating || 4.8).toFixed(1)),
    reviewCount: item.reviewCount || 0,
    stock: defaultVariant ? defaultVariant.stock : (item.stock || 100),
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

      // If scoped query returned empty sections or failed, fallback to global /home/sections
      if ((!res.success || !res.data?.sections || res.data.sections.length === 0) && qs) {
        res = await api.request<any>('/home/sections', { method: 'GET' });
      }

      if (res.success && res.data?.sections && res.data.sections.length > 0) {
        const result = {
          hero: res.data.hero || [],
          categories: res.data.categories || [],
          sections: res.data.sections.map((sec: any) => ({
            ...sec,
            products: (sec.products || []).map(mapRawItemToProduct),
          })),
        };
        _homeSectionCache.set(cacheKey, { data: result, ts: Date.now() });

        // Update cachedProducts flat array
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
        if (allProds.length > 0) {
          cachedProducts = allProds;
        }

        return result;
      }
    } catch (e) {
      console.warn('[ProductService] fetchHomeSections network error:', e);
    }

    // Secondary fallback: synthesize 7 home sections from cached/bundled catalog directly
    const fallbackItems = cachedProducts.length > 0 ? cachedProducts : PRODUCTS;
    if (fallbackItems && fallbackItems.length > 0) {
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
          subtitle: 'In stock at your nearest dark store',
          icon: '⚡',
          products: fallbackItems.slice(0, 10),
        },
        {
          id: 'fresh_veggies',
          title: 'Fresh Vegetables & Fruits',
          subtitle: 'Farm fresh, delivered directly to your doorstep',
          icon: '🌱',
          products: fallbackItems
            .filter((p) => {
              const t = `${p.categoryName || ''} ${p.name || ''} ${p.categorySlug || ''}`.toLowerCase();
              return (
                t.includes('veg') ||
                t.includes('fruit') ||
                t.includes('tomato') ||
                t.includes('onion') ||
                t.includes('apple') ||
                t.includes('banana') ||
                t.includes('potato')
              );
            })
            .slice(0, 10),
        },
        {
          id: 'dairy_bread',
          title: 'Dairy, Bread & Eggs',
          subtitle: 'Start your day right',
          icon: '🥛',
          products: fallbackItems
            .filter((p) => {
              const t = `${p.categoryName || ''} ${p.name || ''} ${p.categorySlug || ''}`.toLowerCase();
              return (
                t.includes('dairy') ||
                t.includes('milk') ||
                t.includes('bread') ||
                t.includes('egg') ||
                t.includes('paneer') ||
                t.includes('butter') ||
                t.includes('curd')
              );
            })
            .slice(0, 10),
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

  clearHomeCache() {
    _homeSectionCache.clear();
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
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await api.get<{ items: any[] }>(`/products${queryString}`);

    if (res.success && res.data?.items) {
      const mapped: Product[] = res.data.items.map(mapRawItemToProduct);

      // If fetching general catalog, update cachedProducts
      if (!params.categoryId && (!params.categoryIds || params.categoryIds.length === 0) && !params.search) {
        cachedProducts = mapped;
      }
      return mapped;
    }

    return cachedProducts.length > 0 ? cachedProducts : PRODUCTS;
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

  // --- Synchronous methods backed by current server cache ---
  getAllProducts(): Product[] {
    return cachedProducts.length > 0 ? cachedProducts : PRODUCTS;
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
    return cachedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
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
