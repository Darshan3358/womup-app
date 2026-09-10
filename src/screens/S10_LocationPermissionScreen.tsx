import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { LocationService } from '../services/locationService';

export const S10_LocationPermissionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, goBack, setDeliveryLocation, setSelectedAddress, user } = useApp();
  const [loading, setLoading] = React.useState(false);

  const handleAllowLocation = async () => {
    setLoading(true);
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        setDeliveryLocation(`Current Location — ${loc.shortAddress || loc.readableAddress}`);
        setSelectedAddress({
          id: `current_${Date.now()}`,
          type: 'Current',
          fullName: user.fullName || 'Customer',
          phoneNumber: user.phoneNumber || '',
          houseFlat: loc.street || 'Current GPS Location',
          areaLandmark: loc.areaLandmark || loc.shortAddress,
          city: loc.city || 'Ahmedabad',
          pincode: loc.pincode || '380015',
          latitude: loc.latitude,
          longitude: loc.longitude,
          isDefault: true,
        });
      }
    } catch (e) {
      console.warn('Location permission detection error:', e);
    } finally {
      setLoading(false);
      setActiveScreen('Blinkit_Home');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        onPress={goBack}
        style={styles.backButton}
      >
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
          style={styles.button}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveScreen('Blinkit_Home')}
          style={styles.notNowButton}
        >
          <Text style={styles.notNowText}>Not Now</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 30,
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
    height: 280,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
