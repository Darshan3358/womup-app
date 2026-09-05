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

export const S07_OtpVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, goBack } = useApp();
  const [otp, setOtp] = useState<string[]>(['1', '2', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');

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

      // If finished, verify
      if (emptyIndex === 3) {
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

  const verifyOtp = (code: string) => {
    if (code.length === 4) {
      const isValid = AuthService.simulateVerifyOtp(code);
      if (isValid) {
        setActiveScreen('C08_CreateAccount');
      } else {
        setError('Incorrect OTP. Please try again.');
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
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to{' '}
          <Text style={styles.phoneBold}>+91 {user.phoneNumber || '98765 43210'}</Text>
        </Text>

        {/* 4 OTP Digit Boxes */}
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
            <TouchableOpacity onPress={() => setTimer(30)}>
              <Text style={styles.resendAction}>Resend OTP</Text>
            </TouchableOpacity>
          )}
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
    gap: 14,
    marginBottom: SPACING.md,
  },
  otpBox: {
    width: 54,
    height: 54,
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
});
