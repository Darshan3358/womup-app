import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { PickItemRow } from '../../components/PickItemRow';
import { COLORS } from '../../theme/colors';

export const ST07_OrderDetailScreen: React.FC = () => {
  const { activeOrder, activePickList, setSubScreen, acceptOrderAndStartPick } = useStore();

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Text style={styles.backText}>Return</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = activePickList?.items || activeOrder.items || [];
  const isPacking = activeOrder.status === 'PACKING';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderNumber}>{activeOrder.orderNumber}</Text>
              <Text style={styles.deliverySlot}>Slot: {activeOrder.deliverySlot || 'Instant 9-min'}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{activeOrder.status}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryVal}>{items.length}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Order Total</Text>
              <Text style={styles.summaryVal}>₹{activeOrder.totalAmount}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Priority</Text>
              <Text style={[styles.summaryVal, { color: activeOrder.priority === 'HIGH' ? COLORS.danger : COLORS.primary }]}>
                {activeOrder.priority || 'NORMAL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pick List Instruction */}
        <View style={styles.instructionBanner}>
          <Ionicons name="information-circle" size={16} color={COLORS.accentCyan} />
          <Text style={styles.instructionText}>
            Follow aisle and rack shelf indicators for the most optimal pick route.
          </Text>
        </View>

        {/* Item List with Shelf Slots */}
        <Text style={styles.sectionTitle}>PICK LIST ITEMS ({items.length})</Text>
        {items.map((item: any, idx: number) => (
          <PickItemRow
            key={item.productId?.toString() || idx}
            item={{
              productId: item.productId?.toString() || idx.toString(),
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || item.quantityLabel || 'pack',
              shelfLocation: item.shelfLocation || `A${(idx % 4) + 1}-R${(idx % 3) + 1}`,
              barcode: item.barcode || '8901030383748',
              status: item.status || 'PENDING',
              notes: item.notes,
            }}
          />
        ))}
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startPickBtn}
          onPress={() => {
            if (isPacking) {
              setSubScreen('PickingCore');
            } else {
              acceptOrderAndStartPick(activeOrder.orderId);
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="barcode" size={20} color="#FFF" />
          <Text style={styles.startPickText}>
            {isPacking ? 'RESUME SCANNING' : 'START PICKING'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderNumber: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  deliverySlot: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  summaryVal: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  instructionText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  startPickText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
