import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export const WHY_CHOOSE_ITEMS = [
  {
    id: '1',
    title: 'Wide Range',
    sub: '2000+ Products',
    iconType: 'feather' as const,
    iconName: 'box',
  },
  {
    id: '2',
    title: 'Quick Delivery',
    sub: 'In 9 Minutes',
    iconType: 'feather' as const,
    iconName: 'zap',
  },
  {
    id: '3',
    title: 'Secure Payment',
    sub: '100% Safe',
    iconType: 'feather' as const,
    iconName: 'shield',
  },
  {
    id: '4',
    title: 'Easy Returns',
    sub: 'Hassle Free',
    iconType: 'feather' as const,
    iconName: 'repeat',
  },
];

export const WomupWhyChooseUs: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 540;

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Why Choose Wom Up?</Text>

      <View style={[styles.grid, !isDesktop && (isTablet ? styles.gridTablet : styles.gridMobile)]}>
        {WHY_CHOOSE_ITEMS.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              isDesktop && styles.cardDesktop,
              !isDesktop && isTablet && styles.cardTablet,
              !isTablet && styles.cardMobile,
            ]}
          >
            <View style={styles.iconWrap}>
              {item.iconName === 'box' && <Feather name="box" size={20} color={COLORS.hotPink} />}
              {item.iconName === 'zap' && <Feather name="zap" size={20} color={COLORS.hotPink} />}
              {item.iconName === 'shield' && <Feather name="shield" size={20} color={COLORS.hotPink} />}
              {item.iconName === 'repeat' && <Feather name="repeat" size={20} color={COLORS.hotPink} />}
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101A4D',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 14,
  },
  gridTablet: {
    flexWrap: 'wrap',
  },
  gridMobile: {
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAF1',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDesktop: {
    flex: 1,
  },
  cardTablet: {
    width: '48.5%',
  },
  cardMobile: {
    width: '48%',
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FCEAF5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101A4D',
    lineHeight: 18,
  },
  cardSub: {
    fontSize: 11.5,
    color: '#62677A',
    fontWeight: '500',
    marginTop: 2,
  },
});
