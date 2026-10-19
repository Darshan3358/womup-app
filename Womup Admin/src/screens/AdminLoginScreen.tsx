import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Lock, Mail, Award, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';

export const AdminLoginScreen: React.FC = () => {
  const { loginAdmin } = useAdminState();
  const [identifier, setIdentifier] = useState('admin@wormup.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (idToUse?: string, passToUse?: string) => {
    setError(null);
    setLoading(true);
    try {
      const targetId = idToUse || identifier;
      const targetPass = passToUse || password;
      const res = await loginAdmin(targetId.trim(), targetPass.trim());
      if (!res.success) {
        setError(res.error || 'Invalid Admin credentials');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setIdentifier('admin@wormup.com');
    setPassword('admin123');
    handleLogin('admin@wormup.com', 'admin123');
  };

  return (
    <LinearGradient colors={['#05062A', '#0B0D3F', '#15195C']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/womup_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Womup Admin</Text>
            <Text style={styles.brandSubtitle}>SuperAdmin Management Console</Text>
          </View>

          {/* Master Sponsor ID Highlight Card */}
          <LinearGradient
            colors={['rgba(245, 98, 175, 0.15)', 'rgba(131, 100, 230, 0.2)']}
            style={styles.sponsorCard}
          >
            <View style={styles.sponsorHeader}>
              <View style={styles.crownBadge}>
                <Award size={18} color="#FFD700" />
              </View>
              <View style={styles.sponsorTitleBox}>
                <Text style={styles.sponsorLabel}>MASTER ADMIN SPONSOR ID</Text>
                <Text style={styles.sponsorCode}>WORMUP001</Text>
              </View>
              <View style={styles.statusPill}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.statusPillText}>ROOT SPONSOR</Text>
              </View>
            </View>
            <View style={styles.sponsorDivider} />
            <Text style={styles.sponsorDescription}>
              Default fallback sponsor for customer app. Any customer signing up without a sponsor ID automatically links to this Admin Master Sponsor ID (<Text style={styles.boldWhite}>WORMUP001</Text>).
            </Text>
          </LinearGradient>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ShieldCheck size={24} color={COLORS.hotPink} />
              <Text style={styles.cardTitle}>Admin Sign In</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Input: Identifier */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Email / Mobile / Sponsor ID</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@wormup.com or WORMUP001"
                  placeholderTextColor="#64748B"
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Input: Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={() => handleLogin()}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Access Admin Console</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* 1-Tap Demo Admin Login */}
            <TouchableOpacity
              style={styles.quickAccessBtn}
              onPress={handleQuickDemoLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color="#F562AF" />
              <Text style={styles.quickAccessText}>
                1-Tap Admin Login (Sponsor: WORMUP001)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Protected by 256-bit JWT • Womup Technologies Pvt. Ltd.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 40,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  sponsorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.35)',
  },
  sponsorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  crownBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  sponsorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F562AF',
    letterSpacing: 0.8,
  },
  sponsorCode: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  sponsorDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  sponsorDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  boldWhite: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    height: '100%',
  },
  loginBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 98, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  quickAccessText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F562AF',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
  },
});
