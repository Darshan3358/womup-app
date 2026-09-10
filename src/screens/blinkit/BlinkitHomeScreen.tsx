import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { CategoryCard } from '../../components/common/CategoryCard';
import { BlinkitProductCard } from '../../components/common/BlinkitProductCard';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { AppIcon } from '../../components/common/AppIcon';
import { useApp, mapProductToBlinkit } from '../../context/AppContext';
import { ProductService } from '../../services/productService';
import { GaneshChaturthiSection } from '../../components/common/GaneshChaturthiSection';
import { PromotionalBannersCarousel } from '../../components/common/PromotionalBannersCarousel';
import {
  BESTSELLER_CATEGORY_CARDS_ROW1,
  BESTSELLER_CATEGORY_CARDS_ROW2,
  MAIN_CATEGORY_GRID,
  SNACKS_DRINKS_GRID,
  BEAUTY_GRID,
  HOUSEHOLD_GRID,
  STORES_IN_SPOTLIGHT,
  LIFESTYLE_PICKS,
  BLINKIT_RAINCOAT_PRODUCT,
  PEOPLE_ALSO_BOUGHT,
  ORDER_AGAIN_PRODUCTS,
  resolveCategoryGroup,
} from '../../data/blinkitData';
import { Product, Category, BlinkitProduct } from '../../types';

