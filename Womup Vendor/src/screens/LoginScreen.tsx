import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Store, Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const LoginScreen: React.FC<{ onRegisterPress?: () => void }> = ({ onRegisterPress }) => {
  const { login } = useVendor();
  const [loginId, setLoginId] = useState('VND001');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginId.trim()) {
      Alert.alert('Required', 'Please enter your Vendor ID or Phone Number.');
      return;
    }
    setLoading(true);
    const success = await login(loginId.trim(), password);
    setLoading(false);
    if (!success) {
      Alert.alert('Login Failed', 'Invalid credentials. Use demo: VND001 / admin123');
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Store size={36} color={COLORS.rose} />
        </View>

        <Text style={styles.title}>Womup Vendor Partner</Text>
        <Text style={styles.subtitle}>
          Billing terminal & counter QR collection system
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vendor Login ID / Store Code</Text>
            <View style={styles.inputWrapper}>
              <KeyRound size={18} color="#64748B" />
              <TextInput
                style={styles.input}
                value={loginId}
                onChangeText={setLoginId}
                placeholder="e.g. VND001 or 9876543210"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password / Pin</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#64748B" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Open Merchant Terminal</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.demoPill}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.demoText}>
              Pre-filled demo credentials: <Text style={{ fontWeight: '800' }}>VND001 (Gokul Vegetables)</Text>
            </Text>
          </View>

          {onRegisterPress && (
            <TouchableOpacity
              style={styles.registerLinkBtn}
              onPress={onRegisterPress}
              activeOpacity={0.8}
            >
              <Text style={styles.registerLinkText}>New Partner? <Text style={styles.registerLinkHighlight}>Register Shop with 4-Step KYC</Text></Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    width: '100%',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
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
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
    marginTop: 4,
  },
  demoText: {
    fontSize: 11,
    color: '#065F46',
  },
  registerLinkBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  registerLinkHighlight: {
    color: COLORS.rose,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
