import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';

export const S06_MobileNumberScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, setUser, goBack, setAuthVerificationId } = useApp();
  const { login } = useAuth();

  // Active Tab: 'SIGN_IN' or 'REGISTER'
  const [activeTab, setActiveTab] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');

  // Sign In Form States (Phone, Email, or Sponsor ID + Password)
  const [identifier, setIdentifier] = useState(
    user.referralCode || user.email || user.phoneNumber || ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States (Mobile OTP or Email OTP per user choice)
  const [registerMethod, setRegisterMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [registerPhone, setRegisterPhone] = useState(
    user.phoneNumber ? user.phoneNumber.replace(/^\+91/, '').replace(/\D/g, '') : ''
  );
  const [registerEmail, setRegisterEmail] = useState(user.email || '');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync identifier if user comes from Success Screen with newly generated Sponsor ID
  useEffect(() => {
    if (user.referralCode && !identifier) {
      setIdentifier(user.referralCode);
    }
  }, [user.referralCode]);

  // Handle Direct Login via Phone, Email, or Sponsor ID + Password
  const handlePasswordLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your Phone, Email, or Sponsor ID');
      return;
    }
    if (!password || password.length < 6) {
      setError('Please enter your password (minimum 6 characters)');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await AuthService.login(cleanId, password);
      setLoading(false);
      if (res.success && res.token && res.user) {
        await login(res.token, undefined, res.user);
        const updatedUser = {
          ...user,
          fullName: res.user.name || res.user.fullName || user.fullName,
          email: res.user.email || user.email,
          phoneNumber: res.user.phoneNumber || res.user.phone || user.phoneNumber,
          phone: res.user.phone || user.phone,
          referralCode: res.user.referralCode || user.referralCode,
          sponsorCode: res.user.sponsorCode || user.sponsorCode,
          shoppingCoins: res.user.shoppingCoins ?? 2000,
          availableIncome: res.user.availableIncome ?? 0,
          pendingIncome: res.user.pendingIncome ?? 0,
        };
        setUser(updatedUser);
        await StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
        await StorageService.saveItem(StorageService.KEYS.ACTIVE_SCREEN, 'Blinkit_Home');
        setActiveScreen('Blinkit_Home');
      } else {
        setError(res.message || 'Invalid credentials. Please verify your details.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Login failed. Please check your network connection.');
    }
  };

  // Handle Login via OTP fallback (Mobile or Email OTP)
  const handleOtpLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your mobile number or email to receive an OTP');
      return;
    }
    const isEmail = cleanId.includes('@');
    const cleanDigits = cleanId.replace(/\D/g, '').slice(-10);
    const target = isEmail ? cleanId.toLowerCase() : (cleanDigits.length === 10 ? cleanDigits : cleanId);

    setError('');
    setLoading(true);
    const res = await AuthService.sendOtp(target, 'LOGIN');
    setLoading(false);
    if (res.success && res.verificationId) {
      setAuthVerificationId(res.verificationId);
      if (isEmail) {
        setUser({ ...user, email: cleanId.toLowerCase(), phoneNumber: '', phone: '' });
      } else {
        const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : cleanId;
        setUser({ ...user, phoneNumber: formattedPhone, phone: cleanDigits, email: '' });
      }
      setActiveScreen('C07_OtpVerification');
    } else {
      setError(res.message || 'Failed to send OTP. Please check your credentials.');
    }
  };

  // Handle New Registration OTP verification (Mobile or Email OTP)
  const handleRegisterOtp = async () => {
    if (registerMethod === 'PHONE') {
      const cleanDigits = registerPhone.replace(/\D/g, '').slice(-10);
      if (cleanDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanDigits)) {
        setError('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      setError('');
      setLoading(true);
      const res = await AuthService.sendOtp(cleanDigits, 'SIGNUP');
      setLoading(false);
      if (res.success && res.verificationId) {
        setAuthVerificationId(res.verificationId);
        setUser({
          ...user,
          phoneNumber: `+91${cleanDigits}`,
          phone: cleanDigits,
          email: '',
        });
        setActiveScreen('C07_OtpVerification');
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } else {
      // EMAIL OTP REGISTRATION
      const cleanEmail = registerEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      setLoading(true);
      const res = await AuthService.sendOtp(cleanEmail, 'SIGNUP');
      setLoading(false);
      if (res.success && res.verificationId) {
        setAuthVerificationId(res.verificationId);
        setUser({
          ...user,
          email: cleanEmail,
          phoneNumber: '',
          phone: '',
        });
        setActiveScreen('C07_OtpVerification');
      } else {
        setError(res.message || 'Failed to send OTP to email. Please try again.');
      }
    }
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
        {/* Top Header & Back Button */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Brand Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={activeTab === 'SIGN_IN' ? 'lock-open' : 'person-add'}
              size={36}
              color={COLORS.hotPink}
            />
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SIGN_IN' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('SIGN_IN');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'SIGN_IN' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'REGISTER' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('REGISTER');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'REGISTER' && styles.tabTextActive]}>
                New Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <Text style={styles.title}>
            {activeTab === 'SIGN_IN' ? 'Welcome Back!' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {activeTab === 'SIGN_IN'
              ? 'Log in using your Mobile Number, Email, or Sponsor ID'
              : registerMethod === 'EMAIL'
              ? 'Enter your email address to verify and get ₹2,000 coins'
              : 'Enter your 10-digit mobile number to verify and get ₹2,000 coins'}
          </Text>

          {/* Operating Cities Pill */}
          <View style={styles.operatingCitiesPill}>
            <Text style={styles.operatingCitiesText}>
              🏙️ Now Delivering in <Text style={styles.boldCity}>Ahmedabad</Text> · <Text style={styles.boldCity}>Surat</Text> · <Text style={styles.boldCity}>Vadodara</Text>
            </Text>
          </View>

          {activeTab === 'REGISTER' && (
            /* Method Switcher for Register: Mobile or Email */
            <View style={styles.methodSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  registerMethod === 'PHONE' && styles.methodTabActive,
                ]}
                onPress={() => {
                  setRegisterMethod('PHONE');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={16}
                  color={registerMethod === 'PHONE' ? COLORS.hotPink : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    registerMethod === 'PHONE' && styles.methodTabTextActive,
                  ]}
                >
                  Mobile Number
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTab,
                  registerMethod === 'EMAIL' && styles.methodTabActive,
                ]}
                onPress={() => {
                  setRegisterMethod('EMAIL');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={registerMethod === 'EMAIL' ? COLORS.hotPink : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    registerMethod === 'EMAIL' && styles.methodTabTextActive,
                  ]}
                >
                  Email Address
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'SIGN_IN' ? (
            /* ==================== SIGN IN TAB ==================== */
            <View style={styles.formContainer}>
              {/* Identifier Input */}
              <Text style={styles.inputLabel}>Phone, Email or Sponsor ID</Text>
              <View style={[styles.inputContainer, error && !password ? styles.inputError : null]}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Phone, Email, or Sponsor ID"
                  placeholderTextColor={COLORS.secondaryText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (error) setError('');
                  }}
                  returnKeyType="next"
                />
                {identifier.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setIdentifier('')}
                    style={styles.inputActionBtn}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Password Input */}
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, error && password ? styles.inputError : null]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your account password"
                  placeholderTextColor={COLORS.secondaryText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.inputActionBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Sign In Button */}
              <GradientButton
                title="Sign In"
                onPress={handlePasswordLogin}
                loading={loading}
                style={styles.button}
              />

              {/* Quick OTP Fallback Link */}
              <TouchableOpacity
                onPress={handleOtpLogin}
                style={styles.fallbackOtpBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.hotPink} />
                <Text style={styles.fallbackOtpText}>Forgot Password? Login with OTP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ==================== REGISTER TAB (Mobile or Email) ==================== */
            <View style={styles.formContainer}>
              {registerMethod === 'PHONE' ? (
                <>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={COLORS.secondaryText}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={registerPhone}
                      onChangeText={(text) => {
                        const digits = text.replace(/\D/g, '');
                        setRegisterPhone(digits);
                        if (error) setError('');
                      }}
                      returnKeyType="done"
                      onSubmitEditing={handleRegisterOtp}
                    />
                    {registerPhone.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setRegisterPhone('')}
                        style={styles.inputActionBtn}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor={COLORS.secondaryText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={registerEmail}
                      onChangeText={(text) => {
                        setRegisterEmail(text);
                        if (error) setError('');
                      }}
                      returnKeyType="done"
                      onSubmitEditing={handleRegisterOtp}
                    />
                    {registerEmail.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setRegisterEmail('')}
                        style={styles.inputActionBtn}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* Error Message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Send OTP Button */}
              <GradientButton
                title="Send Verification OTP"
                onPress={handleRegisterOtp}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.registerHintBox}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
                <Text style={styles.registerHintText}>
                  {registerMethod === 'PHONE'
                    ? 'A 6-digit OTP will be sent via SMS to verify your mobile number. You will receive 2,000 Shopping Coins upon joining!'
                    : 'A 6-digit OTP will be sent to your email to verify your address. You will receive 2,000 Shopping Coins upon joining!'}
                </Text>
              </View>
            </View>
          )}
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
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    marginTop: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  operatingCitiesPill: {
    backgroundColor: '#FFF0F7',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.md,
    alignSelf: 'center',
  },
  operatingCitiesText: {
    fontSize: 12,
    color: COLORS.navy,
  },
  boldCity: {
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  methodSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.lg,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: RADIUS.pill,
  },
  methodTabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  methodTabTextActive: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
    marginLeft: 2,
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
    marginBottom: SPACING.md,
    width: '100%',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  inputActionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
    marginLeft: 4,
    fontWeight: '500',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  button: {
    marginTop: SPACING.sm,
    width: '100%',
  },
  fallbackOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 6,
  },
  fallbackOtpText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.hotPink,
  },
  registerHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  registerHintText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
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
