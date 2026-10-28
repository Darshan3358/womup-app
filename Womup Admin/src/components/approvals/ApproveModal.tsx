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
import { CheckCircle2, X, AlertCircle } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { ApprovalQueueItem } from '../../services/approvalService';

interface ApproveModalProps {
  visible: boolean;
  item: ApprovalQueueItem | null;
  onConfirm: (notes: string, extraData?: any) => Promise<void>;
  onClose: () => void;
}

export const ApproveModal: React.FC<ApproveModalProps> = ({
  visible,
  item,
  onConfirm,
  onClose,
}) => {
  const [notes, setNotes] = useState('');
  const [shoppingCoinPercent, setShoppingCoinPercent] = useState('18');
  const [commissionPercent, setCommissionPercent] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible && item) {
      setNotes('');
      if (item.type === 'LOCAL_VENDOR') {
        setShoppingCoinPercent(String(item.details?.shoppingCoinPercent || '18'));
        setCommissionPercent(String(item.details?.platformCommissionPercent || '2'));
      }
    }
  }, [visible, item]);

  if (!visible || !item) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const extraData: any = {};
      if (item.type === 'LOCAL_VENDOR') {
        extraData.shoppingCoinPercent = Number(shoppingCoinPercent) || 18;
        extraData.platformCommissionPercent = Number(commissionPercent) || 2;
      }
      await onConfirm(notes, extraData);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getImpactPoints = () => {
    switch (item.type) {
      case 'CUSTOMER_KYC':
        return [
          'KYC status updated to Verified (customerKycStatus = 2)',
          'Daily and monthly income features immediately unlocked',
          `Sponsor ${item.details?.sponsorCode || 'WOM5871'} receives referral reward credit`,
        ];
      case 'RIDER':
        return [
          'Partner status set to ACTIVE in dispatch pool',
          'Rider login unlocked & delivery assignment enabled',
          'Eligible for zone per-km payout rates',
        ];
      case 'DARK_STORE':
        return [
          'Dark Store activated in inventory and routing engine',
          'Store QR credentials generated and dispatched',
          `Service radius set to ${item.details?.serviceRadiusKm || 5} km`,
        ];
      case 'LOCAL_VENDOR':
        return [
          'Vendor status set to ACTIVE (vendorStatus = 2)',
          'Store QR Code generated for offline shopping coin deductions',
          `Shopping Coin set to ${shoppingCoinPercent}% · Commission to ${commissionPercent}%`,
        ];
      case 'WITHDRAWAL':
        return [
          `Payout of ₹${item.details?.amount || 0} marked SETTLED`,
          `Dispatched to ${item.details?.bankName || 'Bank'} · ${item.details?.accountNumber || ''}`,
          'Ledger entry synchronized with wallet balance',
        ];
      case 'CANCELLATION':
        return [
          `Order ${item.code} status updated to CANCELLED`,
          'Restock items to store inventory automatically',
          'Refund triggered to customer original payment source',
        ];
      case 'RATE_CHANGE':
        return [
          'Zone rates updated across entire pricing matrix',
          'Real-time broadcast dispatched to all active delivery fleet',
        ];
      default:
        return ['Application approved and activated in system'];
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
                <CheckCircle2 size={22} color="#16A34A" />
              </View>
              <Text style={styles.headerTitle}>Approve {item.name}</Text>
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

            {/* Impact Breakdown */}
            <Text style={styles.sectionLabel}>ON APPROVAL ACTIONS:</Text>
            <View style={styles.impactBox}>
              {getImpactPoints().map((pt, idx) => (
                <View key={idx} style={styles.impactRow}>
                  <Text style={styles.checkIcon}>✅</Text>
                  <Text style={styles.impactText}>{pt}</Text>
                </View>
              ))}
            </View>

            {/* Vendor extra inputs */}
            {item.type === 'LOCAL_VENDOR' && (
              <View style={styles.vendorParamsBox}>
                <View style={styles.vendorParamCol}>
                  <Text style={styles.paramLabel}>Shopping Coin %</Text>
                  <TextInput
                    style={styles.paramInput}
                    keyboardType="numeric"
                    value={shoppingCoinPercent}
                    onChangeText={setShoppingCoinPercent}
                    placeholder="18"
                  />
                </View>
                <View style={styles.vendorParamCol}>
                  <Text style={styles.paramLabel}>Platform Comm. %</Text>
                  <TextInput
                    style={styles.paramInput}
                    keyboardType="numeric"
                    value={commissionPercent}
                    onChangeText={setCommissionPercent}
                    placeholder="2"
                  />
                </View>
              </View>
            )}

            {/* Optional Notes */}
            <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
              ADMIN NOTES (OPTIONAL):
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g., Verified physical Aadhaar card, clean record..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Footer Actions */}
          <View style={styles.dialogFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Approve</Text>
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
    maxWidth: 520,
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
    backgroundColor: '#DCFCE7',
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
    color: COLORS.purple,
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
  impactBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  checkIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  impactText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 18,
  },
  vendorParamsBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  vendorParamCol: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  paramInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 50,
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
    backgroundColor: '#16A34A',
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
