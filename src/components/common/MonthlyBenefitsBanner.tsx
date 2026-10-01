import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface MonthlyBenefitsBannerProps {
  onJoinPress?: () => void;
}

export const MonthlyBenefitsBanner: React.FC<MonthlyBenefitsBannerProps> = ({ onJoinPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onJoinPress}
        style={styles.card}
        accessibilityLabel="Up to ₹2,000 Monthly Benefits. Join Free"
      >
        <Image
          source={require('../../../assets/offer2000.png')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    marginVertical: 14,
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    aspectRatio: 1024 / 288,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F2EEFF',
    shadowColor: '#142350',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
});
