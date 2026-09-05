import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { Address } from '../types';

export const S11_AddAddressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, selectedAddress, addAddress, goBack } = useApp();

  const [fullName, setFullName] = useState(selectedAddress.fullName || 'Rahul Sharma');
  const [phoneNumber, setPhoneNumber] = useState(selectedAddress.phoneNumber || '+91 98765 43210');
  const [houseFlat, setHouseFlat] = useState(selectedAddress.houseFlat || 'B-402, Shivalik Heights');
  const [areaLandmark, setAreaLandmark] = useState(selectedAddress.areaLandmark || 'Opp. ISKCON Temple, SG Highway');
  const [city, setCity] = useState(selectedAddress.city || 'Ahmedabad, Gujarat');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  const handleSave = () => {
    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      type: addressType,
      fullName,
      phoneNumber,
      houseFlat,
      areaLandmark,
      city,
      pincode: '380015',
      isDefault: true,
    };
    addAddress(newAddress);
    setActiveScreen('C12_Home');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <Header
          title="Add Delivery Address"
          onBack={goBack}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.secondaryText}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="House No., Building, Street"
              placeholderTextColor={COLORS.secondaryText}
              value={houseFlat}
              onChangeText={setHouseFlat}
            />
          </View>

          {/* Area / Landmark */}
          <Text style={styles.label}>Area / Landmark</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter area or landmark"
              placeholderTextColor={COLORS.secondaryText}
              value={areaLandmark}
              onChangeText={setAreaLandmark}
            />
          </View>

          {/* City */}
          <Text style={styles.label}>City</Text>
          <View style={[styles.inputContainer, styles.cityContainer]}>
            <TextInput
              style={styles.input}
              placeholder="Select city"
              placeholderTextColor={COLORS.secondaryText}
              value={city}
              onChangeText={setCity}
            />
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </View>

          {/* Address Type Pills */}
          <Text style={styles.label}>Save Address As</Text>
          <View style={styles.typeRow}>
            {(['Home', 'Work', 'Other'] as const).map((type) => {
              const selected = addressType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setAddressType(type)}
                  style={[styles.typePill, selected && styles.typePillSelected]}
                >
                  <Ionicons
                    name={
                      type === 'Home'
                        ? 'home-outline'
                        : type === 'Work'
                        ? 'briefcase-outline'
                        : 'location-outline'
                    }
                    size={16}
                    color={selected ? COLORS.white : COLORS.textPrimary}
                  />
                  <Text
                    style={[
                      styles.typePillText,
                      selected && styles.typePillTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Address CTA */}
          <GradientButton
            title="Save Address"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 50,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    gap: 6,
  },
  typePillSelected: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  typePillTextSelected: {
    color: COLORS.white,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});
