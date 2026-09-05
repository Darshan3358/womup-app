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
import { CATEGORIES } from '../data/categories';
import { useApp } from '../context/AppContext';

export const S13_CategoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, setSelectedCategoryId, setSelectedCategoryName, goBack } = useApp();

  const handleSelect = (id: string, name: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setActiveScreen('C14_SubCategory');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Grocery Categories"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => handleSelect(cat.id, cat.name)}
              style={styles.card}
            >
              <View style={[styles.iconCircle, { backgroundColor: cat.bgColor }]}>
                <Ionicons name={cat.iconName as any} size={30} color={cat.color} />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {cat.name}
              </Text>
              <Text style={styles.count}>{cat.itemCount}+ items</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '30.5%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.compact,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 30,
  },
  count: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
