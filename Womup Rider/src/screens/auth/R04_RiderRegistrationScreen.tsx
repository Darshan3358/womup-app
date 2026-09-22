import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R04_RiderRegistrationScreen: React.FC = () => {
  const { authEmail, registerNewRider } = useRider();

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('Ahmedabad');
  const [vehicleType, setVehicleType] = useState<'EV_SCOOTER' | 'BIKE' | 'BICYCLE'>('EV_SCOOTER');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter your operating city');
      return;
    }
    if (vehicleType !== 'BICYCLE' && !vehicleNumber.trim()) {
      setErrorMsg('Vehicle number is mandatory for motor vehicles');
      return;
    }
    if (vehicleType !== 'BICYCLE' && !drivingLicenseNumber.trim()) {
      setErrorMsg('Driving license number is mandatory for motor vehicles');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await registerNewRider({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        drivingLicenseNumber: drivingLicenseNumber.trim().toUpperCase(),
        address: address.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>STEP 1 OF 3 • PROFILE SETUP</Text>
          </View>
          <Text style={styles.heading}>Delivery Partner Registration</Text>
          <Text style={styles.subHeading}>Fill your fleet details to get onboarded</Text>
        </LinearGradient>

        <View style={styles.card}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>FULL LEGAL NAME (AS PER AADHAAR) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Niraj Thanki"
            placeholderTextColor={COLORS.secondaryText}
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (errorMsg) setErrorMsg(null);
            }}
          />

          {/* Email (Locked & Verified from OTP session) */}
          <Text style={styles.inputLabel}>EMAIL ADDRESS (VERIFIED)</Text>
          <View style={styles.verifiedRow}>
            <TextInput
              style={[styles.input, styles.inputDisabled, { flex: 1 }]}
              editable={false}
              value={authEmail || 'rider@example.com'}
            />
            <View style={[styles.verifiedBadge, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          </View>

          {/* Mobile Number (Mandatory & Unique) */}
          <Text style={styles.inputLabel}>MOBILE NUMBER (MANDATORY & UNIQUE) *</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneTextInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="98765 43210"
              placeholderTextColor={COLORS.secondaryText}
              value={phone}
              onChangeText={(txt) => {
                setPhone(txt);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </View>

          {/* City */}
          <Text style={styles.inputLabel}>CITY *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ahmedabad"
            placeholderTextColor={COLORS.secondaryText}
            value={city}
            onChangeText={setCity}
          />

          {/* Vehicle Selector */}
          <Text style={styles.inputLabel}>VEHICLE TYPE *</Text>
          <View style={styles.vehicleSelector}>
            <TouchableOpacity
              style={[
                styles.vehicleOption,
                vehicleType === 'EV_SCOOTER' && styles.vehicleOptionSelected,
              ]}
              onPress={() => setVehicleType('EV_SCOOTER')}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={18} color={vehicleType === 'EV_SCOOTER' ? COLORS.hotPink : COLORS.navy} style={{ marginBottom: 4 }} />
              <Text
                style={[
                  styles.vehicleOptionText,
                  vehicleType === 'EV_SCOOTER' && styles.vehicleOptionTextSelected,
                ]}
              >
                EV Scooter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleOption, vehicleType === 'BIKE' && styles.vehicleOptionSelected]}
              onPress={() => setVehicleType('BIKE')}
              activeOpacity={0.8}
            >
              <Ionicons name="bicycle" size={18} color={vehicleType === 'BIKE' ? COLORS.hotPink : COLORS.navy} style={{ marginBottom: 4 }} />
              <Text
                style={[
                  styles.vehicleOptionText,
                  vehicleType === 'BIKE' && styles.vehicleOptionTextSelected,
                ]}
              >
                Petrol Bike
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vehicleOption,
                vehicleType === 'BICYCLE' && styles.vehicleOptionSelected,
              ]}
              onPress={() => setVehicleType('BICYCLE')}
              activeOpacity={0.8}
            >
              <Ionicons name="bicycle-outline" size={18} color={vehicleType === 'BICYCLE' ? COLORS.hotPink : COLORS.navy} style={{ marginBottom: 4 }} />
              <Text
                style={[
                  styles.vehicleOptionText,
                  vehicleType === 'BICYCLE' && styles.vehicleOptionTextSelected,
                ]}
              >
                Cycle
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vehicle Number & Driving License */}
          {vehicleType !== 'BICYCLE' && (
            <>
              <Text style={styles.inputLabel}>VEHICLE REGISTRATION NUMBER *</Text>
              <TextInput
                style={styles.input}
                placeholder="GJ-01-AB-1234"
                placeholderTextColor={COLORS.secondaryText}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={(txt) => {
                  setVehicleNumber(txt);
                  if (errorMsg) setErrorMsg(null);
                }}
              />

              <Text style={styles.inputLabel}>DRIVING LICENSE NUMBER *</Text>
              <TextInput
                style={styles.input}
                placeholder="GJ0120200012345"
                placeholderTextColor={COLORS.secondaryText}
                autoCapitalize="characters"
                value={drivingLicenseNumber}
                onChangeText={(txt) => {
                  setDrivingLicenseNumber(txt);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </>
          )}

          {/* Emergency Contact */}
          <Text style={styles.inputLabel}>EMERGENCY CONTACT PHONE</Text>
          <TextInput
            style={styles.input}
            placeholder="98980 12345"
            placeholderTextColor={COLORS.secondaryText}
            keyboardType="phone-pad"
            maxLength={10}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />

          {/* Address */}
          <Text style={styles.inputLabel}>CURRENT RESIDENTIAL ADDRESS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Flat/House, Street, Area, City"
            placeholderTextColor={COLORS.secondaryText}
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
          />

          {errorMsg ? (
            <View style={[styles.errorContainer, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Text style={styles.primaryButtonText}>NEXT: UPLOAD KYC DOCUMENTS</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  topHeader: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 98, 175, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.4)',
    marginBottom: 10,
  },
  badgeText: {
    color: COLORS.hotPink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  subHeading: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
  },
  inputDisabled: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    color: COLORS.textMuted,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  verifiedBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.cardBackground,
    overflow: 'hidden',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  vehicleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  vehicleOptionSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: 'rgba(245, 98, 175, 0.08)',
  },
  vehicleEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  vehicleOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  vehicleOptionTextSelected: {
    color: COLORS.hotPink,
  },
  errorContainer: {
    marginTop: 14,
    padding: 10,
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
