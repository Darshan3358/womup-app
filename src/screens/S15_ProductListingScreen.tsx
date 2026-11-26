import React, { useState, useEffect, useMemo } from 'react';
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
import { FloatingCartPill } from '../components/common/FloatingCartPill';
import { HorizontalProductCardSkeleton } from '../components/common/Skeleton';
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
    currentStoreId,
    catalogVersion,
    filters,
    goBack,
  } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      setLoading(true);
      setProducts([]);
      try {
        const hasCategoryIds = selectedCategoryIds && selectedCategoryIds.length > 0;
        const live = await ProductService.fetchProducts({
          categoryIds: hasCategoryIds ? selectedCategoryIds : undefined,
          categoryId: !hasCategoryIds && selectedCategoryId && selectedCategoryId !== 'All' ? selectedCategoryId : undefined,
          areaId: currentAreaId || undefined,
          storeId: currentStoreId || undefined,
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
  }, [selectedCategoryId, selectedCategoryIds, currentAreaId, currentStoreId, catalogVersion]);

  // Smart category filtering matching IDs, slugs, category names, and title keywords
  const categoryScopedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const normCatName = (selectedCategoryName || '').toLowerCase().trim();
    const idTargets = (selectedCategoryIds || []).map((id) => id.toLowerCase().trim()).filter(Boolean);
    if (selectedCategoryId && selectedCategoryId !== 'All') {
      idTargets.push(selectedCategoryId.toLowerCase().trim());
    }

    // If no category filter specified or "All", show all
    if (idTargets.length === 0 && (!normCatName || normCatName === 'all' || normCatName === 'products')) {
      return products;
    }

    return products.filter((p) => {
      const pCatId = (p.categoryId || '').toString().toLowerCase();
      const pCatSlug = (p.categorySlug || '').toLowerCase();
      const pCatName = (p.categoryName || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();

      // 1. Direct match on selected IDs or slugs or category names
      const matchesDirect = idTargets.some((target) => (
        pCatId === target ||
        pCatSlug === target ||
        pCatName === target ||
        (target.length > 2 && (pCatName.includes(target) || pCatSlug.includes(target)))
      ));
      if (matchesDirect) return true;

      // 2. Title-based semantic matching
      if (normCatName.includes('vegetable') || normCatName.includes('fruit')) {
        return (
          pCatSlug.includes('veg') ||
          pCatSlug.includes('fruit') ||
          pCatName.includes('vegetable') ||
          pCatName.includes('fruit') ||
          pCatId === '6aa2712acb3d55073acc2101' ||
          pCatId === '6aa2712acb3d55073acc2102'
        );
      }
      if (normCatName.includes('dairy') || normCatName.includes('bread') || normCatName.includes('milk')) {
        return (
          pCatSlug.includes('dairy') ||
          pCatSlug.includes('bread') ||
          pCatName.includes('dairy') ||
          pCatName.includes('bread') ||
          pCatId === '6b046011e457907227bc34cc' ||
          pCatId === '6aa2712acb3d55073acc2103' ||
          pName.includes('paneer') ||
          pName.includes('curd') ||
          pName.includes('dahi') ||
          pName.includes('milk') ||
          pName.includes('bread')
        );
      }
      if (normCatName.includes('oil') || normCatName.includes('ghee') || normCatName.includes('masala') || normCatName.includes('atta') || normCatName.includes('rice')) {
        return (
          pCatSlug.includes('atta') ||
          pCatSlug.includes('rice') ||
          pCatSlug.includes('cooking') ||
          pCatName.includes('atta') ||
          pCatName.includes('rice') ||
          pCatName.includes('cooking') ||
          pCatId === '6b046011e457907227bc34cb' ||
          pCatId === '6aa11866c6c3e5984e2ef5ea' ||
          pName.includes('oil') ||
          pName.includes('atta') ||
          pName.includes('rice') ||
          pName.includes('salt')
        );
      }
      if (normCatName.includes('personal') || normCatName.includes('beauty') || normCatName.includes('care')) {
        return (
          pCatSlug.includes('personal') ||
          pCatSlug.includes('beauty') ||
          pCatName.includes('personal') ||
          pCatName.includes('beauty') ||
          pCatId === '6b046012e457907227bc34cd' ||
          pName.includes('shampoo') ||
          pName.includes('perfume') ||
          pName.includes('spray') ||
          pName.includes('conditioner') ||
          pName.includes('hair')
        );
      }
      if (normCatName.includes('bakery') || normCatName.includes('biscuit')) {
        return (
          pCatSlug.includes('bakery') ||
          pCatName.includes('bakery') ||
          pName.includes('bread') ||
          pName.includes('biscuit') ||
          pName.includes('cookie') ||
          pName.includes('rusk')
        );
      }
      if (normCatName.includes('chip') || normCatName.includes('namkeen') || normCatName.includes('snack')) {
        return (
          pCatSlug.includes('snack') ||
          pCatName.includes('snack') ||
          pCatId === '6aa2712bcb3d55073acc2106' ||
          pName.includes('chip') ||
          pName.includes('namkeen') ||
          pName.includes('wafer')
        );
      }
      if (normCatName.includes('drink') || normCatName.includes('juice') || normCatName.includes('beverage')) {
        return (
          pCatSlug.includes('beverage') ||
          pCatSlug.includes('drink') ||
          pCatName.includes('beverage') ||
          pCatId === '6aa2712bcb3d55073acc2105' ||
          pName.includes('juice') ||
          pName.includes('butter milk') ||
          pName.includes('drink')
        );
      }

      return false;
    });
  }, [products, selectedCategoryIds, selectedCategoryId, selectedCategoryName]);

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <HorizontalProductCardSkeleton key={i} />
          ))}
        </ScrollView>
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
          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* Floating View Cart Pill above bottom navigation */}
      <FloatingCartPill bottomOffset={84} />
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
