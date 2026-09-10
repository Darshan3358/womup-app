import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const StockDiscrepancyModal: React.FC = () => {
  const { activeModal, setActiveModal, reportStockDiscrepancy, selectedDarkStore } = useAdminState();

  const [itemName, setItemName] = useState('Tomato');
  const [type, setType] = useState<'Spoilage' | 'Shrinkage' | 'Discrepancy'>('Spoilage');
  const [quantityStr, setQuantityStr] = useState('5');
  const [reason, setReason] = useState('Damaged / Spoiled in transit');

  const handleSave = () => {
    const qty = parseFloat(quantityStr);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid weight quantity.');
      return;
    }

    reportStockDiscrepancy(itemName, type, qty, reason);
    setActiveModal('none');
    Alert.alert('Loss Logged', `${qty} kg of ${itemName} logged as ${type} in ${selectedDarkStore}. Audit record created.`);
  };

  return (
    <ModalContainer
      visible={activeModal === 'StockDiscrepancy'}
      title="Inventory Loss / Spoilage Adjustment"
      onClose={() => setActiveModal('none')}
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Target Item</Text>
        <TextInput
          style={styles.input}
          value={itemName}
          onChangeText={setItemName}
          placeholder="e.g. Tomato, Spinach"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Loss Category Type</Text>
        <View style={styles.typeRow}>
          {(['Spoilage', 'Shrinkage', 'Discrepancy'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.activeTypeChip]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.activeTypeText]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Deduction Quantity (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={quantityStr}
          onChangeText={setQuantityStr}
          placeholder="e.g. 5"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Reason for Discrepancy</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={reason}
          onChangeText={setReason}
          placeholder="Explain reason..."
          multiline
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save Audit Record</Text>
        </TouchableOpacity>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
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
  typeRow: {
    flexDirection: 'row',
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 2,
  },
  activeTypeChip: {
    backgroundColor: COLORS.purple,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTypeText: {
    color: COLORS.white,
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
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    marginLeft: 6,
  },
  saveText: {
    fontWeight: '700',
    color: COLORS.white,
  },
});
