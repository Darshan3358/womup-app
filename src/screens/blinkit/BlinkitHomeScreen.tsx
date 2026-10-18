import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
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
  DEALS_OF_THE_DAY_PRODUCTS,
  FAST_DELIVERY_PRODUCTS,
  FRESH_VEG_FRUITS_PRODUCTS,
  DAIRY_BREAD_EGGS_PRODUCTS,
  BESTSELLERS_PRODUCTS,
  NEW_ARRIVALS_PRODUCTS,
  UNDER_50_PRODUCTS,
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
  } = useApp();

  const [activeTab, setActiveTab] = useState('Home');
  const [isLoading, setIsLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [backendSections, setBackendSections] = useState<Record<string, BlinkitProduct[]>>({});

  // Fetch unified home data + raw catalog products
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const [homeData, prods] = await Promise.all([
          ProductService.fetchHomeSections({
            areaId: currentAreaId || undefined,
            storeId: currentStoreId || undefined,
          }).catch(() => null),
          ProductService.fetchProducts({
            areaId: currentAreaId || undefined,
            storeId: currentStoreId || undefined,
          }).catch(() => []),
        ]);

        if (!isMounted) return;

        if (prods && prods.length > 0) {
          setDbProducts(prods);
        }

        if (homeData && homeData.sections) {
          const map: Record<string, BlinkitProduct[]> = {};
          for (const sec of homeData.sections) {
            map[sec.id] = (sec.products || []).map(mapProductToBlinkit);
          }
          setBackendSections(map);
        }
      } catch (e) {
        console.warn('Error loading home data:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentAreaId, currentStoreId, currentAreaName]);

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
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return DEALS_OF_THE_DAY_PRODUCTS.slice(0, 10);
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 2. 9-Minute Delivery (Fast-Moving Items)
  const fastDeliveryList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['fast_delivery'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveFast = liveBlinkitProducts.filter((p) => p.stock > 15 && p.deliveryMinutes <= 10);
    if (liveFast.length > 0) return liveFast.slice(0, 10);
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return FAST_DELIVERY_PRODUCTS.slice(0, 10);
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
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return FRESH_VEG_FRUITS_PRODUCTS.slice(0, 10);
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
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return DAIRY_BREAD_EGGS_PRODUCTS.slice(0, 10);
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 5. Bestsellers (Rated 4.5+, high sales)
  const bestsellersList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['bestsellers'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveBs = liveBlinkitProducts.filter((p) => p.rating >= 4.5);
    if (liveBs.length > 0) return liveBs.slice(0, 10);
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return BESTSELLERS_PRODUCTS.slice(0, 10);
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 6. New Arrivals
  const newArrivalsList = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['new_arrivals'];
    if (fromApi && fromApi.length > 0) return fromApi;
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 8);
    return NEW_ARRIVALS_PRODUCTS.slice(0, 8);
  }, [isLoading, backendSections, liveBlinkitProducts]);

  // 7. Under ₹50 (Everyday Savings)
  const under50List = useMemo(() => {
    if (isLoading) return [];
    const fromApi = backendSections['under_50'];
    if (fromApi && fromApi.length > 0) return fromApi;
    const liveU50 = liveBlinkitProducts.filter((p) => p.sellingPrice <= 50);
    if (liveU50.length > 0) return liveU50.slice(0, 10);
    if (liveBlinkitProducts.length > 0) return liveBlinkitProducts.slice(0, 10);
    return UNDER_50_PRODUCTS.slice(0, 10);
  }, [isLoading, backendSections, liveBlinkitProducts]);

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
          <Feather name="map-pin" size={17} color="#B45309" />
          <View style={styles.unserviceableTextWrap}>
            <Text style={styles.unserviceableTitle}>
              {!currentStoreName ? 'Delivery Location Required' : 'Outside Active Delivery Zone'}
            </Text>
            <Text style={styles.unserviceableSubtitle}>
              {!currentStoreName
                ? 'Tap here to allow GPS or select your address to see accurate store inventory and delivery ETA.'
                : 'We currently fulfill orders from 8 dark stores in Ahmedabad. Tap to select a serviceable address.'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Scrollable Homepage Body in Exact SRS Order */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Prime Visibility KYC Status Banner (Variant 1-4) */}
        <KYCBanner />

        {/* Section 1: Hero Carousel (Top) */}
        <HeroBannerCarousel onBannerPress={handleBannerPress} />

        {/* Section 2: Shop by Category (12 tiles) */}
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

        {/* Section 3: Deals of the Day (6-8 products) */}
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

        {/* Section 4: 9-Minute Delivery (8 products) */}
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

        {/* --- BANNER 1: Fresh Groceries (Delivered in 9 Minutes) --- */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleSelectCategory('Vegetables & Fruits', 'c1')}
          style={styles.groceriesBannerContainer}
        >
          <Image
            source={require('../../../assets/banners/9minbanner.png')}
            style={styles.groceriesBannerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Section 5: Fresh Vegetables & Fruits (8 products) */}
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

        {/* Section 6: Bestsellers (8 products) */}
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

        {/* --- BANNER 2: Dairy & Breakfast --- */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleSelectCategory('Dairy, Bread & Eggs', 'c3')}
          style={styles.bannerContainer}
        >
          <Image
            source={require('../../../assets/banners/dairy_breakfast.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Section 7: Dairy, Bread & Eggs (8 products) */}
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

        {/* Section 8: Popular Brands (Moved right above New Arrivals) */}
        <WomupPopularBrands
          onSelectBrand={(brand) => {
            navigateToProductListing(brand, []);
          }}
          onViewAll={() => setActiveScreen('C15_ProductListing')}
        />

        {/* Section 9: New Arrivals (6-8 products) */}
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

        {/* Section 10: Under ₹50 (8 products) */}
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

        {/* Section 11: 📢 Monthly Benefits Banner */}
        <MonthlyBenefitsBanner
          onJoinPress={() => setActiveScreen('Blinkit_Money')}
        />

        {/* Bottom space for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
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
  groceriesBannerContainer: {
    marginHorizontal: 12,
    marginVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 1024 / 318,
    backgroundColor: '#FAF0FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  groceriesBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerContainer: {
    marginHorizontal: 12,
    marginVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    height: 150,
    backgroundColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
