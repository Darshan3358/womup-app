import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';

export const S06_MobileNumberScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, setUser, goBack } = useApp();
  const [mobile, setMobile] = useState(user.phoneNumber || '9876543210');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    await AuthService.simulateSendOtp(mobile);
    setUser({ ...user, phoneNumber: mobile });
    setLoading(false);
    setActiveScreen('C07_OtpVerification');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Enter Mobile Number</Text>
          <Text style={styles.subtitle}>We will send you an OTP</Text>

          {/* Mobile Input Card */}
          <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            <View style={styles.prefixContainer}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(text) => {
                setMobile(text.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Send OTP Button */}
          <GradientButton
            title="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            style={styles.button}
          />
        </View>

        {/* Terms Footer */}
        <View style={styles.footer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms & Conditions</Text> &{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 54,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  button: {
    marginTop: SPACING.lg,
  },
  footer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.blue,
    fontWeight: '600',
  },
});
