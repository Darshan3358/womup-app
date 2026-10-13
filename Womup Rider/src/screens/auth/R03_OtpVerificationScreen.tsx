import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R03_OtpVerificationScreen: React.FC = () => {
  const { authEmail, authPhone, verifyOtpCode, resendOtp, setAuthStep } = useRider();
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

  // Keypad press handler
  const handleKeyPress = (num: string) => {
    if (otp.length < 6) {
      const nextOtp = otp + num;
      setOtp(nextOtp);
      if (errorMsg) setErrorMsg(null);
      if (nextOtp.length === 6) {
        triggerVerify(nextOtp);
      }
    }
  };

  const handleBackspace = () => {
    if (otp.length > 0) {
      setOtp(otp.slice(0, -1));
      if (errorMsg) setErrorMsg(null);
    }
  };

  const triggerVerify = async (codeToVerify: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyOtpCode(codeToVerify);
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

  const digits = otp.split('');

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setAuthStep('LOGIN')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subHeading}>
          Enter the 6 digit code sent to{' '}
          <Text style={styles.boldTarget}>{authEmail || authPhone || '+91 98765 43210'}</Text>
        </Text>

        {/* 6 OTP Boxes */}
        <View style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const digit = digits[index] || '';
            const isFilled = Boolean(digit);
            const isCurrent = otp.length === index;

            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  isFilled && styles.otpBoxFilled,
                  isCurrent && styles.otpBoxActive,
                ]}
              >
                <Text
                  style={[
                    styles.otpDigit,
                    isFilled && styles.otpDigitFilled,
                  ]}
                >
                  {digit}
                </Text>
              </View>
            );
          })}
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Resend OTP */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={timer > 0}
          style={styles.resendBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
            {timer > 0 ? `Resend OTP (00:${timer < 10 ? `0${timer}` : timer})` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={COLORS.primaryPink} />
            <Text style={styles.loaderText}>Verifying code...</Text>
          </View>
        ) : null}
      </View>

      {/* Numeric Keypad Grid */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keypadBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keypadNumber}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keypadBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keypadNumber}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keypadBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keypadNumber}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          <View style={[styles.keypadBtn, { backgroundColor: 'transparent', elevation: 0, borderWidth: 0 }]} />
          <TouchableOpacity
            style={styles.keypadBtn}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.6}
          >
            <Text style={styles.keypadNumber}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadBtn}
            onPress={handleBackspace}
            activeOpacity={0.6}
          >
            <Ionicons name="backspace-outline" size={24} color={COLORS.primaryPink} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  subHeading: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  boldTarget: {
    fontWeight: '700',
    color: COLORS.navy,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: COLORS.primaryPink,
    backgroundColor: '#FDF2F8',
  },
  otpBoxFilled: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  otpDigitFilled: {
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  resendBtn: {
    marginTop: 8,
    paddingVertical: 6,
  },
  resendText: {
    color: COLORS.primaryPink,
    fontSize: 13,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#94A3B8',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  loaderText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  keypadContainer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keypadBtn: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.04))',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  keypadNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
  },
});