export const BlinkitHomeScreen: React.FC = () => {
  const {
    setActiveScreen,
    setSelectedProduct,
    setSelectedBlinkitProduct,
    setSelectedCategoryId,
    setSelectedCategoryName,
    navigateToProductListing,
    currentAreaId,
  } = useApp();
  const [selectedTab, setSelectedTab] = useState('All');
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          ProductService.fetchProducts({ areaId: currentAreaId || undefined }),
          ProductService.fetchCategories(),
        ]);
        setDbProducts(prods);
        setCategories(cats);
      } catch (e) {
        console.warn('Error loading live home data:', e);
      }
    })();
  }, [currentAreaId]);

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
      discountPercent: prod.mrp > prod.sellingPrice ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100) : 0,
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

  // Merge live database products with curated rich HD catalog products
  const liveBlinkitProducts: BlinkitProduct[] = dbProducts.map(mapProductToBlinkit);

  const dealsProducts: BlinkitProduct[] = [
    ...liveBlinkitProducts.filter((p) => p.mrp > p.sellingPrice),
    BLINKIT_RAINCOAT_PRODUCT,
    ...PEOPLE_ALSO_BOUGHT,
  ];

  const popularProducts: BlinkitProduct[] = [
    ...liveBlinkitProducts,
    ...ORDER_AGAIN_PRODUCTS,
  ];

  return (
    <View style={styles.mainContainer}>
      {/* Sticky Top Header */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Delivery in"
        etaTime="9 minutes"
        searchPlaceholder='Search "milk, chips, maggi"'
        activeCategoryTab={selectedTab}
        onSelectCategoryTab={setSelectedTab}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Full-Width Promotional Hero Banner (Animated Maggi Double Masala) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => handleOpenProductDetail(dealsProducts[0])}
          style={styles.fullWidthBannerContainer}
          accessibilityLabel="Shop New Maggi Double Masala Noodles"
        >
          {Platform.OS === 'web' ? (
            React.createElement('video', {
              src: require('../../../assets/create_this_banner_as_gif_Crea.mp4'),
              autoPlay: true,
              loop: true,
              muted: true,
              playsInline: true,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
              },
            })
          ) : (
            <Image
              source={require('../../../assets/maggi_double_masala_banner.gif')}
              style={styles.fullWidthBannerImage}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        {/* 2. Bestsellers Rail (Row 1 - Vegetables, Chips, Dairy) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Bestsellers</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRail}
          >
            {BESTSELLER_CATEGORY_CARDS_ROW1.map((card) => (
              <CategoryCard
                key={card.id}
                card={card}
                onPress={() => handleSelectCategory(card.title, card.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 3. Bestsellers Rail (Row 2 - Oil & Spices, Bakery, Drinks) */}
        <View style={styles.sectionContainerCompact}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRail}
          >
            {BESTSELLER_CATEGORY_CARDS_ROW2.map((card) => (
              <CategoryCard
                key={card.id}
                card={card}
                onPress={() => handleSelectCategory(card.title, card.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 4. Deals of the Day (Live + Curated HD Products) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>⚡ Deals of the Day</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveScreen('C15_ProductListing')}>
              <Text style={styles.viewAllText}>View All ▸</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRail}
          >
            {dealsProducts.map((item) => (
              <BlinkitProductCard
                key={item.id}
                product={item}
                variant="horizontal"
                onPress={() => handleOpenProductDetail(item)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 5. Popular in Your Area */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Popular in your area</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveScreen('C15_ProductListing')}>
              <Text style={styles.viewAllText}>View All ▸</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRail}
          >
            {popularProducts.map((prod) => (
              <BlinkitProductCard
                key={prod.id}
                product={prod}
                variant="horizontal"
                onPress={() => handleOpenProductDetail(prod)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 6. Celebrate Ganesh Chaturthi Section */}
        <GaneshChaturthiSection
          onSelectCategory={() => handleSelectCategory('Ganeshotsav Festive Store', 'ganeshotsav')}
        />

        {/* 7. Grocery & Kitchen (4 Columns Grid with Real Photos) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Grocery & Kitchen</Text>
          <View style={styles.fourColGrid}>
            {MAIN_CATEGORY_GRID.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.75}
                onPress={() => handleSelectCategory(tile.title, tile.id)}
                style={styles.gridTile}
              >
                <View style={styles.tileIconContainer}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
                  {tile.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 8. Snacks & Drinks (4 Columns Grid with Real Photos) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Snacks & Drinks</Text>
          <View style={styles.fourColGrid}>
            {SNACKS_DRINKS_GRID.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.75}
                onPress={() => handleSelectCategory(tile.title, tile.id)}
                style={styles.gridTile}
              >
                <View style={styles.tileIconContainer}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
                  {tile.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 9. Beauty & Personal Care (4 Columns Grid with Real Photos) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Beauty & Personal Care</Text>
          <View style={styles.fourColGrid}>
            {BEAUTY_GRID.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.75}
                onPress={() => handleSelectCategory(tile.title, tile.id)}
                style={styles.gridTile}
              >
                <View style={styles.tileIconContainer}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
                  {tile.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 10. Household Essentials (4 Columns Grid with Real Photos) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Household Essentials</Text>
          <View style={styles.fourColGrid}>
            {HOUSEHOLD_GRID.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.75}
                onPress={() => handleSelectCategory(tile.title, tile.id)}
                style={styles.gridTile}
              >
                <View style={styles.tileIconContainer}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
                  {tile.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 11. Promotional Image Banners Carousel */}
        <PromotionalBannersCarousel
          onPressBanner={() => handleOpenProductDetail(dealsProducts[0])}
        />

        {/* 12. Stores in Spotlight */}
        <View style={styles.spotlightSection}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle, { paddingHorizontal: 16 }]}>
            Stores in spotlight
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotlightRow}
          >
            {STORES_IN_SPOTLIGHT.map((store) => (
              <TouchableOpacity
                key={store.id}
                activeOpacity={0.88}
                onPress={() => handleSelectCategory(store.title, store.id)}
                style={[
                  styles.spotlightCard,
                  { backgroundColor: store.bgColor || '#DCEBFA' },
                ]}
              >
                {/* 3D Cutout Product Illustration */}
                <Image
                  source={store.localImage || { uri: store.imageUrl }}
                  style={styles.spotlightCardImage}
                  resizeMode="cover"
                />

                {/* Clean Store Title in Top-Left */}
                <View style={styles.spotlightTitleWrap}>
                  <Text style={styles.spotlightTitleTop}>
                    {store.titleTop || store.title.split(' ')[0]}
                  </Text>
                  <Text style={styles.spotlightTitleBottom}>
                    {store.titleBottom || store.title.split(' ')[1] || 'Store'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 13. Picks for Your Lifestyle (2 Rows x 4 Columns) */}
        <View style={styles.sectionContainer}>
          <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>Picks for your lifestyle</Text>
          <View style={styles.fourColGrid}>
            {LIFESTYLE_PICKS.map((tile) => (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.75}
                onPress={() => handleSelectCategory(tile.title, tile.id)}
                style={styles.gridTile}
              >
                <View style={[styles.tileIconContainer, { backgroundColor: tile.bgColor || '#F1F5F9' }]}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
                  {tile.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 14. Deals Worth Grabbing Teaser Strip */}
        <View style={styles.dealsStripContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveScreen('C15_ProductListing')}
            style={styles.dealsStrip}
          >
            <View style={styles.dealsLeft}>
              <AppIcon name="tag" size={18} color={COLORS.primary} />
              <Text style={styles.dealsText}>Deals worth-grabbing! Save up to 60% today</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Bottom spacer for tab bar + floating pill */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating "View Cart" Pill Button */}
      <FloatingCartPill bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  fullWidthBannerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  fullWidthBannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionContainerCompact: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 0,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  horizontalRail: {
    paddingRight: 16,
    gap: 12,
    paddingTop: 8,
  },
  fourColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gridTile: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  tileIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileTitle: {
    textAlign: 'center',
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 11,
    lineHeight: 14,
  },
  spotlightSection: {
    marginTop: 22,
  },
  spotlightRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  spotlightCard: {
    width: 90,
    height: 126,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  spotlightCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  spotlightTitleWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
  },
  spotlightTitleTop: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  spotlightTitleBottom: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  dealsStripContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  dealsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FCE1F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.hotPink,
  },
  dealsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
});
