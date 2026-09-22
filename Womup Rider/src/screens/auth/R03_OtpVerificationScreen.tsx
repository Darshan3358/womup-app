import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R03_OtpVerificationScreen: React.FC = () => {
  const { authEmail, otpVerificationId, verifyOtpCode, resendOtp, setAuthStep } = useRider();
  const [otp, setOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setErrorMsg('Please enter complete 6-digit verification code');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyOtpCode(otp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(30);
    setErrorMsg(null);
    try {
      await resendOtp();
    } catch (err: any) {
      setErrorMsg('Failed to resend code. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Branding Banner */}
      <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setAuthStep('LOGIN')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Change Email</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Verify OTP</Text>
        <Text style={styles.subHeading}>
          Code sent to <Text style={styles.boldPhone}>{authEmail || 'your email'}</Text>
        </Text>
      </LinearGradient>

      {/* Verification Card */}
      <View style={styles.card}>
        <Text style={styles.inputLabel}>ENTER 6-DIGIT CODE</Text>

        <View style={styles.otpInputBox}>
          <TextInput
            style={styles.otpTextInput}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="_ _ _ _ _ _"
            placeholderTextColor={COLORS.secondaryText}
            value={otp}
            onChangeText={(txt) => {
              setOtp(txt);
              if (errorMsg) setErrorMsg(null);
            }}
            autoFocus
          />
        </View>

        {errorMsg ? (
          <View style={[styles.errorContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleVerify}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>VERIFY & CONTINUE</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Timer */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.resendTimerText}>
              Resend code in <Text style={styles.boldTimer}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
              <Text style={styles.resendLink}>Resend OTP Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: COLORS.hotPink,
    fontSize: 13,
    fontWeight: '700',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  subHeading: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 6,
  },
  boldPhone: {
    color: COLORS.white,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  otpInputBox: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
  },
  otpTextInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  debugBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(81, 95, 234, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  boldTimer: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  resendLink: {
    fontSize: 13,
    color: COLORS.blue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
