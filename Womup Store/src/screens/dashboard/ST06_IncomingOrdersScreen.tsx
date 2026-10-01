import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS } from '../../theme/colors';

export const ST06_IncomingOrdersScreen: React.FC = () => {
  const { incomingOrders, acceptOrderAndStartPick, refreshIncoming, isLoading, store } = useStore();
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const filteredOrders = incomingOrders.filter((o) => {
    if (filter === 'urgent') return o.priority === 'HIGH';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">Incoming Orders</Text>
          <Text style={styles.screenSubtitle} numberOfLines={1} ellipsizeMode="tail">
            FIFO Freshness Queue • {incomingOrders.length} pending
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.pill, filter === 'all' && styles.pillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.pillText, filter === 'all' && styles.pillTextActive]}>
              ALL ({incomingOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, filter === 'urgent' && styles.urgentPillActive]}
            onPress={() => setFilter('urgent')}
          >
            <Ionicons
              name="flame"
              size={12}
              color={filter === 'urgent' ? '#FFF' : COLORS.danger}
            />
            <Text
              style={[
                styles.pillText,
                filter === 'urgent' && styles.urgentPillTextActive,
              ]}
            >
              URGENT
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshIncoming} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            ctaText="ACCEPT & PICK"
            ctaColor={COLORS.primary}
            onPress={() => acceptOrderAndStartPick(item.orderId)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={48} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyDesc}>
              No incoming orders in this queue.
            </Text>
            <View style={styles.servingBadge}>
              <Ionicons name="location" size={13} color={COLORS.primary} />
              <Text style={styles.servingText}>
                Serving: {areaName} · {cityName}
              </Text>
            </View>
            <Text style={styles.emptySubDesc}>
              New orders from this area will appear here.
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
  filterPills: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  pillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  urgentPillActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#FFF',
  },
  urgentPillTextActive: {
    color: '#FFF',
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
