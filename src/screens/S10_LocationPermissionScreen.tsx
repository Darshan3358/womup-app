import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { LocationService, DetectedLocation } from '../services/locationService';

export const S10_LocationPermissionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    goBack,
    setDeliveryLocation,
    setSelectedAddress,
    user,
    setUser,
    setCurrentArea,
    setCurrentStore,
    setCurrentCityName,
    setIsServiceable,
    setDeliveryEtaMinutes,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [cityMismatchModal, setCityMismatchModal] = useState<{
    visible: boolean;
    detectedCity: string;
    loc: DetectedLocation;
    resolvedArea?: any;
  }>({
    visible: false,
    detectedCity: '',
    loc: null as any,
  });

  const applyLocation = (loc: DetectedLocation, area: any, chosenCity: string) => {
    const shortLabel = loc.shortAddress || loc.readableAddress;
    setDeliveryLocation(`Current Location — ${shortLabel}`);
    setCurrentCityName(chosenCity);

    if (area) {
      setCurrentArea(area.areaId, area.areaName);
      if (area.storeId) {
        setCurrentStore(area.storeId, area.storeName || null);
      }
      setIsServiceable(area.serviceable === true);
      setDeliveryEtaMinutes(area.deliveryMinutes || 9);
    }

    setSelectedAddress({
      id: `current_${Date.now()}`,
      type: 'Current',
      fullName: user.fullName || 'Customer',
      phoneNumber: user.phoneNumber || '',
      houseFlat: loc.street || 'Current GPS Location',
      areaLandmark: loc.areaLandmark || loc.shortAddress,
      city: chosenCity,
      pincode: loc.pincode || '380015',
      latitude: loc.latitude,
      longitude: loc.longitude,
      isDefault: true,
    });

    setActiveScreen('Blinkit_Home');
  };

  const handleAllowLocation = async () => {
    setLoading(true);
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        const area = await LocationService.resolveArea(loc.latitude, loc.longitude, true);
        const detectedCity = area?.city || loc.city;
        const preferredCity = user.preferredCityName || 'Ahmedabad';

        // Check if GPS detected city differs from preferred city
        if (
          detectedCity &&
          preferredCity &&
          detectedCity.toLowerCase() !== preferredCity.toLowerCase()
        ) {
          setLoading(false);
          setCityMismatchModal({
            visible: true,
            detectedCity,
            loc,
            resolvedArea: area,
          });
          return;
        }

        applyLocation(loc, area, detectedCity || preferredCity);
      } else {
        fallbackToPreferredCity();
      }
    } catch (e) {
      console.warn('Location permission detection error:', e);
      fallbackToPreferredCity();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToPreferredCity = async () => {
    const preferredCity = user.preferredCityName || 'Ahmedabad';
    setCurrentCityName(preferredCity);
    setDeliveryLocation(`📍 ${preferredCity}`);

    // Resolve default area
    const area = await LocationService.resolveArea(undefined, undefined, true);
    if (area) {
      setCurrentArea(area.areaId, area.areaName);
      if (area.storeId) {
        setCurrentStore(area.storeId, area.storeName || null);
      }
      setIsServiceable(area.serviceable === true);
      setDeliveryEtaMinutes(area.deliveryMinutes || 9);
    }

    setSelectedAddress({
      id: `fallback_${Date.now()}`,
      type: 'Home',
      fullName: user.fullName || 'Customer',
      phoneNumber: user.phoneNumber || '',
      houseFlat: 'Central Area',
      areaLandmark: area?.areaName || 'Main Hub',
      city: preferredCity,
      pincode: '380015',
      latitude: 23.0225,
      longitude: 72.5714,
      isDefault: true,
    });

    setActiveScreen('Blinkit_Home');
  };

  const handleSwitchCity = () => {
    const { detectedCity, loc, resolvedArea } = cityMismatchModal;
    setCityMismatchModal((prev) => ({ ...prev, visible: false }));
    setUser((prev) => ({ ...prev, preferredCityName: detectedCity }));
    applyLocation(loc, resolvedArea, detectedCity);
  };

  const handleKeepPreferredCity = () => {
    const { loc, resolvedArea } = cityMismatchModal;
    const preferredCity = user.preferredCityName || 'Ahmedabad';
    setCityMismatchModal((prev) => ({ ...prev, visible: false }));
    applyLocation(loc, resolvedArea, preferredCity);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Allow Location Access</Text>
        <Text style={styles.subtitle}>
          We need your location to show nearby stores and provide accurate fast delivery.
        </Text>

        {/* Map / Pin Illustration from assets */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/Loctionimage.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <GradientButton
          title={loading ? 'Detecting Location...' : 'Allow Location'}
          onPress={handleAllowLocation}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={fallbackToPreferredCity}
          style={styles.notNowButton}
        >
          <Text style={styles.notNowText}>Not Now (Use {user.preferredCityName || 'Ahmedabad'})</Text>
        </TouchableOpacity>
      </View>

      {/* City Mismatch Confirmation Modal (Change 5) */}
      <Modal
        visible={cityMismatchModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCityMismatchModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.mismatchIconCircle}>
              <Text style={{ fontSize: 30 }}>🏙️</Text>
            </View>
            <Text style={styles.mismatchTitle}>City Location Detected</Text>
            <Text style={styles.mismatchText}>
              You selected <Text style={styles.boldText}>{user.preferredCityName || 'Ahmedabad'}</Text> during registration, but GPS shows you are currently in <Text style={styles.boldText}>{cityMismatchModal.detectedCity}</Text>.
            </Text>
            <Text style={styles.mismatchQuestion}>
              Would you like to switch your service city to {cityMismatchModal.detectedCity}?
            </Text>

            <GradientButton
              title={`Switch to ${cityMismatchModal.detectedCity}`}
              onPress={handleSwitchCity}
              style={{ width: '100%', marginBottom: 10 }}
            />

            <TouchableOpacity
              onPress={handleKeepPreferredCity}
              style={styles.keepBtn}
            >
              <Text style={styles.keepBtnText}>
                Keep {user.preferredCityName || 'Ahmedabad'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  imageContainer: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '90%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  button: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  notNowButton: {
    padding: SPACING.sm,
  },
  notNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Mismatch Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  mismatchIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mismatchTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  mismatchText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  mismatchQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 18,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  keepBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  keepBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
