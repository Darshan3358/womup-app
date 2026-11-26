import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { HeroBannerCarousel, HeroBannerItem } from '../../components/common/HeroBannerCarousel';
import { WomupFestiveBanners } from '../../components/common/WomupFestiveBanners';
import { WomupCategoryGrid } from '../../components/common/WomupCategoryGrid';
import { MonthlyBenefitsBanner } from '../../components/common/MonthlyBenefitsBanner';
import { ProductSection } from '../../components/common/ProductSection';
import { WomupPopularBrands } from '../../components/common/WomupPopularBrands';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { ValuePropositionBar } from '../../components/common/ValuePropositionBar';
import { KYCBanner } from '../../components/KYCBanner';

import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import {
  resolveCategoryGroup,
} from '../../data/blinkitData';
import { Product, Category, BlinkitProduct } from '../../types';
import { api } from '../../services/api';

const vegNames = ['potato', 'onion', 'tomato', 'lady fingers', 'cabbage', 'ginger', 'guwar', 'lemon', 'bottle gourd', 'parwal', 'beetroot'];
const fruitNames = ['apple', 'banana', 'orange', 'pineapple', 'muskmelon', 'papaya', 'kiwi', 'watermelon'];
const attaNames = ['aashirvaad atta', 'basmati rice', 'tata salt', 'sunflower oil'];
const dairyNames = ['paneer', 'curd', 'milk', 'bread', 'butter milk', 'dahi'];
const personalCareNames = ['shampoo', 'hair oil', 'conditioner', 'body spray', 'body perfume', 'hair colour'];

const isVegetable = (p: BlinkitProduct) => {
  const anyP = p as any;
  if (anyP.categoryId === '6aa2712acb3d55073acc2101' || anyP.categorySlug === 'vegetables') return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  return (vegNames.some((v) => name.includes(v)) || cat.includes('veg')) && !fruitNames.some((f) => name.includes(f));
};

const isFruit = (p: BlinkitProduct) => {
  const anyP = p as any;
  if (anyP.categoryId === '6aa2712acb3d55073acc2102' || anyP.categorySlug === 'fruits') return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  return fruitNames.some((f) => name.includes(f)) || cat.includes('fruit');
};

const isAttaRiceDal = (p: BlinkitProduct) => {
  const anyP = p as any;
  if (anyP.categoryId === '6b046011e457907227bc34cb' || anyP.categorySlug === 'atta-rice-dal') return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  return (attaNames.some((a) => name.includes(a)) || cat.includes('atta') || name.includes('atta') || name.includes('rice') || name.includes('salt') || name.includes('sunflower')) && !name.includes('hair');
};

const isDairyBreadEggs = (p: BlinkitProduct) => {
  const anyP = p as any;
  if (anyP.categoryId === '6b046011e457907227bc34cc' || anyP.categorySlug === 'dairy-bread-eggs' || anyP.categorySlug === 'dairy') return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  return dairyNames.some((d) => name.includes(d)) || cat.includes('dairy');
};

const isBeautyPersonalCare = (p: BlinkitProduct) => {
  const anyP = p as any;
  if (anyP.categoryId === '6b046012e457907227bc34cd' || anyP.categorySlug === 'beauty-personal-care') return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  return personalCareNames.some((pc) => name.includes(pc)) || cat.includes('beauty') || cat.includes('personal') || name.includes('shampoo') || name.includes('perfume') || name.includes('spray') || name.includes('colour') || name.includes('conditioner') || name.includes('hair');
};

