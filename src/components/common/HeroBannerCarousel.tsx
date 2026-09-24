import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export interface HeroBannerItem {
  id: string;
  title: string;
  image: any;
  type: 'deals' | 'category';
  categoryName?: string;
  categoryId?: string;
}

export const HERO_BANNERS: HeroBannerItem[] = [
  {
    id: 'banner_maggi',
    title: 'New Maggi Double Masala Noodles',
    image: require('../../../assets/maggi_double_masala_banner.jpg'),
    type: 'deals',
  },
  {
    id: 'banner_amul',
    title: 'Pure Amul Festive Cow Ghee',
    image: require('../../../assets/amul_festive_ghee_banner.jpg'),
    type: 'category',
    categoryName: 'Dairy, Bread & Eggs',
    categoryId: 'c1',
  },
  {
    id: 'banner_loreal',
    title: "L'Oréal Paris Volume Rush Range",
    image: require('../../../assets/loreal_volume_rush_banner.jpg'),
    type: 'category',
    categoryName: 'Bath & Body',
    categoryId: 'c7',
  },
  {
    id: 'banner_nivea',
    title: 'Nivea Deep Impact Men Grooming',
    image: require('../../../assets/nivea_grooming_banner.jpg'),
    type: 'category',
    categoryName: 'Bath & Body',
    categoryId: 'c7',
  },
];

interface HeroBannerCarouselProps {
  onBannerPress?: (banner: HeroBannerItem) => void;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({ onBannerPress }) => {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const timerRef = useRef<any>(null);
  const isInteracting = useRef(false);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isInteracting.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % HERO_BANNERS.length;
        scrollRef.current?.scrollTo({
          x: next * containerWidth,
          animated: true,
        });
        return next;
      });
    }, 3500);
  }, [containerWidth]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (containerWidth || 1));
    if (index >= 0 && index < HERO_BANNERS.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleScrollBegin = () => {
    isInteracting.current = true;
  };

  const handleScrollEnd = () => {
    isInteracting.current = false;
  };

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={(e) => {
          handleScroll(e);
          handleScrollEnd();
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {HERO_BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.94}
            onPress={() => onBannerPress?.(banner)}
            style={[styles.slide, { width: containerWidth }]}
            accessibilityLabel={banner.title}
          >
            <Image
              source={banner.image}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pill Pagination Dots */}
      <View style={styles.pagination} pointerEvents="none">
        {HERO_BANNERS.map((_, i) => (
          <View
            key={`dot_${i}`}
            style={[
              styles.dot,
              activeIndex === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  slide: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
