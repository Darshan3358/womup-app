import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { ProductService } from '../services/productService';
import { useApp } from '../context/AppContext';

export const S14_SubCategoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, selectedCategoryId, selectedCategoryName, setSelectedCategoryName, goBack } = useApp();

  const subCategories = ProductService.getSubCategories(selectedCategoryId);

  const handleSubCategorySelect = (subName: string) => {
    setSelectedCategoryName(subName);
    setActiveScreen('C15_ProductListing');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={selectedCategoryName || 'Cooking Essentials'}
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {subCategories.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handleSubCategorySelect(item.name)}
            style={styles.row}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.iconName as any} size={22} color={COLORS.purple} />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.count}>{item.itemCount} items</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.compact,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.compact,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
