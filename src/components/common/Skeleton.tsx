import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  useWindowDimensions,
  ScrollView,
} from 'react-native';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animation?: 'wave' | 'pulse' | 'none';
}

/**
 * Universal Smooth Shimmer / Pulse Skeleton component
 * Matches Material-UI / Blinkit fluid placeholder standards
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
  animation = 'wave',
}) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (animation === 'none') return;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();

    return () => anim.stop();
  }, [animatedValue, animation]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity: animation === 'none' ? 0.3 : animatedValue,
        },
        style,
      ]}
    />
  );
};

/**
 * Product Card Skeleton matching the exact layout of ProductSection cards
 */
export const ProductCardSkeleton: React.FC<{ cardWidth?: number }> = ({ cardWidth }) => {
  const { width } = useWindowDimensions();

  let resolvedWidth = cardWidth;
  if (!resolvedWidth) {
    if (width >= 1200) {
      resolvedWidth = Math.floor((Math.min(width, 1440) - 48) / 6.2);
    } else if (width >= 900) {
      resolvedWidth = Math.floor((width - 40) / 5.2);
    } else if (width >= 680) {
      resolvedWidth = Math.floor((width - 32) / 4.4);
    } else if (width >= 375) {
      resolvedWidth = Math.max(88, Math.floor((width - 32 - 24) / 3.6));
    } else {
      resolvedWidth = Math.max(82, Math.floor((width - 24 - 16) / 3.2));
    }
  }

  const isCompact = (resolvedWidth || 98) <= 115;

  return (
    <View
      style={[
        styles.cardContainer,
        { width: resolvedWidth },
        isCompact && { padding: 6, borderRadius: 10 },
      ]}
    >
      {/* Product Image placeholder */}
      <View style={[styles.imageWrapper, isCompact && { marginBottom: 6 }]}>
        <Skeleton width="100%" height="100%" borderRadius={8} />
      </View>

      {/* Product Title line 1 */}
      <Skeleton width="85%" height={isCompact ? 10 : 12} borderRadius={4} style={{ marginTop: 6 }} />

      {/* Product Title line 2 / Weight */}
      <Skeleton width="55%" height={isCompact ? 8 : 10} borderRadius={3} style={{ marginTop: 4 }} />

      {/* Variant / Tag pill */}
      <Skeleton width="65%" height={isCompact ? 14 : 18} borderRadius={4} style={{ marginTop: 6 }} />

      {/* Price + ADD Button row */}
      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={isCompact ? 12 : 14} borderRadius={3} />
          <Skeleton width="45%" height={isCompact ? 8 : 10} borderRadius={2} style={{ marginTop: 2 }} />
        </View>
        <Skeleton width={isCompact ? 38 : 46} height={isCompact ? 22 : 26} borderRadius={6} />
      </View>
    </View>
  );
};

/**
 * Product Section Skeleton (Header + Horizontal carousel of 4-5 card skeletons)
 */
