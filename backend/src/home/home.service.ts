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

    let allProducts = allProductsResult?.items || [];
    // Fallback: If areaId/storeId produced 0 products (e.g. outside delivery area or dark store has no stock),
    // fallback to global catalog so users can ALWAYS browse products anywhere!
    if (allProducts.length === 0 && (storeId || areaId)) {
      const fallbackResult = await this.productsService.findAll({ limit: 120 });
      allProducts = fallbackResult?.items || [];
    }

    // Helper for category match
    const vegNames = ['potato', 'onion', 'tomato', 'lady fingers', 'cabbage', 'ginger', 'guwar', 'lemon', 'bottle gourd', 'parwal', 'beetroot'];
    const fruitNames = ['apple', 'banana', 'orange', 'pineapple', 'muskmelon', 'papaya', 'kiwi', 'watermelon'];
    const attaNames = ['aashirvaad atta', 'basmati rice', 'tata salt', 'sunflower oil'];
    const dairyNames = ['paneer', 'curd', 'milk', 'bread', 'butter milk', 'dahi'];
    const personalCareNames = ['shampoo', 'hair oil', 'conditioner', 'body spray', 'body perfume', 'hair colour'];

    const isVegetable = (p: any) => {
      const catId = p.categoryId?._id?.toString() || p.categoryId?.toString() || '';
      const catSlug = p.categoryId?.slug || p.categorySlug || '';
      if (catId === '6aa2712acb3d55073acc2101' || catSlug === 'vegetables') return true;
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return vegNames.some((v) => text.includes(v)) && !fruitNames.some((f) => text.includes(f));
    };

    const isFruit = (p: any) => {
      const catId = p.categoryId?._id?.toString() || p.categoryId?.toString() || '';
      const catSlug = p.categoryId?.slug || p.categorySlug || '';
      if (catId === '6aa2712acb3d55073acc2102' || catSlug === 'fruits') return true;
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return fruitNames.some((f) => text.includes(f));
    };

    const isAttaRiceDal = (p: any) => {
      const catId = p.categoryId?._id?.toString() || p.categoryId?.toString() || '';
      const catSlug = p.categoryId?.slug || p.categorySlug || '';
      if (catId === '6b046011e457907227bc34cb' || catSlug === 'atta-rice-dal') return true;
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return (attaNames.some((a) => text.includes(a)) || text.includes('atta') || text.includes('rice') || text.includes('salt') || text.includes('sunflower')) && !text.includes('hair');
    };

    const isDairyBread = (p: any) => {
      const catId = p.categoryId?._id?.toString() || p.categoryId?.toString() || '';
      const catSlug = p.categoryId?.slug || p.categorySlug || '';
      if (catId === '6b046011e457907227bc34cc' || catSlug === 'dairy-bread-eggs' || catSlug === 'dairy') return true;
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return dairyNames.some((d) => text.includes(d));
    };

    const isBeautyPersonalCare = (p: any) => {
      const catId = p.categoryId?._id?.toString() || p.categoryId?.toString() || '';
      const catSlug = p.categoryId?.slug || p.categorySlug || '';
      if (catId === '6b046012e457907227bc34cd' || catSlug === 'beauty-personal-care') return true;
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return personalCareNames.some((pc) => text.includes(pc)) || text.includes('shampoo') || text.includes('perfume') || text.includes('spray') || text.includes('colour') || text.includes('conditioner') || text.includes('hair');
    };

    // 1. Deals of the Day (discount >= 10% or isDeal or mrp > sellingPrice)
    const dealsProducts = [...allProducts]
      .filter((p) => p.discountPercent >= 10 || p.isDeal || (p.mrp && p.sellingPrice && p.mrp > p.sellingPrice))
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
      .slice(0, 10);

    // 2. 9-Minute Delivery (availableQty > 15 / high stock, quick delivery)
    const fastDeliveryProducts = [...allProducts]
      .filter((p) => (p.stock ?? 100) > 15 && (p.deliveryMinutes || 9) <= 10)
      .slice(0, 10);

    // 3. Fresh Vegetables (all 11 vegetables)
    const vegetablesProducts = [...allProducts].filter(isVegetable);

    // 4. Fresh Fruits (all 8 fruits)
    const fruitsProducts = [...allProducts].filter(isFruit);

    // 5. Atta, Rice & Dal (all 4 staples)
    const attaProducts = [...allProducts].filter(isAttaRiceDal);

    // 6. Dairy, Bread & Eggs (all 5 dairy items)
    const dairyProducts = [...allProducts].filter(isDairyBread);

    // 7. Beauty & Personal Care (all 6 personal care items)
    const personalCareProducts = [...allProducts].filter(isBeautyPersonalCare);

    // 8. Bestsellers (rating >= 4.5 or isPopular)
    const bestsellersProducts = [...allProducts]
      .filter((p) => (p.rating || 0) >= 4.5 || p.isPopular)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);

    // 9. New Arrivals (sorted by createdAt DESC)
    const newArrivalsProducts = [...allProducts]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);

    // 10. Under ₹50
    const under50Products = [...allProducts]
      .filter((p) => (p.sellingPrice || 0) <= 50)
      .sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0))
      .slice(0, 10);

    const sections: HomeSectionResponse[] = [
      {
        id: 'deals',
        title: 'Deals of the Day',
        subtitle: 'Save big on daily essentials',
        icon: '🔥',
        viewAllFilter: 'deals',
        viewAllLink: '/products?filter=deals',
        products: dealsProducts.length > 0 ? dealsProducts : allProducts.slice(0, 8),
      },
      {
        id: 'fast_delivery',
        title: 'Fresh Grocery & Essentials',
        subtitle: 'Freshly stocked for quick doorstep delivery',
        icon: '⚡',
        viewAllFilter: 'fast',
        viewAllLink: '/products?filter=fast',
        products: fastDeliveryProducts.length > 0 ? fastDeliveryProducts : allProducts.slice(0, 8),
      },
      {
        id: 'fresh_vegetables',
        title: 'Fresh Vegetables',
        subtitle: 'Farm fresh, delivered directly to your doorstep',
        icon: '🥕',
        categoryId: '6aa2712acb3d55073acc2101',
        categoryName: 'Vegetables',
        viewAllFilter: '6aa2712acb3d55073acc2101',
        viewAllLink: '/products?category=6aa2712acb3d55073acc2101',
        products: vegetablesProducts,
      },
      {
        id: 'fresh_fruits',
        title: 'Fresh Fruits',
        subtitle: 'Juicy, sweet seasonal fruits',
        icon: '🍎',
        categoryId: '6aa2712acb3d55073acc2102',
        categoryName: 'Fruits',
        viewAllFilter: '6aa2712acb3d55073acc2102',
        viewAllLink: '/products?category=6aa2712acb3d55073acc2102',
        products: fruitsProducts,
      },
      {
        id: 'fresh_veggies',
        title: 'Fresh Vegetables & Fruits',
        subtitle: 'Farm fresh, delivered directly to your doorstep',
        icon: '🌱',
        categoryName: 'Vegetables & Fruits',
        viewAllFilter: 'c1',
        viewAllLink: '/products?category=c1',
        products: [...vegetablesProducts, ...fruitsProducts],
      },
      {
        id: 'atta_rice_dal',
        title: 'Atta, Rice & Dal',
        subtitle: 'Daily kitchen staples & cooking essentials',
        icon: '🌾',
        categoryId: '6b046011e457907227bc34cb',
        categoryName: 'Atta, Rice & Dal',
        viewAllFilter: '6b046011e457907227bc34cb',
        viewAllLink: '/products?category=6b046011e457907227bc34cb',
        products: attaProducts,
      },
      {
        id: 'dairy_bread',
        title: 'Dairy, Bread & Eggs',
        subtitle: 'Start your day right',
        icon: '🥛',
        categoryId: '6b046011e457907227bc34cc',
        categoryName: 'Dairy, Bread & Eggs',
        viewAllFilter: '6b046011e457907227bc34cc',
        viewAllLink: '/products?category=6b046011e457907227bc34cc',
        products: dairyProducts,
      },
      {
        id: 'beauty_personal_care',
        title: 'Beauty & Personal Care',
        subtitle: 'Grooming & self-care essentials',
        icon: '✨',
        categoryId: '6b046012e457907227bc34cd',
        categoryName: 'Beauty & Personal Care',
        viewAllFilter: '6b046012e457907227bc34cd',
        viewAllLink: '/products?category=6b046012e457907227bc34cd',
        products: personalCareProducts,
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
        products: newArrivalsProducts.length > 0 ? newArrivalsProducts : allProducts.slice(0, 8),
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
