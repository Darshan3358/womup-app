import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R02_MobileLoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { requestOtp, setAuthStep } = useRider();

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await requestOtp(cleanEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to send OTP. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Top Navy Header Bar */}
        <View style={styles.topHeaderBar} />

        <View style={styles.mainContent}>
          {/* Brand Logo & Title */}
          <View style={styles.logoBadgeWrapper}>
            <View style={styles.logoBadge}>
              <Ionicons name="bicycle" size={40} color={COLORS.primaryPink} />
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleWorm}>Worm</Text>
              <Text style={styles.brandTitleUp}>Up</Text>
            </View>
            <Text style={styles.brandSubTitle}>Delivery Partner</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subHeading}>Login to continue</Text>

          {/* Form Fields Card */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>EMAIL / MOBILE NUMBER</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
              </View>
              <TextInput
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="rider@wormup.in"
                placeholderTextColor={COLORS.secondaryText}
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </View>

            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Login CTA Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleSendOtp}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Login</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => setErrorMsg('Enter registered email to receive OTP login code')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setAuthStep('REGISTER')} activeOpacity={0.7}>
                <Text style={styles.registerLinkText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },
  topHeaderBar: {
    height: 44,
    backgroundColor: COLORS.navy,
    width: '100%',
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  logoBadgeWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 59, 152, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.primaryPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 4px 12px rgba(255, 59, 152, 0.25))',
      },
      default: {
        shadowColor: COLORS.primaryPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleWorm: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.navy,
  },
  brandTitleUp: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primaryPink,
  },
  brandSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 12,
  },
  inputIconBox: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    paddingLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 4px 14px rgba(255, 59, 152, 0.35))',
      },
      default: {
        shadowColor: COLORS.primaryPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  gradientButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  forgotText: {
    color: COLORS.primaryPink,
    fontSize: 13,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  noAccountText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  registerLinkText: {
    color: COLORS.primaryPink,
    fontSize: 13,
    fontWeight: '800',
  },
});
