import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoreOrder } from '../types/store.types';
import { COLORS } from '../theme/colors';

interface OrderCardProps {
  order: StoreOrder;
  onPress: () => void;
  ctaText?: string;
  ctaColor?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  ctaText = 'START PICKING',
  ctaColor = COLORS.primary,
}) => {
  const isHighPriority = order.priority === 'HIGH';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.orderIdGroup}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.timeAgo}>• {order.timeAgo}</Text>
        </View>

        {isHighPriority ? (
          <View style={styles.priorityBadge}>
            <Ionicons name="flame" size={12} color="#FFF" />
            <Text style={styles.priorityText}>HIGH SLA</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        )}
      </View>

      {/* Item Previews */}
      <View style={styles.itemsPreview}>
        <Text style={styles.itemsCountText}>
          {order.itemCount} items • ₹{order.totalAmount}
        </Text>
        <Text style={styles.itemNamesList} numberOfLines={1}>
          {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ') || 'Various grocery items'}
        </Text>
      </View>

      {/* Progress or Ready Details */}
      {order.shelfSlot ? (
        <View style={styles.shelfSlotBanner}>
          <Ionicons name="location" size={14} color={COLORS.shelfBadgeText} />
          <Text style={styles.shelfSlotText}>Ready on Slot: {order.shelfSlot}</Text>
          {order.bagBarcode && (
            <Text style={styles.bagBarcodeText}>({order.bagBarcode})</Text>
          )}
        </View>
      ) : null}

      {order.assignedRider ? (
        <View style={styles.riderBanner}>
          <Ionicons name="bicycle" size={14} color={COLORS.accentCyan} />
          <Text style={styles.riderText}>
            Rider: {order.assignedRider.name} ({order.assignedRider.vehicleNumber})
          </Text>
        </View>
      ) : null}

      {/* Bottom CTA */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: ctaColor }]} onPress={onPress}>
          <Text style={styles.ctaButtonText}>{ctaText}</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timeAgo: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  itemsPreview: {
    marginBottom: 10,
  },
  itemsCountText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  itemNamesList: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  shelfSlotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.shelfBadgeBg,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    gap: 5,
  },
  shelfSlotText: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '700',
  },
  bagBarcodeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  riderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  riderText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
