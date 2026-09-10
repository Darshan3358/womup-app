import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { api } from '../services/api';

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, setUser } = useApp();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const token = await StorageService.getItem<string | null>(
          StorageService.KEYS.AUTH_TOKEN,
          null
        );
        const savedUser = await StorageService.getItem<any | null>(
          StorageService.KEYS.USER,
          null
        );
        const savedScreen = await StorageService.getItem<string | null>(
          StorageService.KEYS.ACTIVE_SCREEN,
          null
        );

        if (token) {
          api.setToken(token);
          if (savedUser && isMounted) {
            setUser(savedUser);
          }
          try {
            const profile = await AuthService.getProfile();
            if (profile && (profile.email || profile.phoneNumber || profile.fullName) && isMounted) {
              setUser(profile);
            }
          } catch (err) {}

          if (isMounted) {
            const validTarget =
              savedScreen &&
              savedScreen !== 'C01_Splash' &&
              savedScreen !== 'C02_Onboarding1' &&
              savedScreen !== 'C03_Onboarding2' &&
              savedScreen !== 'C04_Onboarding3' &&
              savedScreen !== 'C05_Onboarding4' &&
              savedScreen !== 'C06_MobileNumber' &&
              savedScreen !== 'C07_OtpVerification'
                ? (savedScreen as any)
                : 'Blinkit_Home';
            setActiveScreen(validTarget);
            return;
          }
        }
      } catch (e) {
        console.warn('Session check failed:', e);
      }

      const timer = setTimeout(() => {
        if (isMounted) {
          setActiveScreen('C02_Onboarding1');
        }
      }, 1500);
      return () => clearTimeout(timer);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveScreen('C02_Onboarding1')}
        style={styles.content}
      >
        {/* W Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Wormup.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineBold}>Smart Shopping</Text>
          <Text style={styles.taglineRegular}>Better Saving</Text>
          <Text style={styles.taglineRegular}>More Benefits</Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarFill}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  taglineContainer: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  taglineBold: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  taglineRegular: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    width: '70%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '65%',
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
