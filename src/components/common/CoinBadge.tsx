import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';

interface CoinBadgeProps {
  coins: number;
  prefix?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({
  coins,
  prefix = '+',
  size = 'sm',
}) => {
  const isLarge = size === 'lg';
  const isMedium = size === 'md';

  return (
    <View
      style={[
        styles.container,
        isMedium && styles.mediumContainer,
        isLarge && styles.largeContainer,
      ]}
    >
      <Ionicons
        name="ribbon"
        size={isLarge ? 16 : isMedium ? 14 : 11}
        color={COLORS.purple}
      />
      <Text
        style={[
          styles.text,
          isMedium && styles.mediumText,
          isLarge && styles.largeText,
        ]}
      >
        {prefix}{coins} SC
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
    marginLeft: 3,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});
