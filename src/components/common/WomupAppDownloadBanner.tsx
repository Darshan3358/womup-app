import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export const WomupAppDownloadBanner: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.sectionContainer}>
      <View style={[styles.bannerCard, !isDesktop && styles.bannerCardMobile]}>
        {/* Pink ambient glow decoration */}
        <View style={styles.glowCircle} />

        {/* Left: Smartphone Mockup */}
        <View style={[styles.phoneCol, !isDesktop && styles.phoneColMobile]}>
          <Image
            source={require('../../../assets/app_mockup.jpg')}
            style={styles.phoneImage}
            resizeMode="contain"
          />
        </View>

        {/* Center: Content & Store Badges */}
        <View style={[styles.contentCol, !isDesktop && styles.contentColMobile]}>
          <Text style={styles.title}>Download the Wom Up App</Text>
          <Text style={styles.subtitle}>
            Get exclusive offers, faster delivery and more!
          </Text>

          <View style={styles.buttonsRow}>
            {/* App Store */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.storeButton}
              accessibilityLabel="Download on App Store"
            >
              <Ionicons name="logo-apple" size={20} color="#101A4D" />
              <View style={styles.buttonTextColumn}>
                <Text style={styles.btnSmallLabel}>Download on the</Text>
                <Text style={styles.btnMainLabel}>App Store</Text>
              </View>
            </TouchableOpacity>

            {/* Google Play */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.storeButton}
              accessibilityLabel="Get it on Google Play"
            >
              <Ionicons name="logo-google-playstore" size={18} color="#101A4D" />
              <View style={styles.buttonTextColumn}>
                <Text style={styles.btnSmallLabel}>GET IT ON</Text>
                <Text style={styles.btnMainLabel}>Google Play</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Rotated "Shop Smarter" brand signature */}
        {isDesktop && (
          <View style={styles.brandAccentCol}>
            <View style={styles.scriptWrap}>
              <Text style={styles.scriptTop}>Shop</Text>
              <Text style={styles.scriptBottom}>Smarter</Text>
              <Ionicons
                name="sparkles"
                size={18}
                color={COLORS.hotPink}
                style={styles.sparkleIcon}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginVertical: 18,
  },
  bannerCard: {
    backgroundColor: '#0B1755',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0B1755',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  bannerCardMobile: {
    flexDirection: 'column',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  glowCircle: {
    position: 'absolute',
    top: -100,
    right: 100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(236, 74, 157, 0.15)',
  },
  phoneCol: {
    width: 220,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  phoneColMobile: {
    width: 200,
    height: 160,
    marginBottom: 16,
  },
  phoneImage: {
    width: '100%',
    height: '100%',
  },
  contentCol: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  contentColMobile: {
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  storeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonTextColumn: {
    justifyContent: 'center',
  },
  btnSmallLabel: {
    fontSize: 8.5,
    color: '#62677A',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  btnMainLabel: {
    fontSize: 13,
    color: '#101A4D',
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: -1,
  },
  brandAccentCol: {
    paddingLeft: 20,
    zIndex: 2,
  },
  scriptWrap: {
    transform: [{ rotate: '-8deg' }],
    alignItems: 'center',
    position: 'relative',
  },
  scriptTop: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  scriptBottom: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
    marginTop: -4,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -10,
    right: -16,
  },
});
