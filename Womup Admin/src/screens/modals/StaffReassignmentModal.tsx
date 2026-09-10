import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const StaffReassignmentModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedOrder, staff, reassignOrderStaff } = useAdminState();

  const pickers = staff.filter((s) => s.role === 'Picker' && s.status === 'On Duty');
  const riders = staff.filter((s) => s.role === 'Rider' && s.status === 'On Duty');

  const [selectedPicker, setSelectedPicker] = useState(selectedOrder?.pickerName || pickers[0]?.name || '');
  const [selectedRider, setSelectedRider] = useState(selectedOrder?.riderName || riders[0]?.name || '');

  if (!selectedOrder) return null;

  const handleConfirm = () => {
    reassignOrderStaff(selectedOrder.id, selectedPicker, selectedRider);
    setActiveModal('none');
    Alert.alert('Reassigned', `Order ${selectedOrder.id} reassigned to Picker: ${selectedPicker}, Rider: ${selectedRider}`);
  };

  return (
    <ModalContainer
      visible={activeModal === 'StaffReassignment'}
      title={`Reassign Staff: ${selectedOrder.id}`}
      onClose={() => setActiveModal('none')}
    >
      <Text style={styles.orderMeta}>
        Customer: {selectedOrder.customerName} • Zone: {selectedOrder.zoneName}
      </Text>

      {/* Select Picker */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>1. Select On-Duty Picker</Text>
        <View style={styles.pickerList}>
          {pickers.length === 0 ? (
            <Text style={styles.emptyNotice}>No pickers currently on duty</Text>
          ) : (
            pickers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.staffChip, selectedPicker === p.name && styles.activeStaffChip]}
                onPress={() => setSelectedPicker(p.name)}
              >
                <Text style={[styles.staffChipText, selectedPicker === p.name && styles.activeStaffText]}>
                  {p.name} ({p.activeOrdersCount} orders)
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Select Rider */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>2. Select On-Duty Rider</Text>
        <View style={styles.pickerList}>
          {riders.length === 0 ? (
            <Text style={styles.emptyNotice}>No riders currently on duty</Text>
          ) : (
            riders.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.staffChip, selectedRider === r.name && styles.activeStaffChip]}
                onPress={() => setSelectedRider(r.name)}
              >
                <Text style={[styles.staffChipText, selectedRider === r.name && styles.activeStaffText]}>
                  {r.name} ({r.activeOrdersCount} orders)
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Reassignment</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  orderMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  pickerList: {
    flexDirection: 'column',
  },
  staffChip: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeStaffChip: {
    backgroundColor: COLORS.lightBlueLavender,
    borderColor: COLORS.purple,
  },
  staffChipText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  activeStaffText: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
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
    backgroundColor: COLORS.purple,
    marginLeft: 6,
  },
  confirmText: {
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyNotice: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});
