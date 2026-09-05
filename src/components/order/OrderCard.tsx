import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Order } from '../../types';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { StatusBadge } from '../common/StatusBadge';
import { useApp } from '../../context/AppContext';

interface OrderCardProps {
  order: Order;
  onViewDetails?: () => void;
  onReorder?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onReorder,
}) => {
  const { setCurrentOrder, setActiveScreen } = useApp();

  const handleViewDetails = () => {
    setCurrentOrder(order);
    if (onViewDetails) {
      onViewDetails();
    } else {
      setActiveScreen('C24_OrderTracking');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsSummaryRow}>
        <Text style={styles.itemsCountText}>{order.itemCount} Items</Text>
        <Text style={styles.totalPriceText}>₹{order.totalAmount}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleViewDetails}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReorder}
          style={styles.reorderButton}
        >
          <Text style={styles.reorderButtonText}>Reorder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBackground,
    marginVertical: SPACING.sm,
  },
  itemsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.compact,
  },
  itemsCountText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  detailsButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: '#FCE1F5',
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
});
