import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { ProductCard } from '../components/product/ProductCard';
import { useApp } from '../context/AppContext';
import { ProductService } from '../services/productService';
import { Product } from '../types';
import { VoiceSearchModal } from '../components/common/VoiceSearchModal';

const SUGGESTIONS = [
  'Rice',
  'Basmati Rice',
  'Brown Rice',
  'Sona Masoori Rice',
  'Rice Flour',
  'Amul Butter',
  'Fortune Oil',
  'Aashirvaad Atta',
];

const POPULAR_SEARCHES = ['Milk', 'Atta', 'Oil', 'Sugar', 'Butter', 'Fortune', 'Tea', 'Rice'];

export const S17_SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setActiveScreen,
    searchQuery,
    setSearchQuery,
    goBack,
    isVoiceSearchActive,
    setIsVoiceSearchActive,
  } = useApp();

  const [query, setQuery] = useState(searchQuery || '');
  const [products, setProducts] = useState<Product[]>(ProductService.getAllProducts());
  const [isLoading, setIsLoading] = useState(products.length === 0);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  // Auto-trigger voice search if arrived from BlinkitHeader mic button
  useEffect(() => {
    if (isVoiceSearchActive) {
      setIsVoiceModalVisible(true);
      setIsVoiceSearchActive(false);
    }
  }, [isVoiceSearchActive]);

  // Ensure fresh products are loaded from MongoDB Atlas backend
  useEffect(() => {
    let isMounted = true;
    ProductService.fetchProducts()
      .then((loaded) => {
        if (isMounted && loaded && loaded.length > 0) {
          setProducts(loaded);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time filtered products based on speech / text query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [query, products]);

  const handleSelectQuery = (text: string) => {
    setQuery(text);
    setSearchQuery(text);
  };

  const handleVoiceResult = (spokenTranscript: string) => {
    setQuery(spokenTranscript);
    setSearchQuery(spokenTranscript);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header with Search Input and Microphone Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
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
            autoFocus={!isVoiceModalVisible}
          />

          {/* Clear button if text is present */}
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSelectQuery('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          {/* Divider between input and Mic */}
          <View style={styles.searchDivider} />

          {/* Real-time Voice Search Microphone Button matching screenshot */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsVoiceModalVisible(true)}
            style={styles.micButton}
            accessibilityLabel="Voice search"
          >
            <Ionicons name="mic" size={20} color={COLORS.hotPink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-time speech status pill if active */}
      {query.length > 0 && (
        <View style={styles.queryStatusRow}>
          <Ionicons name="mic-outline" size={14} color={COLORS.hotPink} style={{ marginRight: 4 }} />
          <Text style={styles.queryStatusText}>
            Showing real-time results for <Text style={styles.queryHighlight}>"{query}"</Text> ({results.length})
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading && products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.hotPink} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : null}

        {/* Popular Searches Pills */}
        <Text style={styles.sectionLabel}>Popular Searches</Text>
        <View style={styles.pillsRow}>
          {POPULAR_SEARCHES.map((term) => (
            <TouchableOpacity
              key={term}
              onPress={() => handleSelectQuery(term)}
              style={[styles.pill, query.toLowerCase() === term.toLowerCase() && styles.pillActive]}
            >
              <Text
                style={[
                  styles.pillText,
                  query.toLowerCase() === term.toLowerCase() && styles.pillTextActive,
                ]}
              >
                {term}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggestion list or Empty state */}
        {query.length > 0 && results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No products found for "{query}"</Text>
            <Text style={styles.emptySubtitle}>
              Try speaking or searching with different keywords like "Milk", "Rice", "Atta"
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsVoiceModalVisible(true)}
              style={styles.tryVoiceBtn}
            >
              <Ionicons name="mic" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.tryVoiceText}>Search by Voice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Matching Products */}
            {results.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Matching Products ({results.length})</Text>
                {results.map((prod) => (
                  <ProductCard key={prod.id} product={prod} variant="horizontal" />
                ))}
              </>
            ) : null}

            {/* Suggestions when query is empty */}
            {query.length === 0 && (
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
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Real-time Voice Search Modal with pulsing mic & audio wave visualizer */}
      <VoiceSearchModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onResult={handleVoiceResult}
        initialQuery={query}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6F9',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8F6FE',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FE',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1.5,
    borderColor: 'rgba(131, 100, 230, 0.25)',
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '500',
  },
  clearIcon: {
    padding: 4,
    marginRight: 2,
  },
  searchDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D2D1E1',
    marginHorizontal: 6,
  },
  micButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FCE1F5',
  },
  queryStatusText: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '600',
  },
  queryHighlight: {
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
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
    backgroundColor: '#F4F4FA',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#E2E6F9',
  },
  pillActive: {
    backgroundColor: '#FCE1F5',
    borderColor: COLORS.hotPink,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E6F9',
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  tryVoiceBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  tryVoiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

