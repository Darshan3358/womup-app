import { PRODUCTS } from '../data/products';
import { CATEGORIES, SUB_CATEGORIES } from '../data/categories';
import { Product, FilterSortState, Category, SubCategory } from '../types';

export const ProductService = {
  getAllProducts(): Product[] {
    return PRODUCTS;
  },

  getProductById(id: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
  },

  getProductsByCategory(categoryId: string): Product[] {
    return PRODUCTS.filter((p) => p.categoryId === categoryId);
  },

  getProductsBySubCategory(subCategoryId: string): Product[] {
    return PRODUCTS.filter((p) => p.subCategoryId === subCategoryId);
  },

  getDealsOfTheDay(): Product[] {
    return PRODUCTS.filter((p) => p.isDeal);
  },

  getPopularProducts(): Product[] {
    return PRODUCTS.filter((p) => p.isPopular);
  },

  getCategories(): Category[] {
    return CATEGORIES;
  },

  getSubCategories(categoryId: string): SubCategory[] {
    return SUB_CATEGORIES.filter((s) => s.categoryId === categoryId);
  },

  searchProducts(query: string): Product[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  },

  filterAndSortProducts(products: Product[], filters: FilterSortState): Product[] {
    let result = [...products];

    // Filter by category
    if (filters.category) {
      result = result.filter((p) => p.categoryId === filters.category);
    }

    // Filter by brand
    if (filters.brand) {
      result = result.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }

    // Filter by price range
    result = result.filter(
      (p) => p.sellingPrice >= filters.priceRange[0] && p.sellingPrice <= filters.priceRange[1]
    );

    // Filter by rating
    if (filters.rating) {
      result = result.filter((p) => p.rating >= (filters.rating || 0));
    }

    // Filter in stock
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // Filter discount
    if (filters.discountRange) {
      result = result.filter((p) => p.discountPercent >= (filters.discountRange || 0));
    }

    // Sort
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
