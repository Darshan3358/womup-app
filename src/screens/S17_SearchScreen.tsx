import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { ProductCard } from '../components/product/ProductCard';
import { useApp } from '../context/AppContext';
import { ProductService } from '../services/productService';

const SUGGESTIONS = [
  'Rice',
  'Basmati Rice',
  'Brown Rice',
  'Sona Masoori Rice',
  'Rice Flour',
];

const POPULAR_SEARCHES = ['Atta', 'Oil', 'Sugar', 'Milk', 'Fortune', 'Tea'];

export const S17_SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, searchQuery, setSearchQuery, goBack } = useApp();
  const [query, setQuery] = useState(searchQuery || 'Rice');

  const results = ProductService.searchProducts(query);

  const handleSelectQuery = (text: string) => {
    setQuery(text);
    setSearchQuery(text);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header with Search Input */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search for products, brands..."
            placeholderTextColor={COLORS.secondaryText}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSearchQuery(text);
            }}
            autoFocus
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => handleSelectQuery('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="scan-outline" size={18} color={COLORS.textMuted} />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Popular Searches Pills */}
        <Text style={styles.sectionLabel}>Popular Searches</Text>
        <View style={styles.pillsRow}>
          {POPULAR_SEARCHES.map((term) => (
            <TouchableOpacity
              key={term}
              onPress={() => handleSelectQuery(term)}
              style={styles.pill}
            >
              <Text style={styles.pillText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggestion list */}
        {query.length > 0 && results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try searching with different keywords</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Search Suggestions</Text>
            {SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleSelectQuery(item)}
                style={styles.suggestionRow}
              >
                <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.suggestionText}>{item}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.border} />
              </TouchableOpacity>
            ))}

            {/* Results */}
            {results.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Matching Products ({results.length})</Text>
                {results.map((prod) => (
                  <ProductCard key={prod.id} product={prod} variant="horizontal" />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.compact,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  clearIcon: {
    padding: 2,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  pill: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
