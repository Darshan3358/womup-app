import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/product/ProductCard';
import { useApp } from '../context/AppContext';
import { ProductService } from '../services/productService';

export const S15_ProductListingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    selectedCategoryName,
    filters,
    goBack,
  } = useApp();

  const allProducts = ProductService.getAllProducts();
  const filteredProducts = ProductService.filterAndSortProducts(allProducts, filters);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={selectedCategoryName || 'Rice & Rice Products'}
        onBack={goBack}
        rightAction={
          <TouchableOpacity
            onPress={() => setActiveScreen('C17_Search')}
            style={styles.searchHeaderIcon}
          >
            <Ionicons name="search" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Filter & Sort Bar */}
      <View style={styles.filterSortBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveScreen('C18_FilterSort')}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        <View style={styles.barDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveScreen('C18_FilterSort')}
          style={styles.sortButton}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.sortButtonText}>
            Sort: {filters.sortBy === 'price_asc' ? 'Price Low' : filters.sortBy === 'price_desc' ? 'Price High' : 'Popularity'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>{filteredProducts.length} Products available</Text>
        {filteredProducts.map((prod) => (
          <ProductCard key={prod.id} product={prod} variant="horizontal" />
        ))}
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
  searchHeaderIcon: {
    padding: 6,
  },
  filterSortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  barDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
    flex: 1,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
});
