import React, { useState, useEffect, useRef } from 'react';
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

export const ST03_OtpVerificationScreen: React.FC = () => {
  const { verifyOtp, sendOtp, setAuthStep, error, pendingEmail } = useStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = local.length > 2 ? local.slice(0, 2) + '***' : local;
    return `${maskedLocal}@${domain}`;
  };

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6;

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      // Handle paste
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, idx) => {
        if (idx < 6) newDigits[idx] = d;
      });
      setDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    setLocalError(null);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    if (!pendingEmail) {
      setLocalError('No email provided. Please go back to login.');
      return;
    }
    setLocalLoading(true);
    setLocalError(null);

    const ok = await verifyOtp(pendingEmail, otpCode);
    setLocalLoading(false);
    if (!ok) {
      setLocalError(error || 'Invalid OTP code. Please check your email and try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    if (!pendingEmail) {
      setLocalError('No email provided. Please go back to login.');
      return;
    }
    setTimer(45);
    setDigits(['', '', '', '', '', '']);
    await sendOtp(pendingEmail);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setAuthStep('LOGIN')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="keypad" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Security Code Verification</Text>
          <Text style={styles.subtitle}>
            Enter 6-digit OTP code sent to{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
              {pendingEmail ? maskEmail(pendingEmail) : 'your registered email'}
            </Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Enter 6-Digit Verification Code</Text>

          {/* 6 Digit Boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => { inputRefs.current[idx] = ref; }}
                style={[
                  styles.otpBox,
                  Boolean(digit) && styles.otpBoxFilled,
                  idx === (digits.findIndex((d) => !d) === -1 ? 5 : digits.findIndex((d) => !d)) && styles.otpBoxActive,
                ]}
                value={digit}
                onChangeText={(val) => handleDigitChange(idx, val)}
                onKeyPress={(e) => handleKeyPress(idx, e)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {(localError || error) ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          ) : null}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, (!isComplete || localLoading) && styles.disabledBtn]}
            onPress={handleVerify}
            disabled={!isComplete || localLoading}
            activeOpacity={0.8}
          >
            {localLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.verifyBtnText}>VERIFY & ENTER HUB</Text>
            )}
          </TouchableOpacity>

          {/* Timer / Resend */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerCount}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.resendBtnText}>RESEND OTP EMAIL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  otpBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
        } as any)
      : {}),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    flex: 1,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  timerCount: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
