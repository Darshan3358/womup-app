import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { Address } from '../types';
import { AddressService } from '../services/addressService';
import { AuthService } from '../services/authService';
import { api } from '../services/api';
import { MapPicker } from '../components/MapPicker';

interface CityOption {
  id: string;
  name: string;
  code: string;
  state?: string;
  isServiceable?: boolean;
}

interface AreaOption {
  id: string;
  name: string;
  code?: string;
  city: string;
  cityId?: string;
  pincodes: string[];
  centerLat?: number;
  centerLng?: number;
}

const FALLBACK_CITIES: CityOption[] = [
  { id: 'city_ahm', name: 'Ahmedabad', code: 'AHM', state: 'Gujarat', isServiceable: true },
  { id: 'city_sur', name: 'Surat', code: 'SUR', state: 'Gujarat', isServiceable: true },
  { id: 'city_bdq', name: 'Vadodara', code: 'BDQ', state: 'Gujarat', isServiceable: true },
  { id: 'city_raj', name: 'Rajkot', code: 'RAJ', state: 'Gujarat', isServiceable: true },
  { id: 'city_gan', name: 'Gandhinagar', code: 'GAN', state: 'Gujarat', isServiceable: true },
];

const FALLBACK_AREAS: Record<string, AreaOption[]> = {
  Ahmedabad: [
    { id: 'area_ahm_1', name: 'Chandlodiya', city: 'Ahmedabad', pincodes: ['382481'], centerLat: 23.0805, centerLng: 72.5480 },
    { id: 'area_ahm_2', name: 'Tragad', city: 'Ahmedabad', pincodes: ['382470'], centerLat: 23.1189, centerLng: 72.5630 },
    { id: 'area_ahm_3', name: 'Prahlad Nagar', city: 'Ahmedabad', pincodes: ['380015'], centerLat: 23.0125, centerLng: 72.5110 },
    { id: 'area_ahm_4', name: 'Navrangpura', city: 'Ahmedabad', pincodes: ['380009'], centerLat: 23.0365, centerLng: 72.5610 },
    { id: 'area_ahm_5', name: 'Bopal', city: 'Ahmedabad', pincodes: ['380058'], centerLat: 23.0340, centerLng: 72.4635 },
    { id: 'area_ahm_6', name: 'Gota', city: 'Ahmedabad', pincodes: ['382481'], centerLat: 23.0950, centerLng: 72.5350 },
    { id: 'area_ahm_7', name: 'Vastrapur', city: 'Ahmedabad', pincodes: ['380015'], centerLat: 23.0350, centerLng: 72.5290 },
    { id: 'area_ahm_8', name: 'Satellite', city: 'Ahmedabad', pincodes: ['380015'], centerLat: 23.0280, centerLng: 72.5180 },
  ],
  Surat: [
    { id: 'area_sur_1', name: 'Vesu', city: 'Surat', pincodes: ['395007'], centerLat: 21.1418, centerLng: 72.7709 },
    { id: 'area_sur_2', name: 'Adajan', city: 'Surat', pincodes: ['395009'], centerLat: 21.1959, centerLng: 72.7933 },
    { id: 'area_sur_3', name: 'Varachha', city: 'Surat', pincodes: ['395006'], centerLat: 21.2185, centerLng: 72.8590 },
  ],
  Vadodara: [
    { id: 'area_bdq_1', name: 'Alkapuri', city: 'Vadodara', pincodes: ['390007'], centerLat: 22.3107, centerLng: 73.1706 },
    { id: 'area_bdq_2', name: 'Gotri', city: 'Vadodara', pincodes: ['390021'], centerLat: 22.3168, centerLng: 73.1436 },
    { id: 'area_bdq_3', name: 'Manjalpur', city: 'Vadodara', pincodes: ['390011'], centerLat: 22.2680, centerLng: 73.1950 },
  ],
};

