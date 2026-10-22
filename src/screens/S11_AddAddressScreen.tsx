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
import { LocationService } from '../services/locationService';

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
  pincode?: string;
  centerLat?: number;
  centerLng?: number;
  assignedStore?: {
    storeId: string;
    storeName: string;
    storeCode?: string;
  } | null;
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
    {
      id: 'area_ahm_prahlad_nagar',
      name: 'Prahlad Nagar',
      code: 'AREA-PRAHLAD_NAGAR',
      city: 'Ahmedabad',
      pincodes: ['380015'],
      centerLat: 23.0125,
      centerLng: 72.5082,
      assignedStore: {
        storeId: 'store_prahlad_nagar',
        storeName: 'Wom Up Prahlad Nagar Dark Store',
        storeCode: 'STORE-PRAHLAD_NAGAR',
      },
    },
    {
      id: 'area_ahm_satellite',
      name: 'Satellite',
      code: 'AREA-SATELLITE',
      city: 'Ahmedabad',
      pincodes: ['380015'],
      centerLat: 23.0280,
      centerLng: 72.5180,
      assignedStore: {
        storeId: 'store_satellite',
        storeName: 'Wom Up Satellite Dark Store',
        storeCode: 'STORE-SATELLITE',
      },
    },
    {
      id: 'area_ahm_navrangpura',
      name: 'Navrangpura',
      code: 'AREA-NAVRANGPURA',
      city: 'Ahmedabad',
      pincodes: ['380009'],
      centerLat: 23.0365,
      centerLng: 72.5610,
      assignedStore: {
        storeId: 'store_navrangpura',
        storeName: 'Wom Up Navrangpura Dark Store',
        storeCode: 'STORE-NAVRANGPURA',
      },
    },
    {
      id: 'area_ahm_ghatlodia',
      name: 'Ghatlodia',
      code: 'AREA-GHATLODIA',
      city: 'Ahmedabad',
      pincodes: ['380061'],
      centerLat: 23.0750,
      centerLng: 72.5350,
      assignedStore: {
        storeId: 'store_ghatlodia',
        storeName: 'Wom Up Ghatlodia Dark Store',
        storeCode: 'STORE-GHATLODIA',
      },
    },
    {
      id: 'area_ahm_bopal',
      name: 'Bopal',
      code: 'AREA-BOPAL',
      city: 'Ahmedabad',
      pincodes: ['380058'],
      centerLat: 23.0340,
      centerLng: 72.4635,
      assignedStore: {
        storeId: 'store_bopal',
        storeName: 'Wom Up Bopal Dark Store',
        storeCode: 'STORE-BOPAL',
      },
    },
    {
      id: 'area_ahm_sg_highway',
      name: 'SG Highway',
      code: 'AREA-SG_HIGHWAY',
      city: 'Ahmedabad',
      pincodes: ['380054'],
      centerLat: 23.0300,
      centerLng: 72.5050,
      assignedStore: {
        storeId: 'store_sg_highway',
        storeName: 'Wom Up SG Highway Dark Store',
        storeCode: 'STORE-SG_HIGHWAY',
      },
    },
    {
      id: 'area_ahm_thaltej',
      name: 'Thaltej',
      code: 'AREA-THALTEJ',
      city: 'Ahmedabad',
      pincodes: ['380059'],
      centerLat: 23.0500,
      centerLng: 72.5160,
      assignedStore: {
        storeId: 'store_thaltej',
        storeName: 'Wom Up Thaltej Dark Store',
        storeCode: 'STORE-THALTEJ',
      },
    },
    {
      id: 'area_ahm_vastrapur',
      name: 'Vastrapur',
      code: 'AREA-VASTRAPUR',
      city: 'Ahmedabad',
      pincodes: ['380015'],
      centerLat: 23.0350,
      centerLng: 72.5290,
      assignedStore: {
        storeId: 'store_vastrapur',
        storeName: 'Wom Up Vastrapur Dark Store',
        storeCode: 'STORE-VASTRAPUR',
      },
    },
    {
      id: 'area_ahm_chandlodiya_tragad',
      name: 'Chandlodiya - Tragad',
      code: 'AREA-CHANDLODIYA_TRAGAD',
      city: 'Ahmedabad',
      pincodes: ['382481', '382470'],
      centerLat: 23.1150,
      centerLng: 72.5450,
      assignedStore: {
        storeId: 'store_chandlodiya_tragad',
        storeName: 'Wom Up Chandlodiya - Tragad Dark Store',
        storeCode: 'STORE-CHANDLODIYA_TRAGAD',
      },
    },
    {
      id: 'area_ahm_chandlodia',
      name: 'Chandlodia',
      code: 'AREA-CHANDLODIA',
      city: 'Ahmedabad',
      pincodes: ['382481'],
      centerLat: 23.0805,
      centerLng: 72.5480,
      assignedStore: {
        storeId: 'store_chandlodiya_tragad',
        storeName: 'Wom Up Chandlodiya Dark Store',
        storeCode: 'STORE-CHANDLODIYA',
      },
    },
    {
      id: 'area_ahm_tragad',
      name: 'Tragad',
      code: 'AREA-TRAGAD',
      city: 'Ahmedabad',
      pincodes: ['382470'],
      centerLat: 23.1189,
      centerLng: 72.5630,
      assignedStore: {
        storeId: 'store_chandlodiya_tragad',
        storeName: 'Wom Up Tragad Dark Store',
        storeCode: 'STORE-TRAGAD',
      },
    },
    {
      id: 'area_ahm_maninagar',
      name: 'Maninagar',
      code: 'AREA-MANINAGAR',
      city: 'Ahmedabad',
      pincodes: ['380008'],
      centerLat: 22.9978,
      centerLng: 72.6033,
      assignedStore: {
        storeId: 'store_maninagar',
        storeName: 'Wom Up Maninagar Dark Store',
        storeCode: 'STORE-MANINAGAR',
      },
    },
    {
      id: 'area_ahm_paldi',
      name: 'Paldi',
      code: 'AREA-PALDI',
      city: 'Ahmedabad',
      pincodes: ['380007'],
      centerLat: 23.0129,
      centerLng: 72.5632,
      assignedStore: {
        storeId: 'store_paldi',
        storeName: 'Wom Up Paldi Dark Store',
        storeCode: 'STORE-PALDI',
      },
    },
    {
      id: 'area_ahm_ramol',
      name: 'Ramol',
      code: 'AREA-RAMOL',
      city: 'Ahmedabad',
      pincodes: ['382449'],
      centerLat: 22.9850,
      centerLng: 72.6450,
      assignedStore: {
        storeId: 'store_ramol',
        storeName: 'Wom Up Ramol Dark Store',
        storeCode: 'STORE-RAMOL',
      },
    },
    {
      id: 'area_ahm_hathijan_vatva',
      name: 'Hathijan / Vatva side',
      code: 'AREA-HATHIJAN_VATVA',
      city: 'Ahmedabad',
      pincodes: ['382440'],
      centerLat: 22.9650,
      centerLng: 72.6350,
      assignedStore: {
        storeId: 'store_vatva',
        storeName: 'Wom Up Vatva Dark Store',
        storeCode: 'STORE-VATVA',
      },
    },
    {
      id: 'area_ahm_lambha',
      name: 'Lambha',
      code: 'AREA-LAMBHA',
      city: 'Ahmedabad',
      pincodes: ['382440'],
      centerLat: 22.9450,
      centerLng: 72.5950,
      assignedStore: {
        storeId: 'store_lambha',
        storeName: 'Wom Up Lambha Dark Store',
        storeCode: 'STORE-LAMBHA',
      },
    },
    {
      id: 'area_ahm_isanpur',
      name: 'Isanpur',
      code: 'AREA-ISANPUR',
      city: 'Ahmedabad',
      pincodes: ['382443'],
      centerLat: 22.9820,
      centerLng: 72.5980,
      assignedStore: {
        storeId: 'store_isanpur',
        storeName: 'Wom Up Isanpur Dark Store',
        storeCode: 'STORE-ISANPUR',
      },
    },
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
    latitude: selectedAddress.latitude || 23.1150,
    longitude: selectedAddress.longitude || 72.5450,
  });

  // Track the authoritative selected area ID and request sequence to prevent stale async overwrites
  const selectedAreaIdRef = React.useRef<string | null>(null);
  const requestSequenceRef = React.useRef<number>(0);

  // Modals state
  const [cities, setCities] = useState<CityOption[]>(FALLBACK_CITIES);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // Unserviceable Zone Modal (Change 9)
  const [unserviceableCity, setUnserviceableCity] = useState<string | null>(null);
  const [isUnserviceableModalVisible, setIsUnserviceableModalVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [detectedStoreInfo, setDetectedStoreInfo] = useState<{
    areaName?: string;
    storeName?: string;
    storeCode?: string;
    storeId?: string;
    isServiceable?: boolean;
    isDetecting?: boolean;
    errorMessage?: string;
    status?: string;
    distanceKm?: number;
    maxDistanceKm?: number;
  }>({});

  // Helper to reliably extract the PIN code from an area record
  const getAreaPincode = (areaItem: AreaOption | null | undefined): string => {
    if (!areaItem) return '';
    if (Array.isArray(areaItem.pincodes) && areaItem.pincodes.length > 0 && areaItem.pincodes[0]) {
      return areaItem.pincodes[0].trim();
    }
    if (areaItem.pincode && typeof areaItem.pincode === 'string') {
      return areaItem.pincode.trim();
    }
    return '';
  };

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

  // 2. Fetch areas for reference (without overriding coordinates)
  useEffect(() => {
    fetchAreasForCity(selectedCity);
  }, [selectedCity]);

  const fetchAreasForCity = async (city: CityOption) => {
    try {
      const res = await api.get<any>(`/location/areas?cityId=${city.id}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const loadedAreas = res.data.map((a: any) => ({
          id: a._id || a.id,
          name: a.name,
          code: a.code,
          city: a.city || city.name,
          cityId: a.cityId,
          pincodes: Array.isArray(a.pincodes) && a.pincodes.length > 0
            ? a.pincodes
            : (a.pincode ? [a.pincode] : []),
          pincode: a.pincode || (a.pincodes?.[0]),
          centerLat: a.centerLat,
          centerLng: a.centerLng,
          assignedStore: a.assignedStore,
        }));
        setAreas(loadedAreas);
      } else {
        setAreas(FALLBACK_AREAS[city.name] || []);
      }
    } catch (e) {
      console.warn('Failed to load live areas for city:', e);
      setAreas(FALLBACK_AREAS[city.name] || []);
    }
  };

  /**
   * Spatial GeoJSON boundary query from map coordinates with stale response guard.
   * Directly detects area, PIN code, and active serving dark store from coordinates.
   */
  const detectAreaForLocation = async (
    latitude: number,
    longitude: number,
    sequence?: number
  ) => {
    if (!latitude || !longitude) return;
    const currentSeq = sequence ?? ++requestSequenceRef.current;

    try {
      setDetectedStoreInfo((prev) => ({ ...prev, isDetecting: true, errorMessage: undefined }));
      const res: any = await api.post('/location/detect-area', {
        cityId: selectedCity?.id,
        lat: latitude,
        lng: longitude,
        latitude,
        longitude,
      });

      // Stale response guard: discard if another request started since
      if (currentSeq !== requestSequenceRef.current) {
        return;
      }

      const detected =
        res?.data?.areaName || res?.areaName || res?.data?.location?.areaName || res?.location?.areaName
          ? (res.data || res)
          : res;

      if (detected && detected.success && (detected.areaName || detected.area?.name || detected.location?.areaName)) {
        const aName = detected.location?.areaName || detected.areaName || detected.area?.name;
        const aId = detected.location?.areaId || detected.areaId || detected.area?.id;
        const isServiceable = detected.serviceability
          ? detected.serviceability.available === true
          : (detected.serviceable === true && Boolean(detected.storeId || detected.storeName));
        const status =
          detected.serviceability?.status ||
          detected.status ||
          (isServiceable ? 'AVAILABLE' : (detected.distanceKm ? 'OUT_OF_RANGE' : 'NO_ACTIVE_STORE'));
        const resolvedPin = detected.location?.pincode || detected.pincode;

        const errMsg = !isServiceable
          ? (detected.serviceability?.message || detected.message || `Service not available in ${aName}.`)
          : undefined;

        setDetectedStoreInfo({
          areaName: aName,
          storeName: isServiceable ? (detected.storeName || detected.serviceability?.nearestStore?.name) : undefined,
          storeCode: detected.storeCode,
          storeId: isServiceable ? detected.storeId : undefined,
          isServiceable,
          isDetecting: false,
          errorMessage: errMsg,
          status,
          distanceKm: detected.distanceKm ?? detected.serviceability?.nearestStore?.distanceKm,
          maxDistanceKm: detected.maxDistanceKm ?? detected.serviceability?.nearestStore?.maxDistanceKm,
        });

        const detectedPincodes =
          Array.isArray(detected.pincodes) && detected.pincodes.length > 0
            ? detected.pincodes
            : (resolvedPin ? [resolvedPin] : []);

        const newAreaOpt: AreaOption = {
          id: aId || `area_${Date.now()}`,
          name: aName,
          city: detected.city || selectedCity.name,
          pincodes: detectedPincodes,
          pincode: resolvedPin || detectedPincodes[0],
          centerLat: latitude,
          centerLng: longitude,
          assignedStore: isServiceable
            ? {
                storeId: detected.storeId || '',
                storeName: detected.storeName || `Wom Up ${aName} Dark Store`,
                storeCode: detected.storeCode,
              }
            : null,
        };

        selectedAreaIdRef.current = newAreaOpt.id;
        setSelectedArea(newAreaOpt);

        const finalPin = resolvedPin || (detectedPincodes.length > 0 ? detectedPincodes[0] : '');
        if (finalPin) {
          setPincode(finalPin);
          setErrors((prev) => ({ ...prev, pincode: '', area: '' }));
        } else {
          setPincode('');
        }
      } else {
        const errorMsg =
          detected?.serviceability?.message ||
          detected?.message ||
          'Service not available in this area.';
        setDetectedStoreInfo({
          areaName: undefined,
          storeName: undefined,
          storeCode: undefined,
          storeId: undefined,
          isServiceable: false,
          isDetecting: false,
          errorMessage: errorMsg,
          status: 'LOCATION_INVALID',
        });
        setSelectedArea(null);
        setPincode('');
        setErrors((prev) => ({ ...prev, area: errorMsg }));
      }
    } catch (err: any) {
      if (currentSeq !== requestSequenceRef.current) return;
      console.warn('Backend GeoJSON area detection failed:', err);
      setDetectedStoreInfo((prev) => ({
        ...prev,
        isDetecting: false,
        isServiceable: false,
        errorMessage: 'Unable to connect to delivery service. Please retry.',
      }));
    }
  };

  // Initial Location & Area Detection on Screen Open
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      // 1. If explicit coordinates exist in selectedAddress
      if (selectedAddress.latitude && selectedAddress.longitude) {
        setMapCoords({ latitude: selectedAddress.latitude, longitude: selectedAddress.longitude });
        detectAreaForLocation(selectedAddress.latitude, selectedAddress.longitude);
        return;
      }

      // 2. Auto-detect real GPS location of device
      try {
        const loc = await LocationService.getCurrentLocation();
        if (loc && isMounted) {
          setMapCoords({ latitude: loc.latitude, longitude: loc.longitude });
          if (loc.readableAddress && !streetArea) {
            setStreetArea(loc.readableAddress);
          }
          detectAreaForLocation(loc.latitude, loc.longitude);
          return;
        }
      } catch (err) {
        console.warn('Initial GPS auto-detect fallback:', err);
      }

      // 3. Fallback to default map coordinates if GPS is unavailable
      if (isMounted && mapCoords.latitude && mapCoords.longitude) {
        detectAreaForLocation(mapCoords.latitude, mapCoords.longitude);
      }
    };

    initLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCity = (cityItem: CityOption) => {
    if (cityItem.isServiceable === false) {
      setIsCityModalVisible(false);
      setUnserviceableCity(cityItem.name);
      setIsUnserviceableModalVisible(true);
      return;
    }

    setSelectedCity(cityItem);
    setIsCityModalVisible(false);
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  const handleNotifyMe = () => {
    setIsUnserviceableModalVisible(false);
    Alert.alert(
      'Notification Saved',
      `Thank you! We've noted your interest. We'll notify you as soon as Womup launches in ${unserviceableCity || 'your city'}.`
    );
  };

  const activeStoreName = detectedStoreInfo.storeName;
  const isDeliveryAvailable =
    !detectedStoreInfo.isDetecting &&
    detectedStoreInfo.isServiceable === true &&
    Boolean(detectedStoreInfo.storeName || detectedStoreInfo.storeId);

  const isDeliveryUnavailable =
    !detectedStoreInfo.isDetecting &&
    (detectedStoreInfo.isServiceable === false ||
      (!detectedStoreInfo.storeName && !detectedStoreInfo.storeId) ||
      Boolean(detectedStoreInfo.errorMessage));

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!houseFlat.trim()) newErrors.houseFlat = 'House / Flat number is required';
    if (!streetArea.trim()) newErrors.streetArea = 'Street / Landmark is required';
    if (!selectedCity) newErrors.city = 'Please select a city';

    // Strict area and PIN code validation
    if (!selectedArea || !selectedArea.id) {
      newErrors.area = 'Please select a valid delivery area';
    } else {
      const configuredPincode = getAreaPincode(selectedArea);
      const configuredList = selectedArea.pincodes || [];

      if (!configuredPincode) {
        newErrors.pincode = `Selected area "${selectedArea.name}" has no configured PIN code. Please select a serviceable area.`;
      } else if (pincode !== configuredPincode && !configuredList.includes(pincode)) {
        newErrors.pincode = `PIN code mismatch: ${pincode} does not belong to ${selectedArea.name} (${configuredPincode}). Re-select the area.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!isDeliveryAvailable || isDeliveryUnavailable) {
      Alert.alert(
        'Service Not Available',
        `Service not available in this area. ${detectedStoreInfo.errorMessage || 'No active dark store currently serves this location.'} Please move the pin to a serviceable location.`
      );
      return;
    }

    setSaving(true);
    const resolvedLat = mapCoords.latitude || selectedArea?.centerLat || 23.1150;
    const resolvedLng = mapCoords.longitude || selectedArea?.centerLng || 72.5450;

    try {
      // Revalidate location with backend before saving so stale coordinates cannot be submitted
      const verifyRes: any = await api.post('/location/detect-area', {
        cityId: selectedCity?.id,
        lat: resolvedLat,
        lng: resolvedLng,
        latitude: resolvedLat,
        longitude: resolvedLng,
      });

      const verified =
        verifyRes?.data?.areaName || verifyRes?.areaName || verifyRes?.data?.location?.areaName
          ? (verifyRes.data || verifyRes)
          : verifyRes;

      const isVerifiedServiceable =
        verified?.serviceability?.available === true ||
        (verified?.serviceable === true && Boolean(verified?.storeId || verified?.storeName));

      if (!verified || !verified.success || !isVerifiedServiceable) {
        setSaving(false);
        const errMsg =
          verified?.serviceability?.message ||
          verified?.message ||
          'Service not available in this area.';
        Alert.alert('Service Not Available', errMsg);
        return;
      }

      const verifiedAreaName = verified.location?.areaName || verified.areaName || selectedArea?.name || '';
      const verifiedAreaId = verified.location?.areaId || verified.areaId || selectedArea?.id || '';
      const verifiedPin = verified.location?.pincode || verified.pincode || pincode;
      const verifiedStoreId = verified.storeId || detectedStoreInfo.storeId || '';

      const newAddress: Address = {
        id: `addr_${Date.now()}`,
        type: addressType,
        fullName: fullName || user.fullName || 'Customer',
        phoneNumber: phoneNumber || user.phoneNumber || '',
        houseFlat: houseFlat.trim(),
        areaLandmark: streetArea.trim() || verifiedAreaName || '',
        city: selectedCity.name,
        cityId: selectedCity.id,
        areaId: verifiedAreaId,
        pincode: verifiedPin,
        isDefault: true,
        latitude: resolvedLat,
        longitude: resolvedLng,
      };

      addAddress(newAddress);
      setSelectedAddress(newAddress);
      setDeliveryLocation(`${addressType} — ${verifiedAreaName || selectedCity.name}`);

      await AddressService.saveAddress({
        type: addressType,
        fullName: newAddress.fullName,
        phoneNumber: newAddress.phoneNumber,
        houseFlat: newAddress.houseFlat,
        areaLandmark: newAddress.areaLandmark,
        city: newAddress.city,
        areaId: verifiedAreaId,
        areaName: verifiedAreaName,
        storeId: verifiedStoreId,
        pincode: newAddress.pincode,
        isDefault: true,
        latitude: resolvedLat,
        longitude: resolvedLng,
      });

      await AddressService.checkServiceability(resolvedLat, resolvedLng);
      setActiveScreen('Blinkit_Home');
    } catch (e: any) {
      console.warn('Address save & verify error:', e);
      Alert.alert('Error', e?.message || 'Could not verify delivery location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearchQuery.toLowerCase())
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

          {/* Area (Auto-detected from Map / GPS Coordinates, Non-editable) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
            <Text style={styles.label}>Area <Text style={styles.star}>*</Text></Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed" size={12} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Auto-detected</Text>
            </View>
          </View>
          <View style={[styles.inputContainer, styles.readOnlyContainer, errors.area ? styles.inputError : null]}>
            <View style={styles.dropdownLeft}>
              <Text style={styles.dropdownEmoji}>📍</Text>
              <Text style={[styles.readOnlyText, !selectedArea && { color: COLORS.textMuted }]}>
                {detectedStoreInfo.isDetecting
                  ? 'Detecting area...'
                  : selectedArea
                  ? selectedArea.name
                  : 'Service not available in this area'}
              </Text>
            </View>
            <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          </View>
          {errors.area ? <Text style={styles.errorText}>{errors.area}</Text> : null}

          {/* Pincode (Auto-detected from selected Area, Non-editable) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
            <Text style={styles.label}>Pincode <Text style={styles.star}>*</Text></Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed" size={12} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Auto-detected</Text>
            </View>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: '#F8FAFC', borderColor: errors.pincode ? '#EF4444' : '#E2E8F0', marginBottom: errors.pincode ? 4 : 8 }]}>
            <TextInput
              style={[styles.input, { color: pincode ? '#1E293B' : '#94A3B8', fontWeight: '700' }]}
              placeholder="Auto-detected PIN"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              editable={false}
            />
            <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          </View>
          {errors.pincode ? (
            <Text style={[styles.errorText, { marginTop: 0, marginBottom: 10 }]}>{errors.pincode}</Text>
          ) : null}

          {/* Delivery Serviceability Status (Dark Store Active vs Inactive) */}
          {detectedStoreInfo.isDetecting ? (
            <View style={[styles.serviceStatusBadge, styles.serviceDetectingBadge]}>
              <Ionicons name="sync-outline" size={15} color="#2563EB" />
              <Text style={styles.serviceDetectingText}>Checking delivery service in your area...</Text>
            </View>
          ) : isDeliveryAvailable ? (
            <View style={[styles.serviceStatusBadge, styles.serviceAvailableBadge]}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceAvailableText}>✓ Delivery available in your area</Text>
                {activeStoreName ? (
                  <Text style={styles.serviceAvailableStoreText}>Assigned Dark Store: {activeStoreName}</Text>
                ) : null}
              </View>
            </View>
          ) : isDeliveryUnavailable ? (
            <View style={[styles.serviceStatusBadge, styles.serviceUnavailableBadge]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceUnavailableText}>Service not available in this area</Text>
                <Text style={styles.serviceUnavailableSubText}>
                  {detectedStoreInfo.errorMessage || `No active dark store currently serves ${selectedArea?.name || 'this area'}. Delivery cannot be fulfilled here.`}
                </Text>
              </View>
            </View>
          ) : null}

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
              detectAreaForLocation(coords.latitude, coords.longitude);
            }}
            confirmLabel="Confirm Pin Location"
            pinTitle="Delivery Dropoff"
          />

          {/* Save Address CTA */}
          <GradientButton
            title={
              saving
                ? 'Saving Address...'
                : isDeliveryUnavailable
                ? 'Service Not Available in this Area'
                : 'Save Address'
            }
            onPress={handleSave}
            loading={saving}
            disabled={isDeliveryUnavailable}
            style={[
              styles.saveButton,
              isDeliveryUnavailable ? { opacity: 0.6 } : null,
            ]}
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
  readOnlyContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
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
  serviceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
  },
  serviceAvailableBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  serviceAvailableText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  serviceAvailableStoreText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    fontWeight: '500',
  },
  serviceUnavailableBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  serviceUnavailableText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  serviceUnavailableSubText: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  serviceDetectingBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  serviceDetectingText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
});
