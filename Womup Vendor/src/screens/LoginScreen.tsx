import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Store,
  Lock,
  Smartphone,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';
import { VendorApi } from '../services/api';

interface LoginScreenProps {
  onRegisterPress?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onRegisterPress }) => {
  const { login, loginWithOtp } = useVendor();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [loading, setLoading] = useState(false);

  // Password Login state
  const [mobileOrId, setMobileOrId] = useState('9876543210');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login state
  const [otpMobile, setOtpMobile] = useState('9876543210');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [verificationId, setVerificationId] = useState<string | undefined>(undefined);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // 1. Handle Password Login
  const handlePasswordLogin = async () => {
    const trimmed = mobileOrId.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your Mobile Number or Store ID (e.g. VND001).');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    const success = await login(trimmed, password);
    setLoading(false);
    if (!success) {
      Alert.alert(
        'Login Failed',
        'Invalid credentials. Please verify your mobile number or password.\n\nTip: You can also use "Login with OTP" or demo account VND001 / admin123',
      );
    }
  };

  // 2. Handle Send OTP
  const handleSendOtp = async () => {
    const cleanMobile = otpMobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSendingOtp(true);
    const res = await VendorApi.sendOtp(`+91${cleanMobile}`, 'LOGIN');
    setSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setVerificationId(res.verificationId);
      setOtpTimer(60);
      Alert.alert(
        'OTP Sent 📲',
        `A 6-digit verification code was sent to +91 ${cleanMobile}.\n${res.devOtp ? `(Dev Code: ${res.devOtp})` : ''}`,
      );
    } else {
      Alert.alert('OTP Failed', res.error || 'Could not send OTP. Please try again.');
    }
  };

  // 3. Handle Verify & Login with OTP
  const handleVerifyOtpLogin = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    const success = await loginWithOtp(`+91${otpMobile.replace(/\D/g, '').slice(-10)}`, code);
    setLoading(false);

    if (!success) {
      Alert.alert('Verification Failed', 'Incorrect or expired OTP. You can use 123456 as master test OTP.');
    }
  };

  // Helper for OTP box changes
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newArr = [...otpDigits];
    newArr[index] = cleaned.slice(-1);
    setOtpDigits(newArr);
  };

  // 4. Handle Forgot Password Flow
  const handleSendForgotOtp = async () => {
    const cleanMobile = forgotMobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      Alert.alert('Required', 'Please enter your 10-digit registered mobile number.');
      return;
    }
    setForgotLoading(true);
    const res = await VendorApi.forgotPassword(`+91${cleanMobile}`);
    setForgotLoading(false);
    if (res.success) {
      setForgotOtpSent(true);
      Alert.alert('OTP Sent', `Reset OTP sent to +91 ${cleanMobile}.\n${res.devOtp ? `(Dev Code: ${res.devOtp})` : ''}`);
    } else {
      Alert.alert('Failed', res.error || 'Could not send reset OTP.');
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      Alert.alert('Required', 'Please enter the verification OTP.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    const res = await VendorApi.resetPassword(`+91${forgotMobile.replace(/\D/g, '').slice(-10)}`, forgotOtp.trim(), newPassword);
    setForgotLoading(false);

    if (res.success) {
      Alert.alert('Password Reset Success 🎉', 'Your password has been updated. Please login with your new credentials.', [
        {
          text: 'OK',
          onPress: () => {
            setShowForgotModal(false);
            setAuthMode('PASSWORD');
            setMobileOrId(forgotMobile);
            setPassword(newPassword);
          },
        },
      ]);
    } else {
      Alert.alert('Error', res.error || 'Failed to reset password. Please check OTP.');
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Store Icon Header */}
            <View style={styles.iconCircle}>
              <Store size={38} color={COLORS.rose} />
            </View>

            <Text style={styles.title}>Store Login</Text>
            <Text style={styles.subtitle}>
              Vendor Partner billing terminal & counter QR collection system
            </Text>

            {/* Switch Tab: Password vs Login with OTP */}
            <View style={styles.toggleTabs}>
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'PASSWORD' && styles.toggleBtnActive]}
                onPress={() => setAuthMode('PASSWORD')}
                activeOpacity={0.8}
              >
                <Lock size={15} color={authMode === 'PASSWORD' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.toggleText, authMode === 'PASSWORD' && styles.toggleTextActive]}>
                  Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'OTP' && styles.toggleBtnActive]}
                onPress={() => setAuthMode('OTP')}
                activeOpacity={0.8}
              >
                <Smartphone size={15} color={authMode === 'OTP' ? '#FFFFFF' : '#64748B'} />
                <Text style={[styles.toggleText, authMode === 'OTP' && styles.toggleTextActive]}>
                  Login with OTP
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: PASSWORD LOGIN */}
            {authMode === 'PASSWORD' ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>📱 Mobile Number / Store Code *</Text>
                  <View style={styles.inputWrapper}>
                    <Smartphone size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={mobileOrId}
                      onChangeText={setMobileOrId}
                      placeholder="+91 98765 43210 or VND001"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>🔒 Password *</Text>
                    <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handlePasswordLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>Login</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setAuthMode('OTP')}
                  activeOpacity={0.8}
                >
                  <Smartphone size={16} color={COLORS.navy} />
                  <Text style={styles.secondaryBtnText}>Login with OTP</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* TAB 2: OTP LOGIN */
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>📱 Mobile Number *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.prefixText}>+91</Text>
                    <TextInput
                      style={styles.input}
                      value={otpMobile}
                      onChangeText={setOtpMobile}
                      placeholder="98765 43210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    <TouchableOpacity
                      style={styles.inlineSendBtn}
                      onPress={handleSendOtp}
                      disabled={sendingOtp || (otpSent && otpTimer > 0)}
                    >
                      {sendingOtp ? (
                        <ActivityIndicator color={COLORS.rose} size="small" />
                      ) : (
                        <Text style={styles.inlineSendText}>
                          {otpSent && otpTimer > 0 ? `${otpTimer}s` : otpSent ? 'Resend' : 'Send OTP'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {otpSent && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Enter 6-Digit OTP *</Text>
                    <View style={styles.otpBoxesRow}>
                      {otpDigits.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                          value={digit}
                          onChangeText={(v) => handleOtpChange(idx, v)}
                          keyboardType="number-pad"
                          maxLength={1}
                          textAlign="center"
                        />
                      ))}
                    </View>
                    <Text style={styles.otpHint}>
                      We sent OTP to +91 {otpMobile}.{' '}
                      {otpTimer > 0 ? (
                        <Text style={{ color: '#64748B' }}>Resend in 00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</Text>
                      ) : (
                        <Text style={{ color: COLORS.rose, fontWeight: '700' }} onPress={handleSendOtp}>
                          Resend Code
                        </Text>
                      )}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginBtn, !otpSent && styles.loginBtnDisabled]}
                  onPress={otpSent ? handleVerifyOtpLogin : handleSendOtp}
                  disabled={loading || sendingOtp}
                  activeOpacity={0.85}
                >
                  {loading || sendingOtp ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>{otpSent ? 'Verify & Login' : 'Send Verification OTP'}</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setAuthMode('PASSWORD')}
                  activeOpacity={0.8}
                >
                  <Lock size={16} color={COLORS.navy} />
                  <Text style={styles.secondaryBtnText}>Login with Password</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Demo Pill */}
            <View style={styles.demoPill}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.demoText}>
                Demo Store: <Text style={{ fontWeight: '800' }}>VND001</Text> · Pass: <Text style={{ fontWeight: '800' }}>admin123</Text> · Test OTP: <Text style={{ fontWeight: '800' }}>123456</Text>
              </Text>
            </View>

            {/* Register New Store CTA */}
            {onRegisterPress && (
              <View style={styles.registerContainer}>
                <Text style={styles.registerPrompt}>New Store?</Text>
                <TouchableOpacity
                  style={styles.registerBtn}
                  onPress={onRegisterPress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.registerBtnText}>Register Your Store</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter your registered mobile number to receive a verification OTP.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registered Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Smartphone size={18} color="#64748B" />
                <TextInput
                  style={styles.input}
                  value={forgotMobile}
                  onChangeText={setForgotMobile}
                  placeholder="9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {!forgotOtpSent ? (
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleSendForgotOtp}
                disabled={forgotLoading}
              >
                {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginBtnText}>Send Reset OTP</Text>}
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit OTP</Text>
                  <View style={styles.inputWrapper}>
                    <KeyRound size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={forgotOtp}
                      onChangeText={setForgotOtp}
                      placeholder="e.g. 123456"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Create New Password (min 6 chars)</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginBtnText}>Update Password & Login</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  toggleTabs: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.navy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.rose,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  inlineSendBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
  },
  inlineSendText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.rose,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  otpBox: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: COLORS.navy,
    backgroundColor: '#FFFFFF',
  },
  otpHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.rose,
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    height: 46,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 16,
    width: '100%',
  },
  demoText: {
    fontSize: 11,
    color: '#065F46',
  },
  registerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  registerBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  registerBtnText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    gap: 14,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
