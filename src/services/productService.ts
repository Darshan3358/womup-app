import { Product, FilterSortState, Category, SubCategory, ProductVariantPriced } from '../types';
import { api } from './api';

// In-memory dynamic cache loaded from MongoDB Atlas backend
let cachedProducts: Product[] = [];
let cachedCategories: Category[] = [];

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
  async fetchHomeSections(params: { storeId?: string; areaId?: string } = {}): Promise<{
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

    const res = await api.get<any>(`/home/sections${qs}`);
    if (res.success && res.data?.sections) {
      return {
        hero: res.data.hero || [],
        categories: res.data.categories || [],
        sections: res.data.sections.map((sec: any) => ({
          ...sec,
          products: (sec.products || []).map(mapRawItemToProduct),
        })),
      };
    }
    return null;
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

    return cachedProducts;
  },

  async fetchCategories(): Promise<Category[]> {
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
      cachedCategories = mapped;
      return mapped;
    }
    return cachedCategories;
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