export const ProductSectionSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
}> = ({ title, subtitle }) => {
  return (
    <View style={styles.sectionContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Skeleton width={32} height={32} borderRadius={10} style={{ marginRight: 10 }} />
          <View>
            {title ? (
              <Skeleton width={140} height={16} borderRadius={4} />
            ) : (
              <Skeleton width={130} height={16} borderRadius={4} />
            )}
            {subtitle ? (
              <Skeleton width={100} height={11} borderRadius={3} style={{ marginTop: 4 }} />
            ) : (
              <Skeleton width={90} height={10} borderRadius={3} style={{ marginTop: 4 }} />
            )}
          </View>
        </View>
        <Skeleton width={60} height={18} borderRadius={4} />
      </View>

      {/* Horizontal Carousel of Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        {[1, 2, 3, 4, 5].map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * Cart Screen Skeleton matching BlinkitCartScreen layout
 */
export const CartScreenSkeleton: React.FC = () => {
  return (
    <View style={skeletonStyles.screenContainer}>
      {/* Header */}
      <View style={skeletonStyles.cartHeader}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Skeleton width={90} height={18} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={3} />
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={skeletonStyles.screenScroll}>
        {/* ETA Banner */}
        <View style={skeletonStyles.etaBannerSkeleton}>
          <Skeleton width={120} height={16} borderRadius={4} />
          <Skeleton width={100} height={14} borderRadius={4} />
        </View>

        {/* Cart Item Cards */}
        <View style={skeletonStyles.cardBox}>
          {[1, 2].map((i) => (
            <View key={i} style={[skeletonStyles.itemRowSkeleton, i > 1 && skeletonStyles.rowBorder]}>
              <Skeleton width={48} height={48} borderRadius={8} />
              <View style={{ flex: 1, gap: 5 }}>
                <Skeleton width="80%" height={14} borderRadius={3} />
                <Skeleton width="40%" height={11} borderRadius={3} />
                <Skeleton width="30%" height={16} borderRadius={3} />
              </View>
              <Skeleton width={70} height={30} borderRadius={15} />
            </View>
          ))}
        </View>

        {/* Coupons Box */}
        <View style={skeletonStyles.cardBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton width={120} height={16} borderRadius={4} />
            <Skeleton width={60} height={30} borderRadius={6} />
          </View>
        </View>

        {/* Bill Details Box */}
        <View style={[skeletonStyles.cardBox, { gap: 12 }]}>
          <Skeleton width={100} height={16} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={90} height={14} borderRadius={3} />
            <Skeleton width={45} height={14} borderRadius={3} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={110} height={14} borderRadius={3} />
            <Skeleton width={40} height={14} borderRadius={3} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={80} height={14} borderRadius={3} />
            <Skeleton width={35} height={14} borderRadius={3} />
          </View>
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={90} height={18} borderRadius={4} />
            <Skeleton width={60} height={18} borderRadius={4} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={skeletonStyles.bottomBar}>
        <View style={{ gap: 4 }}>
          <Skeleton width={50} height={12} borderRadius={3} />
          <Skeleton width={70} height={20} borderRadius={4} />
        </View>
        <Skeleton width={160} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

/**
 * Checkout Screen Skeleton matching BlinkitCheckoutScreen layout
 */
export const CheckoutScreenSkeleton: React.FC = () => {
  return (
    <View style={skeletonStyles.screenContainer}>
      {/* Header */}
      <View style={skeletonStyles.cartHeader}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <Skeleton width={130} height={20} borderRadius={4} />
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={skeletonStyles.screenScroll}>
        {/* Address Selection Cards */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[skeletonStyles.cardBox, { flex: 1, gap: 8, padding: 12 }]}>
            <Skeleton width={70} height={16} borderRadius={4} />
            <Skeleton width="100%" height={14} borderRadius={3} />
            <Skeleton width="70%" height={12} borderRadius={3} />
          </View>
          <View style={[skeletonStyles.cardBox, { flex: 1, gap: 8, padding: 12 }]}>
            <Skeleton width={60} height={16} borderRadius={4} />
            <Skeleton width="100%" height={14} borderRadius={3} />
            <Skeleton width="60%" height={12} borderRadius={3} />
          </View>
        </View>

        {/* Selected Address Details */}
        <View style={[skeletonStyles.cardBox, { gap: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={110} height={18} borderRadius={4} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>
          <Skeleton width="90%" height={14} borderRadius={3} />
          <Skeleton width="60%" height={12} borderRadius={3} />
        </View>

        {/* Delivery Time & Slot */}
        <View style={[skeletonStyles.cardBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Skeleton width={140} height={16} borderRadius={4} />
          <Skeleton width={80} height={24} borderRadius={6} />
        </View>

        {/* Bill Summary */}
        <View style={[skeletonStyles.cardBox, { gap: 12 }]}>
          <Skeleton width={100} height={16} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={100} height={14} borderRadius={3} />
            <Skeleton width={50} height={14} borderRadius={3} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={90} height={14} borderRadius={3} />
            <Skeleton width={45} height={14} borderRadius={3} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={110} height={14} borderRadius={3} />
            <Skeleton width={40} height={14} borderRadius={3} />
          </View>
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={90} height={18} borderRadius={4} />
            <Skeleton width={60} height={18} borderRadius={4} />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={[skeletonStyles.cardBox, { gap: 12 }]}>
          <Skeleton width={120} height={16} borderRadius={4} />
          {[1, 2, 3].map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width="60%" height={14} borderRadius={3} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={skeletonStyles.bottomBar}>
        <View style={{ gap: 4 }}>
          <Skeleton width={50} height={12} borderRadius={3} />
          <Skeleton width={70} height={20} borderRadius={4} />
        </View>
        <Skeleton width={160} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sectionContainer: {
    marginVertical: 10,
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginRight: 8,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 4,
  },
});

const skeletonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  screenScroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  etaBannerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
});
