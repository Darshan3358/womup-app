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

export const S01_SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveScreen('C02_Onboarding1');
    }, 2400);
    return () => clearTimeout(timer);
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
