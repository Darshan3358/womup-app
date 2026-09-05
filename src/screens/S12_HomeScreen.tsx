import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { SearchBar } from '../components/common/SearchBar';
import { SectionHeader } from '../components/common/SectionHeader';
import { ProductCard } from '../components/product/ProductCard';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { useApp } from '../context/AppContext';

export const S12_HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    selectedAddress,
    setSelectedCategoryId,
    setSelectedCategoryName,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const deals = PRODUCTS.filter((p) => p.isDeal);
  const popular = PRODUCTS.filter((p) => p.isPopular);

  const handleCategoryPress = (catId: string, catName: string) => {
    setSelectedCategoryId(catId);
    setSelectedCategoryName(catName);
    setActiveScreen('C14_SubCategory');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Top Delivering Header matching wireframe */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Text style={styles.deliveringToLabel}>Delivering To</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveScreen('C11_AddAddress')}
            style={styles.addressRow}
          >
            <Ionicons name="location" size={16} color={COLORS.hotPink} />
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress.type} — {selectedAddress.city.split(',')[0]}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setActiveScreen('C26_Account')}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={32} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* Search Input Button */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={searchQuery}
          editable={false}
          onPress={() => setActiveScreen('C17_Search')}
          placeholder="Search for products..."
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Promotional Banner from assets */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActiveScreen('C15_ProductListing')}
          style={styles.bannerContainer}
        >
          <Image
            source={require('../../assets/Banner.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Shop by Category */}
        <SectionHeader
          title="Shop by Category"
          actionText="View All"
          onActionPress={() => setActiveScreen('C13_Category')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesHorizontal}
        >
          {CATEGORIES.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => handleCategoryPress(cat.id, cat.name)}
              style={styles.categoryItem}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: cat.bgColor }]}>
                <Ionicons name={cat.iconName as any} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Deals */}
        <SectionHeader
          title="Today's Deals"
          actionText="See All"
          onActionPress={() => setActiveScreen('C15_ProductListing')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsHorizontal}
        >
          {deals.map((prod) => (
            <ProductCard key={prod.id} product={prod} variant="grid" />
          ))}
        </ScrollView>

        {/* Popular Products */}
        <SectionHeader
          title="Popular Products"
          actionText="View All"
          onActionPress={() => setActiveScreen('C15_ProductListing')}
        />
        <View style={styles.popularList}>
          {popular.map((prod) => (
            <ProductCard key={prod.id} product={prod} variant="horizontal" />
          ))}
        </View>

        {/* Extra spacing for bottom nav */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  locationContainer: {
    flex: 1,
  },
  deliveringToLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  profileButton: {
    padding: 2,
  },
  searchPadding: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    height: 140,
    borderRadius: RADIUS.banner,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoriesHorizontal: {
    paddingHorizontal: SPACING.md,
    gap: 14,
    paddingVertical: 4,
  },
  categoryItem: {
    width: 72,
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  productsHorizontal: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  popularList: {
    paddingHorizontal: SPACING.md,
    marginTop: 4,
  },
});
