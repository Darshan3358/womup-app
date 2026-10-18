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
