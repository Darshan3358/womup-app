import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';
import { CartService } from '../../services/cartService';
import { matchAreaByName } from '../../data/areas';

interface FloatingCartPillProps {
  bottomOffset?: number; // Adjust offset when placed above sticky bar vs bottom nav
}

export const FloatingCartPill: React.FC<FloatingCartPillProps> = ({
  bottomOffset = 84,
}) => {
  const insets = useSafeAreaInsets();
  const {
    blinkitCartCount,
    blinkitCartTotal,
    blinkitCartList,
    currentCityName,
    currentAreaName,
    currentStoreId,
    selectedAddress,
    selectedAddressSource,
    setActiveScreen,
    isAuthenticated,
    openAuthPrompt,
  } = useApp();

  // Floating Cart Pill should float above the BottomNavigation bar.
  // Standard tab bar height is 66 + bottom padding (Math.max(insets.bottom, 10)).
  // We ensure it never dips below (insets.bottom + 80px) to prevent overlap.
  const effectiveBottom = Math.max(bottomOffset, (insets.bottom || 0) + 80);

  // Pre-warm dynamic delivery fee calculation cache before user navigates to cart (debounced 500ms)
  useEffect(() => {
    if (blinkitCartCount <= 0) return;
    const abortController = new AbortController();

    const timer = setTimeout(() => {
      const matchedArea = matchAreaByName(
        selectedAddress?.areaLandmark || (selectedAddress as any)?.area || currentAreaName || ''
      );
      const feeParams = CartService.buildDeliveryFeeParams({
        items: blinkitCartList,
        selectedAddress,
        matchedArea,
        currentAreaName,
        currentCityName,
        currentStoreId,
      });

      // Only invoke backend if not already in memory cache
      const cached = CartService.getCachedDeliveryFee(feeParams);

      if (!cached) {
        CartService.calculateDynamicDeliveryFee({
          ...feeParams,
          forceRefresh: false,
        }).catch(() => {});
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [blinkitCartCount, currentAreaName, currentCityName, currentStoreId, selectedAddress, selectedAddressSource]);

  if (blinkitCartCount <= 0) return null;

  return (
    <View style={[styles.wrapper, { bottom: effectiveBottom }]}>
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
    zIndex: 9999,
    elevation: 10,
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
