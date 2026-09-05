import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S09_ReferralCodeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, setUser, goBack } = useApp();
  const [code, setCode] = useState('WORM500');
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (code.trim()) {
      setApplied(true);
      setUser({
        ...user,
        referralCode: code.trim(),
        shoppingCoins: user.shoppingCoins + 500, // Reward 500 SC
      });
      setTimeout(() => {
        setActiveScreen('C10_LocationPermission');
      }, 600);
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
        {/* Gift / Reward Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="gift-outline" size={40} color={COLORS.hotPink} />
        </View>

        <Text style={styles.title}>Referral Code (Optional)</Text>
        <Text style={styles.subtitle}>
          Enter referral code and get exciting Shopping Coin rewards instantly in your wallet
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter referral code"
            placeholderTextColor={COLORS.secondaryText}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
          {applied && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          )}
        </View>

        {applied && (
          <View style={styles.rewardBanner}>
            <Text style={styles.rewardText}>🎉 500 Shopping Coins added to your account!</Text>
          </View>
        )}

        <GradientButton
          title={applied ? 'Applied ✓' : 'Apply Code'}
          onPress={handleApply}
          style={styles.button}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveScreen('C10_LocationPermission')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View />
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
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
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 52,
    paddingHorizontal: SPACING.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rewardBanner: {
    backgroundColor: '#EAF8F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  rewardText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
