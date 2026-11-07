import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, TrendingUp, Package, Store, Gift } from 'lucide-react-native';

interface QuickActionsCardProps {
  onAdjustPrices?: () => void;
  onManageStock?: () => void;
  onViewStores?: () => void;
  onLiveOrders?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onAdjustPrices,
  onManageStock,
  onViewStores,
  onLiveOrders,
}) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Zap size={18} color="#F12A9B" strokeWidth={2.5} />
        <Text style={styles.headerTitle}>Quick Actions</Text>
      </View>

      {/* 4 Shortcut Tiles */}
      <View style={styles.tilesRow}>
        {/* 1. Adjust Prices */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: '#F3E8FF' }]}
          onPress={onAdjustPrices}
          activeOpacity={0.75}
        >
          <View style={styles.iconWrapper}>
            <TrendingUp size={22} color="#762DEB" strokeWidth={2.4} />
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            Adjust{'\n'}Prices
          </Text>
        </TouchableOpacity>

        {/* 2. Manage Stock */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: '#E0F2FE' }]}
          onPress={onManageStock}
          activeOpacity={0.75}
        >
          <View style={styles.iconWrapper}>
            <Package size={22} color="#0284C7" strokeWidth={2.4} />
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            Manage{'\n'}Stock
          </Text>
        </TouchableOpacity>

        {/* 3. View Stores */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: '#DCFCE7' }]}
          onPress={onViewStores}
          activeOpacity={0.75}
        >
          <View style={styles.iconWrapper}>
            <Store size={22} color="#16A34A" strokeWidth={2.4} />
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            View{'\n'}Stores
          </Text>
        </TouchableOpacity>

        {/* 4. Live Orders */}
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: '#FCE7F3' }]}
          onPress={onLiveOrders}
          activeOpacity={0.75}
        >
          <View style={styles.iconWrapper}>
            <Gift size={22} color="#DB2777" strokeWidth={2.4} />
          </View>
          <Text style={styles.tileLabel} numberOfLines={2}>
            Live{'\n'}Orders
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: '#E7D9FF',
    shadowColor: '#762DEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#111044',
    fontSize: 16,
    fontWeight: '700',
  },
  tilesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  iconWrapper: {
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileLabel: {
    color: '#111044',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
});