export const BlinkitHomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const bannerWidth = Math.min(width - 24, 1400);
  const diwaliBannerHeight = Math.max(Math.min(Math.round(bannerWidth * (250 / 900)), 150), 96);

  const {
    setActiveScreen,
    setSelectedProduct,
    setSelectedBlinkitProduct,
    navigateToProductListing,
    currentAreaId,
    currentStoreId,
    currentAreaName,
    currentStoreName,
    isServiceable,
    deliveryEtaMinutes,
    setLocationModalVisible,
    requestLocationPermissionAndDetect,
    catalogVersion,
    blinkitCart,
    blinkitCartCount,
  } = useApp();

  const [activeBanners, setActiveBanners] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    api.get<any>('/banners').then((res: any) => {
      if (!mounted) return;
      const list = res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setActiveBanners(list);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [catalogVersion]);

  const heroBanners = useMemo(() => {
    return activeBanners.filter((b) => b.placement === 'HOME_HERO' && b.isActive !== false);
  }, [activeBanners]);

  const festiveBanner = useMemo(() => {
    return activeBanners.find((b) => b.placement === 'FESTIVE_RAIL' && b.isActive !== false);
  }, [activeBanners]);

  const veggieSpotlight = useMemo(() => {
    return activeBanners.find(
      (b) =>
        b.placement === 'CATEGORY_SPOTLIGHT' &&
        b.isActive !== false &&
        (b.targetId === 'c1' || (b.title && b.title.toLowerCase().includes('grocer')) || (b.title && b.title.toLowerCase().includes('veggie')))
    );
  }, [activeBanners]);

  const dairySpotlight = useMemo(() => {
    return activeBanners.find(
      (b) =>
        b.placement === 'CATEGORY_SPOTLIGHT' &&
        b.isActive !== false &&
        (b.targetId === 'c3' || (b.title && b.title.toLowerCase().includes('dairy')))
    );
  }, [activeBanners]);

  // Direct app open: Request location permission & detect location once on initial mount
  useEffect(() => {
    requestLocationPermissionAndDetect?.();
  }, []);

  const [activeTab, setActiveTab] = useState('Home');
  const [isLoading, setIsLoading] = useState(!ProductService.hasCachedProducts());
  const [isError, setIsError] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>(() => ProductService.getAllProducts());
  const [backendSections, setBackendSections] = useState<Record<string, BlinkitProduct[]>>({});
  const requestEpochRef = useRef(0);
  const lastScopeKeyRef = useRef(`${currentStoreId || ''}_${currentAreaId || ''}`);

  const loadHomeData = useCallback(async () => {
    const epoch = ++requestEpochRef.current;
    const scopeKey = `${currentStoreId || ''}_${currentAreaId || ''}`;
    const isScopeChanged = scopeKey !== lastScopeKeyRef.current;

    if (isScopeChanged) {
      lastScopeKeyRef.current = scopeKey;
      ProductService.clearHomeCache(true);
      setBackendSections({});
      setDbProducts([]);
      setIsLoading(true);
    } else if (!ProductService.hasCachedProducts()) {
      setIsLoading(true);
    }
    setIsError(false);

    try {
      const homeData = await ProductService.fetchHomeSections({
        areaId: currentAreaId || undefined,
        storeId: currentStoreId || undefined,
      }).catch(() => null);

      if (epoch !== requestEpochRef.current) return;

      if (homeData && homeData.sections && homeData.sections.length > 0) {
        // Populate section map from the unified home response
        const map: Record<string, BlinkitProduct[]> = {};
        for (const sec of homeData.sections || []) {
          map[sec.id] = (sec.products || []).map(mapProductToBlinkit);
        }
        setBackendSections(map);

        // Build a deduplicated flat product list from the sections for fallback logic
        const seen = new Set<string>();
        const allProds: Product[] = [];
        for (const sec of homeData.sections || []) {
          for (const p of sec.products || []) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              allProds.push(p);
            }
          }
        }
        setDbProducts(allProds);
      } else {
        // Fallback: If unified homeData returned empty sections, fetch catalog directly
        const fallbackProds = await ProductService.fetchProducts({
          areaId: currentAreaId || undefined,
          storeId: currentStoreId || undefined,
          limit: 120,
        }).catch(() => []);
        if (epoch !== requestEpochRef.current) return;
        setBackendSections({});
        setDbProducts(fallbackProds);
      }
    } catch (e: any) {
      if (epoch !== requestEpochRef.current) return;
      console.warn('Error loading home data:', e);
      setIsError(true);
    } finally {
      if (epoch === requestEpochRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentAreaId, currentStoreId]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData, catalogVersion]);

  const handleOpenProductDetail = (prod: BlinkitProduct) => {
    setSelectedBlinkitProduct(prod);
    const convertedProduct: Product = {
      id: prod.id,
      name: prod.name,
      brand: prod.brand,
      categoryId: prod.category,
      quantityLabel: prod.packSize,
      sellingPrice: prod.sellingPrice,
      mrp: prod.mrp,
      discountPercent:
        prod.mrp > prod.sellingPrice
          ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100)
          : 0,
      shoppingCoins: 10,
      rating: prod.rating,
      reviewCount: prod.reviewCount,
      stock: prod.stock,
      deliveryMinutes: prod.deliveryMinutes,
      imageUrl: prod.imageUrl,
      variants: prod.variants,
      specifications: prod.specifications,
    };
    setSelectedProduct(convertedProduct);
    setActiveScreen('Blinkit_ProductDetail');
  };

  const handleSelectCategory = (catName: string, catId?: string) => {
    const categoryIds = resolveCategoryGroup(catId || '', catName);
    navigateToProductListing(catName, categoryIds);
  };

  const handleBannerPress = (banner: HeroBannerItem) => {
    if (banner.type === 'deals') {
      if (dealsList.length > 0) {
        handleOpenProductDetail(dealsList[0]);
      } else {
        setActiveScreen('C15_ProductListing');
      }
    } else if (banner.type === 'category' && banner.categoryName && banner.categoryId) {
      handleSelectCategory(banner.categoryName, banner.categoryId);
    }
  };

  // Convert live DB products to BlinkitProduct format
  const liveBlinkitProducts = useMemo(() => {
    const list = dbProducts && dbProducts.length > 0 ? dbProducts : [];
    return list.map(mapProductToBlinkit);
  }, [dbProducts]);

  // 1. Deals of the Day (combines backend section, live products with discount)
  const dealsList = useMemo(() => {
    const fromApi = backendSections['deals'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveDeals = liveBlinkitProducts.filter((p) => p.mrp > p.sellingPrice);
    if (liveDeals.length > 0) return liveDeals.slice(0, 10);
    return [];
  }, [backendSections, liveBlinkitProducts]);

  // 2. 9-Minute Delivery (Fast-Moving Items)
  const fastDeliveryList = useMemo(() => {
    const fromApi = backendSections['fast_delivery'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveFast = liveBlinkitProducts.filter((p) => p.stock > 0 && p.deliveryMinutes <= 15);
    if (liveFast.length > 0) return liveFast.slice(0, 10);
    return [];
  }, [backendSections, liveBlinkitProducts]);

  // 3. Fresh Vegetables (all 11 items)
  const freshVegetablesList = useMemo(() => {
    const fromApi = backendSections['fresh_vegetables'];
    if (fromApi && fromApi.length > 0) return fromApi;
    return liveBlinkitProducts.filter(isVegetable);
  }, [backendSections, liveBlinkitProducts]);

  // 4. Fresh Fruits (all 8 items)
  const freshFruitsList = useMemo(() => {
    const fromApi = backendSections['fresh_fruits'];
    if (fromApi && fromApi.length > 0) return fromApi;
    return liveBlinkitProducts.filter(isFruit);
  }, [backendSections, liveBlinkitProducts]);

  // 5. Atta, Rice & Dal (all 4 items)
  const attaRiceDalList = useMemo(() => {
    const fromApi = backendSections['atta_rice_dal'];
    if (fromApi && fromApi.length > 0) return fromApi;
    return liveBlinkitProducts.filter(isAttaRiceDal);
  }, [backendSections, liveBlinkitProducts]);

  // 6. Dairy, Bread & Eggs (all 5 items)
  const dairyBreadEggsList = useMemo(() => {
    const fromApi = backendSections['dairy_bread'];
    if (fromApi && fromApi.length > 0) return fromApi;
    return liveBlinkitProducts.filter(isDairyBreadEggs);
  }, [backendSections, liveBlinkitProducts]);

  // 7. Beauty & Personal Care (all 6 items)
  const beautyPersonalCareList = useMemo(() => {
    const fromApi = backendSections['beauty_personal_care'];
    if (fromApi && fromApi.length > 0) return fromApi;
    return liveBlinkitProducts.filter(isBeautyPersonalCare);
  }, [backendSections, liveBlinkitProducts]);

  // 8. Bestsellers (Rated 4.5+, high sales)
  const bestsellersList = useMemo(() => {
    const fromApi = backendSections['bestsellers'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveBs = liveBlinkitProducts.filter((p) => p.rating >= 4.5);
    if (liveBs.length > 0) return liveBs.slice(0, 10);
    return [];
  }, [backendSections, liveBlinkitProducts]);

  // 9. New Arrivals
  const newArrivalsList = useMemo(() => {
    const fromApi = backendSections['new_arrivals'];
    if (fromApi && fromApi.length > 0) return fromApi;
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 8);
    return [];
  }, [backendSections, liveBlinkitProducts]);

  // 10. Under ₹50 (Everyday Savings)
  const under50List = useMemo(() => {
    const fromApi = backendSections['under_50'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveU50 = liveBlinkitProducts.filter((p) => p.sellingPrice <= 50);
    if (liveU50.length > 0) return liveU50.slice(0, 10);
    return [];
  }, [backendSections, liveBlinkitProducts]);

  // ── FlatList section data ─────────────────────────────────────────────────
  // Each entry is one virtualised row. Sections that are heavy (ProductSection)
  // are deferred by FlatList — only visible ones mount.
  type HomeSection =
    | { type: 'deals'; products: BlinkitProduct[] }
    | { type: 'fast_delivery'; products: BlinkitProduct[] }
    | { type: 'banner_veggies' }
    | { type: 'fresh_vegetables'; products: BlinkitProduct[] }
    | { type: 'fresh_fruits'; products: BlinkitProduct[] }
    | { type: 'atta_rice_dal'; products: BlinkitProduct[] }
    | { type: 'banner_dairy' }
    | { type: 'dairy_bread'; products: BlinkitProduct[] }
    | { type: 'beauty_personal_care'; products: BlinkitProduct[] }
    | { type: 'popular_brands' }
    | { type: 'bestsellers'; products: BlinkitProduct[] }
    | { type: 'new_arrivals'; products: BlinkitProduct[] }
    | { type: 'under_50'; products: BlinkitProduct[] };

  const SECTION_DATA: HomeSection[] = useMemo(() => [
    { type: 'deals', products: dealsList },
    { type: 'fast_delivery', products: fastDeliveryList },
    { type: 'banner_veggies' },
    { type: 'fresh_vegetables', products: freshVegetablesList },
    { type: 'fresh_fruits', products: freshFruitsList },
    { type: 'atta_rice_dal', products: attaRiceDalList },
    { type: 'banner_dairy' },
    { type: 'dairy_bread', products: dairyBreadEggsList },
    { type: 'beauty_personal_care', products: beautyPersonalCareList },
    { type: 'popular_brands' },
    { type: 'bestsellers', products: bestsellersList },
    { type: 'new_arrivals', products: newArrivalsList },
    { type: 'under_50', products: under50List },
  ], [
    dealsList,
    fastDeliveryList,
    freshVegetablesList,
    freshFruitsList,
    attaRiceDalList,
    dairyBreadEggsList,
    beautyPersonalCareList,
    bestsellersList,
    newArrivalsList,
    under50List,
  ]);

  const renderSection = useCallback(({ item }: { item: HomeSection }) => {
    switch (item.type) {
      case 'deals':
        return (
          <ProductSection
            id="deals"
            title="Deals of the Day"
            subtitle="Save big on daily essentials"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'fast_delivery':
        return (
          <ProductSection
            id="fast_delivery"
            title="Fresh Grocery & Essentials"
            subtitle="Fresh picks ready for fast doorstep delivery"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'banner_veggies':
        if (activeBanners.length > 0 && !veggieSpotlight) return null;
        return (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (veggieSpotlight?.targetType === 'CATEGORY' && veggieSpotlight?.targetId) {
                  handleSelectCategory(veggieSpotlight.title || 'Vegetables & Fruits', veggieSpotlight.targetId);
                } else {
                  handleSelectCategory('Vegetables & Fruits', '6aa2712acb3d55073acc2101');
                }
              }}
              style={styles.groceriesBannerCard}
            >
              <Image
                source={veggieSpotlight?.imageUrl ? { uri: veggieSpotlight.imageUrl } : require('../../../assets/banners/9minbanner.png')}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        );
      case 'fresh_vegetables':
        return (
          <ProductSection
            id="fresh_vegetables"
            title="Fresh Vegetables"
            subtitle="Farm fresh, delivered directly to your doorstep"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Vegetables', '6aa2712acb3d55073acc2101')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'fresh_fruits':
        return (
          <ProductSection
            id="fresh_fruits"
            title="Fresh Fruits"
            subtitle="Juicy, sweet seasonal fruits"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Fruits', '6aa2712acb3d55073acc2102')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'atta_rice_dal':
        return (
          <ProductSection
            id="atta_rice_dal"
            title="Atta, Rice & Dal"
            subtitle="Daily kitchen staples & cooking essentials"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Atta, Rice & Dal', '6b046011e457907227bc34cb')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'bestsellers':
        return (
          <ProductSection
            id="bestsellers"
            title="Bestsellers"
            subtitle="Loved by 1000+ customers"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'banner_dairy':
        if (activeBanners.length > 0 && !dairySpotlight) return null;
        return (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (dairySpotlight?.targetType === 'CATEGORY' && dairySpotlight?.targetId) {
                  handleSelectCategory(dairySpotlight.title || 'Dairy, Bread & Eggs', dairySpotlight.targetId);
                } else {
                  handleSelectCategory('Dairy, Bread & Eggs', '6b046011e457907227bc34cc');
                }
              }}
              style={styles.dairyBannerCard}
            >
              <Image
                source={dairySpotlight?.imageUrl ? { uri: dairySpotlight.imageUrl } : require('../../../assets/banners/dairy_breakfast.jpg')}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        );
      case 'dairy_bread':
        return (
          <ProductSection
            id="dairy_bread"
            title="Dairy, Bread & Eggs"
            subtitle="Start your day right"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Dairy, Bread & Eggs', '6b046011e457907227bc34cc')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'beauty_personal_care':
        return (
          <ProductSection
            id="beauty_personal_care"
            title="Beauty & Personal Care"
            subtitle="Grooming & self-care essentials"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Beauty & Personal Care', '6b046012e457907227bc34cd')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'popular_brands':
        return (
          <WomupPopularBrands
            onSelectBrand={(brand) => navigateToProductListing(brand, [])}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
          />
        );
      case 'new_arrivals':
        return (
          <ProductSection
            id="new_arrivals"
            title="New Arrivals"
            subtitle="Just landed in our stores"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      case 'under_50':
        return (
          <ProductSection
            id="under_50"
            title="Under ₹50"
            subtitle="Everyday savings"
            products={item.products}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
            cartCount={blinkitCartCount}
          />
        );
      default:
        return null;
    }
  }, [isLoading, handleOpenProductDetail, handleSelectCategory, navigateToProductListing, setActiveScreen, blinkitCartCount, activeBanners.length, veggieSpotlight, dairySpotlight]);

  const ListHeader = useMemo(() => (
    <>
      <KYCBanner />
      <HeroBannerCarousel onBannerPress={handleBannerPress} banners={heroBanners} />
      <WomupCategoryGrid
        onSelectCategory={(name, id) => {
          if (name.toLowerCase().includes('more') || id === 'c12') {
            setActiveScreen('Blinkit_Categories');
          } else {
            handleSelectCategory(name, id);
          }
        }}
        onViewAll={() => setActiveScreen('Blinkit_Categories')}
      />
      {/* Festive Special Diwali Banner - Managed by Admin */}
      {(festiveBanner || activeBanners.length === 0) && (
        <View style={styles.festiveBannerWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (festiveBanner?.targetType === 'CATEGORY' && festiveBanner.targetId) {
                handleSelectCategory(festiveBanner.title || 'Festive Special', festiveBanner.targetId);
              } else {
                setActiveScreen('C15_ProductListing');
              }
            }}
            style={[styles.festiveBannerCard, { height: diwaliBannerHeight }]}
          >
            <Image
              source={festiveBanner?.imageUrl ? { uri: festiveBanner.imageUrl } : require('../../../assets/banners/diwali_ready_banner.png')}
              style={styles.festiveBannerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}
    </>
  ), [handleBannerPress, handleSelectCategory, setActiveScreen, diwaliBannerHeight, heroBanners, festiveBanner, activeBanners.length]);

  const ListFooter = useMemo(() => (
    <>
      {/* 24x7 Support & Trust Badges moved to LAST */}
      <ValuePropositionBar />
      <MonthlyBenefitsBanner onJoinPress={() => setActiveScreen('Blinkit_Money')} />
      <View style={{ height: 90 }} />
    </>
  ), [setActiveScreen]);

  return (
    <View style={styles.mainContainer}>
      {/* 1 & 2: Header + Category Bar */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Delivery in"
        etaTime={
          isServiceable
            ? `${deliveryEtaMinutes || 9} minutes`
            : !currentStoreName
            ? 'Set Location'
            : 'Outside Zone'
        }
        searchPlaceholder='Search "milk, chips, maggi"'
        activeCategoryTab={activeTab}
        onSelectCategoryTab={setActiveTab}
        showCategoryTabs={true}
      />

      {/* Location Required / Unserviceable Notification Banner */}
      {!isServiceable && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setLocationModalVisible(true)}
          style={styles.unserviceableBanner}
        >
          <Image
            source={require('../../../assets/red_triangle_alert.png')}
            style={styles.unserviceableIcon}
            resizeMode="contain"
          />
          <View style={styles.unserviceableTextWrap}>
            <Text style={styles.unserviceableTitle}>
              <Text style={styles.unserviceableMiniWarning}>⚠️ </Text>
              Sorry, WOMART is not serviceable in your area.
            </Text>
            <Text style={styles.unserviceableSubtitle}>
              We are expanding soon! You can browse products, but ordering is disabled for unsupported locations.
            </Text>
          </View>
          <Image
            source={require('../../../assets/megaphone_notice.png')}
            style={styles.megaphoneImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* Virtualised homepage body — only visible sections are mounted */}
      <FlatList
        data={SECTION_DATA}
        extraData={useMemo(() => ({
          cart: blinkitCart,
          cartCount: blinkitCartCount,
          secKeys: Object.keys(backendSections).join(','),
          dbProdsCount: dbProducts.length,
          dealsCount: dealsList.length,
          fastCount: fastDeliveryList.length,
          vegCount: freshVegetablesList.length,
          fruitCount: freshFruitsList.length,
          attaCount: attaRiceDalList.length,
          dairyCount: dairyBreadEggsList.length,
          beautyCount: beautyPersonalCareList.length,
        }), [
          blinkitCart,
          blinkitCartCount,
          backendSections,
          dbProducts.length,
          dealsList.length,
          fastDeliveryList.length,
          freshVegetablesList.length,
          freshFruitsList.length,
          attaRiceDalList.length,
          dairyBreadEggsList.length,
          beautyPersonalCareList.length,
        ])}
        keyExtractor={(item) => item.type}
        renderItem={renderSection}
        ListHeaderComponent={
          <>
            {ListHeader}
            {isError && !isLoading && dbProducts.length === 0 && (
              <View style={styles.errorCard}>
                <Ionicons name="cloud-offline-outline" size={36} color="#EF4444" style={{ marginBottom: 6 }} />
                <Text style={styles.errorTitle}>Unable to load products</Text>
                <Text style={styles.errorSubtitle}>Please check your internet connection and try again</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => {
                    ProductService.clearHomeCache(true);
                    loadHomeData();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListFooterComponent={ListFooter}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && dbProducts.length > 0}
            onRefresh={() => {
              ProductService.clearHomeCache(true);
              loadHomeData();
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.flatListStyle}
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Floating "View Cart" Pill Button above bottom navigation bar */}
      <FloatingCartPill bottomOffset={84} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FEF7FF',
    width: '100%',
    maxWidth: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  flatListStyle: {
    backgroundColor: '#FEF7FF',
    flex: 1,
  },
  listContent: {
    backgroundColor: '#FEF7FF',
    paddingBottom: 110,
    width: '100%',
    maxWidth: '100%',
  },
  unserviceableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 20,
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  unserviceableIcon: {
    width: 32,
    height: 32,
  },
  unserviceableTextWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  unserviceableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  unserviceableMiniWarning: {
    fontSize: 13,
  },
  unserviceableSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 3,
    lineHeight: 15,
  },
  megaphoneImage: {
    width: 54,
    height: 42,
  },
  festiveBannerWrapper: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  festiveBannerCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E0638',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  festiveBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerWrapper: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginVertical: 12,
    overflow: 'hidden',
  },
  groceriesBannerCard: {
    width: '100%',
    aspectRatio: 1024 / 318,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FAF0FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dairyBannerCard: {
    width: '100%',
    aspectRatio: 1376 / 768,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
