import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface SubstituteModalProps {
  visible: boolean;
  onClose: () => void;
  itemName: string;
  onConfirmOOS: (reason: string) => void;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  visible,
  onClose,
  itemName,
  onConfirmOOS,
}) => {
  const [selectedReason, setSelectedReason] = useState('Not found in shelf');
  const [customNotes, setCustomNotes] = useState('');

  const reasons = [
    'Not found in shelf',
    'Damaged item / leaked packaging',
    'Expired or near-expiry batch',
    'Wrong barcode on SKU label',
    'Other exception',
  ];

  const handleConfirm = () => {
    const finalReason = customNotes.trim() ? `${selectedReason} - ${customNotes.trim()}` : selectedReason;
    onConfirmOOS(finalReason);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={22} color={COLORS.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Item Not Found / Damaged</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {itemName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select Reason for Out-of-Stock:</Text>

          {reasons.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.reasonOption, isSelected && styles.reasonSelected]}
                onPress={() => setSelectedReason(r)}
              >
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={isSelected ? COLORS.danger : COLORS.textMuted}
                />
                <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TextInput
            style={styles.notesInput}
            value={customNotes}
            onChangeText={setCustomNotes}
            placeholder="Additional notes (optional)..."
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.refundNotice}>
            <Ionicons name="information-circle" size={16} color={COLORS.accentCyan} />
            <Text style={styles.refundText}>
              This will automatically recalculate order total and refund the customer wallet.
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>CONFIRM OUT OF STOCK</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    marginBottom: 8,
    gap: 10,
  },
  reasonSelected: {
    borderColor: COLORS.danger,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  reasonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  reasonTextActive: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  refundNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  refundText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
