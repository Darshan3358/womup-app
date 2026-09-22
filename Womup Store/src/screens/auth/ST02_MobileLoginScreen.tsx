import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ST02_EmailLoginScreen: React.FC = () => {
  const { sendOtp, setAuthStep, error } = useStore();
  const [email, setEmail] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

  const handleSendOtp = async () => {
    if (!isValidEmail) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError(null);
    setLocalLoading(true);

    const ok = await sendOtp(email.trim().toLowerCase());
    setLocalLoading(false);
    if (ok) {
      setAuthStep('OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Top Header */}
        <View style={styles.topLogo}>
          <View style={styles.iconBox}>
            <Ionicons name="storefront" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Dark Store Staff Login</Text>
          <Text style={styles.subtitle}>
            Enter registered email to receive OTP on your inbox
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Registered Email Address</Text>
          <View style={styles.emailInputRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.emailIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setValidationError(null);
              }}
              placeholder="picker@wormup.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          {(validationError || error) ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{validationError || error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, (!isValidEmail || localLoading) && styles.disabledBtn]}
            onPress={handleSendOtp}
            disabled={!isValidEmail || localLoading}
            activeOpacity={0.8}
          >
            {localLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>SEND OTP TO EMAIL</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.hintBox}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
            <Text style={styles.hintText}>
              Authorised dark store pickers and hub managers only.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Also export alias for compatibility
export const ST02_MobileLoginScreen = ST02_EmailLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  topLogo: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emailIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    flex: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    justifyContent: 'center',
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
