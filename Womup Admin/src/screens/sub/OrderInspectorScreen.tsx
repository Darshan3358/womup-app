import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Clock, MapPin, User, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Printer } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { OrderStage } from '../../types/admin';

const LIFECYCLE_STAGES: OrderStage[] = [
  'Order Placed',
  'Payment Confirmed',
  'Order Accepted',
  'Picker Assigned',
  'Picking',
  'Picking Completed',
  'Packed',
  'Rider Assigned',
  'Ready for Dispatch',
  'Out for Delivery',
  'Delivered',
];

export const OrderInspectorScreen: React.FC = () => {
  const { selectedOrder, updateOrderStatus, setActiveModal, openLabelPrint } = useAdminState();

  if (!selectedOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order selected for inspection</Text>
      </View>
    );
  }

  const currentStageIndex = LIFECYCLE_STAGES.indexOf(selectedOrder.status as OrderStage);

  const handleAdvanceStage = () => {
    if (currentStageIndex < LIFECYCLE_STAGES.length - 1) {
      const nextStage = LIFECYCLE_STAGES[currentStageIndex + 1];
      updateOrderStatus(selectedOrder.id, nextStage);
      Alert.alert('Stage Advanced', `Order ${selectedOrder.id} moved to "${nextStage}"`);
    } else {
      Alert.alert('Completed', 'Order has reached final Delivered state.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>{selectedOrder.id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{selectedOrder.status}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Clock size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{selectedOrder.timestamp}</Text>
        </View>

        <View style={styles.customerRow}>
          <User size={14} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.customerText}>
            {selectedOrder.customerName} ({selectedOrder.customerPhone})
          </Text>
        </View>

        <View style={styles.customerRow}>
          <MapPin size={14} color={COLORS.hotPink} style={{ marginRight: 6 }} />
          <Text style={styles.addressText}>
            {selectedOrder.address} • <Text style={{ fontWeight: '700' }}>{selectedOrder.zoneName}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.printHeaderBtn}
          onPress={() =>
            openLabelPrint({
              orderId: selectedOrder.id,
              type: 'GROCERY',
              customerName: selectedOrder.customerName,
              customerPhone: selectedOrder.customerPhone,
              address: selectedOrder.address,
              items: selectedOrder.items,
              total: selectedOrder.total,
              paymentMethod: 'Online UPI',
            })
          }
        >
          <Printer size={15} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.printHeaderBtnText}>Print Dispatch Shipping Label / Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Items Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ordered Fresh Items</Text>
        {selectedOrder.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemWeight}>{item.quantityKg} kg @ ₹{item.pricePerKg}/kg</Text>
            </View>
            <Text style={styles.itemSubtotal}>₹{item.subtotal}</Text>
          </View>
        ))}

        <View style={styles.pricingSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{selectedOrder.subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>₹{selectedOrder.deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalVal}>₹{selectedOrder.total}</Text>
          </View>
        </View>
      </View>

      {/* Staff Operational Assignments */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assigned Operational Fleet</Text>
        <View style={styles.staffRow}>
          <Text style={styles.staffLabel}>Picker:</Text>
          <Text style={styles.staffVal}>{selectedOrder.pickerName || 'Unassigned'}</Text>
        </View>
        <View style={styles.staffRow}>
          <Text style={styles.staffLabel}>Rider:</Text>
          <Text style={styles.staffVal}>{selectedOrder.riderName || 'Unassigned'}</Text>
        </View>
      </View>

      {/* 11-Stage Interactive Timeline */}
      <View style={styles.card}>
        <View style={styles.timelineHeader}>
          <Text style={styles.cardTitle}>11-Stage Order Lifecycle</Text>
          <TouchableOpacity onPress={handleAdvanceStage}>
            <Text style={styles.advanceLink}>Advance Stage</Text>
          </TouchableOpacity>
        </View>

        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isDone = idx <= currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <View key={stage} style={styles.timelineStep}>
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.timelineDot,
                    isDone && styles.dotDone,
                    isCurrent && styles.dotCurrent,
                  ]}
                >
                  {isDone && <CheckCircle2 size={12} color={COLORS.white} />}
                </View>
                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <View style={[styles.line, isDone && styles.lineDone]} />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    !isDone && styles.stepTitleFuture,
                  ]}
                >
                  {stage}
                </Text>
                {isDone && (
                  <Text style={styles.stepTime}>
                    {selectedOrder.timeline.find((t) => t.stage === stage)?.timestamp || 'Recorded'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.reassignBtn}
          onPress={() => setActiveModal('StaffReassignment')}
        >
          <RefreshCw size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.reassignText}>Reassign Fleet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('OrderCancelRefund')}
        >
          <AlertCircle size={16} color={COLORS.error} style={{ marginRight: 6 }} />
          <Text style={styles.cancelText}>Cancel & Refund</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusPill: {
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  printHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  printHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.purple,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemWeight: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pricingSummary: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  staffRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  staffLabel: {
    width: 60,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  staffVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  advanceLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 36,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: {
    backgroundColor: COLORS.success,
  },
  dotCurrent: {
    backgroundColor: COLORS.hotPink,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: COLORS.success,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepTitleCurrent: {
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  stepTitleFuture: {
    color: COLORS.textMuted,
  },
  stepTime: {
    fontSize: 10,
    color: COLORS.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
  },
  reassignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginRight: 6,
  },
  reassignText: {
    color: COLORS.purple,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEE',
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginLeft: 6,
  },
  cancelText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },
});
