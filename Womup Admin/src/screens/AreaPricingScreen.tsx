import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Table,
  Layers,
  Plus,
  Edit2,
  History,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { CategoryItem, ProductItem, ProductVariantItem } from '../types/admin';

export const AreaPricingScreen: React.FC = () => {
  const {
    zones,
    selectedZone,
    setSelectedZone,
    categories,
    products,
    areaPricing,
    setSubView,
    setActiveModal,
    setSelectedProduct,
    setSelectedVariantPricing,
    deleteProductItem,
    toggleProductStatus,
  } = useAdminState();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showZonePicker, setShowZonePicker] = useState(false);
  // Default all products to expanded so admin immediately sees variant-level pricing
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Active category is resolved dynamically from categories collection
  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) ||
    categories[0] || {
      id: '',
      name: 'Vegetables',
      slug: 'vegetables',
      isActive: true,
    };

  const isProductInCategory = (p: ProductItem, cat?: CategoryItem) => {
    if (!cat) return false;
    if (cat.id && p.categoryId && p.categoryId === cat.id) return true;
    if (cat.name && p.category && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) return true;
    if (cat.slug && p.category && p.category.trim().toLowerCase() === cat.slug.trim().toLowerCase()) return true;
    return false;
  };

  const filteredProducts = products.filter((p) => isProductInCategory(p, activeCategory));

  const currentZoneObj = zones.find(
    (z) => z.name === selectedZone || z.id === selectedZone
  );
  const currentAreaId = currentZoneObj?.id || selectedZone;

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: prev[productId] === undefined ? false : !prev[productId],
    }));
  };

  const isExpanded = (productId: string) => {
    // Expanded by default
    return expandedProducts[productId] !== false;
  };

  const getVariantZonePrice = (variant: ProductVariantItem) => {
    // 1. Look up area_pricing by variantId + areaId or selectedZone
    const override =
      areaPricing[variant.id]?.[currentAreaId] ??
      areaPricing[variant.id]?.[selectedZone];

    if (override !== undefined && override !== null && override > 0) {
      return {
        price: override,
        hasOverride: true,
      };
    }

    // 2. Fallback to variant default sellingPrice (NEVER products.sellingPrice)
    return {
      price: variant.sellingPrice,
      hasOverride: false,
    };
  };

  const handleEditVariantPrice = (product: ProductItem, variant: ProductVariantItem) => {
    setSelectedVariantPricing({
      product,
      variant,
      zone: selectedZone,
    });
    setActiveModal('EditZonePrice');
  };

  const handleEditProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setActiveModal('EditProduct');
  };

  const handleViewHistory = (product: ProductItem) => {
    setSelectedProduct(product);
    setActiveModal('PriceHistory');
  };

  const handleDelete = (product: ProductItem) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProductItem(product.id);
            Alert.alert('Deleted', `"${product.name}" was removed.`);
          },
        },
      ]
    );
  };

  const handleToggleActive = async (product: ProductItem) => {
    await toggleProductStatus(product.id);
  };

  return (
    <View style={styles.container}>
      {/* Zone Selector Header */}
      <View style={styles.topSection}>
        <Text style={styles.sectionLabel}>Select Operational Zone</Text>
        <TouchableOpacity
          style={styles.zoneDropdown}
          onPress={() => setShowZonePicker(!showZonePicker)}
        >
          <View>
            <Text style={styles.zoneDropdownText}>{selectedZone} Zone</Text>
            {currentZoneObj?.darkStore && (
              <Text style={styles.zoneSubtext}>{currentZoneObj.darkStore}</Text>
            )}
          </View>
          <ChevronDown size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Zone Dropdown Menu */}
        {showZonePicker && (
          <View style={styles.zonePickerMenu}>
            <ScrollView style={styles.zonePickerScroll} nestedScrollEnabled={true}>
              {zones.map((z) => (
                <TouchableOpacity
                  key={z.id}
                  style={[
                    styles.zonePickerItem,
                    selectedZone === z.name && styles.zonePickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedZone(z.name);
                    setShowZonePicker(false);
                  }}
                >
                  <View style={styles.zoneItemRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={[
                          styles.zonePickerText,
                          selectedZone === z.name && styles.zonePickerTextActive,
                        ]}
                      >
                        {z.name} ({z.darkStore || `Wom Up ${z.name} Dark Store`})
                      </Text>
                      {z.code && (
                        <Text style={styles.zoneItemCode}>
                          CODE: {z.code}
                        </Text>
                      )}
                    </View>
                    {selectedZone === z.name && (
                      <CheckCircle2 size={16} color={COLORS.purple} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* + Add New Zone Action at bottom */}
            <TouchableOpacity
              style={styles.addZoneDropdownBtn}
              onPress={() => {
                setShowZonePicker(false);
                setActiveModal('AddZone');
              }}
            >
              <Plus size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addZoneDropdownBtnText}>＋ Add New Zone</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Selector Tabs with Dynamic Counters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
          style={styles.categoryScrollView}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            const count = products.filter((p) => isProductInCategory(p, cat)).length;
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

      {/* Sub Header / Add Item Action Bar */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.catalogHeading}>{activeCategory?.name || 'Category'} Catalog</Text>
          <Text style={styles.catalogSubHeading}>
            {filteredProducts.length} products configured for {selectedZone}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addItemBtn}
          onPress={() => setActiveModal('AddProduct')}
        >
          <Plus size={16} color={COLORS.white} style={{ marginRight: 4 }} />
          <Text style={styles.addItemBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Product List with Expandable Variant Hierarchy */}
      <ScrollView style={styles.tableScrollView} contentContainerStyle={styles.tableContent}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No {activeCategory?.name} items found</Text>
            <Text style={styles.emptySubTitle}>
              Click "+ Add Item" above to add new {activeCategory?.name.toLowerCase()} items to the catalog.
            </Text>
            <TouchableOpacity
              style={[styles.addItemBtn, { marginTop: 12 }]}
              onPress={() => setActiveModal('AddProduct')}
            >
              <Plus size={16} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.addItemBtnText}>Add First {activeCategory?.name} Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const isItemActive = p.isActive !== false;
            const expanded = isExpanded(p.id);
            const variants = p.variants || [];

            // Calculate "From ₹X" minimum price across variants for this zone
            let minPrice = 0;
            if (variants.length > 0) {
              const prices = variants.map((v) => getVariantZonePrice(v).price);
              minPrice = Math.min(...prices);
            } else {
              minPrice = p.sellingPrice || p.basePrice || 0;
            }

            return (
              <View
                key={p.id}
                style={[
                  styles.productCard,
                  !isItemActive && styles.inactiveCard,
                ]}
              >
                {/* Collapsed/Expanded Header Row */}
                <View style={styles.productCardHeader}>
                  <TouchableOpacity
                    style={styles.productInfoRow}
                    onPress={() => toggleExpand(p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expandIconContainer}>
                      {expanded ? (
                        <ChevronDown size={18} color={COLORS.purple} />
                      ) : (
                        <ChevronRight size={18} color={COLORS.textMuted} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleWithBadge}>
                        <Text
                          style={[
                            styles.productNameText,
                            !isItemActive && { color: COLORS.textMuted },
                          ]}
                        >
                          {p.name}
                        </Text>
                        <View style={styles.variantCountBadge}>
                          <Package size={11} color={COLORS.purple} style={{ marginRight: 3 }} />
                          <Text style={styles.variantCountText}>
                            {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.fromPriceText}>
                          From <Text style={styles.fromPriceBold}>₹{minPrice}</Text> in {selectedZone}
                        </Text>
                        <Text style={styles.metaDot}>•</Text>
                        <TouchableOpacity
                          style={[
                            styles.statusPill,
                            { backgroundColor: isItemActive ? '#ECFDF5' : '#FEF2F2' },
                          ]}
                          onPress={() => handleToggleActive(p)}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isItemActive ? COLORS.success : COLORS.error },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: isItemActive ? COLORS.success : COLORS.error },
                            ]}
                          >
                            {isItemActive ? 'Active' : 'Hidden'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Actions for the master product */}
                  <View style={styles.masterActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleEditProduct(p)}
                      accessibilityLabel={`Edit master details for ${p.name}`}
                    >
                      <Edit2 size={15} color={COLORS.purple} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleViewHistory(p)}
                      accessibilityLabel="View price history"
                    >
                      <History size={15} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(p)}
                      accessibilityLabel="Delete item"
                    >
                      <Trash2 size={15} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded Variants Section */}
                {expanded && (
                  <View style={styles.variantsContainer}>
                    {variants.length === 0 ? (
                      <View style={styles.noVariantsNotice}>
                        <AlertCircle size={14} color={COLORS.warning} style={{ marginRight: 6 }} />
                        <Text style={styles.noVariantsText}>
                          No SKU variants defined for this product. Edit product to configure variants.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.variantTableHeader}>
                          <Text style={[styles.variantColHeader, { flex: 2 }]}>Pack Size / SKU</Text>
                          <Text style={[styles.variantColHeader, { flex: 1.2, textAlign: 'center' }]}>
                            Default Price
                          </Text>
                          <Text style={[styles.variantColHeader, { flex: 1.6, textAlign: 'center' }]}>
                            {selectedZone} Price
                          </Text>
                          <Text style={[styles.variantColHeader, { flex: 1, textAlign: 'center' }]}>MRP</Text>
                          <Text style={[styles.variantColHeader, { flex: 1, textAlign: 'center' }]}>Action</Text>
                        </View>

                        {variants.map((v) => {
                          const { price: zoneSellingPrice, hasOverride } = getVariantZonePrice(v);

                          return (
                            <View key={v.id} style={styles.variantRow}>
                              {/* Variant identity / SKU */}
                              <View style={{ flex: 2 }}>
                                <Text style={styles.variantWeightText}>
                                  {v.weightOrVolume}
                                  {v.isDefault && <Text style={styles.defaultLabel}> (Default)</Text>}
                                </Text>
                                <Text style={styles.variantSkuText}>SKU: {v.sku}</Text>
                              </View>

                              {/* Base/Default Price (from product_variants.sellingPrice) */}
                              <View style={{ flex: 1.2, alignItems: 'center' }}>
                                <Text style={styles.defaultPriceValue}>₹{v.sellingPrice}</Text>
                                <Text style={styles.defaultPriceSub}>Catalog Base</Text>
                              </View>

                              {/* Final Zone Selling Price (from area_pricing.price) */}
                              <View style={{ flex: 1.6, alignItems: 'center' }}>
                                <TouchableOpacity
                                  style={[
                                    styles.zonePriceBadge,
                                    hasOverride ? styles.overrideBadge : styles.noOverrideBadge,
                                  ]}
                                  onPress={() => handleEditVariantPrice(p, v)}
                                  activeOpacity={0.7}
                                >
                                  <Text
                                    style={[
                                      styles.zonePriceValue,
                                      hasOverride
                                        ? styles.overridePriceText
                                        : styles.noOverridePriceText,
                                    ]}
                                  >
                                    ₹{zoneSellingPrice}
                                  </Text>
                                </TouchableOpacity>
                                <Text
                                  style={[
                                    styles.overrideLabel,
                                    hasOverride ? styles.overrideLabelActive : styles.overrideLabelMuted,
                                  ]}
                                >
                                  {hasOverride ? 'Zone Override' : 'No Override'}
                                </Text>
                              </View>

                              {/* MRP */}
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.mrpValue}>₹{v.mrp}</Text>
                              </View>

                              {/* Edit Action Button */}
                              <View style={{ flex: 1, alignItems: 'center' }}>
                                <TouchableOpacity
                                  style={styles.editVariantBtn}
                                  onPress={() => handleEditVariantPrice(p, v)}
                                  activeOpacity={0.7}
                                >
                                  <Edit2 size={13} color={COLORS.white} style={{ marginRight: 4 }} />
                                  <Text style={styles.editVariantBtnText}>Edit</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Actions Footer */}
      <View style={styles.footerActions}>
        <View style={styles.subActionRow}>
          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => setSubView('SingleZonePricing')}
          >
            <Layers size={14} color={COLORS.purple} />
            <Text style={styles.subActionText}>Single Config</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => setActiveModal('CrossZoneMatrix')}
          >
            <Table size={14} color={COLORS.purple} />
            <Text style={styles.subActionText}>Cross-Zone Matrix</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => setActiveModal('BulkPriceAdjustment')}
          >
            <SlidersHorizontal size={14} color={COLORS.purple} />
            <Text style={styles.subActionText}>Bulk Adjust</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    zIndex: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  zoneDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  zoneDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  zoneSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  zonePickerMenu: {
    position: 'absolute',
    top: 75,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  zonePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  zonePickerItemActive: {
    backgroundColor: '#EEF2FF',
  },
  zonePickerText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  zonePickerTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  zonePickerScroll: {
    maxHeight: 260,
  },
  zoneItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoneItemCode: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  addZoneDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1.5,
    borderTopColor: '#BBF7D0',
    borderBottomLeftRadius: RADIUS.sm,
    borderBottomRightRadius: RADIUS.sm,
  },
  addZoneDropdownBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  catalogHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  catalogSubHeading: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  tableScrollView: {
    flex: 1,
  },
  tableContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 24,
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
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Product Card & Variant Hierarchy Styles
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
  inactiveCard: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  productNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  variantCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  variantCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fromPriceText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  fromPriceBold: {
    fontWeight: '800',
    color: COLORS.purple,
  },
  metaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  masterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
  },

  // Variants Inner Table
  variantsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  noVariantsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.sm,
    marginVertical: SPACING.sm,
  },
  noVariantsText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  variantTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  variantColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  variantWeightText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaultLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.purple,
  },
  variantSkuText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  defaultPriceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  defaultPriceSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  zonePriceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  overrideBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  noOverrideBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  zonePriceValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  overridePriceText: {
    color: '#047857',
  },
  noOverridePriceText: {
    color: COLORS.textPrimary,
  },
  overrideLabel: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },
  overrideLabelActive: {
    color: '#059669',
  },
  overrideLabelMuted: {
    color: COLORS.textMuted,
  },
  mrpValue: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  editVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  editVariantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Footer Actions
  footerActions: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 9,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
    marginLeft: 4,
  },
});
