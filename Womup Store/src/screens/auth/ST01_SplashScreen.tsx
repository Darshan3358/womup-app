import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export const ST01_SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="storefront" size={54} color={COLORS.primary} />
      </View>
      <Text style={styles.appName}>WORM UP</Text>
      <Text style={styles.appRole}>DARK STORE OPERATIONS</Text>
      <Text style={styles.tagline}>9-Minute Hyperlocal Fulfillment Hub</Text>

      <View style={styles.loaderArea}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing Dark Store Terminal...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appRole: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  loaderArea: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 10,
  },
});
