import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { ApprovalQueueItem } from '../../services/approvalService';

interface RejectModalProps {
  visible: boolean;
  item: ApprovalQueueItem | null;
  onConfirm: (reason: string, notes: string) => Promise<void>;
  onClose: () => void;
}

const PREDEFINED_REASONS = [
  'Aadhaar image not clear / blurry',
  'Aadhaar number doesn\'t match document',
  'Document cropped or back side missing',
  'Name mismatch with bank account',
  'Expired license or vehicle document',
  'Address outside serviceable coverage',
  'Suspicious / unverified documentation',
  'Other (specify in notes below)',
];

export const RejectModal: React.FC<RejectModalProps> = ({
  visible,
  item,
  onConfirm,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setSelectedReason(PREDEFINED_REASONS[0]);
      setNotes('');
    }
  }, [visible]);

  if (!visible || !item) return null;

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selectedReason, notes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <ShieldAlert size={22} color="#DC2626" />
              </View>
              <Text style={styles.headerTitle}>Reject {item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.dialogBody}>
            {/* Meta summary card */}
            <View style={styles.metaCard}>
              <Text style={styles.metaCode}>{item.code}</Text>
              <Text style={styles.metaName}>{item.name}</Text>
              {item.mobile !== 'N/A' && <Text style={styles.metaSub}>Mobile: {item.mobile}</Text>}
            </View>

            {/* Reason Selection */}
            <Text style={styles.sectionLabel}>REASON FOR REJECTION *</Text>
            <View style={styles.reasonsGrid}>
              {PREDEFINED_REASONS.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonPill, isSelected && styles.reasonPillActive]}
                    onPress={() => setSelectedReason(r)}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]} />
                    <Text
                      style={[styles.reasonText, isSelected && styles.reasonTextActive]}
                      numberOfLines={1}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional Notes */}
            <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
              ADDITIONAL INSTRUCTIONS / NOTES:
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Explain what the applicant needs to correct before re-uploading..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Notification alert banner */}
            <View style={styles.warningBanner}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text style={styles.warningText}>
                The applicant will receive an instant push notification and SMS with this exact rejection reason.
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.dialogFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleReject}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  dialogBody: {
    padding: SPACING.lg,
  },
  metaCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  metaCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  metaName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  metaSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reasonsGrid: {
    gap: 6,
  },
  reasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  reasonPillActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  radioCircleActive: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  reasonTextActive: {
    color: '#991B1B',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 60,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 14,
  },
  warningText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
    lineHeight: 16,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    minWidth: 140,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
