import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { InventoryItem } from '../../types/store.types';
import { StockAdjustmentModal } from '../../components/modals/StockAdjustmentModal';
import { EditShelfModal } from '../../components/modals/EditShelfModal';
import { COLORS } from '../../theme/colors';

export const ST12_InventoryScreen: React.FC = () => {
  const {
    inventory,
    inventoryFilter,
    setInventoryFilter,
    inventorySearch,
    setInventorySearch,
    adjustStock,
    updateShelfLocation,
    refreshInventory,
    setSubScreen,
    isLoading,
  } = useStore();

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [editShelfItem, setEditShelfItem] = useState<InventoryItem | null>(null);
  const [editShelfVisible, setEditShelfVisible] = useState(false);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenEditShelf = (item: InventoryItem) => {
    setEditShelfItem(item);
    setEditShelfVisible(true);
  };

  const handleConfirmAdjust = async (delta: number, reason: string, changeType: string) => {
    if (!selectedItem) return;
    await adjustStock(selectedItem.productId, delta, reason, changeType);
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={inventorySearch}
            onChangeText={setInventorySearch}
            placeholder="Search SKU, product or barcode..."
            placeholderTextColor={COLORS.textMuted}
          />
          {Boolean(inventorySearch) && (
            <TouchableOpacity onPress={() => setInventorySearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addProductBtn}
          onPress={() => setSubScreen('AddProduct')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={16} color="#FFF" />
          <Text style={styles.addProductBtnText}>ADD ITEM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logsBtn}
          onPress={() => setSubScreen('InventoryLogs')}
        >
          <Ionicons name="time" size={16} color={COLORS.accentCyan} />
          <Text style={styles.logsBtnText}>LOGS</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'low', 'oos'] as const).map((f) => {
          const isSelected = inventoryFilter === f;
          const label = f === 'all' ? 'All Stock' : f === 'low' ? 'Low Stock (≤5)' : 'Out of Stock';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setInventoryFilter(f)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Inventory List */}
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshInventory} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => {
          const isUnassigned = !item.shelfLocation || item.shelfLocation === 'UNASSIGNED' || item.shelfLocation === 'Not set';
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                {/* Shelf Location Tag */}
                <View style={[styles.shelfTag, isUnassigned && styles.shelfTagUnassigned]}>
                  <Ionicons
                    name={isUnassigned ? 'alert-circle' : 'location'}
                    size={11}
                    color={isUnassigned ? COLORS.danger : COLORS.shelfBadgeText}
                  />
                  <Text style={[styles.shelfTagText, isUnassigned && styles.shelfTagTextUnassigned]}>
                    {isUnassigned ? 'Not set' : item.shelfLocation}
                  </Text>
                </View>

                {/* Product Name & Brand */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand || 'Wom Up'} • ₹{item.sellingPrice}</Text>
                </View>

                {/* Action Buttons: ADJUST & EDIT SHELF */}
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => handleOpenAdjust(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={13} color="#FFF" />
                    <Text style={styles.adjustBtnText}>ADJUST</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.editShelfBtn, isUnassigned && styles.editShelfBtnHighlight]}
                    onPress={() => handleOpenEditShelf(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={isUnassigned ? COLORS.warning : COLORS.accentCyan}
                    />
                    <Text
                      style={[
                        styles.editShelfBtnText,
                        isUnassigned && { color: COLORS.warning },
                      ]}
                    >
                      EDIT SHELF
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stock Metric Row */}
              <View style={styles.stockRow}>
                <View style={styles.stockCol}>
                  <Text style={styles.stockLabel}>Available</Text>
                  <Text
                    style={[
                      styles.stockValue,
                      item.availableQty === 0
                        ? styles.stockOOS
                        : item.availableQty <= item.threshold
                        ? styles.stockLow
                        : styles.stockNormal,
                    ]}
                  >
                    {item.availableQty} units
                  </Text>
                </View>

                <View style={styles.stockCol}>
                  <Text style={styles.stockLabel}>Reserved</Text>
                  <Text style={styles.stockValue}>{item.reservedQty || 0} units</Text>
                </View>

                <View style={styles.stockCol}>
                  <Text style={styles.stockLabel}>Threshold</Text>
                  <Text style={styles.stockValue}>{item.threshold || 5} units</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Matching Inventory</Text>
            <Text style={styles.emptyDesc}>
              No items found matching the current search or filter.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setSubScreen('AddProduct')}
            >
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onConfirm={handleConfirmAdjust}
      />

      {/* Edit Shelf Location Modal */}
      <EditShelfModal
        visible={editShelfVisible}
        onClose={() => setEditShelfVisible(false)}
        item={editShelfItem}
        onSave={updateShelfLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addProductBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  logsBtnText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  shelfTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.shelfBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shelfTagUnassigned: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  shelfTagText: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  shelfTagTextUnassigned: {
    color: COLORS.danger,
    fontFamily: 'monospace',
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemBrand: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 3,
  },
  adjustBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  editShelfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  editShelfBtnHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  editShelfBtnText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  stockCol: {
    alignItems: 'center',
  },
  stockLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  stockValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  stockNormal: {
    color: COLORS.primary,
  },
  stockLow: {
    color: COLORS.warning,
  },
  stockOOS: {
    color: COLORS.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
