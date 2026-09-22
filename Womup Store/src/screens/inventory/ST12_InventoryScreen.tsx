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
import { COLORS } from '../../theme/colors';

export const ST12_InventoryScreen: React.FC = () => {
  const {
    inventory,
    inventoryFilter,
    setInventoryFilter,
    inventorySearch,
    setInventorySearch,
    adjustStock,
    refreshInventory,
    setSubScreen,
    isLoading,
  } = useStore();

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
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
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.shelfTag}>
                <Text style={styles.shelfTagText}>{item.shelfLocation || 'A2-R3'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemBrand}>{item.brand || 'Worm Up'} • ₹{item.sellingPrice}</Text>
              </View>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => handleOpenAdjust(item)}
              >
                <Ionicons name="create-outline" size={14} color="#FFF" />
                <Text style={styles.adjustBtnText}>ADJUST</Text>
              </TouchableOpacity>
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
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Matching Inventory</Text>
            <Text style={styles.emptyDesc}>
              No items found matching the current search or filter.
            </Text>
          </View>
        }
      />

      {/* Adjustment Modal */}
      <StockAdjustmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onConfirm={handleConfirmAdjust}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
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
  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 12,
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
    backgroundColor: COLORS.shelfBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shelfTagText: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '800',
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
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  adjustBtnText: {
    color: '#FFF',
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
    paddingVertical: 60,
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
  },
});
