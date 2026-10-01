import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';

export const R04_RiderRegistrationScreen: React.FC = () => {
  const { authEmail, registerNewRider } = useRider();

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('Ahmedabad');
  const [cities, setCities] = useState<Array<{ id: string; name: string; code: string; status?: string }>>([]);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string; code: string } | null>(null);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);

  const [vehicleType, setVehicleType] = useState<'EV_SCOOTER' | 'BIKE' | 'BICYCLE'>('EV_SCOOTER');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load active cities from Admin's cities collection on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingCities(true);
        const list = await RiderApiService.fetchCities();
        if (isMounted) {
          const activeList = list.filter((c) => c.status === 'Active' || !c.status);
          setCities(activeList);

          // Pre-select Ahmedabad or first active city
          const defaultCity =
            activeList.find((c) => c.name.toLowerCase() === 'ahmedabad') ||
            activeList[0] ||
            null;
          if (defaultCity) {
            setSelectedCity(defaultCity);
            setCity(defaultCity.name);
          }
        }
      } catch (err) {
        console.warn('[R04] Error fetching cities:', err);
      } finally {
        if (isMounted) setLoadingCities(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!selectedCity || !city.trim()) {
      setErrorMsg('Please select your operating city from the list');
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
        city: selectedCity.name,
        cityId: selectedCity.id,
        cityName: selectedCity.name,
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

          {/* City Dropdown (Non-editable list selector) */}
          <Text style={styles.inputLabel}>CITY *</Text>
          <TouchableOpacity
            style={[styles.cityDropdownButton, !selectedCity && styles.cityDropdownButtonEmpty]}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.cityDropdownLeft}>
              <Text style={styles.cityDropdownEmoji}>🏙️</Text>
              <Text style={[styles.cityDropdownText, !selectedCity && styles.cityDropdownPlaceholder]}>
                {selectedCity ? selectedCity.name : 'Select City'}
              </Text>
            </View>
            <View style={styles.cityDropdownRight}>
              {loadingCities ? (
                <ActivityIndicator size="small" color={COLORS.navy} />
              ) : (
                <Ionicons name="chevron-down" size={18} color={COLORS.navy} />
              )}
            </View>
          </TouchableOpacity>

          {/* Informational Hint */}
          <View style={styles.cityHelperBox}>
            <Ionicons name="information-circle" size={14} color="#515FEA" style={{ marginTop: 1 }} />
            <Text style={styles.cityHelperText}>
              Only cities where Wom Up operates are available. You'll be assigned to a hub in your selected city.
            </Text>
          </View>

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

      {/* City Selection Modal */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCityPicker(false)}
          />

          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalHeaderEmoji}>🏙️</Text>
                <View>
                  <Text style={styles.modalTitle}>Select Your City</Text>
                  <Text style={styles.modalSubtitle}>Only operational cities shown</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCityPicker(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            {/* City Options List */}
            <ScrollView style={styles.cityListScroll} showsVerticalScrollIndicator={false}>
              {cities.length === 0 ? (
                <View style={styles.emptyCitiesBox}>
                  <ActivityIndicator size="small" color={COLORS.hotPink} />
                  <Text style={styles.emptyCitiesText}>Loading available cities...</Text>
                </View>
              ) : (
                cities.map((item) => {
                  const isSelected =
                    selectedCity?.name?.toLowerCase() === item.name.toLowerCase();

                  return (
                    <TouchableOpacity
                      key={item.id || item.code}
                      style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                      onPress={() => {
                        setSelectedCity(item);
                        setCity(item.name);
                        setShowCityPicker(false);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cityItemLeft}>
                        <View
                          style={[
                            styles.radioIndicator,
                            isSelected && styles.radioIndicatorSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.cityNameText,
                            isSelected && styles.cityNameTextSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View style={styles.checkPill}>
                          <Ionicons name="checkmark" size={14} color="#059669" />
                          <Text style={styles.checkPillText}>Selected</Text>
                        </View>
                      ) : (
                        item.code ? (
                          <View style={styles.cityCodeBadge}>
                            <Text style={styles.cityCodeText}>{item.code}</Text>
                          </View>
                        ) : null
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // City Dropdown Styles
  cityDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBackground,
  },
  cityDropdownButtonEmpty: {
    borderColor: COLORS.border,
  },
  cityDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityDropdownEmoji: {
    fontSize: 18,
  },
  cityDropdownText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cityDropdownPlaceholder: {
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  cityDropdownRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityHelperBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  cityHelperText: {
    fontSize: 11,
    color: '#3730A3',
    lineHeight: 15,
    flex: 1,
    fontWeight: '500',
  },

  // City Selection Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderEmoji: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityListScroll: {
    padding: 14,
  },
  emptyCitiesBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyCitiesText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cityItemSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: COLORS.hotPink,
  },
  cityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.secondaryText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioIndicatorSelected: {
    borderColor: COLORS.hotPink,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  cityNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  cityNameTextSelected: {
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  checkPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cityCodeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
