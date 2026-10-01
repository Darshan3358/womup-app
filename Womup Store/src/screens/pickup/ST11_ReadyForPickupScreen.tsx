import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS } from '../../theme/colors';

export const ST11_ReadyForPickupScreen: React.FC = () => {
  const { readyOrders, selectOrderForDetail, setSubScreen, setCurrentTab, refreshReady, isLoading, store } = useStore();

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const handleHandoverPress = (orderId: string) => {
    selectOrderForDetail(orderId);
    setSubScreen('HandoverScan');
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">Ready for Delivery Pickup</Text>
          <Text style={styles.screenSubtitle} numberOfLines={1} ellipsizeMode="tail">
            {readyOrders.length} sealed bags waiting on pickup shelves
          </Text>
        </View>

        <TouchableOpacity
          style={styles.historyShortcutBtn}
          onPress={() => setCurrentTab('History')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={13} color={COLORS.accentCyan} />
          <Text style={styles.historyShortcutText}>HISTORY</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={readyOrders}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshReady} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            ctaText="SCAN RIDER BAG & HANDOVER"
            ctaColor={COLORS.primary}
            onPress={() => handleHandoverPress(item.orderId)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Orders on Shelves</Text>
            <Text style={styles.emptyDesc}>
              No sealed bags waiting on pickup shelves.
            </Text>
            <View style={styles.servingBadge}>
              <Ionicons name="location" size={13} color={COLORS.primary} />
              <Text style={styles.servingText}>
                Serving: {areaName} · {cityName}
              </Text>
            </View>
            <Text style={styles.emptySubDesc}>
              Packed orders awaiting pickup will appear here.
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  shelvesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.shelfBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  shelvesBadgeText: {
    color: COLORS.shelfBadgeText,
    fontSize: 10,
    fontWeight: '800',
  },
  historyShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    flexShrink: 0,
  },
  historyShortcutText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
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
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  servingText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptySubDesc: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
});
