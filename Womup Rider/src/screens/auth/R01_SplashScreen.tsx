import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';

export const R01_SplashScreen: React.FC = () => {
  const { checkSession } = useRider();

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSession();
    }, 1200);
    return () => clearTimeout(timer);
  }, [checkSession]);

  return (
    <LinearGradient colors={GRADIENTS.navyHeader} style={styles.container}>
      <View style={styles.content}>
        {/* Glow badge */}
        <View style={styles.logoBadge}>
          <Ionicons name="bicycle" size={48} color={COLORS.hotPink} />
        </View>

        <Text style={styles.title}>WORM UP</Text>
        <Text style={styles.subTitle}>DELIVERY PARTNER FLEET</Text>

        <View style={styles.taglineBox}>
          <Text style={styles.tagline}>9-Min Hyper-Local Fulfillment Network</Text>
        </View>

        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={COLORS.hotPink} />
          <Text style={styles.loaderText}>Verifying session & telemetry...</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Worm Up Partner OS • v1.0.0</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245, 98, 175, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.hotPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 16px rgba(245, 98, 175, 0.4)',
      },
      default: {
        shadowColor: COLORS.hotPink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 3,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
    letterSpacing: 4,
    marginTop: 4,
  },
  taglineBox: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagline: {
    fontSize: 12,
    color: COLORS.lightBlueLavender,
    fontWeight: '500',
  },
  loaderBox: {
    marginTop: 56,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
});
