import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const BulkPriceAdjustmentModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    applyBulkPriceAdjustment,
    zones,
    cities,
    selectedZone,
  } = useAdminState();

  const [scopeType, setScopeType] = useState<'area' | 'city' | 'all'>('area');
  const [category, setCategory] = useState<string>('All Vegetables');
  const [type, setType] = useState<'Increase' | 'Decrease'>('Increase');
  const [percentStr, setPercentStr] = useState<string>('5');

  // Resolve current Area and City
  const currentArea = zones.find((z) => z.name === selectedZone || z.id === selectedZone) || zones[0];
  const currentCityName = currentArea?.cityName || currentArea?.city || 'Ahmedabad';
  const areasInCity = zones.filter(
    (z) => (z.cityName || z.city || '').toLowerCase() === currentCityName.toLowerCase()
  );

  const handleConfirm = () => {
    const percent = parseFloat(percentStr);
    if (isNaN(percent) || percent <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid percentage number greater than 0.');
      return;
    }

    const scopeDesc =
      scopeType === 'area'
        ? currentArea?.name || 'Selected Area'
        : scopeType === 'city'
        ? `all ${areasInCity.length} areas in ${currentCityName}`
        : `all ${zones.length} areas across all cities`;

    Alert.alert(
      'Confirm Bulk Adjustment',
      `Are you sure you want to ${type.toLowerCase()} prices by ${percent}% for ${category} in ${scopeDesc}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Apply',
          onPress: () => {
            applyBulkPriceAdjustment(
              category === 'All Vegetables' ? 'Vegetables' : category,
              type,
              percent,
              {
                type: scopeType,
                areaName: currentArea?.name,
                cityName: currentCityName,
                areaNames:
                  scopeType === 'area'
                    ? [currentArea?.name || selectedZone]
                    : scopeType === 'city'
                    ? areasInCity.map((z) => z.name)
                    : zones.map((z) => z.name),
              }
            );
            setActiveModal('none');
            Alert.alert('Success', `Bulk price adjustment applied to ${scopeDesc}.`);
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
      {/* 1. Scope Selector */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>1. Apply To Geographic Scope:</Text>
        <View style={styles.radioGroup}>
          {/* This area only */}
          <TouchableOpacity
            style={[styles.radioItem, scopeType === 'area' && styles.radioItemActive]}
            onPress={() => setScopeType('area')}
            activeOpacity={0.8}
          >
            {scopeType === 'area' ? (
              <CheckCircle2 size={16} color={COLORS.purple} />
            ) : (
              <Circle size={16} color={COLORS.textMuted} />
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.radioLabel, scopeType === 'area' && styles.radioLabelActive]}>
                This area only ({currentArea?.name || selectedZone})
              </Text>
              <Text style={styles.radioSub}>Only alters prices for the current active area</Text>
            </View>
          </TouchableOpacity>

          {/* All areas in city */}
          <TouchableOpacity
            style={[styles.radioItem, scopeType === 'city' && styles.radioItemActive]}
            onPress={() => setScopeType('city')}
            activeOpacity={0.8}
          >
            {scopeType === 'city' ? (
              <CheckCircle2 size={16} color={COLORS.purple} />
            ) : (
              <Circle size={16} color={COLORS.textMuted} />
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.radioLabel, scopeType === 'city' && styles.radioLabelActive]}>
                All areas in {currentCityName} ({areasInCity.length} areas)
              </Text>
              <Text style={styles.radioSub}>Applies adjustment across all areas of {currentCityName}</Text>
            </View>
          </TouchableOpacity>

          {/* All areas in all cities */}
          <TouchableOpacity
            style={[styles.radioItem, scopeType === 'all' && styles.radioItemActive]}
            onPress={() => setScopeType('all')}
            activeOpacity={0.8}
          >
            {scopeType === 'all' ? (
              <CheckCircle2 size={16} color={COLORS.purple} />
            ) : (
              <Circle size={16} color={COLORS.textMuted} />
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.radioLabel, scopeType === 'all' && styles.radioLabelActive]}>
                All areas in all cities (Global / {zones.length} areas)
              </Text>
              <Text style={styles.radioSub}>Applies price change system-wide</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Product Category Scope */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>2. Product Category Scope:</Text>
        <View style={styles.scopeRow}>
          {['All Vegetables', 'Fruits', 'Dairy', 'Bakery'].map((cat) => (
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

      {/* 3. Adjustment Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>3. Adjustment Type:</Text>
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

      {/* 4. Percentage */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>4. Adjustment Percentage (%):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={percentStr}
          onChangeText={setPercentStr}
          placeholder="e.g. 5"
        />
      </View>

      {/* Preview Card */}
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>Impact Summary Preview</Text>
        <Text style={styles.previewText}>
          • Scope: <Text style={{ fontWeight: '700' }}>
            {scopeType === 'area'
              ? currentArea?.name
              : scopeType === 'city'
              ? `All areas in ${currentCityName}`
              : 'All areas in all cities'}
          </Text>
        </Text>
        <Text style={styles.previewText}>
          • Target Category: <Text style={{ fontWeight: '700' }}>{category}</Text>
        </Text>
        <Text style={styles.previewText}>
          • Action: <Text style={{ fontWeight: '700', color: type === 'Increase' ? COLORS.success : COLORS.error }}>{type} by {percentStr}%</Text>
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.modalActionButtonsRow}>
        <TouchableOpacity
          style={styles.cancelModalBtn}
          onPress={() => setActiveModal('none')}
        >
          <Text style={styles.cancelModalBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn} onPress={handleConfirm}>
          <Text style={styles.applyText}>Apply Adjustment</Text>
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  radioGroup: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  radioItemActive: {
    borderColor: COLORS.purple,
    backgroundColor: '#FAF5FF',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  radioLabelActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  radioSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
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
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  increaseActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  decreaseActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
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
    backgroundColor: '#FAF5FF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  applyBtn: {
    flex: 1.5,
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
