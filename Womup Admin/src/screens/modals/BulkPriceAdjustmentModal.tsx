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

export const BulkPriceAdjustmentModal: React.FC = () => {
  const { activeModal, setActiveModal, applyBulkPriceAdjustment } = useAdminState();

  const [category, setCategory] = useState<string>('All Vegetables');
  const [type, setType] = useState<'Increase' | 'Decrease'>('Increase');
  const [percentStr, setPercentStr] = useState<string>('5');
  const [effectiveDate, setEffectiveDate] = useState<string>('15 Aug 2025 • 06:00 AM');

  const handleConfirm = () => {
    const percent = parseFloat(percentStr);
    if (isNaN(percent) || percent <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid percentage number greater than 0.');
      return;
    }

    Alert.alert(
      'Confirm Bulk Adjustment',
      `Are you sure you want to ${type.toLowerCase()} prices by ${percent}% for ${category}? Effective: ${effectiveDate}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Apply',
          onPress: () => {
            applyBulkPriceAdjustment(category === 'All Vegetables' ? 'Vegetables' : category, type, percent);
            setActiveModal('none');
            Alert.alert('Success', `Bulk price adjustment applied to ${category}.`);
          },
        },
      ]
    );
  };

  return (
    <ModalContainer
      visible={activeModal === 'BulkPriceAdjustment'}
      title="Bulk Price Adjustment"
      onClose={() => setActiveModal('none')}
    >
      {/* Scope Selector */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>1. Select Product Scope</Text>
        <View style={styles.scopeRow}>
          {['All Vegetables', 'Fruits', 'Others'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.scopeChip, category === cat && styles.activeScopeChip]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.scopeText, category === cat && styles.activeScopeText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Adjustment Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>2. Adjustment Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Increase' && styles.increaseActive]}
            onPress={() => setType('Increase')}
          >
            <Text style={[styles.typeText, type === 'Increase' && styles.activeTypeText]}>
              Increase (+)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, type === 'Decrease' && styles.decreaseActive]}
            onPress={() => setType('Decrease')}
          >
            <Text style={[styles.typeText, type === 'Decrease' && styles.activeTypeText]}>
              Decrease (-)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Percentage */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>3. Adjustment Percentage (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={percentStr}
          onChangeText={setPercentStr}
          placeholder="e.g. 5"
        />
      </View>

      {/* Effective Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>4. Effective Date & Time</Text>
        <TextInput
          style={styles.input}
          value={effectiveDate}
          onChangeText={setEffectiveDate}
        />
      </View>

      {/* Preview Card */}
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>Impact Summary Preview</Text>
        <Text style={styles.previewText}>
          • Target: <Text style={{ fontWeight: '700' }}>{category}</Text>
        </Text>
        <Text style={styles.previewText}>
          • Action: <Text style={{ fontWeight: '700', color: type === 'Increase' ? COLORS.success : COLORS.error }}>{type} by {percentStr}%</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={handleConfirm}>
        <Text style={styles.applyText}>Apply Bulk Adjustment</Text>
      </TouchableOpacity>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  scopeRow: {
    flexDirection: 'row',
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeScopeChip: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  scopeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activeScopeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 3,
  },
  increaseActive: {
    backgroundColor: COLORS.success,
  },
  decreaseActive: {
    backgroundColor: COLORS.error,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTypeText: {
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
  previewBox: {
    backgroundColor: COLORS.lightBlueLavender,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.purple,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  applyText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
