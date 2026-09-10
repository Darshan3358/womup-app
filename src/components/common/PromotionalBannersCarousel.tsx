import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Card width with side peeking
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const CARD_HEIGHT = CARD_WIDTH * (9 / 16);

export interface PromoBannerItem {
  id: string;
  image: any;
  title: string;
}

const PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: 'loreal_rush',
    title: "L'Oréal Paris Volume Rush",
    image: require('../../../assets/loreal_volume_rush_banner.jpg'),
  },
  {
    id: 'amul_ghee',
    title: 'Festive Purity with Amul Ghee',
    image: require('../../../assets/amul_festive_ghee_banner.jpg'),
  },
  {
    id: 'nivea_men',
    title: "Men's Grooming Essentials",
    image: require('../../../assets/nivea_grooming_banner.jpg'),
  },
];

interface PromotionalBannersCarouselProps {
  onPressBanner?: (bannerId: string) => void;
}

export const PromotionalBannersCarousel: React.FC<PromotionalBannersCarouselProps> = ({
  onPressBanner,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (CARD_WIDTH + 12));
    if (index >= 0 && index < PROMO_BANNERS.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {PROMO_BANNERS.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.92}
            onPress={() => onPressBanner?.(item.id)}
            style={[
              styles.cardContainer,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
              },
            ]}
          >
            <Image
              source={item.image}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Indicator Dots */}
      <View style={styles.paginationRow}>
        {PROMO_BANNERS.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              activeIndex === idx ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
    width: '100%',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.navy,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D1D5DB',
  },
});
