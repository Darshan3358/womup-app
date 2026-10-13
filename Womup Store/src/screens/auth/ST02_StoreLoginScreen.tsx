import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../context/StoreContext';
import { COLORS, GRADIENTS } from '../../theme/colors';

export const ST02_StoreLoginScreen: React.FC = () => {
  const { loginWithStoreCredentials, isLoading, error, setAuthStep } = useStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter both Store ID and Password.');
      return;
    }

    const success = await loginWithStoreCredentials(loginId.trim(), password);
    if (!success) {
      Alert.alert(
        'Login Failed',
        error || 'Invalid Store ID or Password. Please check with your store manager.'
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please contact your Dark Store Admin or Operations Manager to reset credentials.'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Top Cart Icon */}
        <View style={styles.topIconContainer}>
          <Image
            source={require('../../../assets/store_cart_icon.png')}
            style={styles.cartIcon}
            resizeMode="contain"
          />
        </View>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Text style={styles.brandWorm}>Worm</Text>
            <Text style={styles.brandUp}>Up</Text>
          </View>
          <Text style={styles.brandSubtitle}>Dark Store Partner</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Login to your dark store account</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Store ID / Mobile Number */}
          <Text style={styles.inputLabel}>STORE ID / MOBILE NUMBER</Text>
          <View style={styles.pillInputWrapper}>
            <View style={styles.inputIconCircle}>
              <Ionicons name="phone-portrait-outline" size={18} color="#071B52" />
            </View>
            <TextInput
              style={styles.input}
              value={loginId}
              onChangeText={setLoginId}
              placeholder="e.g. 9876543210 or womupTragad"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.pillInputWrapper}>
            <View style={styles.inputIconCircle}>
              <Ionicons name="lock-closed-outline" size={18} color="#071B52" />
            </View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Full-width Pink Gradient Login Button */}
          <TouchableOpacity
            style={[
              styles.loginBtnWrapper,
              (!loginId.trim() || !password || isLoading) && styles.disabledBtn,
            ]}
            onPress={handleLogin}
            disabled={!loginId.trim() || !password || isLoading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={GRADIENTS.primaryPink}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Registration Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => setAuthStep('REGISTER')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Subtle Decorative Wave at Bottom */}
        <View style={styles.bottomWaveContainer}>
          <View style={styles.waveBar} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  topIconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  cartIcon: {
    width: 68,
    height: 68,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandWorm: {
    fontSize: 32,
    fontWeight: '900',
    color: '#071B52',
    letterSpacing: -0.5,
  },
  brandUp: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF3B98',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  pillInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    gap: 10,
  },
  inputIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#071B52',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 22,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B98',
  },
  loginBtnWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledBtn: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 13,
    color: '#FF3B98',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  bottomWaveContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  waveBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 59, 152, 0.2)',
  },
});
