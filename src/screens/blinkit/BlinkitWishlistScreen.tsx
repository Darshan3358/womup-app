import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { BlinkitProductCard } from '../../components/common/BlinkitProductCard';
import { useApp } from '../../context/AppContext';
import { BlinkitProduct } from '../../types';

export const BlinkitWishlistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    wishlist,
    clearWishlist,
    goBack,
    setActiveScreen,
    blinkitCartCount,
    blinkitCartTotal,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleClearAll = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear your wishlist?')) {
        clearWishlist();
      }
    } else {
      Alert.alert(
        'Clear Wishlist',
        'Are you sure you want to remove all items from your wishlist?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: clearWishlist },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={goBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>My Wishlist</Text>
            <Text style={styles.headerSubtitle}>
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved by you
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {wishlist.length > 0 && (
            <>
              {/* Layout Toggle: List vs Grid */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                style={styles.viewToggleBtn}
                accessibilityLabel="Switch layout"
              >
                <AppIcon
                  name={viewMode === 'list' ? 'grid' : 'file-text'}
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>

              {/* Clear All */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClearAll}
                style={styles.clearButton}
                accessibilityLabel="Clear Wishlist"
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Main Content */}
      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <AppIcon name="heart" size={48} color="#FDA4AF" />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptyDescription}>
            Explore thousands of products and tap the heart icon on items you love to save them here for quick re-ordering.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveScreen('Blinkit_Home')}
            style={styles.exploreButton}
          >
            <LinearGradient
              colors={['#15803D', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreGradient}
            >
              <Text style={styles.exploreButtonText}>Explore Products</Text>
              <AppIcon name="arrow-left" size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: blinkitCartCount > 0 ? 120 : insets.bottom + 32 },
          ]}
        >
          {/* User Notice Chip */}
          <View style={styles.noticeBanner}>
            <AppIcon name="sparkles" size={16} color="#B45309" />
            <Text style={styles.noticeText}>
              Showing products liked by your account with live prices and fast delivery.
            </Text>
          </View>

          {/* Cards Display */}
          {viewMode === 'list' ? (
            <View style={styles.listViewContainer}>
              {wishlist.map((item: BlinkitProduct) => (
                <BlinkitProductCard
                  key={item.id}
                  product={item}
                  variant="wishlist"
                />
              ))}
            </View>
          ) : (
            <View style={styles.gridViewContainer}>
              {wishlist.map((item: BlinkitProduct) => (
                <View key={item.id} style={styles.gridColumn}>
                  <BlinkitProductCard
                    product={item}
                    variant="grid"
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Bottom Cart Bar */}
      {blinkitCartCount > 0 && (
        <View style={[styles.floatingCartContainer, { bottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveScreen('Blinkit_Cart')}
            style={styles.floatingCartButton}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartBadge}>
                <Text style={styles.floatingCartBadgeText}>{blinkitCartCount}</Text>
              </View>
              <View>
                <Text style={styles.floatingCartTotal}>₹{blinkitCartTotal}</Text>
                <Text style={styles.floatingCartLabel}>TOTAL</Text>
              </View>
            </View>
            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartCta}>View Cart</Text>
              <AppIcon name="chevron-right" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FECDD3',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  exploreButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  listViewContainer: {
    width: '100%',
  },
  gridViewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
    marginBottom: 12,
  },
  floatingCartContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  floatingCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  floatingCartBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  floatingCartTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  floatingCartLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingCartCta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
