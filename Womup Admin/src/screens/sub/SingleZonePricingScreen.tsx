import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Edit2,
  Package,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { ProductItem, ProductVariantItem } from '../../types/admin';

export const SingleZonePricingScreen: React.FC = () => {
  const {
    selectedZone,
    zones,
    categories,
    products,
    areaPricing,
    areaPricingRecords,
    setSelectedVariantPricing,
    setActiveModal,
    setSubView,
  } = useAdminState();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const currentZoneObj = zones.find(
    (z) => z.name === selectedZone || z.id === selectedZone
  );
  const currentAreaId = currentZoneObj?.id || selectedZone;

  // Active category is resolved dynamically from categories collection
  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) ||
    categories[0] || {
      id: '',
      name: 'Vegetables',
      slug: 'vegetables',
      isActive: true,
    };

  const filteredProducts = products.filter(
    (p) => p.categoryId === activeCategory.id && p.isActive !== false
  );

  const getVariantPricingDetails = (variant: ProductVariantItem) => {
    const override =
      areaPricing[variant.id]?.[currentAreaId] ??
      areaPricing[variant.id]?.[selectedZone];

    const hasOverride = override !== undefined && override !== null && override > 0;
    const finalPrice = hasOverride ? override : variant.sellingPrice;

    // Find stock if present in areaPricingRecords
    const record = areaPricingRecords.find(
      (r) =>
        r.variantId === variant.id &&
        (r.areaId === currentAreaId || r.areaId === selectedZone)
    );

    const stock = record?.stock ?? variant.stock ?? 100;

    return {
      price: finalPrice,
      hasOverride,
      stock,
    };
  };

  const handleEditPrice = (product: ProductItem, variant: ProductVariantItem) => {
    setSelectedVariantPricing({
      product,
      variant,
      zone: selectedZone,
    });
    setActiveModal('EditZonePrice');
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Navigation */}
      <View style={styles.topSection}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSubView('none')}
            accessibilityLabel="Back to pricing overview"
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{selectedZone} Zone Pricing</Text>
            <Text style={styles.subtitle}>
              {currentZoneObj?.darkStore ? `${currentZoneObj.darkStore} • ` : ''}Single Source of Truth
            </Text>
          </View>
        </View>

        {/* Category Selector Tabs with Dynamic Counters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
          style={styles.categoryScrollView}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id && p.isActive !== false).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, isSelected && styles.activeCategoryTab]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text style={[styles.categoryText, isSelected && styles.activeCategoryText]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products & Variants List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No active {activeCategory?.name || 'Category'} products found</Text>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const variants = p.variants || [];

            return (
              <View key={p.id} style={styles.productCard}>
                {/* Product Title Bar */}
                <View style={styles.productHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productBrand}>
                      {p.brand || 'Womup'} • {variants.length} {variants.length === 1 ? 'pack size' : 'pack sizes'}
                    </Text>
                  </View>
                </View>

                {/* Variants List */}
                <View style={styles.variantsList}>
                  {variants.length === 0 ? (
                    <View style={styles.noVariantsBox}>
                      <Text style={styles.noVariantsText}>No SKU variants configured</Text>
                    </View>
                  ) : (
                    variants.map((v) => {
                      const { price: zonePrice, hasOverride, stock } = getVariantPricingDetails(v);

                      return (
                        <View key={v.id} style={styles.variantRow}>
                          <View style={styles.variantIdentity}>
                            <View style={styles.variantBadgeRow}>
                              <Text style={styles.variantPackSize}>{v.weightOrVolume}</Text>
                              {hasOverride && (
                                <View style={styles.overridePill}>
                                  <Text style={styles.overridePillText}>Zone Override</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.skuText}>SKU: {v.sku}</Text>
                          </View>

                          {/* Pricing Metrics Grid */}
                          <View style={styles.metricsContainer}>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Default</Text>
                              <Text style={styles.defaultVal}>₹{v.sellingPrice}</Text>
                            </View>

                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>{selectedZone}</Text>
                              <Text
                                style={[
                                  styles.zoneVal,
                                  hasOverride ? styles.overrideZoneVal : styles.defaultZoneVal,
                                ]}
                              >
                                ₹{zonePrice}
                              </Text>
                            </View>

                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>MRP</Text>
                              <Text style={styles.mrpVal}>₹{v.mrp}</Text>
                            </View>

                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Stock</Text>
                              <Text style={styles.stockVal}>{stock}</Text>
                            </View>
                          </View>

                          {/* Action Button */}
                          <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => handleEditPrice(p, v)}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={13} color={COLORS.white} style={{ marginRight: 4 }} />
                            <Text style={styles.editBtnText}>Edit Price</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryScrollView: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  categoryScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 4,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  activeCategoryTab: {
    backgroundColor: COLORS.purple,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeCategoryText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  productBrand: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  variantsList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  noVariantsBox: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  noVariantsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantIdentity: {
    minWidth: 120,
    flex: 1.5,
  },
  variantBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variantPackSize: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  overridePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  overridePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  skuText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 2,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  defaultVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  zoneVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  overrideZoneVal: {
    color: '#059669',
  },
  defaultZoneVal: {
    color: COLORS.textPrimary,
  },
  mrpVal: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  stockVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});
