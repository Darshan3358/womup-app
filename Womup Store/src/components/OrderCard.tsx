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
  ctaColor = COLORS.primaryPink,
}) => {
  const isHighPriority = order.priority === 'HIGH';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
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

      {/* Customer Name if available */}
      {order.customerName ? (
        <View style={styles.customerRow}>
          <Ionicons name="person-circle-outline" size={14} color="#64748B" />
          <Text style={styles.customerName}>Customer: {order.customerName}</Text>
        </View>
      ) : null}

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
          <Ionicons name="location" size={14} color="#4F46E5" />
          <Text style={styles.shelfSlotText}>Ready on Slot: {order.shelfSlot}</Text>
          {order.bagBarcode && (
            <Text style={styles.bagBarcodeText}>({order.bagBarcode})</Text>
          )}
        </View>
      ) : null}

      {order.assignedRider ? (
        <View style={styles.riderBanner}>
          <Ionicons name="bicycle" size={14} color="#059669" />
          <Text style={styles.riderText}>
            Rider: {order.assignedRider.name} ({order.assignedRider.vehicleNumber})
          </Text>
        </View>
      ) : null}

      {/* Bottom CTA */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: ctaColor }]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>{ctaText}</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    color: '#071B52',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timeAgo: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  customerName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsPreview: {
    marginBottom: 10,
  },
  itemsCountText: {
    color: '#071B52',
    fontSize: 13,
    fontWeight: '700',
  },
  itemNamesList: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  shelfSlotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 5,
  },
  shelfSlotText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  bagBarcodeText: {
    color: '#64748B',
    fontSize: 10,
  },
  riderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  riderText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
