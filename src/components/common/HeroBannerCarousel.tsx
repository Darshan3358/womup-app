import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export interface HeroBannerItem {
  id: string;
  type: 'deals' | 'category';
  categoryName?: string;
  categoryId?: string;
  image: any;
  bgColor?: string;
}

export const HERO_SLIDES: HeroBannerItem[] = [
  {
    id: 'hero_1',
    type: 'deals',
    image: require('../../../assets/home banner .png'),
    bgColor: '#F9ECF8',
  },
  {
    id: 'hero_snacks',
    type: 'category',
    categoryName: 'Chips & Namkeen',
    categoryId: 'c4',
    image: require('../../../assets/banners/snacks_beverages.jpg'),
    bgColor: '#0D47A1',
  },
  {
    id: 'hero_2',
    type: 'category',
    categoryName: 'Vegetables & Fruits',
    categoryId: 'c1',
    image: require('../../../assets/FRESH AND HEALTHY .png'),
    bgColor: '#EDE8FF',
  },
  {
    id: 'hero_3',
    type: 'category',
    categoryName: 'Dairy, Bread & Eggs',
    categoryId: 'c3',
    image: require('../../../assets/dairy special.png'),
    bgColor: '#FCEAF5',
  },
];

interface HeroBannerCarouselProps {
  onBannerPress?: (banner: HeroBannerItem) => void;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({ onBannerPress }) => {
  const { width } = useWindowDimensions();
  // Ensure the banner container never exceeds viewport width minus 24px padding
  const bannerWidth = Math.min(width - 24, 1400);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const timerRef = useRef<any>(null);
  const isInteracting = useRef(false);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isInteracting.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        scrollRef.current?.scrollTo({
          x: next * bannerWidth,
          animated: true,
        });
        return next;
      });
    }, 4500);
  }, [bannerWidth]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (bannerWidth || 1));
    if (index >= 0 && index < HERO_SLIDES.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Dynamic 2:1 aspect ratio matching the 1024x512 banner dimensions so the image fills edge-to-edge with zero empty space
  const bannerHeight = Math.min(Math.round(bannerWidth * 0.5), 360);

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.carouselContainer, { width: bannerWidth, height: bannerHeight }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            isInteracting.current = true;
          }}
          onScrollEndDrag={() => {
            isInteracting.current = false;
          }}
          style={{ width: bannerWidth, height: bannerHeight, maxWidth: '100%', overflow: 'hidden' }}
          contentContainerStyle={{ width: bannerWidth * HERO_SLIDES.length, height: bannerHeight }}
        >
          {HERO_SLIDES.map((slide) => (
            <TouchableOpacity
              key={slide.id}
              activeOpacity={0.92}
              onPress={() => onBannerPress && onBannerPress(slide)}
              style={[
                styles.bannerTouchable,
                { width: bannerWidth, height: bannerHeight, backgroundColor: slide.bgColor || '#F9ECF8' },
              ]}
            >
              <Image
                source={slide.image}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Carousel Dots */}
      <View style={styles.dotsContainer}>
        {HERO_SLIDES.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => {
              scrollRef.current?.scrollTo({
                x: idx * bannerWidth,
                animated: true,
              });
              setActiveIndex(idx);
            }}
            style={[
              styles.dot,
              idx === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  carouselContainer: {
    maxWidth: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9ECF8',
    shadowColor: '#EC4A9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#EC4A9D',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(16, 26, 77, 0.16)',
  },
});
