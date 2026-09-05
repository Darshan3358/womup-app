import React, { useState } from 'react';
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
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { FilterSortState } from '../types';

export const S18_FilterSortScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, filters, setFilters, resetFilters, goBack } = useApp();

  const [localFilters, setLocalFilters] = useState<FilterSortState>({ ...filters });

  const sortOptions = [
    { key: 'popularity', label: 'Popularity' },
    { key: 'price_asc', label: 'Price — Low to High' },
    { key: 'price_desc', label: 'Price — High to Low' },
    { key: 'newest', label: 'Newest First' },
    { key: 'discount', label: 'Discount' },
  ] as const;

  const priceOptions: [number, number][] = [
    [0, 100],
    [0, 200],
    [0, 500],
    [100, 300],
    [200, 500],
  ];

  const handleApply = () => {
    setFilters(localFilters);
    goBack();
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters({
      sortBy: 'popularity',
      priceRange: [0, 500],
      inStockOnly: false,
    });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Filter & Sort"
        onBack={goBack}
        rightActionText="Reset"
        onRightActionPress={handleReset}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sort By Section */}
        <Text style={styles.sectionHeading}>Sort By</Text>
        <View style={styles.card}>
          {sortOptions.map((opt) => {
            const isSelected = localFilters.sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.7}
                onPress={() => setLocalFilters({ ...localFilters, sortBy: opt.key })}
                style={styles.radioRow}
              >
                <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>
                  {opt.label}
                </Text>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Range Filter */}
        <Text style={styles.sectionHeading}>Price Range</Text>
        <View style={styles.pillsRow}>
          {priceOptions.map((range, idx) => {
            const isSelected =
              localFilters.priceRange[0] === range[0] &&
              localFilters.priceRange[1] === range[1];
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setLocalFilters({ ...localFilters, priceRange: range })}
                style={[styles.pill, isSelected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  ₹{range[0]} – ₹{range[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* In Stock Only */}
        <Text style={styles.sectionHeading}>Availability</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            setLocalFilters({ ...localFilters, inStockOnly: !localFilters.inStockOnly })
          }
          style={styles.switchRow}
        >
          <View>
            <Text style={styles.switchTitle}>In Stock Items Only</Text>
            <Text style={styles.switchSubtitle}>Hide products that are currently out of stock</Text>
          </View>
          <Ionicons
            name={localFilters.inStockOnly ? 'checkbox' : 'square-outline'}
            size={24}
            color={localFilters.inStockOnly ? COLORS.hotPink : COLORS.border}
          />
        </TouchableOpacity>

        {/* Minimum Discount */}
        <Text style={styles.sectionHeading}>Discount</Text>
        <View style={styles.pillsRow}>
          {[10, 15, 20].map((pct) => {
            const isSelected = localFilters.discountRange === pct;
            return (
              <TouchableOpacity
                key={pct}
                onPress={() =>
                  setLocalFilters({
                    ...localFilters,
                    discountRange: isSelected ? undefined : pct,
                  })
                }
                style={[styles.pill, isSelected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {pct}% or more
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Apply CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GradientButton
          title="Apply Filters"
          onPress={handleApply}
          style={styles.applyButton}
        />
      </View>
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
    paddingBottom: 90,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  optionLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  selectedOptionLabel: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.purple,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.purple,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  pillText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: COLORS.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    width: '100%',
  },
});
