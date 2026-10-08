import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface CategoryItem {
  id: string;
  name: string;
  bgColor: string;
  iconName: string;
  iconType: 'ionicons' | 'material';
  iconColor: string;
}

export const LOCAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'Vegetables',
    name: 'Vegetables',
    bgColor: '#D1FAE5', // Mint green
    iconName: 'carrot',
    iconType: 'material',
    iconColor: '#10B981',
  },
  {
    id: 'Grocery',
    name: 'Grocery',
    bgColor: '#FCE7F3', // Soft pink
    iconName: 'cart-outline',
    iconType: 'ionicons',
    iconColor: '#EC4899',
  },
  {
    id: 'Medical',
    name: 'Medical',
    bgColor: '#E0F2FE', // Light cyan / blue
    iconName: 'medical-outline',
    iconType: 'ionicons',
    iconColor: '#0284C7',
  },
  {
    id: 'Salon',
    name: 'Salon',
    bgColor: '#FFEDD5', // Peach
    iconName: 'cut-outline',
    iconType: 'ionicons',
    iconColor: '#EA580C',
  },
  {
    id: 'Garments',
    name: 'Garments',
    bgColor: '#F3E8FF', // Lavender
    iconName: 'tshirt-crew-outline',
    iconType: 'material',
    iconColor: '#9333EA',
  },
  {
    id: 'More',
    name: 'More',
    bgColor: '#F1F5F9', // Gray
    iconName: 'grid-outline',
    iconType: 'ionicons',
    iconColor: '#475569',
  },
];

interface CategoryHScrollProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryHScroll: React.FC<CategoryHScrollProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {LOCAL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => onSelectCategory(isSelected ? '' : cat.id)}
            >
              {/* Circular Icon Wrapper */}
              <View
                style={[
                  styles.circleWrapper,
                  { backgroundColor: cat.bgColor },
                  isSelected && styles.circleSelected,
                ]}
              >
                {cat.iconType === 'material' ? (
                  <MaterialCommunityIcons
                    name={cat.iconName as any}
                    size={28}
                    color={cat.iconColor}
                  />
                ) : (
                  <Ionicons
                    name={cat.iconName as any}
                    size={26}
                    color={cat.iconColor}
                  />
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && styles.categoryLabelSelected,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    width: 62,
  },
  circleWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  circleSelected: {
    borderColor: '#E11D48',
    transform: [{ scale: 1.05 }],
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    fontWeight: '800',
    color: '#E11D48',
  },
});
