import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

const REJECTION_REASONS = [
  'Store is too far away',
  'Heavy rain / Bad weather',
  'Vehicle mechanical breakdown',
  'Personal emergency',
  'Approaching end of shift',
  'Other operational reason',
];

export const RejectDeliveryModal: React.FC = () => {
  const { showRejectModal, setShowRejectModal, rejectDelivery } = useRider();
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);

  const handleConfirmReject = async () => {
    await rejectDelivery(selectedReason);
  };

  return (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <Text style={styles.dialogTitle}>Why are you rejecting?</Text>
          <Text style={styles.dialogSubtitle}>
            Please select a reason. Rejections are monitored by dark store fleet managers.
          </Text>

          <View style={styles.reasonsList}>
            {REJECTION_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowRejectModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmReject}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  dialogSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  reasonItemSelected: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.secondaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.error,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  reasonTextSelected: {
    fontWeight: '700',
    color: COLORS.error,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.offlineGrayLight,
  },
  cancelBtnText: {
    color: COLORS.offlineGray,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.error,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
