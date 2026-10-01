import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
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
  MapPin,
  Navigation,
  Warehouse,
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

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

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

  // 3. Auto-Select the ONE Dark Store assigned to this area (1-store-per-area rule)
  const resolvedStore = darkStores.find((s) => {
    if (currentArea) {
      const areaIdStr = currentArea.id || currentArea._id;
      if (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) return true;
      if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
      if (currentArea.assignedStore && (s.id === currentArea.assignedStore.id || s.code === currentArea.assignedStore.code)) return true;
      if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
    }
    return false;
  }) || (currentCity ? darkStores.find(s => (s.cityName || s.city || '').toLowerCase() === currentCity.name.toLowerCase()) : null) || darkStores[0];

  const currentStoreName = resolvedStore?.name || currentArea?.darkStore || `Wom Up ${currentArea?.name || 'Area'} Dark Store`;

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

  return (
    <View style={styles.container}>
      {/* City -> Area Cascading Controls Header */}
      <View style={styles.topSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>💰 Area Dynamic Pricing</Text>
          <Text style={styles.sectionSubtitle}>
            Configure hyper-local selling prices per Area (cascades from City)
          </Text>
        </View>

        {/* Cascading 2-Step Selector */}
        <View style={styles.cascadingRow}>
          {/* STEP 1: SELECT CITY */}
          <View style={styles.cascadingCol}>
            <Text style={styles.inputLabel}>STEP 1: SELECT CITY</Text>
            <TouchableOpacity
              style={styles.cascadingBtn}
              onPress={() => setShowCityPicker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.cascadingBtnLeft}>
                <MapPin size={16} color={COLORS.purple} />
                <Text style={styles.cascadingBtnText} numberOfLines={1}>
                  {currentCity ? `${currentCity.name} (${currentCity.code})` : 'Select City'}
                </Text>
              </View>
              <ChevronDown size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* STEP 2: SELECT AREA */}
          <View style={styles.cascadingCol}>
            <Text style={styles.inputLabel}>STEP 2: SELECT AREA</Text>
            <TouchableOpacity
              style={[styles.cascadingBtn, availableAreas.length === 0 && styles.disabledBtn]}
              onPress={() => {
                if (availableAreas.length === 0) return;
                setShowAreaPicker(true);
              }}
              activeOpacity={0.8}
              disabled={availableAreas.length === 0}
            >
              <View style={styles.cascadingBtnLeft}>
                <Navigation size={16} color={COLORS.blue} />
                <Text style={styles.cascadingBtnText} numberOfLines={1}>
                  {currentArea ? currentArea.name : availableAreas.length === 0 ? 'No Areas Found' : 'Select Area'}
                </Text>
              </View>
              <ChevronDown size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fulfilling Store (auto-selected) */}
        <View style={styles.autoStoreCard}>
          <Text style={styles.autoStoreLabel}>Fulfilling Store (auto-selected):</Text>
          <View style={styles.autoStoreBox}>
            <View style={styles.autoStoreLeft}>
              <View style={styles.storeIconBadge}>
                <Warehouse size={18} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.autoStoreTitleRow}>
                  <Text style={styles.autoStoreName} numberOfLines={1}>
                    {currentStoreName}
                  </Text>
                  <View style={styles.lockBadge}>
                    <Lock size={10} color="#047857" style={{ marginRight: 3 }} />
                    <Text style={styles.lockBadgeText}>
                      1:1 AREA LOCKED · {currentCity?.name || 'Active City'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.autoStoreSubText}>
                  Bound to area: <Text style={{ fontWeight: '700', color: COLORS.navy }}>{currentAreaName}</Text> ({currentCity?.name})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Small Breadcrumb above Category Tabs */}
        <View style={styles.tabsBreadcrumbRow}>
          <Text style={styles.tabsBreadcrumbText}>
            🏙️ {currentCity?.name} · 📍 {currentAreaName}
          </Text>
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

      {/* Sub Header / Catalog & Add Item Action Bar */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.catalogHeading}>{activeCategory?.name || 'Category'} Catalog</Text>
          <Text style={styles.catalogSubHeading}>
            {filteredProducts.length} products configured for {currentAreaName} ({currentCity?.name})
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
              Click "+ Add Item" above to add new {activeCategory?.name?.toLowerCase()} items to the catalog.
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

            // Calculate "From ₹X" minimum price across variants for this area
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

                      {/* City · Area Sub-label */}
                      <Text style={styles.productBreadcrumb}>
                        {currentCity?.name} · {currentAreaName}
                      </Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.fromPriceText}>
                          From <Text style={styles.fromPriceBold}>₹{minPrice}</Text> in {currentCity?.name} → {currentAreaName}
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
                          <Text style={[styles.variantColHeader, { flex: 2 }]}>PACK / SKU</Text>
                          <Text style={[styles.variantColHeader, { flex: 1.2, textAlign: 'center' }]}>
                            DEFAULT PRICE
                          </Text>
                          <Text style={[styles.variantColHeader, { flex: 1.8, textAlign: 'center' }]}>
                            AREA PRICE
                          </Text>
                          <Text style={[styles.variantColHeader, { flex: 1, textAlign: 'center' }]}>MRP</Text>
                          <Text style={[styles.variantColHeader, { flex: 1, textAlign: 'center' }]}>ACTION</Text>
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

                              {/* Base/Default Price */}
                              <View style={{ flex: 1.2, alignItems: 'center' }}>
                                <Text style={styles.defaultPriceValue}>₹{v.sellingPrice}</Text>
                                <Text style={styles.defaultPriceSub}>Catalog Base</Text>
                              </View>

                              {/* Final Area Selling Price */}
                              <View style={{ flex: 1.8, alignItems: 'center' }}>
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
                                  {hasOverride ? 'Area Override' : 'Default'}
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
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  variantColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  variantWeightText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaultLabel: {
    fontSize: 10,
    color: COLORS.purple,
    fontWeight: '800',
  },
  variantSkuText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  defaultPriceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaultPriceSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  zonePriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 9,
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
    backgroundColor: COLORS.purple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
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
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
});
