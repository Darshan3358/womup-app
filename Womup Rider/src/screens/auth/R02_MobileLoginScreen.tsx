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

  const { requestOtp } = useRider();

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
        {/* Header Hero */}
        <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PARTNER ACCESS</Text>
          </View>
          <Text style={styles.heading}>Delivery Partner Login</Text>
          <Text style={styles.subHeading}>Enter your email address to receive OTP</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>

          <View style={styles.emailInputRow}>
            <View style={styles.emailIconBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
            </View>
            <TextInput
              style={styles.emailTextInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="example@gmail.com"
              placeholderTextColor={COLORS.secondaryText}
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </View>

          {errorMsg ? (
            <View style={[styles.errorContainer, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Primary CTA */}
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
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>GET OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.legalBox}>
            <Text style={styles.legalText}>
              By continuing, you agree to Worm Up Fleet Partner Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 98, 175, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.4)',
    marginBottom: 12,
  },
  badgeText: {
    color: COLORS.hotPink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
    lineHeight: 18,
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
    marginBottom: 8,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    overflow: 'hidden',
  },
  emailIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  emailIcon: {
    fontSize: 18,
  },
  emailTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  legalBox: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
