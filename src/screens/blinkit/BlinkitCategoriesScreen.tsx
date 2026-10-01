import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { BlinkitHeader } from '../../components/common/BlinkitHeader';
import { FloatingCartPill } from '../../components/common/FloatingCartPill';
import { useApp } from '../../context/AppContext';
import {
  MAIN_CATEGORY_GRID,
  SNACKS_DRINKS_GRID,
  BEAUTY_GRID,
  HOUSEHOLD_GRID,
  LIFESTYLE_PICKS,
  BlinkitIconTile,
  resolveCategoryGroup,
} from '../../data/blinkitData';

export const BlinkitCategoriesScreen: React.FC = () => {
  const {
    navigateToProductListing,
  } = useApp();

  const handleTilePress = (tile: BlinkitIconTile) => {
    const categoryIds = resolveCategoryGroup(tile.id, tile.title);
    navigateToProductListing(tile.title, categoryIds);
  };

  const renderSection = (title: string, subtitle: string, items: BlinkitIconTile[]) => (
    <View style={styles.sectionBlock}>
      <Text style={[TYPOGRAPHY.headingLg, styles.sectionTitle]}>{title}</Text>
      <Text style={[TYPOGRAPHY.bodySm, styles.sectionSubtitle]}>{subtitle}</Text>
      <View style={styles.gridContainer}>
        {items.map((tile) => (
          <TouchableOpacity
            key={tile.id}
            activeOpacity={0.75}
            onPress={() => handleTilePress(tile)}
            style={styles.tileItem}
          >
            <View style={[styles.iconBox, { backgroundColor: tile.bgColor || '#f0f7f0' }]}>
              <Image
                source={tile.localImage || { uri: tile.imageUrl }}
                style={styles.tileImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[TYPOGRAPHY.bodySmBold, styles.tileTitle]} numberOfLines={2}>
              {tile.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Pinned Gradient Header with Search */}
      <BlinkitHeader
        variant="gradient"
        etaLabel="Delivery in"
        etaTime="9 minutes"
        searchPlaceholder='Search "atta, dal, snacks, milk"'
        showCategoryTabs={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderSection('Grocery & Kitchen', 'Fresh essentials delivered in 9 minutes', MAIN_CATEGORY_GRID)}
        {renderSection('Snacks & Drinks', 'Munchies, cold beverages & sweets', SNACKS_DRINKS_GRID)}
        {renderSection('Beauty & Personal Care', 'Skincare, haircare & hygiene favorites', BEAUTY_GRID)}
        {renderSection('Household Essentials', 'Home, kitchen & cleaning supplies', HOUSEHOLD_GRID)}
        {renderSection('Picks for Your Lifestyle', 'Specialty curated categories', LIFESTYLE_PICKS)}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating View Cart pill */}
      <FloatingCartPill bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tileItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tileImage: {
    width: '82%',
    height: '82%',
    resizeMode: 'contain',
  },
  tileTitle: {
    textAlign: 'center',
    marginTop: 6,
    color: COLORS.textPrimary,
    fontSize: 11,
    lineHeight: 14,
  },
});
