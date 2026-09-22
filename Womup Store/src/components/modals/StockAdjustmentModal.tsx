import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '../../types/store.types';
import { COLORS } from '../../theme/colors';

interface StockAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onConfirm: (delta: number, reason: string, changeType: string) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  visible,
  onClose,
  item,
  onConfirm,
}) => {
  const [delta, setDelta] = useState<number>(-1);
  const [reason, setReason] = useState<string>('Damaged during storage');
  const [changeType, setChangeType] = useState<'DAMAGE' | 'RETURN' | 'ADJUSTMENT'>('DAMAGE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleAdjust = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(delta, reason.trim(), changeType);
      setIsSubmitting(false);
      onClose();
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const newProjectedQty = Math.max(0, item.availableQty + delta);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="construct" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Adjust Stock Quantity</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current vs Projected */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current Stock</Text>
              <Text style={styles.statValue}>{item.availableQty}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Adjustment</Text>
              <Text style={[styles.statValue, { color: delta >= 0 ? COLORS.primary : COLORS.danger }]}>
                {delta >= 0 ? `+${delta}` : delta}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>New Stock</Text>
              <Text style={[styles.statValue, { color: COLORS.accentCyan }]}>{newProjectedQty}</Text>
            </View>
          </View>

          {/* Quantity Stepper */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDelta((d) => d - 5)}
            >
              <Text style={styles.stepBtnText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDelta((d) => d - 1)}
            >
              <Text style={styles.stepBtnText}>-1</Text>
            </TouchableOpacity>

            <View style={styles.deltaBox}>
              <Text style={styles.deltaValue}>{delta > 0 ? `+${delta}` : delta}</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDelta((d) => d + 1)}
            >
              <Text style={styles.stepBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDelta((d) => d + 5)}
            >
              <Text style={styles.stepBtnText}>+5</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelectorRow}>
            {(['DAMAGE', 'RETURN', 'ADJUSTMENT'] as const).map((t) => {
              const isSel = changeType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, isSel && styles.typeBtnActive]}
                  onPress={() => setChangeType(t)}
                >
                  <Text style={[styles.typeBtnText, isSel && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Reason Input */}
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for adjustment (required)..."
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!reason.trim() || isSubmitting) && styles.disabledBtn]}
              onPress={handleAdjust}
              disabled={!reason.trim() || isSubmitting}
            >
              <Text style={styles.saveText}>{isSubmitting ? 'SAVING...' : 'CONFIRM ADJUSTMENT'}</Text>
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
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  stepBtn: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  deltaBox: {
    minWidth: 64,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deltaValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: COLORS.primary,
  },
  reasonInput: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 16,
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
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
