import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

const REASONS = [
  'Customer Request',
  'Out of Stock',
  'Operational Issue',
  'Payment Issue',
  'Address Problem',
  'Other',
];

export const OrderCancelRefundModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedOrder, cancelAndRefundOrder } = useAdminState();

  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState('');
  const [issueRefund, setIssueRefund] = useState(true);

  if (!selectedOrder) return null;

  const handleConfirm = () => {
    cancelAndRefundOrder(selectedOrder.id, notes ? `${reason} - ${notes}` : reason, issueRefund);
    setActiveModal('none');
    Alert.alert(
      'Order Cancelled',
      `Order ${selectedOrder.id} has been cancelled. Refund status: ${issueRefund ? `₹${selectedOrder.total} Auto-Initiated` : 'No Refund'}`
    );
  };

  return (
    <ModalContainer
      visible={activeModal === 'OrderCancelRefund'}
      title={`Cancel Order ${selectedOrder.id}`}
      onClose={() => setActiveModal('none')}
    >
      <Text style={styles.amountText}>
        Order Total: <Text style={{ fontWeight: '800', color: COLORS.error }}>₹{selectedOrder.total}</Text>
      </Text>

      {/* Cancellation Reason */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Select Cancellation Reason *</Text>
        <View style={styles.reasonGrid}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonChip, reason === r && styles.activeReasonChip]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.activeReasonText]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Additional Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Operational Notes</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Provide detailed explanation..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* Refund Toggle Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setIssueRefund(!issueRefund)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, issueRefund && styles.checkboxActive]}>
          {issueRefund && <Check size={14} color={COLORS.white} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.checkboxLabel}>Issue Automatic Refund (₹{selectedOrder.total})</Text>
          <Text style={styles.checkboxSub}>Refund will be credited to customer's original payment method</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelText}>Keep Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Cancellation</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  amountText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeReasonChip: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activeReasonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    height: 60,
    paddingTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: COLORS.hotPink,
    borderColor: COLORS.hotPink,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkboxSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  cancelText: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.error,
    marginLeft: 6,
  },
  confirmText: {
    fontWeight: '700',
    color: COLORS.white,
  },
});
