import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Store } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.centerBox}>
        <View style={styles.iconCircle}>
          <Store size={48} color={COLORS.rose} />
        </View>

        <Text style={styles.appName}>WOMUP VENDOR</Text>
        <Text style={styles.tagline}>Merchant Terminal & Counter QR Billing</Text>

        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.rose} size="small" />
          <Text style={styles.loadingText}>Connecting to merchant network...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Enterprise Partner Edition • v1.0.0</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  centerBox: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  loadingText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
  },
});
