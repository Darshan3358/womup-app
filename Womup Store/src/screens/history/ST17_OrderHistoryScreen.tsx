import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ST17_OrderHistoryScreen: React.FC = () => {
  const { completedOrders, refreshCompletedOrders, isLoading, store } = useStore();
  const [filterTab, setFilterTab] = useState<'ALL' | 'TODAY' | 'EARLIER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    refreshCompletedOrders();
  }, [refreshCompletedOrders]);

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  // Filter orders by date and search
  const filteredOrders = completedOrders.filter((order) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = (order.orderNumber || '').toLowerCase().includes(q);
      const matchCust = (order.customerName || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some((it: any) => (it.name || '').toLowerCase().includes(q));
      if (!matchNum && !matchCust && !matchItems) return false;
    }

    if (filterTab === 'ALL') return true;

    const orderDate = new Date(order.deliveredAt || order.createdAt || Date.now());
    const today = new Date();
    const isToday =
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear();

    if (filterTab === 'TODAY') return isToday;
    if (filterTab === 'EARLIER') return !isToday;

    return true;
  });

  const formatDeliveredTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeString}`;
    }
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeString}`;
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.screenTitle}>Completed Orders</Text>
          <Text style={styles.screenSubtitle}>
            Fulfillment history for {areaName} · {cityName}
          </Text>
        </View>

        <View style={styles.deliveredCountBadge}>
          <Ionicons name="checkmark-done" size={13} color={COLORS.primary} />
          <Text style={styles.deliveredCountText}>{completedOrders.length} DELIVERED</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order #, customer, or product..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'TODAY', 'EARLIER'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filterTab === tab && styles.filterChipActive]}
            onPress={() => setFilterTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterTab === tab && styles.filterChipTextActive]}>
              {tab === 'ALL' ? `ALL (${completedOrders.length})` : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshCompletedOrders}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.orderId;
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => toggleExpand(item.orderId)}
              activeOpacity={0.85}
            >
              {/* Card Top: Order Number & DELIVERED Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.orderNumberRow}>
                  <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.orderNumberText}>{item.orderNumber}</Text>
                </View>

                <View style={styles.deliveredBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.deliveredBadgeText}>DELIVERED</Text>
                </View>
              </View>

              {/* Card Meta: Date & Time */}
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{formatDeliveredTime(item.deliveredAt)}</Text>
                </View>

                {Boolean(item.customerName) && (
                  <View style={styles.metaCol}>
                    <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.customerName}</Text>
                  </View>
                )}
              </View>

              {/* Items Summary Preview */}
              <View style={styles.itemsSummaryBox}>
                <View style={styles.itemsSummaryHeader}>
                  <Text style={styles.itemsSummaryCount}>
                    {item.itemCount || (item.items ? item.items.length : 0)} items
                  </Text>
                  <Text style={styles.totalAmountText}>₹{item.totalAmount}</Text>
                </View>

                {/* Items list preview (collapsed: 2 items, expanded: all) */}
                {(item.items || [])
                  .slice(0, isExpanded ? item.items.length : 2)
                  .map((prod: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemBullet}>•</Text>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {prod.name}
                      </Text>
                      <Text style={styles.itemQty}>
                        {prod.quantity}x {prod.quantityLabel || ''}
                      </Text>
                    </View>
                  ))}

                {(item.items || []).length > 2 && !isExpanded && (
                  <Text style={styles.moreItemsText}>
                    +{item.items.length - 2} more items (tap to view)
                  </Text>
                )}
              </View>

              {/* Card Footer: Rider Handover info */}
              {Boolean(item.deliveryPartner) && (
                <View style={styles.riderRow}>
                  <Ionicons name="bicycle-outline" size={13} color={COLORS.accentCyan} />
                  <Text style={styles.riderText}>
                    Rider: {item.deliveryPartner.name} • {item.deliveryPartner.vehicle || 'Bike'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Completed Orders</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'No past orders matched your search.'
                : 'Orders marked as DELIVERED from this dark store will appear here.'}
            </Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshCompletedOrders}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#FFF" />
              <Text style={styles.refreshBtnText}>REFRESH ORDERS</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  deliveredCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  deliveredCountText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumberText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deliveredBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  itemsSummaryBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  itemsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
  },
  itemsSummaryCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  totalAmountText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  itemBullet: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 6,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  itemQty: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  moreItemsText: {
    color: COLORS.accentCyan,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  riderText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
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
    maxWidth: 260,
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
