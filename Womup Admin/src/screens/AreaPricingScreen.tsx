import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  useWindowDimensions,
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
  RotateCcw,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Navigation,
  Warehouse,
  Store,
  Home,
  Settings,
  Lock,
  Search,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { CategoryItem, ProductItem, ProductVariantItem } from '../types/admin';

export const AreaPricingScreen: React.FC = () => {
  const {
    cities,
    zones,
    selectedZone,
    setSelectedZone,
    darkStores,
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

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  // Expanded product states
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // 1. Resolve Active Cities
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);

  // Default to Ahmedabad or first active city
  const currentCity =
    activeCities.find((c) => (c.id && c.id === selectedCityId) || (c._id && c._id === selectedCityId)) ||
    activeCities.find((c) => c.code === 'AHM' || c.name.toLowerCase() === 'ahmedabad') ||
    activeCities[0];

  // 2. Resolve Available Areas for Selected City
  const availableAreas = zones.filter((z) => {
    if (!currentCity) return true;
    const currentCityIdStr = currentCity.id || currentCity._id;
    if (z.cityId && currentCityIdStr && String(z.cityId) === String(currentCityIdStr)) return true;
    if (z.cityName && currentCity.name && z.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
    if (z.city && currentCity.name && z.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
    return false;
  });

  // Current selected area
  const currentArea =
    availableAreas.find((a) => (a.id && a.id === selectedAreaId) || (a._id && a._id === selectedAreaId)) ||
    availableAreas.find((a) => a.name === selectedZone || a.id === selectedZone) ||
    availableAreas[0] ||
    zones[0];

  // Sync selectedZone in global context with currentArea
  useEffect(() => {
    if (currentArea && currentArea.name && selectedZone !== currentArea.name) {
      setSelectedZone(currentArea.name);
    }
  }, [currentArea, selectedZone, setSelectedZone]);

  // 3. Resolve Available Dark Stores for Selected Area (Multi-Store Capacity Support)
  const areaStores = useMemo(() => {
    if (!currentArea) return [];
    const areaIdStr = String(currentArea.id || (currentArea as any)._id || '');
    return darkStores.filter((s: any) => {
      if (s.areaId && areaIdStr && String(s.areaId) === areaIdStr) return true;
      if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
      if (currentArea.assignedStores && currentArea.assignedStores.some((as: any) => String(as.id || as._id) === String(s.id || s._id))) return true;
      if (currentArea.assignedStore && String(currentArea.assignedStore.id || currentArea.assignedStore._id) === String(s.id || s._id)) return true;
      if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
      return false;
    });
  }, [currentArea, darkStores]);

  // Default to first store in area when area changes
  useEffect(() => {
    if (areaStores.length > 0) {
      const exists = areaStores.some((s: any) => String(s.id || s._id) === String(selectedStoreId));
      if (!exists) {
        setSelectedStoreId(String(areaStores[0].id || (areaStores[0] as any)._id));
      }
    } else {
      setSelectedStoreId('');
    }
  }, [areaStores, selectedStoreId]);

  const resolvedStore = darkStores.find((s: any) => {
    if (currentArea) {
      const areaIdStr = currentArea.id || (currentArea as any)._id;
      if (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) return true;
      if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
      if (currentArea.assignedStore && (s.id === currentArea.assignedStore.id || s.code === currentArea.assignedStore.code)) return true;
      if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
    }
    return false;
  }) || (currentCity ? darkStores.find(s => (s.cityName || s.city || '').toLowerCase() === currentCity.name.toLowerCase()) : null) || darkStores[0];

  const selectedStore =
    areaStores.find((s: any) => String(s.id || s._id) === String(selectedStoreId)) ||
    areaStores[0] ||
    resolvedStore;

  const currentStoreName = selectedStore?.name || resolvedStore?.name || currentArea?.darkStore || `Wom Up ${currentArea?.name || 'Area'} Dark Store`;

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

  const currentAreaId = currentArea?.id || selectedZone;
  const currentAreaName = currentArea?.name || selectedZone;

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: prev[productId] === undefined ? false : !prev[productId],
    }));
  };

  const isExpanded = (productId: string) => {
    return expandedProducts[productId] !== false;
  };

  const getVariantZonePrice = (variant: ProductVariantItem) => {
    // 1. Look up area_pricing by variantId + areaId or selectedZone
    const override =
      areaPricing[variant.id]?.[currentAreaId] ??
      areaPricing[variant.id]?.[currentAreaName] ??
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
      zone: currentAreaName,
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

  const getProductThumbnail = (name: string, defaultUrl?: string) => {
    if (defaultUrl && defaultUrl.startsWith('http')) return defaultUrl;
    const n = (name || '').toLowerCase();
    if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80';
    if (n.includes('potato')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&auto=format&fit=crop&q=80';
    if (n.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&auto=format&fit=crop&q=80';
    if (n.includes('banana')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop&q=80';
    if (n.includes('capsicum') || n.includes('pepper')) return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&auto=format&fit=crop&q=80';
    if (n.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80';
    if (n.includes('milk')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80';
    return defaultUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HEADER */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>💰 Area Dynamic Pricing</Text>
          <Text style={styles.headerSubtitle}>
            Configure hyper-local selling prices per Area (cascades from City)
          </Text>
        </View>

      {/* 2. CASCADING 3-STEP SELECTORS (City -> Area -> Store) */}
      <View style={styles.selectorsSection}>
        {/* STEP 1: SELECT CITY */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowCityPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <MapPin size={18} color="#6366F1" style={styles.selectorIcon} />
            <View>
              <Text style={styles.selectorStepLabel}>STEP 1: SELECT CITY</Text>
              <Text style={styles.selectorValue}>
                {currentCity ? `${currentCity.name} (${currentCity.code})` : 'Ahmedabad (AHM)'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>

        {/* STEP 2: SELECT AREA */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowAreaPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <Navigation size={18} color="#6366F1" style={styles.selectorIcon} />
            <View>
              <Text style={styles.selectorStepLabel}>STEP 2: SELECT AREA</Text>
              <Text style={styles.selectorValue}>
                {currentArea ? currentArea.name : 'Satellite'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>

        {/* STEP 3: SELECT STORE */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowStorePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <Store size={18} color="#6366F1" style={styles.selectorIcon} />
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.selectorStepLabel}>STEP 3: SELECT STORE</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>
                {currentStoreName || 'Wom Up Satellite Dark Store'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* 3. SELECTED STORE BANNER CARD */}
      <View style={styles.selectedStoreCard}>
        <View style={styles.selectedStoreTopRow}>
          <View style={styles.selectedStoreIconBox}>
            <Warehouse size={18} color="#4F46E5" />
          </View>
          <Text style={styles.selectedStoreName} numberOfLines={1}>
            {currentStoreName || 'Wom Up Satellite Dark Store'}
          </Text>
          <View style={styles.selectedStorePill}>
            <Text style={styles.selectedStorePillText}>◎ SELECTED STORE</Text>
          </View>
        </View>

        <View style={styles.selectedStoreTagsRow}>
          <View style={styles.storeTag}>
            <Text style={styles.storeTagText}>
              📍 Area: <Text style={styles.boldText}>{currentAreaName} • {currentCity?.name}</Text>
            </Text>
          </View>

          <View style={styles.storeHubTag}>
            <Text style={styles.storeHubTagText}>
              ⚙ Hub: {currentStoreName || 'Wom Up Satellite Dark Store'}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. LOCATION BREADCRUMB */}
      <View style={styles.breadcrumbRow}>
        <Home size={16} color="#1E3A8A" style={{ marginRight: 6 }} />
        <Text style={styles.breadcrumbText}>
          {currentCity?.name || 'Ahmedabad'} • {currentAreaName || 'Satellite'}
        </Text>
      </View>

      {/* 5. HORIZONTAL CATEGORY TABS WITH CHEVRON */}
      <View style={styles.categoryTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsScroll}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            const count = products.filter((p) => isProductInCategory(p, cat)).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTabPill, isSelected && styles.categoryTabPillActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.categoryChevronBox}>
          <ChevronRight size={14} color="#64748B" />
        </View>
      </View>

      {/* 6. CATALOG HEADING & ADD ITEM ACTION ROW */}
      <View style={styles.catalogHeadingRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.catalogTitle}>{activeCategory?.name || 'Vegetables'} Catalog</Text>
          <Text style={styles.catalogSubtitle}>
            {filteredProducts.length} products configured for {currentAreaName} ({currentCity?.name})
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addCatalogItemBtn}
          onPress={() => setActiveModal('AddProduct')}
          activeOpacity={0.85}
        >
          <Plus size={15} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.addCatalogItemBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* 7. PRODUCT PRICING CARDS */}
      <View style={styles.productsListWrap}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No {activeCategory?.name} items found</Text>
            <Text style={styles.emptySubTitle}>
              Click "+ Add Item" above to add new {activeCategory?.name?.toLowerCase()} items.
            </Text>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const isItemActive = p.isActive !== false;
            const variants = p.variants || [];

            let minPrice = 0;
            if (variants.length > 0) {
              const prices = variants.map((v) => getVariantZonePrice(v).price);
              minPrice = Math.min(...prices);
            } else {
              minPrice = p.sellingPrice || p.basePrice || 0;
            }

            const thumbUrl = getProductThumbnail(p.name, p.image || p.imageUrl);

            return (
              <View key={p.id} style={styles.pricingProductCard}>
                {/* TOP HEADER: THUMBNAIL, INFO, ACTIONS */}
                <View style={styles.pricingCardTopRow}>
                  {/* Thumbnail Image */}
                  <Image
                    source={{ uri: thumbUrl }}
                    style={styles.productThumbImg}
                    resizeMode="cover"
                  />

                  {/* Middle Info */}
                  <View style={styles.productInfoCol}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.productTitleText} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <View style={styles.variantCountPill}>
                        <Edit2 size={9} color="#6366F1" style={{ marginRight: 3 }} />
                        <Text style={styles.variantCountPillText}>
                          {variants.length} Variants
                        </Text>
                      </View>
                    </View>

                    <View style={styles.subLocRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLocText}>
                          📍 {currentCity?.name || 'Ahmedabad'}
                        </Text>
                        <Text style={[styles.subLocText, { marginLeft: 14 }]}>
                          • {currentAreaName || 'Satellite'}
                        </Text>
                      </View>
                      <View style={styles.activeStatusPill}>
                        <Text style={styles.activeStatusText}>
                          {isItemActive ? 'Active' : 'Hidden'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.fromPriceRow}>
                      From <Text style={styles.fromPriceVal}>₹{minPrice}</Text> in {currentCity?.name} → {currentAreaName}
                    </Text>
                  </View>

                  {/* Top Right Actions */}
                  <View style={styles.productTopActions}>
                    <TouchableOpacity
                      style={styles.roundActionBtn}
                      onPress={() => handleEditProduct(p)}
                      activeOpacity={0.75}
                    >
                      <Edit2 size={13} color="#4F46E5" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.roundHistoryBtn}
                      onPress={() => handleViewHistory(p)}
                      activeOpacity={0.75}
                    >
                      <RotateCcw size={13} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.roundDeleteBtn}
                      onPress={() => handleDelete(p)}
                      activeOpacity={0.75}
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* VARIANT PRICING TABLE (100% MATCHING SCREENSHOT) */}
                <View style={styles.variantTableWrap}>
                  {/* Table Header */}
                  <View style={styles.variantTableHeaderRow}>
                    <Text style={[styles.variantThText, { flex: 2.1 }]}>PACK / SKU</Text>
                    <Text style={[styles.variantThText, { flex: 1.2, textAlign: 'center' }]}>DEFAULT</Text>
                    <Text style={[styles.variantThText, { flex: 1.4, textAlign: 'center' }]}>AREA PRICE</Text>
                    <Text style={[styles.variantThText, { flex: 1.0, textAlign: 'center' }]}>MRP</Text>
                    <Text style={[styles.variantThText, { flex: 1.3, textAlign: 'center' }]}>ACTION</Text>
                  </View>

                  {/* Variant Rows */}
                  {variants.length === 0 ? (
                    <View style={styles.noVariantsNotice}>
                      <Text style={styles.noVariantsText}>No variants defined for this item.</Text>
                    </View>
                  ) : (
                    variants.map((v) => {
                      const { price: zoneSellingPrice, hasOverride } = getVariantZonePrice(v);
                      return (
                        <View key={v.id} style={styles.variantTableRow}>
                          {/* Pack / SKU */}
                          <View style={{ flex: 2.1, paddingRight: 4 }}>
                            <Text style={styles.variantWeightText}>
                              {v.weightOrVolume}
                            </Text>
                            {v.isDefault && (
                              <Text style={styles.defaultPillText}>(Default)</Text>
                            )}
                            <Text style={styles.variantSkuText} numberOfLines={1}>
                              SKU: {v.sku}
                            </Text>
                          </View>

                          {/* Default Base Price (Touch to Edit) */}
                          <TouchableOpacity
                            style={{ flex: 1.2, alignItems: 'center' }}
                            onPress={() => handleEditVariantPrice(p, v)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.defaultPillBox}>
                              <Text style={styles.defaultPillValText}>₹{v.sellingPrice}</Text>
                            </View>
                            <Text style={styles.baseLabelText}>Catalog{'\n'}Base</Text>
                          </TouchableOpacity>

                          {/* Area Price with Override Pill (Touch to Edit) */}
                          <TouchableOpacity
                            style={{ flex: 1.4, alignItems: 'center' }}
                            onPress={() => handleEditVariantPrice(p, v)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.areaPricePill}>
                              <Text style={styles.areaPricePillText}>₹{zoneSellingPrice}</Text>
                            </View>
                            <Text style={styles.overrideSubText}>
                              {hasOverride ? 'Area\nOverride' : 'Default'}
                            </Text>
                          </TouchableOpacity>

                          {/* MRP (Clean text, Touch to Edit) */}
                          <TouchableOpacity
                            style={{ flex: 1.0, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => handleEditVariantPrice(p, v)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.mrpText}>₹{v.mrp}</Text>
                          </TouchableOpacity>

                          {/* Edit Action Button */}
                          <View style={{ flex: 1.3, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={styles.editActionBtn}
                              onPress={() => handleEditVariantPrice(p, v)}
                              activeOpacity={0.8}
                            >
                              <Edit2 size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                              <Text style={styles.editActionBtnText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 8. BOTTOM FLOATING MULTI-MODE ACTION STRIP */}
      <View style={styles.floatingBottomWrap}>
        <View style={styles.floatingBottomBar}>
          <TouchableOpacity
            style={styles.floatingTabActive}
            onPress={() => setSubView('SingleZonePricing')}
            activeOpacity={0.8}
          >
            <Settings size={14} color="#4F46E5" style={{ marginRight: 5 }} />
            <Text style={styles.floatingTabTextActive}>Single Config</Text>
          </TouchableOpacity>

          <View style={styles.floatingDivider} />

          <TouchableOpacity
            style={styles.floatingTab}
            onPress={() => setActiveModal('CrossZoneMatrix')}
            activeOpacity={0.8}
          >
            <Table size={14} color="#6366F1" style={{ marginRight: 5 }} />
            <Text style={styles.floatingTabText}>Cross-Zone Matrix</Text>
          </TouchableOpacity>

          <View style={styles.floatingDivider} />

          <TouchableOpacity
            style={styles.floatingTab}
            onPress={() => setActiveModal('BulkPriceAdjustment')}
            activeOpacity={0.8}
          >
            <Layers size={14} color="#6366F1" style={{ marginRight: 5 }} />
            <Text style={styles.floatingTabText}>Bulk Adjust</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

      {/* ================= MODAL: SELECT CITY ================= */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MapPin size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Select City</Text>
                  <Text style={styles.modalSubtitle}>Filter pricing areas by city</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search city by name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
                {citySearch ? (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                {activeCities
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      c.code.toLowerCase().includes(citySearch.toLowerCase())
                  )
                  .map((city) => {
                    const isSelected =
                      currentCity?.id === city.id || currentCity?.code === city.code;
                    return (
                      <TouchableOpacity
                        key={city.id || city._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedCityId(city.id || city._id || '');
                          setSelectedAreaId('');
                          setShowCityPicker(false);
                          setCitySearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <View style={styles.cityMiniBadge}>
                            <Text style={styles.cityMiniBadgeText}>{city.code}</Text>
                          </View>
                          <Text
                            style={[
                              styles.modalItemText,
                              isSelected && styles.modalItemTextActive,
                            ]}
                          >
                            {city.name}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SELECT AREA ================= */}
      <Modal
        visible={showAreaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Navigation size={20} color={COLORS.blue} />
                <View>
                  <Text style={styles.modalTitle}>Select Area in {currentCity?.name}</Text>
                  <Text style={styles.modalSubtitle}>Pick an operational area to set dynamic prices</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search area name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={areaSearch}
                  onChangeText={setAreaSearch}
                />
                {areaSearch ? (
                  <TouchableOpacity onPress={() => setAreaSearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                {availableAreas
                  .filter(
                    (a) =>
                      a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
                      (a.code && a.code.toLowerCase().includes(areaSearch.toLowerCase()))
                  )
                  .map((area) => {
                    const isSelected =
                      currentArea?.id === area.id || currentArea?.name === area.name;
                    return (
                      <TouchableOpacity
                        key={area.id || area._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedAreaId(area.id || area._id || '');
                          setSelectedZone(area.name);
                          setShowAreaPicker(false);
                          setAreaSearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <View style={styles.areaMiniDot} />
                          <View>
                            <Text
                              style={[
                                styles.modalItemText,
                                isSelected && styles.modalItemTextActive,
                              ]}
                            >
                              {area.name}
                            </Text>
                            <Text style={styles.modalItemSub}>
                              {area.darkStore || `Wom Up ${area.name} Dark Store`}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: STORE PICKER ================= */}
      <Modal
        visible={showStorePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStorePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Warehouse size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Select Dark Store</Text>
                  <Text style={styles.modalSubtitle}>
                    {areaStores.length} Dark Stores operating in {currentAreaName}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowStorePicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search store name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={storeSearch}
                  onChangeText={setStoreSearch}
                />
                {storeSearch ? (
                  <TouchableOpacity onPress={() => setStoreSearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                {areaStores
                  .filter(
                    (s: any) =>
                      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                      (s.code && s.code.toLowerCase().includes(storeSearch.toLowerCase()))
                  )
                  .map((store: any) => {
                    const isSelected =
                      selectedStore?.id === store.id || (selectedStore as any)?._id === store._id || selectedStore?.name === store.name;
                    return (
                      <TouchableOpacity
                        key={store.id || store._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedStoreId(String(store.id || store._id));
                          setShowStorePicker(false);
                          setStoreSearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <View style={styles.areaMiniDot} />
                          <View>
                            <Text
                              style={[
                                styles.modalItemText,
                                isSelected && styles.modalItemTextActive,
                              ]}
                            >
                              {store.name}
                            </Text>
                            <Text style={styles.modalItemSub}>
                              Code: {store.code || store.loginId} · SLA: {store.estimatedDeliveryMinutes || 9}m
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderRow: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cascadingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  cascadingRowMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  cascadingCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cascadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledBtn: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  cascadingBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 4,
  },
  cascadingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  autoStoreCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    marginBottom: SPACING.sm,
  },
  autoStoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  autoStoreBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  autoStoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoStoreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  autoStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  autoStoreSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabsBreadcrumbRow: {
    paddingVertical: 5,
    marginBottom: 4,
  },
  tabsBreadcrumbText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },
  productBreadcrumb: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 100,
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
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  expandIconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  productNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  variantCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  variantCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
    gap: 6,
  },
  fromPriceText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fromPriceBold: {
    fontWeight: '800',
    color: COLORS.purple,
  },
  metaDot: {
    fontSize: 10,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  masterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  variantsContainer: {
    backgroundColor: '#FAFAFA',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noVariantsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.sm,
  },
  noVariantsText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  variantTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  variantColHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  legacyVariantWeightText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  defaultLabel: {
    fontSize: 9.5,
    color: COLORS.purple,
    fontWeight: '800',
  },
  legacyVariantSkuText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  defaultPriceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaultPriceSub: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  zonePriceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  overrideBadge: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  noOverrideBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  zonePriceValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  overridePriceText: {
    color: COLORS.purple,
  },
  noOverridePriceText: {
    color: COLORS.textPrimary,
  },
  overrideLabel: {
    fontSize: 8,
    marginTop: 2,
  },
  overrideLabelActive: {
    color: COLORS.purple,
    fontWeight: '700',
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
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    minWidth: 38,
  },
  editVariantBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerActions: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.sm,
  },
  subActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FAF5FF',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  subActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modalBody: {
    padding: SPACING.md,
  },
  searchInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInnerInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#FAF5FF',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityMiniBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  areaMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  modalItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Exact 1:1 Area Dynamic Pricing Styles Matching Screenshot
  mainScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 110,
    backgroundColor: '#F8FAFC',
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '500',
  },
  selectorsSection: {
    gap: 10,
    marginBottom: 14,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorIcon: {
    marginRight: 2,
  },
  selectorStepLabel: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedStoreCard: {
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  selectedStoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedStoreIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  selectedStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
    flex: 1,
  },
  selectedStorePill: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectedStorePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  selectedStoreTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginLeft: 44,
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  storeTagText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  storeHubTag: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  storeHubTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DB2777',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  categoryTabPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
  },
  categoryTabPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  categoryChevronBox: {
    paddingLeft: 4,
    paddingRight: 2,
    justifyContent: 'center',
  },
  catalogHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#071B52',
  },
  catalogSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addCatalogItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addCatalogItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productsListWrap: {
    gap: 14,
    marginBottom: 20,
  },
  pricingProductCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pricingCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productThumbImg: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  productInfoCol: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 4,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  variantCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  variantCountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  subLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  subLocText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 15,
  },
  activeStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  fromPriceRow: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    fontWeight: '500',
  },
  fromPriceVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  productTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roundActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundHistoryBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantTableWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  variantTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  variantThText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  variantTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  variantWeightText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  defaultPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 1,
  },
  variantSkuText: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  defaultPillBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPillValText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  baseLabelText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 2,
  },
  areaPricePill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaPricePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  overrideSubText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#4F46E5',
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 2,
  },
  mrpText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 7,
  },
  editActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingBottomWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
    width: '100%',
  },
  floatingBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 30,
    paddingHorizontal: 4,
    paddingVertical: 4,
    maxWidth: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  floatingTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  floatingTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  floatingTabTextActive: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4F46E5',
  },
  floatingDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 1,
  },
});
