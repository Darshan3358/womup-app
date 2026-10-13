import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from './AppIcon';
import { useApp } from '../../context/AppContext';

interface BlinkitHeaderProps {
  variant?: 'gradient' | 'plain';
  etaLabel?: string;
  etaTime?: string;
  searchPlaceholder?: string;
  activeCategoryTab?: string;
  onSelectCategoryTab?: (tab: string) => void;
  showCategoryTabs?: boolean;
  plainTitle?: string;
  onBackPress?: () => void;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  children?: React.ReactNode;
}

export const BlinkitHeader: React.FC<BlinkitHeaderProps> = ({
  variant = 'gradient',
  etaLabel = 'Delivery in',
  etaTime = '9 minutes',
  searchPlaceholder = 'Search "milk, chips, maggi"',
  activeCategoryTab = 'Home',
  onSelectCategoryTab,
  showCategoryTabs = true,
  plainTitle,
  onBackPress,
  showSettings = false,
  onSettingsPress,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isVerySmall = width < 480;

  const {
    walletBalance,
    deliveryLocation,
    currentAreaName,
    currentCityName,
    currentStoreName,
    isServiceable,
    deliveryEtaMinutes,
    setLocationModalVisible,
    setActiveScreen,
    goBack,
    wishlist,
    blinkitCartCount,
    setIsVoiceSearchActive,
    user,
  } = useApp();

  const totalCartCount = blinkitCartCount;

  // Search placeholder animation queries
  const placeholderQueries = [
    searchPlaceholder,
    'Search "milk, chips, maggi"',
    'Search "fresh milk, butter"',
    'Search "fruits, vegetables"',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderQueries.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [placeholderQueries.length]);

  if (variant === 'plain') {
    return (
      <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBackPress || goBack}
          style={styles.circularBackButton}
          accessibilityLabel="Go back"
        >
          <AppIcon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {plainTitle && (
          <Text style={[TYPOGRAPHY.headingMd, styles.plainTitleText]} numberOfLines={1}>
            {plainTitle}
          </Text>
        )}

        {showSettings ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSettingsPress}
            style={styles.circularRightButton}
            accessibilityLabel="Settings"
          >
            <AppIcon name="settings" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.circularRightPlaceholder} />
        )}
      </View>
    );
  }

  const isThaltej =
    (currentAreaName || '').toLowerCase().includes('thaltej') ||
    (currentStoreName || '').toLowerCase().includes('thaltej');
  const areaName = isThaltej ? 'Thaltej' : (currentAreaName || 'Chandlodiya - Tragad');
  const cityName = currentCityName || user?.preferredCityName || 'Ahmedabad';
  const cleanStoreName = (
    isThaltej
      ? 'Wom Up Thaltej Dark Store'
      : (currentStoreName || 'Wom Up Chandlodiya - Tragad Dark Store')
  )
    .replace(/^🟢\s*/, '')
    .trim();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.containerInner}>
        {/* Row 1: Logo & Location (Left) | Action Icons (Right) */}
        <View style={styles.headerTopRow}>
          {/* Left Group: WOM UP Brand Logo & Location */}
          <View style={styles.topLeftGroup}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveScreen('Blinkit_Home')}
              style={styles.logoContainer}
              accessibilityLabel="WOM UP Home"
            >
              <Image
                source={require('../../../assets/Wormup.png')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Location Selector */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLocationModalVisible(true)}
              style={styles.locationWrapper}
              accessibilityLabel="Select delivery address"
            >
              <View style={styles.locationTextColumn}>
                <Text style={styles.etaText} numberOfLines={1}>
                  {etaLabel} {etaTime}
                </Text>

                <View style={styles.locationRow}>
                  <Text style={styles.locationSubtitle} numberOfLines={1}>
                    {areaName}, {cityName}
                  </Text>
                  <Feather
                    name="chevron-down"
                    size={13}
                    color="rgba(255,255,255,0.85)"
                    style={{ marginLeft: 3 }}
                  />
                </View>

                <View style={styles.storeStatusRow}>
                  <View style={styles.storeStatusDot} />
                  <Text style={styles.locationTitle} numberOfLines={1}>
                    {cleanStoreName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Group: Wishlist & Wallet */}
          <View style={styles.headerActions}>
            {/* Wishlist */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_Wishlist')}
              style={styles.actionIconButton}
              accessibilityLabel="Wishlist"
            >
              <Feather
                name="heart"
                size={17}
                color={wishlist.length > 0 ? COLORS.hotPink : '#FFFFFF'}
              />
              {wishlist.length > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{wishlist.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Wallet with balance badge */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_Money')}
              style={styles.actionIconButton}
              accessibilityLabel="Wallet"
            >
              <Ionicons name="wallet-outline" size={17} color="#FFFFFF" />
              <View style={styles.walletBadge}>
                <Text style={styles.walletBadgeText}>
                  ₹{walletBalance || 50}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Search Bar & Cart Icon (Replaces deleted tabs) */}
        <View style={styles.headerSearchRow}>
          {/* Search Bar */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveScreen('C17_Search')}
            style={styles.searchBar}
          >
            <Feather
              name="search"
              size={16}
              color="#9296A7"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder || placeholderQueries[placeholderIndex]}
              placeholderTextColor="#9296A7"
              editable={false}
              pointerEvents="none"
            />
            <View style={styles.searchDivider} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsVoiceSearchActive(true);
                setActiveScreen('C17_Search');
              }}
              style={styles.micButton}
              accessibilityLabel="Voice search"
            >
              <Feather name="mic" size={16} color={COLORS.hotPink} />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveScreen('Blinkit_Cart')}
            style={styles.cartButton}
            accessibilityLabel="Shopping Cart"
          >
            <Feather name="shopping-cart" size={18} color="#FFFFFF" />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0B1755',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  containerInner: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingBottom: 4,
    overflow: 'hidden',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    width: '100%',
    maxWidth: '100%',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    paddingRight: 2,
  },
  headerLogoImage: {
    width: 36,
    height: 36,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 260,
    paddingVertical: 1,
    flexShrink: 1,
  },
  locationTextColumn: {
    flexShrink: 1,
  },
  etaText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  locationSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  storeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  storeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  locationTitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
  },
  headerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
    paddingBottom: 6,
    width: '100%',
    maxWidth: '100%',
  },
  searchBar: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#101A4D',
    padding: 0,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E9EAF1',
    marginHorizontal: 8,
  },
  micButton: {
    padding: 3,
  },
  cartButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EC4A9D',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0B1755',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EC4A9D',
    borderRadius: 10,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  walletBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderWidth: 1,
    borderColor: '#E9EAF1',
  },
  walletBadgeText: {
    color: '#101A4D',
    fontSize: 8,
    fontWeight: '800',
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EAF1',
  },
  circularBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9EAF1',
  },
  circularRightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9EAF1',
  },
  circularRightPlaceholder: {
    width: 40,
    height: 40,
  },
  plainTitleText: {
    color: '#101A4D',
    textAlign: 'center',
  },
});
