import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitCategoryCard } from '../../types';

interface CategoryCardProps {
  card: BlinkitCategoryCard;
  onPress?: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ card, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      {/* 2x2 Real Online Image Grid Tile */}
      <View style={styles.gridContainer}>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Image
              source={{ uri: card.imageUrls[0] }}
              style={styles.cellImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cell}>
            <Image
              source={{ uri: card.imageUrls[1] }}
              style={styles.cellImage}
              resizeMode="cover"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Image
              source={{ uri: card.imageUrls[2] }}
              style={styles.cellImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cell}>
            <Image
              source={{ uri: card.imageUrls[3] }}
              style={styles.cellImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Overlay Chip */}
        <View style={styles.overlayChip}>
          <Text style={styles.overlayChipText}>{card.countBadge}</Text>
        </View>
      </View>

      {/* Label below with consistent height */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText} numberOfLines={2}>
          {card.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 108,
    marginRight: 14,
    alignItems: 'center',
  },
  gridContainer: {
    width: 108,
    height: 108,
    borderRadius: 14,
    backgroundColor: COLORS.cardBackground,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  overlayChip: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(254, 254, 254, 0.96)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  titleContainer: {
    height: 38,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
    color: '#1E293B',
  },
});
