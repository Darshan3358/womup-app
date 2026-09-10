import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/product/ProductCard';
import { useApp } from '../context/AppContext';
import { ProductService } from '../services/productService';
import { Product } from '../types';

export const S15_ProductListingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    selectedCategoryId,
    selectedCategoryIds,
    selectedCategoryName,
    currentAreaId,
    filters,
    goBack,
  } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      setLoading(true);
      try {
        const hasCategoryIds = selectedCategoryIds && selectedCategoryIds.length > 0;
        const live = await ProductService.fetchProducts({
          categoryIds: hasCategoryIds ? selectedCategoryIds : undefined,
          categoryId: !hasCategoryIds && selectedCategoryId && selectedCategoryId !== 'All' ? selectedCategoryId : undefined,
          areaId: currentAreaId || undefined,
        });

        if (!isCancelled) {
          setProducts(live || []);
        }
      } catch (e) {
        if (!isCancelled) {
          setProducts(ProductService.getAllProducts());
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategoryId, selectedCategoryIds, currentAreaId]);

  // Enforce strict category scoping on the frontend to guarantee zero unrelated products leak
  const categoryScopedProducts = products.filter((p) => {
    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      return selectedCategoryIds.some((cid) => {
        const target = cid.toLowerCase();
        return (
          (p.categoryId || '').toString().toLowerCase() === target ||
          (p.categorySlug || '').toLowerCase() === target ||
          (p.categoryName || '').toLowerCase() === target
        );
      });
    }

    if (selectedCategoryId && selectedCategoryId !== 'All') {
      const target = selectedCategoryId.toLowerCase();
      return (
        (p.categoryId || '').toString().toLowerCase() === target ||
        (p.categorySlug || '').toLowerCase() === target ||
        (p.categoryName || '').toLowerCase() === target
      );
    }

    return true;
  });

  const filteredProducts = ProductService.filterAndSortProducts(categoryScopedProducts, filters);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={selectedCategoryName || 'Products'}
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            There are currently no items available in {selectedCategoryName || 'this category'}.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsCount}>{filteredProducts.length} Products available</Text>
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} variant="horizontal" />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 8,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
