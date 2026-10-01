import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { HeroBannerCarousel, HeroBannerItem } from '../../components/common/HeroBannerCarousel';
import { WomupCategoryGrid } from '../../components/common/WomupCategoryGrid';
import { MonthlyBenefitsBanner } from '../../components/common/MonthlyBenefitsBanner';
import { WomupDealsSection } from '../../components/common/WomupDealsSection';
import { WomupPopularBrands } from '../../components/common/WomupPopularBrands';
import { WomupPromoBanners } from '../../components/common/WomupPromoBanners';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';

import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import {
  DEALS_OF_THE_DAY_PRODUCTS,
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
    currentStoreName,
    isServiceable,
    deliveryEtaMinutes,
    setLocationModalVisible,
  } = useApp();

  const [activeTab, setActiveTab] = useState('Home');
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch live database products & categories (Preserved 100%)
  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          ProductService.fetchProducts({
            areaId: currentAreaId || undefined,
            storeId: currentStoreId || undefined,
          }),
          ProductService.fetchCategories(),
        ]);
        setDbProducts(prods);
        setCategories(cats);
      } catch (e) {
        console.warn('Error loading live home data:', e);
      }
    })();
  }, [currentAreaId, currentStoreId]);

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
      if (allDealsProducts.length > 0) {
        handleOpenProductDetail(allDealsProducts[0]);
      } else {
        setActiveScreen('C15_ProductListing');
      }
    } else if (banner.type === 'category' && banner.categoryName && banner.categoryId) {
      handleSelectCategory(banner.categoryName, banner.categoryId);
    }
  };

  // Merge live database products with curated deals
  const liveBlinkitProducts: BlinkitProduct[] = dbProducts.map(mapProductToBlinkit);
  const liveDeals = liveBlinkitProducts.filter((p) => p.mrp > p.sellingPrice);
  const allDealsProducts: BlinkitProduct[] = [
    ...DEALS_OF_THE_DAY_PRODUCTS,
    ...liveDeals,
  ];

  return (
    <View style={styles.mainContainer}>
      {/* 1 & 2: Dark Navy Header + Main Navigation Row */}
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 3. Hero Carousel */}
        <HeroBannerCarousel onBannerPress={handleBannerPress} />

        {/* 4. Shop by Category */}
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

        {/* 5. Monthly Benefits Banner */}
        <MonthlyBenefitsBanner
          onJoinPress={() => setActiveScreen('Blinkit_Money')}
        />

        {/* 6. Deals of the Day */}
        <WomupDealsSection
          products={allDealsProducts}
          onOpenProduct={handleOpenProductDetail}
          onViewAll={() => setActiveScreen('C15_ProductListing')}
        />

        {/* 7. Popular Brands */}
        <WomupPopularBrands
          onSelectBrand={(brand) => {
            navigateToProductListing(brand, []);
          }}
          onViewAll={() => setActiveScreen('C15_ProductListing')}
        />

        {/* 8 & 9. Promotional Banners (Fresh Fruits & Vegetables + Pure & Fresh Dairy) */}
        <WomupPromoBanners
          onPressProduce={() => handleSelectCategory('Vegetables & Fruits', 'c1')}
          onPressDairy={() => handleSelectCategory('Dairy, Bread & Eggs', 'c3')}
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
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 24,
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
});
