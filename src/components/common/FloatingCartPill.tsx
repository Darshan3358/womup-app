import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';

interface FloatingCartPillProps {
  bottomOffset?: number; // Adjust offset when placed above sticky bar vs bottom nav
}

export const FloatingCartPill: React.FC<FloatingCartPillProps> = ({
  bottomOffset = 72,
}) => {
  const {
    blinkitCartCount,
    blinkitCartTotal,
    setActiveScreen,
    isAuthenticated,
    openAuthPrompt,
  } = useApp();

  if (blinkitCartCount <= 0) return null;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            openAuthPrompt('Please sign in or register to view your cart and checkout.', 'Your Cart');
          } else {
            setActiveScreen('Blinkit_Cart');
          }
        }}
        style={styles.touchable}
        accessibilityLabel={`View cart with ${blinkitCartCount} items`}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientPill}
        >
          {/* Left Bag Icon Avatar */}
          <View style={styles.avatarCircle}>
            <AppIcon name="shopping-bag" size={16} color={COLORS.primary} />
          </View>

          {/* Center Text Stack */}
          <View style={styles.textContainer}>
            <Text style={styles.viewCartTitle}>View cart</Text>
            <Text style={styles.itemCountSubtitle}>
              {blinkitCartCount} {blinkitCartCount === 1 ? 'item' : 'items'} • ₹{blinkitCartTotal}
            </Text>
          </View>

          {/* Right Chevron */}
          <View style={styles.chevronContainer}>
            <AppIcon name="chevron-right" size={20} color={COLORS.white} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  touchable: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  gradientPill: {
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  viewCartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 18,
  },
  itemCountSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(254, 254, 254, 0.9)',
    lineHeight: 14,
  },
  chevronContainer: {
    paddingRight: 4,
  },
});
