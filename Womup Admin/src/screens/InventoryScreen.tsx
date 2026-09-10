import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  Warehouse,
  Package,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { InventoryItem } from '../types/admin';

export const InventoryScreen: React.FC = () => {
  const {
    inventory,
    darkStores,
    selectedDarkStore,
    setSelectedDarkStore,
    zones,
    products,
    setActiveModal,
  } = useAdminState();

  const [activeTab, setActiveTab] = useState<'All Items' | 'Low Stock' | 'Expired'>('All Items');
  const [showStorePicker, setShowStorePicker] = useState(false);

  // Build full dark store list from MongoDB stores collection with zones fallback
  const storeList: { id: string; name: string; code?: string; areaName?: string }[] =
    darkStores.length > 0
      ? darkStores
      : [
          {
            id: 'central_store',
            name: 'Wom Up Ahmedabad Central Dark Store',
            code: 'DARK-STORE-01',
          },
          ...zones.map((z) => ({
            id: z.id,
            name: z.darkStore || `Wom Up ${z.name} Dark Store`,
            code: z.code ? `STORE-${z.code}` : undefined,
            areaName: z.name,
          })),
        ];

  // Currently selected store object
  const currentStore =
    storeList.find(
      (s) =>
        s.name.trim().toLowerCase() === selectedDarkStore.trim().toLowerCase() ||
        s.id === selectedDarkStore
    ) || storeList[0];

  const currentStoreId = currentStore?.id;
  const currentStoreName = currentStore?.name || selectedDarkStore;

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
      {/* Dark Store Selector */}
      <View style={styles.topSection}>
        <Text style={styles.sectionLabel}>Select Dark Store Warehouse</Text>
        <TouchableOpacity
          style={styles.storeDropdown}
          onPress={() => setShowStorePicker(!showStorePicker)}
        >
          <View style={styles.storeDropdownLeft}>
            <Warehouse size={18} color={COLORS.purple} style={{ marginRight: 8 }} />
            <Text style={styles.storeDropdownText} numberOfLines={1}>
              {currentStoreName}
            </Text>
          </View>
          <ChevronDown size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {showStorePicker && (
          <View style={styles.storePickerMenu}>
            <ScrollView style={styles.storePickerScroll} nestedScrollEnabled={true}>
              {storeList.map((store) => {
                const isSelected =
                  currentStoreName.trim().toLowerCase() === store.name.trim().toLowerCase();
                return (
                  <TouchableOpacity
                    key={store.id}
                    style={[
                      styles.storePickerItem,
                      isSelected && styles.storePickerItemActive,
                    ]}
                    onPress={() => {
                      setSelectedDarkStore(store.name);
                      setShowStorePicker(false);
                    }}
                  >
                    <View style={styles.storePickerRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={[
                            styles.storePickerText,
                            isSelected && styles.storePickerTextActive,
                          ]}
                        >
                          {store.name}
                        </Text>
                        {store.code ? (
                          <Text style={styles.storePickerCode}>
                            {store.code} {store.areaName ? `• ${store.areaName}` : ''}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <CheckCircle size={16} color={COLORS.purple} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  storeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  storeDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  storeDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  storePickerMenu: {
    position: 'absolute',
    top: 76,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 30,
  },
  storePickerScroll: {
    maxHeight: 280,
  },
  storePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storePickerItemActive: {
    backgroundColor: '#EEF2FF',
  },
  storePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storePickerText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  storePickerTextActive: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  storePickerCode: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
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
});
