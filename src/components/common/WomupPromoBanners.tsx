import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

interface WomupPromoBannersProps {
  onPressProduce?: () => void;
  onPressDairy?: () => void;
}

export const WomupPromoBanners: React.FC<WomupPromoBannersProps> = ({
  onPressProduce,
  onPressDairy,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.sectionContainer}>
      <View style={[styles.grid, !isDesktop && styles.gridStacked]}>
        {/* Banner 1: Fresh Fruits & Vegetables */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPressProduce}
          style={[
            styles.bannerCard,
            { backgroundColor: '#EDE8FF' },
            isDesktop ? styles.bannerCardDesktop : { aspectRatio: 1024 / 452 },
          ]}
          accessibilityLabel="Explore Fresh Fruits & Vegetables"
        >
          <Image
            source={require('../../../assets/FRESH AND HEALTHY .png')}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Banner 2: Pure & Fresh Dairy Products */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPressDairy}
          style={[
            styles.bannerCard,
            { backgroundColor: '#FCEAF5' },
            isDesktop ? styles.bannerCardDesktop : { aspectRatio: 1024 / 572 },
          ]}
          accessibilityLabel="Shop Dairy Products"
        >
          <Image
            source={require('../../../assets/dairy special.png')}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginVertical: 14,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridStacked: {
    flexDirection: 'column',
    gap: 14,
  },
  bannerCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCardDesktop: {
    flex: 1,
    height: 220,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
