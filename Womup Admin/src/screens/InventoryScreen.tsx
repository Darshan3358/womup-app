import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  Warehouse,
  Package,
  MapPin,
  Navigation,
  Check,
  Search,
  X,
  Lock,
  Layers,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { InventoryItem, Zone, CityItem, DarkStoreItem } from '../types/admin';

export const InventoryScreen: React.FC = () => {
  const {
    inventory,
    darkStores,
    selectedDarkStore,
    setSelectedDarkStore,
    cities,
    zones,
    products,
    setActiveModal,
    updateShelfLocation,
  } = useAdminState();

  const [activeTab, setActiveTab] = useState<'All Items' | 'Low Stock' | 'Expired'>('All Items');

  // Cascading City & Area Selection States
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // Shelf Editing States
  const [editingShelfItem, setEditingShelfItem] = useState<InventoryItem | null>(null);
  const [shelfInput, setShelfInput] = useState('');
  const [isSavingShelf, setIsSavingShelf] = useState(false);
  const [shelfSuccessMsg, setShelfSuccessMsg] = useState('');

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
    availableAreas[0];

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

  const currentStoreId = resolvedStore?.id;
  const currentStoreName = resolvedStore?.name || selectedDarkStore || 'Dark Store Hub';

  // Automatically sync with global context when resolvedStore changes
  useEffect(() => {
    if (resolvedStore && resolvedStore.name && selectedDarkStore !== resolvedStore.name) {
      setSelectedDarkStore(resolvedStore.name);
    }
  }, [resolvedStore, selectedDarkStore, setSelectedDarkStore]);

  // Filter inventory strictly by the selected dark store warehouse
  const storeInventory = inventory.filter((item) => {
    if (currentStoreId && (item.darkStoreId === currentStoreId || (item as any).warehouseId === currentStoreId)) {
      return true;
    }
    if (item.darkStoreName && currentStoreName) {
      return item.darkStoreName.trim().toLowerCase() === currentStoreName.trim().toLowerCase();
    }
    return false;
  });

  // Calculate real stock metrics for the selected warehouse
  const totalAvailableStock = storeInventory.reduce((sum, i) => sum + (Number(i.availableKg) || 0), 0);
  const totalReservedStock = storeInventory.reduce((sum, i) => sum + (Number(i.reservedKg) || 0), 0);
  const totalStockQuantity = totalAvailableStock + totalReservedStock;

  // Real Low Stock & Expired counts
  const lowStockItems = storeInventory.filter(
    (i) =>
      i.status === 'Low Stock' ||
      ((i.availableKg <= (i.lowStockThreshold || 15)) && i.status !== 'Expired')
  );
  const lowStockCount = lowStockItems.length;

  const expiredItems = storeInventory.filter(
    (i) =>
      i.status === 'Expired' ||
      (i.expiryDate && new Date(i.expiryDate).getTime() < Date.now())
  );
  const expiredCount = expiredItems.length;

  // Tab Filtering
  const filteredInventory = storeInventory.filter((item) => {
    if (activeTab === 'Low Stock') {
      return (
        item.status === 'Low Stock' ||
        (item.availableKg <= (item.lowStockThreshold || 15) && item.status !== 'Expired')
      );
    }
    if (activeTab === 'Expired') {
      return (
        item.status === 'Expired' ||
        (item.expiryDate && new Date(item.expiryDate).getTime() < Date.now())
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* City → Area → Store Cascading Control Header */}
      <View style={styles.topSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Warehouse Inventory Control</Text>
          <Text style={styles.sectionSubtitle}>
            Filter by City & Area — inventory automatically syncs to that zone's 1:1 Dark Store
          </Text>
        </View>

        {/* Cascading Selector: City (1) + Area (2) */}
        <View style={styles.cascadingRow}>
          {/* City Selector */}
          <View style={styles.cascadingCol}>
            <Text style={styles.inputLabel}>1. SELECT CITY</Text>
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

          {/* Area Selector (Cascaded from City) */}
          <View style={styles.cascadingCol}>
            <Text style={styles.inputLabel}>2. SELECT AREA (1:1 STORE)</Text>
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
                  {currentArea ? currentArea.name : availableAreas.length === 0 ? 'No Areas Configured' : 'Select Area'}
                </Text>
              </View>
              <ChevronDown size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Auto-Resolved Store Info Banner */}
        <View style={styles.resolvedStoreCard}>
          <View style={styles.resolvedStoreLeft}>
            <View style={styles.storeIconBadge}>
              <Warehouse size={18} color={COLORS.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.resolvedStoreTitleRow}>
                <Text style={styles.resolvedStoreName} numberOfLines={1}>
                  {currentStoreName}
                </Text>
                <View style={styles.lockBadge}>
                  <Lock size={10} color="#047857" style={{ marginRight: 3 }} />
                  <Text style={styles.lockBadgeText}>1:1 AREA LOCKED</Text>
                </View>
              </View>
              <Text style={styles.resolvedStoreMeta}>
                📍 Area: <Text style={{ fontWeight: '700', color: COLORS.navy }}>{currentArea?.name || resolvedStore?.areaName || 'Zone'}</Text> • City: <Text style={{ fontWeight: '700', color: COLORS.navy }}>{currentCity?.name || resolvedStore?.cityName || 'City'}</Text> • ID: <Text style={{ fontWeight: '700', color: COLORS.purple }}>{resolvedStore?.loginId || resolvedStore?.code}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* KPI Cards: Total Stock, Available, Reserved */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Stock</Text>
            <Text style={styles.kpiValue}>
              {totalStockQuantity.toLocaleString()} kg
            </Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Text style={[styles.kpiLabel, { color: '#047857' }]}>Available</Text>
            <Text style={[styles.kpiValue, { color: '#065F46' }]}>
              {totalAvailableStock.toLocaleString()} kg
            </Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: COLORS.lightBlueLavender }]}>
            <Text style={styles.kpiLabel}>Reserved</Text>
            <Text style={[styles.kpiValue, { color: COLORS.purple }]}>
              {totalReservedStock.toLocaleString()} kg
            </Text>
          </View>
        </View>

        {/* Low-stock Warning Banner */}
        {lowStockCount > 0 && (
          <View style={styles.warningBanner}>
            <AlertTriangle size={18} color={COLORS.warning} style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              <Text style={{ fontWeight: '700' }}>Low Stock Alert:</Text> {lowStockCount} items need replenishment
            </Text>
          </View>
        )}

        {/* Real Dynamic Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: 'All Items', label: `All Items (${storeInventory.length})` },
            { key: 'Low Stock', label: `Low Stock (${lowStockCount})` },
            { key: 'Expired', label: `Expired (${expiredCount})` },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isSelected && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.activeTabBtnText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Inventory Items List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={40} color={COLORS.border} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No items in {activeTab}</Text>
            <Text style={styles.emptySubTitle}>
              {activeTab === 'All Items'
                ? `No inventory items are registered for ${currentStoreName}.`
                : activeTab === 'Low Stock'
                ? `All items in ${currentStoreName} have healthy inventory levels.`
                : `No expired batches found in ${currentStoreName}.`}
            </Text>
          </View>
        ) : (
          filteredInventory.map((item) => {
            // Dynamic resolution: productId -> products.name; variantId -> weightOrVolume & sku
            const resolvedProduct = products.find(
              (p) => p.id === item.productId || (item.productId && p.id.toString() === item.productId.toString())
            );
            const resolvedVariant = resolvedProduct?.variants?.find(
              (v) =>
                v.id === item.variantId ||
                (item.variantId && v.id.toString() === item.variantId.toString()) ||
                (item.sku && v.sku === item.sku)
            );

            // Never fallback to "Fresh Produce Item"
            const displayName = resolvedProduct?.name || (item.name !== 'Fresh Produce Item' ? item.name : 'Fresh Produce');
            const displayPackSize = resolvedVariant?.weightOrVolume || item.packSize || '1 unit';
            const displaySku = resolvedVariant?.sku || item.sku || (item.id ? `SKU: ${item.id.slice(-6)}` : '');
            const displayStore = item.darkStoreName || currentStoreName;

            // Resolved Status
            const isItemExpired =
              item.status === 'Expired' ||
              (item.expiryDate && new Date(item.expiryDate).getTime() < Date.now());
            const isItemLow = !isItemExpired && (item.availableKg <= (item.lowStockThreshold || 15) || item.status === 'Low Stock');
            const itemStatus = isItemExpired ? 'Expired' : (isItemLow ? 'Low Stock' : 'Healthy');

            return (
              <View key={item.id} style={styles.itemCard}>
                {/* Header Row: Product Name + Health Status */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      itemStatus === 'Healthy' && styles.statusHealthy,
                      itemStatus === 'Low Stock' && styles.statusLow,
                      itemStatus === 'Expired' && styles.statusExpired,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        itemStatus === 'Healthy' && { backgroundColor: COLORS.success },
                        itemStatus === 'Low Stock' && { backgroundColor: '#D97706' },
                        itemStatus === 'Expired' && { backgroundColor: COLORS.error },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        itemStatus === 'Healthy' && { color: COLORS.success },
                        itemStatus === 'Low Stock' && { color: '#B45309' },
                        itemStatus === 'Expired' && { color: COLORS.error },
                      ]}
                    >
                      {itemStatus}
                    </Text>
                  </View>
                </View>

                {/* Variant & SKU Details */}
                <Text style={styles.variantSkuText}>
                  {displayPackSize} {displaySku ? `· SKU: ${displaySku}` : ''}
                </Text>

                {/* Dark Store Identification */}
                <View style={styles.storeLabelRow}>
                  <Warehouse size={13} color={COLORS.textMuted} style={{ marginRight: 5 }} />
                  <Text style={styles.storeLabelText} numberOfLines={1}>
                    {displayStore}
                  </Text>
                </View>

                {/* Shelf Location Slot & Quick Edit */}
                <View style={styles.shelfRow}>
                  <View style={styles.shelfInfoRow}>
                    <Layers size={13} color={item.shelfLocation ? COLORS.purple : COLORS.textMuted} style={{ marginRight: 5 }} />
                    <Text style={styles.shelfLabel}>
                      Shelf:{' '}
                      <Text style={item.shelfLocation ? styles.shelfValueActive : styles.shelfValueEmpty}>
                        {item.shelfLocation || 'Not set'}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editShelfBtn}
                    onPress={() => {
                      setEditingShelfItem(item);
                      setShelfInput(item.shelfLocation || '');
                      setShelfSuccessMsg('');
                    }}
                  >
                    <Text style={styles.editShelfBtnText}>
                      {item.shelfLocation ? 'Edit Shelf' : '+ Assign Shelf'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Stock Details Row */}
                <View style={styles.stockDetailsRow}>
                  <View style={styles.stockCol}>
                    <Text style={styles.stockColLabel}>Available</Text>
                    <Text style={styles.availableQtyText}>{item.availableKg} kg</Text>
                  </View>

                  <View style={styles.stockCol}>
                    <Text style={styles.stockColLabel}>Reserved</Text>
                    <Text style={styles.reservedQtyText}>{item.reservedKg} kg</Text>
                  </View>

                  <View style={styles.stockCol}>
                    <Text style={styles.stockColLabel}>Total</Text>
                    <Text style={styles.totalQtyText}>
                      {(item.availableKg || 0) + (item.reservedKg || 0)} kg
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB: Discrepancy / Spoilage */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setActiveModal('StockDiscrepancy')}
        activeOpacity={0.9}
      >
        <PlusCircle size={20} color={COLORS.white} />
        <Text style={styles.fabText}>Report Loss / Spoilage</Text>
      </TouchableOpacity>

      {/* ================= MODAL: ASSIGN / EDIT SHELF ================= */}
      <Modal
        visible={Boolean(editingShelfItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingShelfItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Layers size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.modalTitle}>Assign Shelf Location</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editingShelfItem?.name} ({editingShelfItem?.darkStoreName || 'Dark Store'})
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setEditingShelfItem(null)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.shelfInputLabel}>Shelf / Bin Coordinate (e.g. A3-R2, B1-04, COOLER-1)</Text>
              <TextInput
                style={styles.shelfTextInput}
                placeholder="Enter shelf location (e.g. A3-R2)"
                placeholderTextColor={COLORS.textMuted}
                value={shelfInput}
                onChangeText={(text) => setShelfInput(text.toUpperCase())}
                autoCapitalize="characters"
                autoFocus
              />

              {shelfSuccessMsg ? (
                <Text style={styles.shelfSuccessText}>{shelfSuccessMsg}</Text>
              ) : null}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditingShelfItem(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveShelfBtn, isSavingShelf && { opacity: 0.7 }]}
                  disabled={isSavingShelf}
                  onPress={async () => {
                    if (!editingShelfItem) return;
                    setIsSavingShelf(true);
                    try {
                      const res = await updateShelfLocation({
                        inventoryId: editingShelfItem.id,
                        storeId: editingShelfItem.darkStoreId,
                        productId: editingShelfItem.productId,
                        shelfLocation: shelfInput.trim().toUpperCase(),
                      });
                      if (res.success) {
                        setShelfSuccessMsg('Shelf updated successfully!');
                        setTimeout(() => {
                          setEditingShelfItem(null);
                          setIsSavingShelf(false);
                          setShelfSuccessMsg('');
                        }, 500);
                      } else {
                        setIsSavingShelf(false);
                        alert(res.error || 'Failed to update shelf');
                      }
                    } catch {
                      setIsSavingShelf(false);
                    }
                  }}
                >
                  <Text style={styles.saveShelfBtnText}>
                    {isSavingShelf ? 'Saving...' : 'Save Shelf'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                  <Text style={styles.modalSubtitle}>Filter dark store warehouses by city</Text>
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

      {/* ================= MODAL: SELECT AREA (1:1 STORE) ================= */}
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
                  <Text style={styles.modalTitle}>Select Area (1:1 Store)</Text>
                  <Text style={styles.modalSubtitle}>
                    Scoped to {currentCity?.name || 'City'} areas
                  </Text>
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
                  placeholder="Search area..."
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
                  .filter((a) => a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                  .map((area) => {
                    const isSelected =
                      currentArea?.id === area.id || currentArea?.name === area.name;
                    const assignedStoreName =
                      area.assignedStore?.name || area.darkStore || 'Active Hub';
                    return (
                      <TouchableOpacity
                        key={area.id || area._id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedAreaId(area.id || area._id || '');
                          setShowAreaPicker(false);
                          setAreaSearch('');
                        }}
                      >
                        <View style={styles.modalItemLeft}>
                          <Lock
                            size={15}
                            color={isSelected ? COLORS.purple : COLORS.textMuted}
                          />
                          <View style={{ marginLeft: 8 }}>
                            <Text
                              style={[
                                styles.modalItemText,
                                isSelected && styles.modalItemTextActive,
                              ]}
                            >
                              {area.name}
                            </Text>
                            <Text style={styles.modalItemSub}>
                              🏪 {assignedStoreName}
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
    zIndex: 10,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cascadingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cascadingCol: {
    flex: 1,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cascadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
  cascadingBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  cascadingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  modalBody: {
    padding: SPACING.md,
  },
  modalScroll: {
    maxHeight: 340,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#ECEAF3',
  },
  modalItemActive: {
    backgroundColor: '#F3F0FA',
    borderColor: COLORS.purple,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.purple,
  },
  modalItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  searchInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 6,
  },
  searchInnerInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    padding: 0,
  },
  pickerScroll: {
    maxHeight: 220,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  pickerItemActive: {
    backgroundColor: '#EEF2FF',
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  pickerItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  cityMiniBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cityMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  resolvedStoreCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.input,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  resolvedStoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resolvedStoreTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resolvedStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    flexShrink: 1,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  resolvedStoreMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: 6,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F1B562',
  },
  warningText: {
    fontSize: 12,
    color: '#8A5D00',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabBtn: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activeTabBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
    marginRight: 8,
  },
  variantSkuText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  storeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  storeLabelText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  stockDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockCol: {
    flex: 1,
  },
  stockColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availableQtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 2,
  },
  reservedQtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  totalQtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusHealthy: {
    backgroundColor: '#ECFDF5',
  },
  statusLow: {
    backgroundColor: '#FFFBEB',
  },
  statusExpired: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    elevation: 6,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  emptySubTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Shelf Location Styles
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  shelfInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shelfLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  shelfValueActive: {
    color: '#7C3AED',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shelfValueEmpty: {
    color: '#94A3B8',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  editShelfBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  editShelfBtnText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
  },
  shelfInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  shelfTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  shelfSuccessText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  saveShelfBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
  },
  saveShelfBtnText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
  },
});
