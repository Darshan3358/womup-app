import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';
import { RiderVehicle } from '../../types/rider.types';

const VEHICLE_TYPES: { key: RiderVehicle['vehicleType']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'EV_SCOOTER', label: 'EV Scooter', icon: 'flash' },
  { key: 'BIKE', label: 'Motorcycle', icon: 'bicycle' },
  { key: 'BICYCLE', label: 'Bicycle', icon: 'bicycle-outline' },
];

export const VehicleDetailsScreen: React.FC = () => {
  const { vehicle, updateVehicle, setSubScreen } = useRider();

  const [vehicleType, setVehicleType] = useState<RiderVehicle['vehicleType']>(
    vehicle?.vehicleType || 'EV_SCOOTER'
  );
  const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicleNumber || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [insurance, setInsurance] = useState(vehicle?.insurancePolicyMasked || '');
  const [battery, setBattery] = useState(
    vehicle?.batteryPercentage !== undefined ? String(vehicle.batteryPercentage) : ''
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setVehicleType(vehicle.vehicleType);
      setVehicleNumber(vehicle.vehicleNumber);
      setModel(vehicle.model);
      setInsurance(vehicle.insurancePolicyMasked);
      if (vehicle.batteryPercentage !== undefined) {
        setBattery(String(vehicle.batteryPercentage));
      }
    }
  }, [vehicle]);

  const handleSave = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle registration number');
      return;
    }
    setSaving(true);
    try {
      await updateVehicle({
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        model: model.trim(),
        insurancePolicyMasked: insurance.trim(),
        batteryPercentage: battery ? parseInt(battery, 10) : undefined,
        isInspected: true,
      });
      Alert.alert('Vehicle Saved', 'Your registered delivery vehicle details have been updated.');
    } catch {
      Alert.alert('Error', 'Failed to update vehicle details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Registered Fleet Vehicle</Text>
      <Text style={styles.screenSubtitle}>
        Vehicle specifications and inspection compliance for dark store deliveries.
      </Text>

      {/* Vehicle Type Selection */}
      <Text style={styles.sectionHeader}>SELECT VEHICLE CATEGORY</Text>
      <View style={styles.typeRow}>
        {VEHICLE_TYPES.map((t) => {
          const isSelected = vehicleType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
              onPress={() => setVehicleType(t.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={t.icon} size={22} color={isSelected ? COLORS.hotPink : COLORS.navy} style={{ marginBottom: 6 }} />
              <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Form Details */}
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>VEHICLE REGISTRATION NUMBER (NUMBER PLATE)</Text>
        <TextInput
          style={styles.input}
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          placeholder="e.g. GJ-01-ET-4829"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.fieldLabel}>VEHICLE MAKE & MODEL</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Ola S1 Pro / Hero Splendor"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.fieldLabel}>COMPREHENSIVE INSURANCE POLICY NO.</Text>
        <TextInput
          style={styles.input}
          value={insurance}
          onChangeText={setInsurance}
          placeholder="e.g. POL-ICICI-9938491"
          placeholderTextColor={COLORS.textMuted}
        />

        {vehicleType === 'EV_SCOOTER' && (
          <>
            <Text style={styles.fieldLabel}>BATTERY LEVEL ESTIMATE (%)</Text>
            <TextInput
              style={styles.input}
              value={battery}
              onChangeText={setBattery}
              placeholder="e.g. 85"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
            />
          </>
        )}

        <View style={styles.statusBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
            <Text style={styles.statusTitle}>Fleet Inspection Status</Text>
          </View>
          <Text style={styles.statusDesc}>
            Certified & Approved for dark store grocery & medicine rapid dispatch SLA.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'UPDATE VEHICLE DETAILS'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeCardSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF5FA',
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  typeLabelSelected: {
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBox: {
    backgroundColor: COLORS.onlineGreenLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onlineGreenDark,
  },
  statusDesc: {
    fontSize: 11,
    color: COLORS.onlineGreenDark,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 30,
  },
});
