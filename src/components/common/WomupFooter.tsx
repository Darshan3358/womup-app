import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export const WomupFooter: React.FC = () => {
  const { width } = useWindowDimensions();
  const { setActiveScreen } = useApp();
  const isDesktop = width >= 768;

  return (
    <View style={styles.footerContainer}>
      <View style={styles.innerContainer}>
        {/* Top Section */}
        <View style={[styles.topRow, !isDesktop && styles.topRowMobile]}>
          {/* Logo */}
          <View style={styles.logoCol}>
            <View style={styles.logoTitleRow}>
              <Text style={styles.logoWom}>WOM </Text>
              <Text style={styles.logoUp}>UP</Text>
            </View>
            <Text style={styles.logoTagline}>Shop Smarter</Text>
          </View>

          {/* Links */}
          <View style={[styles.linksRow, !isDesktop && styles.linksRowMobile]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveScreen('Blinkit_Profile')}
            >
              <Text style={styles.linkText}>About Us</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveScreen('Blinkit_Profile')}
            >
              <Text style={styles.linkText}>Help</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveScreen('Blinkit_Profile')}
            >
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.linkDivider}>|</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveScreen('Blinkit_Profile')}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Social Icons */}
          <View style={styles.socialsRow}>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <Ionicons name="logo-instagram" size={17} color="#101A4D" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <Ionicons name="logo-facebook" size={17} color="#101A4D" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <Ionicons name="logo-youtube" size={17} color="#101A4D" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <Ionicons name="logo-twitter" size={16} color="#101A4D" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Copyright */}
        <View style={styles.bottomRow}>
          <Text style={styles.copyrightText}>
            © 2025 Wom Up. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9EAF1',
    paddingVertical: 32,
    marginTop: 36,
  },
  innerContainer: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    gap: 20,
  },
  topRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 16,
  },
  logoCol: {
    justifyContent: 'center',
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoWom: {
    color: '#0B1755',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoUp: {
    color: '#EC4A9D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoTagline: {
    color: '#62677A',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  linksRowMobile: {
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    color: '#62677A',
    fontWeight: '500',
  },
  linkDivider: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  socialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F8',
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 11.5,
    color: '#9296A7',
    fontWeight: '500',
  },
});
