import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';

export const S07_OtpVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    user,
    setUser,
    goBack,
    authVerificationId,
    setAuthVerificationId,
    tempRegistration,
  } = useApp();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleKeyPress = (num: string) => {
    setError('');
    const emptyIndex = otp.findIndex((val) => val === '');
    if (emptyIndex !== -1) {
      const nextOtp = [...otp];
      nextOtp[emptyIndex] = num;
      setOtp(nextOtp);

      // If all 6 digits entered, automatically verify
      if (emptyIndex === 5) {
        verifyOtp(nextOtp.join(''));
      }
    }
  };

  const handleDelete = () => {
    setError('');
    const filledIndices = otp
      .map((val, idx) => (val !== '' ? idx : -1))
      .filter((idx) => idx !== -1);
    if (filledIndices.length > 0) {
      const lastFilledIndex = filledIndices[filledIndices.length - 1];
      const nextOtp = [...otp];
      nextOtp[lastFilledIndex] = '';
      setOtp(nextOtp);
    }
  };

  const handleResend = async () => {
    setTimer(30);
    setError('');
    if (user.email) {
      const res = await AuthService.sendOtp(user.email);
      if (res.success && res.verificationId) {
        setAuthVerificationId(res.verificationId);
      } else {
        setError(res.message || 'Failed to resend OTP');
      }
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length >= 4) {
      setLoading(true);
      setError('');
      if (!authVerificationId) {
        setLoading(false);
        setError('Verification session expired. Please go back and resend OTP.');
        return;
      }

      const res = await AuthService.verifyOtp(authVerificationId, code);
      setLoading(false);
      if (res.success) {
        if (res.isNewUser === false) {
          // Existing customer: Logged in! Go straight to Blinkit Home!
          if (res.user) {
            const updatedUser = {
              ...user,
              fullName: res.user.name || user.fullName,
              email: res.user.email || user.email,
              phoneNumber: res.user.phone || user.phoneNumber,
              shoppingCoins: res.user.shoppingCoins || user.shoppingCoins,
            };
            setUser(updatedUser);
            StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
          }
          StorageService.saveItem(StorageService.KEYS.ACTIVE_SCREEN, 'Blinkit_Home');
          setActiveScreen('Blinkit_Home');
        } else {
          // New user registration flow
          setActiveScreen('C08_CreateAccount');
        }
      } else {
        setError(res.message || 'Incorrect OTP. Please try again.');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Form Info */}
      <View style={styles.content}>
        <Text style={styles.title}>Verify your Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{' '}
          <Text style={styles.phoneBold}>{user.email || 'your email'}</Text>
        </Text>

        {/* Email confirmation badge */}
        <View style={styles.sentBadge}>
          <Ionicons name="mail" size={16} color="#059669" />
          <Text style={styles.sentBadgeText}>OTP sent to your email inbox</Text>
        </View>

        {/* 6 OTP Digit Boxes */}
        <View style={styles.otpBoxesRow}>
          {otp.map((digit, index) => {
            const isFilled = digit !== '';
            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  isFilled && styles.otpBoxFilled,
                  error ? styles.otpBoxError : null,
                ]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Resend Timer */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={styles.resendText}>
              Resend OTP in <Text style={styles.timerBold}>00:{timer < 10 ? `0${timer}` : timer}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendAction}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── YOU'LL BE REGISTERED IN ── */}
        <View style={styles.cityContextSection}>
          <View style={styles.cityContextDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.cityContextLabel}>YOU'LL BE REGISTERED IN</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.cityContextBadge}>
            <Text style={styles.cityContextEmoji}>🏙️</Text>
            <Text style={styles.cityContextCityName}>
              {user.preferredCityName || tempRegistration.preferredCityName || 'Ahmedabad'}
            </Text>
          </View>
        </View>
      </View>

      {/* On-Screen Numeric Keypad matching wireframe */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <Ionicons name="backspace-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.key, styles.keyCheck]}
            onPress={() => verifyOtp(otp.join(''))}
          >
            <Ionicons name="checkmark" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  phoneBold: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.input,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF4F9',
  },
  otpBoxError: {
    borderColor: COLORS.error,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: SPACING.lg,
    gap: 6,
  },
  sentBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  resendRow: {
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  timerBold: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  resendAction: {
    fontSize: 13,
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  keypad: {
    marginBottom: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  key: {
    width: 72,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCheck: {
    backgroundColor: COLORS.hotPink,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cityContextSection: {
    marginTop: 18,
    alignItems: 'center',
    width: '100%',
  },
  cityContextDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '80%',
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  cityContextLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  cityContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    gap: 6,
  },
  cityContextEmoji: {
    fontSize: 14,
  },
  cityContextCityName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
});