export const S11_AddAddressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    user,
    selectedAddress,
    setSelectedAddress,
    addAddress,
    setDeliveryLocation,
    goBack,
  } = useApp();

  const [fullName, setFullName] = useState(selectedAddress.fullName || user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(selectedAddress.phoneNumber || user.phoneNumber || '');
  const [houseFlat, setHouseFlat] = useState(selectedAddress.houseFlat || '');
  const [streetArea, setStreetArea] = useState(selectedAddress.areaLandmark || '');

  // Pre-fill city from preferred city
  const initialCityName = user.preferredCityName || selectedAddress.city || 'Ahmedabad';
  const [selectedCity, setSelectedCity] = useState<CityOption>({
    id: user.preferredCityId || 'city_ahm',
    name: initialCityName,
    code: 'AHM',
    state: 'Gujarat',
    isServiceable: true,
  });

  const [selectedArea, setSelectedArea] = useState<AreaOption | null>(null);
  const [pincode, setPincode] = useState(selectedAddress.pincode || '382481');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [mapCoords, setMapCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: selectedAddress.latitude || 23.0805,
    longitude: selectedAddress.longitude || 72.5480,
  });

  // Modals state
  const [cities, setCities] = useState<CityOption[]>(FALLBACK_CITIES);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isAreaModalVisible, setIsAreaModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // Unserviceable Zone Modal (Change 9)
  const [unserviceableCity, setUnserviceableCity] = useState<string | null>(null);
  const [isUnserviceableModalVisible, setIsUnserviceableModalVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Fetch cities from API
  useEffect(() => {
    AuthService.getCities().then((data) => {
      if (data && data.length > 0) {
        const mapped = data.map((c) => ({
          ...c,
          isServiceable: true,
        }));
        setCities(mapped);
        const match = mapped.find(
          (c) => c.name.toLowerCase() === initialCityName.toLowerCase() || c.id === user.preferredCityId
        );
        if (match) {
          setSelectedCity(match);
        }
      }
    });
  }, [user.preferredCityId, user.preferredCityName]);

  // 2. Fetch areas cascading from selected city
  useEffect(() => {
    fetchAreasForCity(selectedCity);
  }, [selectedCity]);

  const fetchAreasForCity = async (city: CityOption) => {
    try {
      const res = await api.get<any>(`/location/areas?cityId=${city.id}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mappedAreas: AreaOption[] = res.data.map((a: any) => ({
          id: a._id || a.id,
          name: a.name,
          code: a.code,
          city: a.city || city.name,
          cityId: a.cityId,
          pincodes: a.pincodes || ['380015'],
          centerLat: a.centerLat,
          centerLng: a.centerLng,
        }));
        setAreas(mappedAreas);
        if (mappedAreas.length > 0) {
          setSelectedArea(mappedAreas[0]);
          if (mappedAreas[0].pincodes && mappedAreas[0].pincodes.length > 0) {
            setPincode(mappedAreas[0].pincodes[0]);
          }
        }
        return;
      }
    } catch (e) {
      console.warn('Failed to load live areas for city:', e);
    }

    // Fallback areas if API returns empty
    const fallbackList = FALLBACK_AREAS[city.name] || [
      { id: `${city.name.toLowerCase()}_main`, name: `${city.name} Central`, city: city.name, pincodes: ['380001'], centerLat: 23.0225, centerLng: 72.5714 }
    ];
    setAreas(fallbackList);
    if (fallbackList.length > 0) {
      setSelectedArea(fallbackList[0]);
      setPincode(fallbackList[0].pincodes[0]);
    }
  };

  const [detectedStoreInfo, setDetectedStoreInfo] = useState<{
    areaName?: string;
    storeName?: string;
    storeCode?: string;
    isDetecting?: boolean;
    errorMessage?: string;
  }>({});

  const handleDetectArea = async (latitude: number, longitude: number) => {
    if (!latitude || !longitude) return;
    try {
      setDetectedStoreInfo((prev) => ({ ...prev, isDetecting: true, errorMessage: undefined }));
      const res: any = await api.post('/location/detect-area', {
        cityId: selectedCity?.id,
        lat: latitude,
        lng: longitude,
        latitude,
        longitude,
      });
      const detected = res?.data?.areaName || res?.areaName ? (res.data || res) : res;
      if (detected && detected.success && (detected.areaName || detected.area?.name)) {
        const aName = detected.areaName || detected.area?.name;
        const aId = detected.areaId || detected.area?.id;
        setDetectedStoreInfo({
          areaName: aName,
          storeName: detected.storeName,
          storeCode: detected.storeCode,
          isDetecting: false,
        });

        // Auto-fill the Area dropdown
        setAreas((currentAreas) => {
          const matched = currentAreas.find(
            (a) =>
              a.name.toLowerCase() === aName.toLowerCase() ||
              (aId && (a.id === aId || (a as any)._id === aId))
          );
          if (matched) {
            setSelectedArea(matched);
            if (matched.pincodes && matched.pincodes.length > 0) {
              setPincode(matched.pincodes[0]);
            }
          } else {
            const newAreaOpt: AreaOption = {
              id: aId || `area_${Date.now()}`,
              name: aName,
              city: detected.city || selectedCity.name,
              pincodes: ['380015'],
              centerLat: latitude,
              centerLng: longitude,
            };
            setSelectedArea(newAreaOpt);
            return [newAreaOpt, ...currentAreas];
          }
          return currentAreas;
        });

        if (errors.area) setErrors((prev) => ({ ...prev, area: '' }));
      } else {
        const errorMsg = detected?.message || 'Sorry, WormUp delivery is not available at this location.';
        setDetectedStoreInfo({
          areaName: undefined,
          storeName: undefined,
          storeCode: undefined,
          isDetecting: false,
          errorMessage: errorMsg,
        });
        setErrors((prev) => ({ ...prev, area: errorMsg }));
      }
    } catch (err) {
      console.warn('Backend GeoJSON area detection failed:', err);
      setDetectedStoreInfo((prev) => ({ ...prev, isDetecting: false }));
    }
  };

  useEffect(() => {
    if (mapCoords.latitude && mapCoords.longitude) {
      handleDetectArea(mapCoords.latitude, mapCoords.longitude);
    }
  }, []);

  const handleSelectCity = (cityItem: CityOption) => {
    if (cityItem.isServiceable === false) {
      // Show Change 9 unserviceable notification
      setIsCityModalVisible(false);
      setUnserviceableCity(cityItem.name);
      setIsUnserviceableModalVisible(true);
      return;
    }

    setSelectedCity(cityItem);
    setIsCityModalVisible(false);
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  const handleSelectArea = (areaItem: AreaOption) => {
    setSelectedArea(areaItem);
    setIsAreaModalVisible(false);
    if (areaItem.pincodes && areaItem.pincodes.length > 0) {
      setPincode(areaItem.pincodes[0]);
    }
    if (errors.area) setErrors((prev) => ({ ...prev, area: '' }));
  };

  const handleNotifyMe = () => {
    setIsUnserviceableModalVisible(false);
    Alert.alert(
      'Notification Saved',
      `Thank you! We've noted your interest. We'll notify you as soon as Worm Up launches in ${unserviceableCity || 'your city'}.`
    );
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!houseFlat.trim()) newErrors.houseFlat = 'House / Flat number is required';
    if (!streetArea.trim()) newErrors.streetArea = 'Street / Landmark is required';
    if (!selectedCity) newErrors.city = 'Please select a city';
    if (!selectedArea) newErrors.area = 'Please select a delivery area';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    const resolvedLat = mapCoords.latitude || selectedArea?.centerLat || 23.0805;
    const resolvedLng = mapCoords.longitude || selectedArea?.centerLng || 72.5480;

    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      type: addressType,
      fullName: fullName || user.fullName || 'Customer',
      phoneNumber: phoneNumber || user.phoneNumber || '',
      houseFlat: houseFlat.trim(),
      areaLandmark: streetArea.trim() || selectedArea?.name || '',
      city: selectedCity.name,
      cityId: selectedCity.id,
      areaId: selectedArea?.id,
      pincode: pincode || '380015',
      isDefault: true,
      latitude: resolvedLat,
      longitude: resolvedLng,
    };

    addAddress(newAddress);
    setSelectedAddress(newAddress);
    setDeliveryLocation(`${addressType} — ${selectedArea?.name || selectedCity.name}`);

    try {
      await AddressService.saveAddress({
        type: addressType,
        fullName: newAddress.fullName,
        phoneNumber: newAddress.phoneNumber,
        houseFlat: newAddress.houseFlat,
        areaLandmark: newAddress.areaLandmark,
        city: newAddress.city,
        pincode: newAddress.pincode,
        isDefault: true,
        latitude: resolvedLat,
        longitude: resolvedLng,
      });

      await AddressService.checkServiceability(resolvedLat, resolvedLng);
    } catch (e) {
      console.warn('Address sync error:', e);
    } finally {
      setSaving(false);
      setActiveScreen('Blinkit_Home');
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(areaSearchQuery.toLowerCase()) ||
    (a.pincodes && a.pincodes.some((p) => p.includes(areaSearchQuery)))
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <Header title="Add New Address" onBack={goBack} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputContainer, errors.fullName ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.secondaryText}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
            />
          </View>
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* House / Flat Number */}
          <Text style={styles.label}>House / Flat Number <Text style={styles.star}>*</Text></Text>
          <View style={[styles.inputContainer, errors.houseFlat ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 402, Shivalik Highstreet"
              placeholderTextColor={COLORS.secondaryText}
              value={houseFlat}
              onChangeText={(text) => {
                setHouseFlat(text);
                if (errors.houseFlat) setErrors((prev) => ({ ...prev, houseFlat: '' }));
              }}
            />
          </View>
          {errors.houseFlat ? <Text style={styles.errorText}>{errors.houseFlat}</Text> : null}

          {/* Street / Area */}
          <Text style={styles.label}>Street / Landmark <Text style={styles.star}>*</Text></Text>
          <View style={[styles.inputContainer, errors.streetArea ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near SP Ring Road, Tragad Road"
              placeholderTextColor={COLORS.secondaryText}
              value={streetArea}
              onChangeText={(text) => {
                setStreetArea(text);
                if (errors.streetArea) setErrors((prev) => ({ ...prev, streetArea: '' }));
              }}
            />
          </View>
          {errors.streetArea ? <Text style={styles.errorText}>{errors.streetArea}</Text> : null}

          {/* City Dropdown (Auto-filled from user's preferred city) */}
          <Text style={styles.label}>City <Text style={styles.star}>*</Text></Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsCityModalVisible(true)}
            style={[styles.inputContainer, styles.dropdownContainer, errors.city ? styles.inputError : null]}
          >
            <View style={styles.dropdownLeft}>
              <Text style={styles.dropdownEmoji}>🏙️</Text>
              <Text style={styles.dropdownValueText}>{selectedCity.name}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          {/* Area Dropdown (Cascades from City) */}
          <Text style={styles.label}>Area <Text style={styles.star}>*</Text></Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsAreaModalVisible(true)}
            style={[styles.inputContainer, styles.dropdownContainer, errors.area ? styles.inputError : null]}
          >
            <View style={styles.dropdownLeft}>
              <Text style={styles.dropdownEmoji}>📍</Text>
              <Text style={styles.dropdownValueText}>
                {selectedArea ? selectedArea.name : 'Select Delivery Area'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}

          {/* Auto-detected boundary badge or outside service area alert */}
          {detectedStoreInfo.areaName ? (
            <View style={styles.detectedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.detectedBadgeText}>
                GeoJSON Boundary: <Text style={styles.detectedBold}>{detectedStoreInfo.areaName}</Text>
                {detectedStoreInfo.storeName ? ` • ${detectedStoreInfo.storeName}` : ''}
              </Text>
            </View>
          ) : detectedStoreInfo.isDetecting ? (
            <View style={styles.detectedBadge}>
              <Ionicons name="sync-outline" size={14} color="#2563EB" />
              <Text style={[styles.detectedBadgeText, { color: '#2563EB' }]}>
                Detecting zone from GeoJSON boundaries...
              </Text>
            </View>
          ) : detectedStoreInfo.errorMessage ? (
            <View style={[styles.detectedBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.detectedBadgeText, { color: '#B91C1C' }]}>
                {detectedStoreInfo.errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Pincode (Auto-filled from selected Area) */}
          <Text style={styles.label}>Pincode</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 382481"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
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
                  <Text style={[styles.typePillText, selected && styles.typePillTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Map Pinning */}
          <Text style={[styles.label, { marginTop: 16 }]}>
            Pin Exact Delivery Location <Text style={styles.star}>*</Text>
          </Text>
          <MapPicker
            initialLatitude={mapCoords.latitude}
            initialLongitude={mapCoords.longitude}
            onLocationSelect={(coords) => {
              setMapCoords({ latitude: coords.latitude, longitude: coords.longitude });
              if (coords.address && !streetArea) {
                setStreetArea(coords.address);
              }
              handleDetectArea(coords.latitude, coords.longitude);
            }}
            confirmLabel="Confirm Pin Location"
            pinTitle="Delivery Dropoff"
          />

          {/* Save Address CTA */}
          <GradientButton
            title={saving ? 'Saving Address...' : 'Save Address'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </View>

      {/* City Picker Modal */}
      <Modal
        visible={isCityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Select City</Text>
                <Text style={styles.sheetSubtitle}>Choose operational service city</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city..."
                placeholderTextColor={COLORS.secondaryText}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedCity.name === item.name;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectCity(item)}
                    style={[styles.cityRowItem, isSelected && styles.cityRowItemSelected]}
                  >
                    <View style={styles.cityRowLeft}>
                      <Text style={styles.cityEmoji}>🏙️</Text>
                      <View>
                        <Text style={[styles.cityNameText, isSelected && styles.cityNameTextSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.cityStateText}>{item.state || 'Gujarat'}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.hotPink} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Area Picker Modal */}
      <Modal
        visible={isAreaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAreaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Select Area in {selectedCity.name}</Text>
                <Text style={styles.sheetSubtitle}>Pick your hyper-local delivery zone</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAreaModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search area or pincode..."
                placeholderTextColor={COLORS.secondaryText}
                value={areaSearchQuery}
                onChangeText={setAreaSearchQuery}
              />
            </View>

            <FlatList
              data={filteredAreas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedArea?.id === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectArea(item)}
                    style={[styles.cityRowItem, isSelected && styles.cityRowItemSelected]}
                  >
                    <View style={styles.cityRowLeft}>
                      <Text style={styles.cityEmoji}>📍</Text>
                      <View>
                        <Text style={[styles.cityNameText, isSelected && styles.cityNameTextSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.cityStateText}>
                          Pincode: {item.pincodes.join(', ') || '380015'}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.hotPink} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Change 9: Service Not Available Modal */}
      <Modal
        visible={isUnserviceableModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsUnserviceableModalVisible(false)}
      >
        <View style={styles.unserviceableOverlay}>
          <View style={styles.unserviceableCard}>
            <View style={styles.unserviceableIconWrap}>
              <Text style={{ fontSize: 32 }}>📍</Text>
            </View>

            <Text style={styles.unserviceableHeading}>Service Not Available</Text>
            <Text style={styles.unserviceableMessage}>
              Sorry, we don't deliver to {unserviceableCity || 'this city'} yet.
            </Text>

            <View style={styles.operatingBox}>
              <Text style={styles.operatingTitle}>We're currently operating in:</Text>
              <Text style={styles.operatingBullet}>• Ahmedabad</Text>
              <Text style={styles.operatingBullet}>• Surat</Text>
              <Text style={styles.operatingBullet}>• Vadodara</Text>
            </View>

            <GradientButton
              title="Notify Me When Available"
              onPress={handleNotifyMe}
              style={styles.notifyBtn}
            />

            <TouchableOpacity
              onPress={() => {
                setIsUnserviceableModalVisible(false);
                setIsCityModalVisible(true);
              }}
              style={styles.chooseDifferentBtn}
            >
              <Text style={styles.chooseDifferentText}>Choose Different City</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  star: {
    color: COLORS.hotPink,
    fontWeight: '700',
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
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 3,
    marginLeft: 4,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownEmoji: {
    fontSize: 16,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
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
    marginTop: SPACING.md,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
    paddingHorizontal: SPACING.md,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  cityRowItemSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF0F7',
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityEmoji: {
    fontSize: 18,
  },
  cityNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cityNameTextSelected: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  cityStateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Change 9: Unserviceable Modal Styles
  unserviceableOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  unserviceableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  unserviceableIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unserviceableHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  unserviceableMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  operatingBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  operatingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  operatingBullet: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  notifyBtn: {
    width: '100%',
    marginBottom: 10,
  },
  chooseDifferentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chooseDifferentText: {
    fontSize: 14,
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: -8,
    marginBottom: 12,
    gap: 6,
  },
  detectedBadgeText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  detectedBold: {
    fontWeight: '700',
    color: '#047857',
  },
});
