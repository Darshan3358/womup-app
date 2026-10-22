import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { BannersService } from '../banners/banners.service';

export interface HomeSectionResponse {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  viewAllLink?: string;
  viewAllFilter?: string;
  categoryId?: string;
  categoryName?: string;
  products: any[];
}

import { getHomeCache, setHomeCache, clearHomeCache } from './home-cache';
export { clearHomeCache } from './home-cache';

@Injectable()
export class HomeService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly bannersService: BannersService,
  ) {}

  async getHomeSections(storeId?: string, areaId?: string) {
    const cacheKey = `${storeId || 'none'}:${areaId || 'none'}`;
    const cached = getHomeCache(cacheKey);
    if (cached) {
      return cached;
    }

    const [heroBanners, categories, allProductsResult] = await Promise.all([
      this.bannersService.findAll('HOME_HERO').then((b) => (b.length ? b : this.bannersService.findAll())),
      this.categoriesService.findAll(),
      this.productsService.findAll({ storeId, areaId, limit: 120 }),
    ]);

    const allProducts = allProductsResult?.items || [];

    // Helper for category match
    const isVegFruit = (p: any) => {
      const text = `${p.categoryId?.name || ''} ${p.categoryId?.slug || ''} ${p.category || ''} ${p.name || ''}`.toLowerCase();
      return text.includes('veg') || text.includes('fruit') || text.includes('tomato') || text.includes('onion') || text.includes('potato') || text.includes('banana') || text.includes('apple');
    };

    const isDairyBread = (p: any) => {
      const text = `${p.categoryId?.name || ''} ${p.categoryId?.slug || ''} ${p.category || ''} ${p.name || ''}`.toLowerCase();
      return (
        text.includes('dairy') ||
        text.includes('milk') ||
        text.includes('bread') ||
        text.includes('egg') ||
        text.includes('paneer') ||
        text.includes('butter') ||
        text.includes('cheese') ||
        text.includes('yogurt') ||
        text.includes('curd')
      );
    };

    // 1. Deals of the Day (discount >= 10% or isDeal or mrp > sellingPrice)
    const dealsProducts = [...allProducts]
      .filter((p) => p.discountPercent >= 10 || p.isDeal || (p.mrp && p.sellingPrice && p.mrp > p.sellingPrice))
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
      .slice(0, 8);

    // 2. 9-Minute Delivery (availableQty > 15 / high stock, quick delivery)
    const fastDeliveryProducts = [...allProducts]
      .filter((p) => (p.stock ?? 100) > 15 && (p.deliveryMinutes || 9) <= 10)
      .slice(0, 8);

    // 3. Fresh Vegetables & Fruits
    const vegFruitsProducts = [...allProducts].filter(isVegFruit).slice(0, 8);

    // 4. Dairy, Bread & Eggs
    const dairyProducts = [...allProducts].filter(isDairyBread).slice(0, 8);

    // 5. Bestsellers (rating >= 4.5 or isPopular)
    const bestsellersProducts = [...allProducts]
      .filter((p) => (p.rating || 0) >= 4.5 || p.isPopular)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);

    // 6. New Arrivals (sorted by createdAt DESC)
    const newArrivalsProducts = [...allProducts]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);

    // 7. Under ₹50
    const under50Products = [...allProducts]
      .filter((p) => (p.sellingPrice || 0) <= 50)
      .sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0))
      .slice(0, 8);

    const sections: HomeSectionResponse[] = [
      {
        id: 'deals',
        title: 'Deals of the Day',
        subtitle: 'Save big on daily essentials',
        icon: '🔥',
        viewAllFilter: 'deals',
        viewAllLink: '/products?filter=deals',
        products: dealsProducts.length > 0 ? dealsProducts : allProducts.slice(0, 6),
      },
      {
        id: 'fast_delivery',
        title: '9-Minute Delivery',
        subtitle: 'In stock at your nearest dark store',
        icon: '⚡',
        viewAllFilter: 'fast',
        viewAllLink: '/products?filter=fast',
        products: fastDeliveryProducts.length > 0 ? fastDeliveryProducts : allProducts.slice(0, 8),
      },
      {
        id: 'fresh_veggies',
        title: 'Fresh Vegetables & Fruits',
        subtitle: 'Farm fresh, delivered in 9 minutes',
        icon: '🌱',
        categoryName: 'Vegetables & Fruits',
        viewAllFilter: 'c1',
        viewAllLink: '/products?category=c1',
        products: vegFruitsProducts.length > 0 ? vegFruitsProducts : allProducts.slice(0, 6),
      },
      {
        id: 'dairy_bread',
        title: 'Dairy, Bread & Eggs',
        subtitle: 'Start your day right',
        icon: '🥛',
        categoryName: 'Dairy, Bread & Eggs',
        viewAllFilter: 'c3',
        viewAllLink: '/products?category=c3',
        products: dairyProducts.length > 0 ? dairyProducts : allProducts.slice(0, 6),
      },
      {
        id: 'bestsellers',
        title: 'Bestsellers',
        subtitle: 'Loved by 1000+ customers',
        icon: '⭐',
        viewAllFilter: 'bestsellers',
        viewAllLink: '/products?sort=popularity',
        products: bestsellersProducts.length > 0 ? bestsellersProducts : allProducts.slice(0, 8),
      },
      {
        id: 'new_arrivals',
        title: 'New Arrivals',
        subtitle: 'Just landed in our stores',
        icon: '🆕',
        viewAllFilter: 'newest',
        viewAllLink: '/products?sort=newest',
        products: newArrivalsProducts.length > 0 ? newArrivalsProducts : allProducts.slice(0, 6),
      },
      {
        id: 'under_50',
        title: 'Under ₹50',
        subtitle: 'Everyday savings',
        icon: '💰',
        viewAllFilter: 'under_50',
        viewAllLink: '/products?maxPrice=50',
        products: under50Products.length > 0 ? under50Products : allProducts.slice(0, 8),
      },
    ];

    const result = {
      success: true,
      data: {
        hero: heroBanners,
        categories: categories.slice(0, 12),
        sections,
      },
    };

    // Store result in cache
    setHomeCache(cacheKey, result);
    return result;
  }
}
