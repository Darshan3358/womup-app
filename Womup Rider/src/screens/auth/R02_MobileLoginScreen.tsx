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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R02_MobileLoginScreen: React.FC = () => {
  const { loginWithPassword, loginWithEmailOtp, forgotPassword, resetPassword, requestOtp, setAuthStep } = useRider();

  // Mode: 'PASSWORD' | 'OTP'
  const [loginMode, setLoginMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // OTP Login Fields
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');

  // Status & Loaders
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Validate Email
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Handle Password Login
  const handlePasswordLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await loginWithPassword(cleanEmail, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP for OTP Login
  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await requestOtp(cleanEmail);
      setOtpSent(true);
      setSuccessMsg(`6-digit OTP sent to ${cleanEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to send OTP. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify & Login with OTP
  const handleOtpLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await loginWithEmailOtp(cleanEmail, otpCode.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Request OTP
  const handleForgotRequestOtp = async () => {
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setForgotError('Please enter a valid registered email');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await forgotPassword(cleanEmail);
      setForgotStep('RESET');
      setForgotSuccess(res.message || 'OTP sent to your email. Check inbox & spam.');
    } catch (err: any) {
      setForgotError(err.message || 'Could not send reset code. Please check email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Forgot Password - Reset Password
  const handleForgotResetPassword = async () => {
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      await resetPassword(forgotEmail.trim().toLowerCase(), forgotOtp.trim(), newPassword);
      setForgotSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('REQUEST');
        setPassword('');
        setEmail(forgotEmail.trim().toLowerCase());
        setSuccessMsg('Password updated! Please log in with your new password.');
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please check OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Top Header Bar */}
        <View style={styles.topHeaderBar} />

        <View style={styles.mainContent}>
          {/* Brand Logo & Title */}
          <View style={styles.logoBadgeWrapper}>
            <View style={styles.logoBadge}>
              <Ionicons name="bicycle" size={38} color={COLORS.primaryPink} />
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleWorm}>Worm</Text>
              <Text style={styles.brandTitleUp}>Up</Text>
            </View>
            <Text style={styles.brandSubTitle}>Rider Partner App</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            {loginMode === 'PASSWORD' ? 'Rider Login' : 'OTP Login'}
          </Text>
          <Text style={styles.subHeading}>
            {loginMode === 'PASSWORD'
              ? 'Enter your registered email and password'
              : 'Sign in securely using email OTP verification'}
          </Text>

          {/* Form Fields Card */}
          <View style={styles.formContainer}>
            {/* Field 1: Email Address */}
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconBox}>
                <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
              </View>
              <TextInput
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="rider@example.com"
                placeholderTextColor={COLORS.secondaryText}
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </View>

            {/* Field 2: Password (when loginMode === 'PASSWORD') */}
            {loginMode === 'PASSWORD' ? (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.inputLabel}>PASSWORD *</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.secondaryText}
                    value={password}
                    onChangeText={(txt) => {
                      setPassword(txt);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMeRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={rememberMe ? COLORS.primaryPink : '#94A3B8'}
                    />
                    <Text style={styles.rememberMeText}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setForgotEmail(email);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('REQUEST');
                      setShowForgotModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* OTP Input (when loginMode === 'OTP' and OTP is sent) */}
            {loginMode === 'OTP' && otpSent ? (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.inputLabel}>6-DIGIT EMAIL OTP *</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="key-outline" size={18} color={COLORS.navy} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="123456"
                    placeholderTextColor={COLORS.secondaryText}
                    value={otpCode}
                    onChangeText={(txt) => {
                      setOtpCode(txt);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.resendOtpRow}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendOtpText}>Didn't receive code? Resend OTP</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Success Message Banner */}
            {successMsg ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Error Message Banner */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={
                loginMode === 'PASSWORD'
                  ? handlePasswordLogin
                  : otpSent
                  ? handleOtpLogin
                  : handleSendOtp
              }
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
                    <Text style={styles.buttonText}>
                      {loginMode === 'PASSWORD'
                        ? 'Login'
                        : otpSent
                        ? 'Verify & Login'
                        : 'Send OTP to Email'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ───────── OR ───────── Divider */}
            <View style={styles.orDividerContainer}>
              <View style={styles.orLine} />
              <View style={styles.orBadge}>
                <Text style={styles.orText}>OR</Text>
              </View>
              <View style={styles.orLine} />
            </View>

            {/* Secondary Action: Login with Email OTP / Password */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setOtpSent(false);
                setOtpCode('');
                setLoginMode(loginMode === 'PASSWORD' ? 'OTP' : 'PASSWORD');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={loginMode === 'PASSWORD' ? 'mail-unread-outline' : 'key-outline'}
                size={18}
                color={COLORS.navy}
              />
              <Text style={styles.secondaryButtonText}>
                {loginMode === 'PASSWORD' ? 'Login with Email OTP' : 'Login with Password'}
              </Text>
            </TouchableOpacity>

            {/* Register Footer */}
            <View style={styles.registerRow}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setAuthStep('REGISTER')} activeOpacity={0.7}>
                <Text style={styles.registerLinkText}>Register as Rider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <Ionicons name="lock-open-outline" size={20} color={COLORS.primaryPink} />
                <Text style={styles.modalTitle}>Reset Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowForgotModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.successText}>{forgotSuccess}</Text>
              </View>
            ) : null}

            {forgotError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{forgotError}</Text>
              </View>
            ) : null}

            {forgotStep === 'REQUEST' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalSubText}>
                  Enter your registered email address. We'll send you a 6-digit verification code to reset your password.
                </Text>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>EMAIL ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="rider@example.com"
                    placeholderTextColor={COLORS.secondaryText}
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }, forgotLoading && styles.buttonDisabled]}
                  onPress={handleForgotRequestOtp}
                  disabled={forgotLoading}
                >
                  <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                    {forgotLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Send Reset Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalSubText}>
                  We sent a 6-digit code to <Text style={{ fontWeight: '700', color: COLORS.navy }}>{forgotEmail}</Text>. Enter the code and your new password.
                </Text>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>6-DIGIT OTP</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="key-outline" size={18} color={COLORS.navy} />
                  <TextInput
                    style={[styles.textInput, { letterSpacing: 4, fontWeight: '700' }]}
                    placeholder="123456"
                    placeholderTextColor={COLORS.secondaryText}
                    value={forgotOtp}
                    onChangeText={setForgotOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>NEW PASSWORD (MIN 6 CHARS)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="New password"
                    placeholderTextColor={COLORS.secondaryText}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={COLORS.secondaryText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNewPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 18 }, forgotLoading && styles.buttonDisabled]}
                  onPress={handleForgotResetPassword}
                  disabled={forgotLoading}
                >
                  <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                    {forgotLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Update Password & Login</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setForgotStep('REQUEST')}
                  style={{ alignSelf: 'center', marginTop: 12 }}
                >
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>← Back to email</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 24,
    alignItems: 'center',
  },
  logoBadgeWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 59, 152, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.primaryPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.navy,
  },
  brandTitleUp: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryPink,
  },
  brandSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 12,
  },
  inputIconBox: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    paddingLeft: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  forgotText: {
    color: COLORS.primaryPink,
    fontSize: 13,
    fontWeight: '700',
  },
  resendOtpRow: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  resendOtpText: {
    fontSize: 12,
    color: COLORS.primaryPink,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    gap: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
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
    height: 52,
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
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orBadge: {
    paddingHorizontal: 12,
  },
  orText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 50,
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 10px 25px rgba(0,0,0,0.2))',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
