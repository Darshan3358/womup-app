import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface WomupCategoryItem {
  id: string;
  name: string;
  bgColor: string;
  localImage?: any;
}

export const CATEGORIES_DATA: WomupCategoryItem[] = [
  {
    id: 'c1',
    name: 'Vegetables &\nFruits',
    bgColor: '#ECF5F7',
    localImage: require('../../../assets/cat_1_trans.png'),
  },
  {
    id: 'c2',
    name: 'Chips &\nNamkeen',
    bgColor: '#FCF6F0',
    localImage: require('../../../assets/cat_2_trans.png'),
  },
  {
    id: 'c3',
    name: 'Dairy, Bread &\nEggs',
    bgColor: '#F3F4FC',
    localImage: require('../../../assets/cat_3_trans.png'),
  },
  {
    id: 'c4',
    name: 'Oil, Ghee &\nMasala',
    bgColor: '#FDF7EE',
    localImage: require('../../../assets/cat_4_trans.png'),
  },
  {
    id: 'c5',
    name: 'Bakery &\nBiscuits',
    bgColor: '#F7F1FC',
    localImage: require('../../../assets/cat_5_trans.png'),
  },
  {
    id: 'c6',
    name: 'Drinks &\nJuices',
    bgColor: '#FCF2F2',
    localImage: require('../../../assets/cat_6_trans.png'),
  },
  {
    id: 'c7',
    name: 'Household\nEssentials',
    bgColor: '#EAF1FD',
    localImage: require('../../../assets/cat_7_trans.png'),
  },
  {
    id: 'c8',
    name: 'Personal\nCare',
    bgColor: '#FAF2FB',
    localImage: require('../../../assets/cat_8_trans.png'),
  },
  {
    id: 'c9',
    name: 'Baby\nCare',
    bgColor: '#F5F0FC',
    localImage: require('../../../assets/cat_9_trans.png'),
  },
  {
    id: 'c12',
    name: 'More',
    bgColor: '#FBEFF8',
    localImage: require('../../../assets/cat_12_trans.png'),
  },
];

export const ALL_CATEGORIES_DATA: WomupCategoryItem[] = [
  ...CATEGORIES_DATA.slice(0, 9),
  {
    id: 'c10',
    name: 'Pet\nCare',
    bgColor: '#EFF9F6',
    localImage: require('../../../assets/cat_10_trans.png'),
  },
  {
    id: 'c11',
    name: 'Frozen\nFoods',
    bgColor: '#EAF1FD',
    localImage: require('../../../assets/cat_11_trans.png'),
  },
  CATEGORIES_DATA[9], // More
];

interface WomupCategoryGridProps {
  onSelectCategory: (name: string, id: string) => void;
  onViewAll?: () => void;
}

const WomupCategoryGridComponent: React.FC<WomupCategoryGridProps> = ({
  onSelectCategory,
  onViewAll,
}) => {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width - 24, 1400);

  // Exactly 5 columns x 2 rows (9 categories + 1 More = 10 items)
  const isSmall = width < 480;
  // Inside white card padding (24 total horizontal padding inside containerWidth)
  const innerWidth = containerWidth - 24;
  const gap = isSmall ? 6 : 8;
  const cardWidth = Math.floor((innerWidth - 4 * gap) / 5);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.cardContainer}>
        {/* Header Row with Pink Bag Icon */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            <View style={styles.headerBagBadge}>
              <Ionicons name="bag-handle" size={15} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onViewAll} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {/* Grid: 5 columns x 2 rows = 10 items */}
        <View style={styles.gridContainer}>
          {CATEGORIES_DATA.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => {
                if (cat.id === 'c12' || cat.name.toLowerCase().includes('more')) {
                  if (onViewAll) {
                    onViewAll();
                  } else {
                    onSelectCategory(cat.name.replace('\n', ' '), cat.id);
                  }
                } else {
                  onSelectCategory(cat.name.replace('\n', ' '), cat.id);
                }
              }}
              style={[
                styles.card,
                {
                  width: cardWidth,
                  height: Math.round(cardWidth * 1.18),
                  backgroundColor: cat.bgColor,
                  paddingVertical: isSmall ? 6 : 8,
                  paddingHorizontal: 2,
                  borderRadius: isSmall ? 12 : 14,
                  marginBottom: gap,
                },
              ]}
              accessibilityLabel={cat.name.replace('\n', ' ')}
            >
              {cat.id === 'c12' ? (
                <View style={styles.moreIconWrapper}>
                  <Ionicons name="grid" size={20} color="#E11D88" />
                </View>
              ) : (
                <Image
                  source={cat.localImage}
                  style={[
                    styles.categoryImage,
                    {
                      width: Math.round(cardWidth * 0.65),
                      height: Math.round(cardWidth * 0.55),
                      marginBottom: isSmall ? 3 : 5,
                    },
                  ]}
                  resizeMode="contain"
                />
              )}

              <Text
                style={[
                  styles.categoryName,
                  isSmall && { fontSize: 9.5, lineHeight: 11.5 },
                ]}
                numberOfLines={2}
              >
                {cat.id === 'c3' ? 'Dairy, Bread\n& ...' : cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    marginTop: 10,
    marginBottom: 4,
    overflow: 'hidden',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBagBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#E11D88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D88',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '100%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryImage: {
    backgroundColor: 'transparent',
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 12.5,
  },
});

export const WomupCategoryGrid = React.memo(WomupCategoryGridComponent);
