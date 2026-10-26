import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { HeroBannerCarousel, HeroBannerItem } from '../../components/common/HeroBannerCarousel';
import { WomupCategoryGrid } from '../../components/common/WomupCategoryGrid';
import { MonthlyBenefitsBanner } from '../../components/common/MonthlyBenefitsBanner';
import { ProductSection } from '../../components/common/ProductSection';
import { WomupPopularBrands } from '../../components/common/WomupPopularBrands';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { KYCBanner } from '../../components/KYCBanner';

import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import {
  resolveCategoryGroup,
} from '../../data/blinkitData';
import { Product, Category, BlinkitProduct } from '../../types';

export const BlinkitHomeScreen: React.FC = () => {
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
  } = useApp();

  // Direct app open: Request location permission & detect location once on initial mount
  useEffect(() => {
    requestLocationPermissionAndDetect?.();
  }, []);

  const [activeTab, setActiveTab] = useState('Home');
  const [isLoading, setIsLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [backendSections, setBackendSections] = useState<Record<string, BlinkitProduct[]>>({});

  // Fetch unified home data — sections already contain all product lists
  // (B-01 fix: removed redundant fetchProducts; fetchHomeSections returns all 7 sections
  //  with up to 8 products each so a separate full-catalogue call is wasteful)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController(); // B-06 fix: cancel stale requests on area change

    (async () => {
      try {
        setIsLoading(true);
        const homeData = await ProductService.fetchHomeSections(
          {
            areaId: currentAreaId || undefined,
            storeId: currentStoreId || undefined,
          },
          controller.signal,
        ).catch(() => null);

        if (!isMounted) return;

        if (homeData) {
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
          if (allProds.length > 0) setDbProducts(allProds);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn('Error loading home data:', e);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort(); // Cancel any in-flight request when deps change
    };
  // Auto-refreshes when area changes OR when admin pushes real-time price/catalog update (catalogVersion)
  }, [currentAreaId, currentStoreId, catalogVersion]);

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
  const liveBlinkitProducts = useMemo(
    () => dbProducts.map(mapProductToBlinkit),
    [dbProducts]
  );

  // 1. Deals of the Day (combines backend section, live products with discount)
  const dealsList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['deals'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveDeals = liveBlinkitProducts.filter((p) => p.mrp > p.sellingPrice);
    if (liveDeals.length > 0) return liveDeals.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 2. 9-Minute Delivery (Fast-Moving Items)
  const fastDeliveryList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['fast_delivery'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveFast = liveBlinkitProducts.filter((p) => p.stock > 0 && p.deliveryMinutes <= 15);
    if (liveFast.length > 0) return liveFast.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 3. Fresh Vegetables & Fruits
  const freshVegFruitsList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['fresh_veggies'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveVeg = liveBlinkitProducts.filter((p) => {
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return text.includes('veg') || text.includes('fruit') || text.includes('tomato') || text.includes('onion') || text.includes('banana');
    });
    if (liveVeg.length > 0) return liveVeg.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 4. Dairy, Bread & Eggs
  const dairyBreadEggsList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['dairy_bread'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveDairy = liveBlinkitProducts.filter((p) => {
      const text = `${p.category || ''} ${p.name || ''}`.toLowerCase();
      return (
        text.includes('dairy') ||
        text.includes('milk') ||
        text.includes('bread') ||
        text.includes('egg') ||
        text.includes('paneer') ||
        text.includes('butter')
      );
    });
    if (liveDairy.length > 0) return liveDairy.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 5. Bestsellers (Rated 4.5+, high sales)
  const bestsellersList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['bestsellers'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveBs = liveBlinkitProducts.filter((p) => p.rating >= 4.5);
    if (liveBs.length > 0) return liveBs.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 6. New Arrivals
  const newArrivalsList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['new_arrivals'];
    if (fromApi && fromApi.length > 0) return fromApi;
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 8);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 7. Under ₹50 (Everyday Savings)
  const under50List = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['under_50'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveU50 = liveBlinkitProducts.filter((p) => p.sellingPrice <= 50);
    if (liveU50.length > 0) return liveU50.slice(0, 10);
    return [];
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // ── FlatList section data ─────────────────────────────────────────────────
  // Each entry is one virtualised row. Sections that are heavy (ProductSection)
  // are deferred by FlatList — only visible ones mount.
  type HomeSection =
    | { type: 'deals' }
    | { type: 'fast_delivery' }
    | { type: 'banner_veggies' }
    | { type: 'fresh_veggies' }
    | { type: 'bestsellers' }
    | { type: 'banner_dairy' }
    | { type: 'dairy_bread' }
    | { type: 'popular_brands' }
    | { type: 'new_arrivals' }
    | { type: 'under_50' };

  const SECTION_DATA: HomeSection[] = useMemo(() => [
    { type: 'deals' },
    { type: 'fast_delivery' },
    { type: 'banner_veggies' },
    { type: 'fresh_veggies' },
    { type: 'bestsellers' },
    { type: 'banner_dairy' },
    { type: 'dairy_bread' },
    { type: 'popular_brands' },
    { type: 'new_arrivals' },
    { type: 'under_50' },
  ], []);

  const renderSection = useCallback(({ item }: { item: HomeSection }) => {
    switch (item.type) {
      case 'deals':
        return (
          <ProductSection
            id="deals"
            title="Deals of the Day"
            subtitle="Save big on daily essentials"
            products={dealsList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      case 'fast_delivery':
        return (
          <ProductSection
            id="fast_delivery"
            title="9-Minute Delivery"
            subtitle="In stock at your nearest dark store"
            products={fastDeliveryList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      case 'banner_veggies':
        return (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelectCategory('Vegetables & Fruits', 'c1')}
              style={styles.groceriesBannerCard}
            >
              <Image
                source={require('../../../assets/banners/9minbanner.png')}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        );
      case 'fresh_veggies':
        return (
          <ProductSection
            id="fresh_veggies"
            title="Fresh Vegetables & Fruits"
            subtitle="Farm fresh, delivered in 9 minutes"
            products={freshVegFruitsList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Vegetables & Fruits', 'c1')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      case 'bestsellers':
        return (
          <ProductSection
            id="bestsellers"
            title="Bestsellers"
            subtitle="Loved by 1000+ customers"
            products={bestsellersList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      case 'banner_dairy':
        return (
          <View style={styles.bannerWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelectCategory('Dairy, Bread & Eggs', 'c3')}
              style={styles.dairyBannerCard}
            >
              <Image
                source={require('../../../assets/banners/dairy_breakfast.jpg')}
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
            products={dairyBreadEggsList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => handleSelectCategory('Dairy, Bread & Eggs', 'c3')}
            viewAllText="View All"
            isLoading={isLoading}
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
            products={newArrivalsList}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      case 'under_50':
        return (
          <ProductSection
            id="under_50"
            title="Under ₹50"
            subtitle="Everyday savings"
            products={under50List}
            onOpenProduct={handleOpenProductDetail}
            onViewAll={() => setActiveScreen('C15_ProductListing')}
            viewAllText="View All"
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  }, [dealsList, fastDeliveryList, freshVegFruitsList, bestsellersList,
      dairyBreadEggsList, newArrivalsList, under50List, isLoading,
      handleOpenProductDetail, handleSelectCategory, navigateToProductListing, setActiveScreen]);

  const ListHeader = useMemo(() => (
    <>
      <KYCBanner />
      <HeroBannerCarousel onBannerPress={handleBannerPress} />
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
    </>
  ), [handleBannerPress, handleSelectCategory, setActiveScreen]);

  const ListFooter = useMemo(() => (
    <>
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
          <Feather name="alert-triangle" size={18} color="#DC2626" />
          <View style={styles.unserviceableTextWrap}>
            <Text style={[styles.unserviceableTitle, { color: '#DC2626' }]}>
              ⚠️ Sorry, WOMART is not serviceable in your area.
            </Text>
            <Text style={styles.unserviceableSubtitle}>
              We are expanding soon! You can browse products, but ordering is disabled for unsupported locations.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Virtualised homepage body — only visible sections are mounted */}
      <FlatList
        data={SECTION_DATA}
        keyExtractor={(item) => item.type}
        renderItem={renderSection}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Floating "View Cart" Pill Button */}
      <FloatingCartPill bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFBFE',
    width: '100%',
    maxWidth: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 110,
    width: '100%',
    maxWidth: '100%',
  },
  unserviceableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  unserviceableTextWrap: {
    flex: 1,
  },
  unserviceableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  unserviceableSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
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
});
