import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  bottomOffset = 72,
}) => {
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

  // Pre-warm dynamic delivery fee calculation cache before user navigates to cart
  useEffect(() => {
    if (blinkitCartCount > 0) {
      const isSavedAddress = selectedAddressSource === 'SAVED' && selectedAddress && selectedAddress.type !== 'Current';
      const matchedArea = matchAreaByName(
        (isSavedAddress ? (selectedAddress?.areaLandmark || (selectedAddress as any)?.area || selectedAddress?.street || selectedAddress?.houseFlat) : null) ||
        currentAreaName ||
        selectedAddress?.areaLandmark
      );
      const activeLat = isSavedAddress
        ? (matchedArea?.lat || Number(selectedAddress?.latitude) || 23.0125)
        : (Number(selectedAddress?.latitude) || matchedArea?.lat || 23.0125);
      const activeLng = isSavedAddress
        ? (matchedArea?.lng || Number(selectedAddress?.longitude) || 72.5082)
        : (Number(selectedAddress?.longitude) || matchedArea?.lng || 72.5082);
      const areaKey = (isSavedAddress ? (selectedAddress?.areaLandmark || matchedArea?.name) : null) ||
        matchedArea?.name || currentAreaName || selectedAddress?.areaLandmark || 'Prahlad Nagar';
      const cityKey = (isSavedAddress ? selectedAddress?.city : null) || currentCityName || 'Ahmedabad';

      CartService.calculateDynamicDeliveryFee({
        items: blinkitCartList.map((item) => ({
          name: item.product.name,
          price: item.product.sellingPrice,
          mrp: item.product.mrp,
          quantity: item.quantity,
        })),
        cityName: cityKey,
        areaName: areaKey,
        storeId: currentStoreId || undefined,
        distanceKm: 1.2,
        deliveryAddress: {
          latitude: activeLat,
          longitude: activeLng,
          area: areaKey,
          city: cityKey,
        },
      }).catch(() => {});
    }
  }, [blinkitCartCount, currentAreaName, currentCityName, currentStoreId, selectedAddress, selectedAddressSource]);

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
