import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S05_Onboarding4Screen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, goBack } = useApp();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveScreen('C06_MobileNumber')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/screen4image.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>Fast Delivery at Your Doorstep</Text>
        <Text style={styles.description}>
          Superfast delivery within minutes so you never run out of groceries and home supplies.
        </Text>

        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <GradientButton
          title="Get Started"
          onPress={() => setActiveScreen('C06_MobileNumber')}
          style={styles.ctaButton}
        />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    padding: SPACING.sm,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 340,
  },
  illustration: {
    width: '85%',
    height: '100%',
  },
  bottomContent: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.hotPink,
  },
  ctaButton: {
    width: '100%',
  },
});
