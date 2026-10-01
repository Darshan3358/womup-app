import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '../../types/store.types';
import { COLORS } from '../../theme/colors';

interface EditShelfModalProps {
  visible: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (productId: string, shelfLocation: string) => Promise<void>;
}

const PRESET_SHELVES = ['A1-R1', 'A1-R2', 'A2-R1', 'A2-R2', 'A3-R1', 'A3-R2', 'B1-R1', 'B2-R2'];

export const EditShelfModal: React.FC<EditShelfModalProps> = ({
  visible,
  onClose,
  item,
  onSave,
}) => {
  const [shelfInput, setShelfInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setShelfInput(item.shelfLocation && item.shelfLocation !== 'UNASSIGNED' && item.shelfLocation !== 'Not set' ? item.shelfLocation : '');
      setErrorMsg(null);
    }
  }, [item, visible]);

  if (!item) return null;

  const handleSave = async () => {
    const trimmed = shelfInput.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a shelf location (e.g. A3-R2)');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(item.productId, trimmed);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Failed to update shelf location');
    }
  };

  const isShelfUnassigned = !item.shelfLocation || item.shelfLocation === 'UNASSIGNED' || item.shelfLocation === 'Not set';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Set Shelf Location</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.name} {item.quantityLabel ? `(${item.quantityLabel})` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current Shelf Banner */}
          <View style={styles.currentInfoBanner}>
            <Text style={styles.currentInfoLabel}>CURRENT SHELF ASSIGNMENT</Text>
            <View style={styles.currentInfoRow}>
              <View
                style={[
                  styles.currentBadge,
                  {
                    backgroundColor: isShelfUnassigned
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currentBadgeText,
                    {
                      color: isShelfUnassigned ? COLORS.danger : COLORS.primary,
                    },
                  ]}
                >
                  {isShelfUnassigned ? 'Not set' : item.shelfLocation}
                </Text>
              </View>
              <Text style={styles.currentSkuText}>SKU: {item.sku || item.productId.slice(-6)}</Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>SHELF LOCATION *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="grid-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={shelfInput}
                onChangeText={(text) => {
                  setShelfInput(text.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="e.g. A3-R2"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
              />
              {Boolean(shelfInput) && (
                <TouchableOpacity onPress={() => setShelfInput('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.formatHint}>Format: AisleA-RackB (e.g. A3-R2, B1-R4)</Text>
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetSection}>
            <Text style={styles.presetHeader}>QUICK SELECT PRESETS</Text>
            <View style={styles.presetGrid}>
              {PRESET_SHELVES.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    shelfInput === preset && styles.presetChipSelected,
                  ]}
                  onPress={() => {
                    setShelfInput(preset);
                    setErrorMsg(null);
                  }}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      shelfInput === preset && styles.presetChipTextSelected,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>SAVE SHELF</Text>
                </>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  currentInfoBanner: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentInfoLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  currentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  currentSkuText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  formatHint: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 4,
  },
  presetSection: {
    marginBottom: 18,
  },
  presetHeader: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.primary,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  presetChipTextSelected: {
    color: COLORS.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
