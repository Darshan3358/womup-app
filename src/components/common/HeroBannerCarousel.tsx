import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  banners?: any[];
}

const HeroBannerCarouselComponent: React.FC<HeroBannerCarouselProps> = ({ onBannerPress, banners }) => {
  const { width } = useWindowDimensions();
  // Ensure the banner container never exceeds viewport width minus 24px padding
  const bannerWidth = Math.min(width - 24, 1400);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const timerRef = useRef<any>(null);
  const isInteracting = useRef(false);

  const slides: HeroBannerItem[] = useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b: any, idx: number) => {
        const fallback = HERO_SLIDES[idx % HERO_SLIDES.length];
        const isCat = b.targetType?.toLowerCase() === 'category' || !!b.targetId;
        return {
          id: b._id || b.id || `hero_${idx}`,
          type: isCat ? 'category' : 'deals',
          categoryName: b.targetId === 'c1' ? 'Vegetables & Fruits' : b.targetId === 'c3' ? 'Dairy, Bread & Eggs' : (b.title || fallback.categoryName),
          categoryId: b.targetId || undefined,
          image: b.imageUrl ? { uri: b.imageUrl } : fallback.image,
          bgColor: '#F9ECF8',
        };
      });
    }
    return HERO_SLIDES;
  }, [banners]);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (isInteracting.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({
          x: next * bannerWidth,
          animated: true,
        });
        return next;
      });
    }, 4500);
  }, [bannerWidth, slides.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (bannerWidth || 1));
    if (index >= 0 && index < slides.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Aspect ratio tuned to 2.35:1 (16:7) matching modern e-commerce banner standards (Blinkit/Zepto)
  // and uploaded Cloudinary banner dimensions (1024x434 / 2.36 ratio)
  const bannerAspectRatio = 2.35;
  const bannerHeight = Math.min(Math.round(bannerWidth / bannerAspectRatio), 360);

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
          contentContainerStyle={{ width: bannerWidth * slides.length, height: bannerHeight }}
        >
          {slides.map((slide) => (
            <TouchableOpacity
              key={slide.id}
              activeOpacity={0.92}
              onPress={() => onBannerPress && onBannerPress(slide)}
              style={[
                styles.bannerTouchable,
                { width: bannerWidth, height: bannerHeight, backgroundColor: slide.bgColor || '#F8FAFC' },
              ]}
            >
              <Image
                source={slide.image}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Carousel Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, idx) => (
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
    borderRadius: 20,
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
    width: 22,
    backgroundColor: '#E11D88',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#FCE7F3',
  },
});

export const HeroBannerCarousel = React.memo(HeroBannerCarouselComponent);
