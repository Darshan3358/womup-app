import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

interface CityItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  status: string;
}

interface AreaItem {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  cityName?: string;
  cityId?: string;
  hasActiveStore?: boolean;
  isAvailable?: boolean;
  assignedStore?: {
    storeName?: string;
    storeCode?: string;
  };
}

export const ST02b_StoreRegistrationScreen: React.FC = () => {
  const { setAuthStep } = useStore();

  // Form Fields
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Master Data
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  // Loading States
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals for selection
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // Success Modal
  const [registeredStoreData, setRegisteredStoreData] = useState<{
    loginId: string;
    storeName: string;
    cityName: string;
    areaName: string;
  } | null>(null);

  // 1. Fetch Admin Master Cities on screen mount
  useEffect(() => {
    fetchMasterCities();
  }, []);

  const fetchMasterCities = async () => {
    setIsLoadingCities(true);
    try {
      const data = await StoreApiService.getCities();
      const activeCities = (data || []).filter((c: any) => c.status === 'Active' || !c.status);
      setCities(activeCities);
    } catch (err) {
      console.warn('Failed to load cities:', err);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // 2. Fetch Areas when a City is chosen
  const handleSelectCity = async (city: CityItem) => {
    setSelectedCity(city);
    setSelectedArea(null);
    setCityModalVisible(false);
    setCitySearch('');

    const cityId = city._id || city.id || city.name;
    setIsLoadingAreas(true);
    try {
      const data = await StoreApiService.getAreasByCity(cityId);
      setAreas(data || []);
    } catch (err) {
      console.warn('Failed to load areas for city:', err);
      Alert.alert('Error', 'Unable to fetch areas for selected city.');
    } finally {
      setIsLoadingAreas(false);
    }
  };

  const handleSelectArea = (area: AreaItem) => {
    if (area.hasActiveStore || area.isAvailable === false) {
      Alert.alert(
        'Area Already Assigned',
        `The area "${area.name}" already has an assigned active dark store (${area.assignedStore?.storeName || 'Registered Store'}). Womup operates on a strict 1-store-per-area model. Please select an available area.`
      );
      return;
    }
    setSelectedArea(area);
    setAreaModalVisible(false);
    setAreaSearch('');
  };

  // 3. Validation & Submission
  const handleRegister = async () => {
    if (!ownerName.trim()) {
      Alert.alert('Missing Field', 'Please enter store owner or manager name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please provide a valid 10-digit phone number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please provide a valid email address.');
      return;
    }
    if (!storeName.trim()) {
      Alert.alert('Missing Field', 'Please enter your dark store business name.');
      return;
    }
    if (!selectedCity) {
      Alert.alert('Missing Location', 'Please select a City from the Admin master list.');
      return;
    }
    if (!selectedArea) {
      Alert.alert('Missing Location', 'Please select an available Area for your store.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cityId = selectedCity._id || selectedCity.id || selectedCity.code;
      const areaId = selectedArea._id || selectedArea.id || selectedArea.name;

      const res = await StoreApiService.registerStore({
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        cityId,
        areaId,
        password,
      });

      if (res && res.success) {
        setRegisteredStoreData({
          loginId: res.store?.loginId || `womup_${selectedArea.name.toLowerCase()}`,
          storeName: res.store?.name || storeName,
          cityName: selectedCity.name,
          areaName: selectedArea.name,
        });
      } else {
        Alert.alert('Registration Failed', res?.message || 'Unable to register dark store.');
      }
    } catch (err: any) {
      Alert.alert('Registration Error', err.message || 'Server error during store registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setAuthStep('LOGIN')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Dark Store Partner</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          {/* Logo & Headline */}
          <View style={styles.headerBox}>
            <View style={styles.logoBadge}>
              <Ionicons name="storefront-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Register New Store</Text>
            <Text style={styles.subtitle}>
              Set up your dark store hub with Admin-configured city and area zones
            </Text>
          </View>

          {/* Section 1: Owner Details */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>OWNER & CONTACT</Text>
          </View>

          {/* Owner Name */}
          <Text style={styles.label}>OWNER FULL NAME</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-circle-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="e.g. Raj Patel"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>MOBILE PHONE NUMBER</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCodeBadge}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210 (10 digits)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Email Address */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. storeowner@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Section 2: Store Details */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Ionicons name="business-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>STORE DETAILS</Text>
          </View>

          <Text style={styles.label}>STORE BUSINESS NAME</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g. Raj Super Mart"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Section 3: Cascading Location Dropdowns */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>MASTER LOCATION (ADMIN ASSIGNED)</Text>
          </View>

          {/* City Dropdown */}
          <Text style={styles.label}>CITY (SELECT FROM MASTER DATA)</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setCityModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownInner}>
              <Ionicons name="map-outline" size={20} color={selectedCity ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.dropdownValue, !selectedCity && styles.placeholderText]}>
                {selectedCity ? `${selectedCity.name} (${selectedCity.code})` : 'Select City...'}
              </Text>
            </View>
            {isLoadingCities ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Area Dropdown (Cascaded) */}
          <Text style={styles.label}>AREA (1 STORE PER AREA ENFORCED)</Text>
          <TouchableOpacity
            style={[styles.dropdownBtn, !selectedCity && styles.disabledDropdown]}
            onPress={() => {
              if (!selectedCity) {
                Alert.alert('Select City First', 'Please select a city to view its available zones.');
                return;
              }
              setAreaModalVisible(true);
            }}
            disabled={!selectedCity || isLoadingAreas}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownInner}>
              <Ionicons
                name="navigate-circle-outline"
                size={20}
                color={selectedArea ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.dropdownValue, !selectedArea && styles.placeholderText]}>
                {isLoadingAreas
                  ? 'Loading areas for this city...'
                  : selectedArea
                  ? `${selectedArea.name}`
                  : selectedCity
                  ? 'Select an available Area...'
                  : 'Choose a City above first'}
              </Text>
            </View>
            {isLoadingAreas ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>

          {selectedArea && (
            <View style={styles.areaBadgeInfo}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.areaBadgeText}>
                Area "{selectedArea.name}" is verified available for registration
              </Text>
            </View>
          )}

          {/* Section 4: Security */}
          <View style={[styles.sectionHeader, { marginTop: 22 }]}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>SECURITY CREDENTIALS</Text>
          </View>

          {/* Password */}
          <Text style={styles.label}>CREATE PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <View
            style={[
              styles.inputWrapper,
              confirmPassword.length > 0 &&
                (password === confirmPassword ? styles.inputWrapperSuccess : styles.inputWrapperError),
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password to confirm"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && (
            <View style={styles.passwordMatchNotice}>
              <Ionicons
                name={password === confirmPassword ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={password === confirmPassword ? COLORS.success : COLORS.danger}
              />
              <Text
                style={[
                  styles.passwordMatchText,
                  { color: password === confirmPassword ? COLORS.success : COLORS.danger },
                ]}
              >
                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>REGISTER STORE</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.loginRedirect}>
            <Text style={styles.redirectText}>Already have dark store credentials?</Text>
            <TouchableOpacity onPress={() => setAuthStep('LOGIN')}>
              <Text style={styles.loginLink}>Sign In Here →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal visible={cityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Master City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrapper}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city name or code..."
                placeholderTextColor={COLORS.textMuted}
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item, index) => item._id || item.id || `city_${index}`}
              renderItem={({ item }) => {
                const isSelected = selectedCity?._id === item._id || selectedCity?.name === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.cityBadge}>
                        <Text style={styles.cityBadgeText}>{item.code || 'CITY'}</Text>
                      </View>
                      <View>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        <Text style={styles.modalItemSub}>Active Delivery Region</Text>
                      </View>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No active cities configured by Admin.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Area Selection Modal */}
      <Modal visible={areaModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Delivery Area</Text>
                <Text style={styles.modalSubtitle}>City: {selectedCity?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrapper}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search area in this city..."
                placeholderTextColor={COLORS.textMuted}
                value={areaSearch}
                onChangeText={setAreaSearch}
              />
            </View>

            <FlatList
              data={filteredAreas}
              keyExtractor={(item, index) => item._id || item.id || `area_${index}`}
              renderItem={({ item }) => {
                const isAssigned = item.hasActiveStore || item.isAvailable === false;
                const isSelected = selectedArea?._id === item._id || selectedArea?.name === item.name;

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isAssigned && styles.modalItemDisabled,
                      isSelected && styles.modalItemSelected,
                    ]}
                    onPress={() => handleSelectArea(item)}
                    activeOpacity={isAssigned ? 0.9 : 0.6}
                  >
                    <View style={styles.modalItemLeft}>
                      <View
                        style={[
                          styles.areaStatusCircle,
                          { backgroundColor: isAssigned ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' },
                        ]}
                      >
                        <Ionicons
                          name={isAssigned ? 'close' : 'checkmark'}
                          size={16}
                          color={isAssigned ? COLORS.danger : COLORS.success}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.modalItemName,
                            isAssigned && { color: COLORS.textMuted, textDecorationLine: 'line-through' },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.modalItemSub}>
                          {isAssigned
                            ? `❌ Assigned to ${item.assignedStore?.storeName || 'Active Dark Store'}`
                            : '✅ Available for Registration'}
                        </Text>
                      </View>
                    </View>

                    <View>
                      {isAssigned ? (
                        <View style={styles.badgeUnavailable}>
                          <Text style={styles.badgeUnavailableText}>ASSIGNED</Text>
                        </View>
                      ) : isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      ) : (
                        <View style={styles.badgeAvailable}>
                          <Text style={styles.badgeAvailableText}>SELECT</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No areas found for this city.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Registration Success Modal */}
      <Modal visible={!!registeredStoreData} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            </View>

            <Text style={styles.successTitle}>Store Registered!</Text>
            <Text style={styles.successSubtitle}>
              Your dark store hub has been successfully created and linked to your selected zone.
            </Text>

            <View style={styles.credentialsBox}>
              <Text style={styles.credLabel}>YOUR STORE LOGIN ID</Text>
              <Text style={styles.credValue}>{registeredStoreData?.loginId}</Text>
              <Text style={styles.credHint}>Use this Store ID and your password to sign in</Text>

              <View style={styles.credDivider} />

              <View style={styles.credRow}>
                <Text style={styles.credKey}>Store:</Text>
                <Text style={styles.credValText}>{registeredStoreData?.storeName}</Text>
              </View>
              <View style={styles.credRow}>
                <Text style={styles.credKey}>City / Zone:</Text>
                <Text style={styles.credValText}>
                  {registeredStoreData?.cityName} • {registeredStoreData?.areaName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.proceedLoginBtn}
              onPress={() => {
                setRegisteredStoreData(null);
                setAuthStep('LOGIN');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedLoginText}>PROCEED TO LOGIN</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputWrapperSuccess: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  countryCodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countryCodeText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  passwordMatchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  passwordMatchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  disabledDropdown: {
    opacity: 0.45,
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  areaBadgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  areaBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loginRedirect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  redirectText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  modalItemDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cityBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cityBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  modalItemName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalItemSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  areaStatusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnavailable: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeUnavailableText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAvailableText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  // Success Card Modal
  successModalCard: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  successIconWrapper: {
    marginBottom: 12,
  },
  successTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  successSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  credentialsBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  credLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  credValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  credHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  credDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  credKey: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  credValText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  proceedLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
  },
  proceedLoginText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
