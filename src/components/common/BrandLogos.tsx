import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface BrandLogoProps {
  brandKey: 'amul' | 'tata' | 'nestle' | 'maggi' | 'fortune' | 'cocacola' | 'dove' | 'haldirams';
  width?: number;
  height?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ brandKey, width = 80, height = 36 }) => {
  switch (brandKey) {
    case 'amul':
      return (
        <View style={styles.center}>
          <Text style={styles.amulText}>Amul</Text>
          <Text style={styles.amulSub}>The Taste of India</Text>
        </View>
      );

    case 'tata':
      return (
        <View style={styles.center}>
          <Svg width={24} height={20} viewBox="0 0 24 20">
            <Path
              d="M12 2C6.48 2 2 5.58 2 10C2 14.42 6.48 18 12 18C17.52 18 22 14.42 22 10C22 5.58 17.52 2 12 2ZM9 7H15V9H13V15H11V9H9V7Z"
              fill="#0F4C9C"
            />
          </Svg>
          <Text style={styles.tataText}>TATA</Text>
        </View>
      );

    case 'nestle':
      return (
        <View style={styles.center}>
          <Svg width={28} height={18} viewBox="0 0 32 20">
            <Path
              d="M6 14C8 16 14 17 22 16M4 11C6 11 10 9 12 7M14 7C16 8 20 8 24 6M10 17C14 18 20 18 26 15"
              stroke="#5C381E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle cx="12" cy="5" r="2" fill="#5C381E" />
            <Circle cx="16" cy="4" r="1.5" fill="#5C381E" />
          </Svg>
          <Text style={styles.nestleText}>Nestlé</Text>
        </View>
      );

    case 'maggi':
      return (
        <View style={styles.maggiBadge}>
          <Text style={styles.maggiText}>Maggi</Text>
        </View>
      );

    case 'fortune':
      return (
        <View style={styles.center}>
          <Text style={styles.fortuneText}>fortune</Text>
          <View style={styles.fortuneDot} />
        </View>
      );

    case 'cocacola':
      return (
        <View style={styles.center}>
          <Text style={styles.cocaColaText}>Coca-Cola</Text>
        </View>
      );

    case 'dove':
      return (
        <View style={styles.center}>
          <Svg width={20} height={14} viewBox="0 0 24 16">
            <Path
              d="M2 12C6 10 12 5 18 2C15 6 12 9 8 11M18 2C20 4 22 8 22 12C18 10 12 12 6 14"
              fill="#C59B27"
            />
          </Svg>
          <Text style={styles.doveText}>Dove</Text>
        </View>
      );

    case 'haldirams':
      return (
        <View style={styles.haldiramsBadge}>
          <Text style={styles.haldiramsText}>Haldiram's</Text>
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amulText: {
    color: '#D8232A',
    fontSize: 19,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  amulSub: {
    color: '#101A4D',
    fontSize: 6,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  tataText: {
    color: '#0F4C9C',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  nestleText: {
    color: '#3B2314',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  maggiBadge: {
    backgroundColor: '#FFE500',
    borderWidth: 2,
    borderColor: '#D8232A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maggiText: {
    color: '#D8232A',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  fortuneText: {
    color: '#D8232A',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  fortuneDot: {
    width: 24,
    height: 2,
    backgroundColor: '#1FA463',
    borderRadius: 1,
    marginTop: 1,
  },
  cocaColaText: {
    color: '#F40000',
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  doveText: {
    color: '#0F2042',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  haldiramsBadge: {
    backgroundColor: '#D8232A',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haldiramsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
