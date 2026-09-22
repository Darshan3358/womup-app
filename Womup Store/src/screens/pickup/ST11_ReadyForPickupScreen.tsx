import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { OrderCard } from '../../components/OrderCard';
import { COLORS } from '../../theme/colors';

export const ST11_ReadyForPickupScreen: React.FC = () => {
  const { readyOrders, selectOrderForDetail, setSubScreen, refreshReady, isLoading } = useStore();

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

        <View style={styles.shelvesBadge}>
          <Ionicons name="cube" size={14} color={COLORS.shelfBadgeText} />
          <Text style={styles.shelvesBadgeText}>SHELF SLOTS</Text>
        </View>
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
              When pickers complete packing bags, they will appear here ready for rider collection.
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
});
