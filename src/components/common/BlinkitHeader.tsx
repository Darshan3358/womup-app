import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
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
import { useNotifications } from '../../context/NotificationContext';
import { NotificationCenterModal } from './NotificationCenterModal';

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

const BlinkitHeaderComponent: React.FC<BlinkitHeaderProps> = ({
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
    isAuthenticated,
    openAuthPrompt,
    selectedAddress,
    selectedAddressSource,
    locationError,
  } = useApp();

  const { unreadCount } = useNotifications();
  const [isNotificationCenterVisible, setNotificationCenterVisible] = useState(false);

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

  // Serviceability & ETA display states
  const isAvailable = isServiceable === true;
  const isUnavailable = isServiceable === false;
  const isUnknown = isServiceable === null;
  const isSavedAddress = selectedAddressSource === 'SAVED' && selectedAddress && selectedAddress.type !== 'Current';

  const hasValidLocation = Boolean(
    !locationError &&
    ((selectedAddress?.readableAddress && selectedAddress.readableAddress.trim().length > 0) ||
      (isSavedAddress && selectedAddress) ||
      (deliveryLocation && deliveryLocation !== 'Set Delivery Location' && deliveryLocation !== 'Select delivery address' && deliveryLocation !== 'Detecting your location...'))
  );

  // Display the real reverse-geocoded detected address or explicit location error. NEVER default to mock Surat or Ahmedabad.
  const displayLocationText = (() => {
    if (locationError) {
      return locationError;
    }
    if (!isAvailable && !hasValidLocation) {
      return 'Device location is unavailable. Please check system location services.';
    }
    if (selectedAddress?.readableAddress && selectedAddress.readableAddress.trim().length > 0) {
      return selectedAddress.readableAddress.trim();
    }
    if (isSavedAddress && selectedAddress) {
      const parts = [
        selectedAddress.houseFlat,
        selectedAddress.areaLandmark || selectedAddress.street,
        selectedAddress.city,
        selectedAddress.pincode,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    if (deliveryLocation && deliveryLocation !== 'Set Delivery Location' && deliveryLocation !== 'Select delivery address') {
      const cleaned = deliveryLocation.replace(/^Current Location\s*[—–-]\s*/i, '').trim();
      if (cleaned && !cleaned.toLowerCase().startsWith('set delivery')) {
        return cleaned;
      }
    }
    if (selectedAddress?.shortAddress) {
      return selectedAddress.shortAddress.trim();
    }
    if (currentAreaName && currentCityName) {
      return `${currentAreaName}, ${currentCityName}`;
    }
    return 'Device location is unavailable. Please check system location services.';
  })();

  // Top ETA / Status Header Line
  const statusLineText = (() => {
    if (locationError || (!isAvailable && !hasValidLocation)) {
      return 'LOCATION UNAVAILABLE';
    }
    if (isAvailable) {
      const eta = deliveryEtaMinutes ? `${deliveryEtaMinutes} MINS` : (etaTime || '9 MINS');
      return `${etaLabel} ${eta}`.toUpperCase();
    }
    if (isUnavailable) {
      return 'DELIVERY UNAVAILABLE';
    }
    return hasValidLocation ? 'CHECKING SERVICEABILITY…' : 'LOCATION UNAVAILABLE';
  })();

  // Store Hub Status Line - Only show when a real resolved store exists
  const storeStatusText = (() => {
    if (locationError || (!isAvailable && !hasValidLocation)) {
      return null;
    }
    if (isAvailable && currentStoreName) {
      return currentStoreName.replace(/^🟢\s*/, '').trim();
    }
    if (isUnavailable && hasValidLocation) {
      return 'Outside delivery area';
    }
    return null;
  })();

  return (
    <ImageBackground
      source={require('../../../assets/HOMEHEADERIMAGE.png')}
      style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}
      imageStyle={styles.headerBgImage}
      resizeMode="stretch"
    >
      <View style={styles.containerInner}>
        {/* Row 1: Logo & Location (Left) | 3 Circle Action Icons (Right) */}
        <View style={styles.headerTopRow}>
          {/* Left Group: Brand Logo & Location */}
          <View style={styles.topLeftGroup}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveScreen('Blinkit_Home')}
              style={styles.logoContainer}
            >
              <Image
                source={require('../../../assets/Wormup.png')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Brand Title & Location Selector */}
            <View style={styles.locationTextColumn}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLocationModalVisible(true)}
                style={styles.locationRow}
                accessibilityLabel="Select delivery address"
              >
                <Ionicons name="location-sharp" size={13} color="#25105F" style={{ marginRight: 3 }} />
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {displayLocationText}
                </Text>
                <Feather
                  name="chevron-down"
                  size={14}
                  color="#25105F"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>

              <View style={styles.storeStatusRow}>
                <View
                  style={[
                    styles.storeStatusDot,
                    (isUnavailable && !hasValidLocation) ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' },
                  ]}
                />
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {storeStatusText || 'Outside delivery area'}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Group: 3 White Circular Buttons (Wishlist, Notifications, Cart) */}
          <View style={styles.headerActions}>
            {/* 1. Wishlist */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_Wishlist')}
              style={styles.actionIconButton}
              accessibilityLabel="Wishlist"
            >
              <Feather
                name="heart"
                size={18}
                color={wishlist.length > 0 ? '#E11D88' : '#1F2937'}
              />
              {wishlist.length > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{wishlist.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 2. Notification Bell */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setNotificationCenterVisible(true)}
              style={styles.actionIconButton}
              accessibilityLabel="Notifications"
            >
              <Feather name="bell" size={18} color="#1F2937" />
              <View style={[styles.badgePill, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.badgeText}>{unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 3}</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Womup Wallet */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveScreen('Blinkit_Money')}
              style={styles.actionIconButton}
              accessibilityLabel="Womup Wallet"
            >
              <Ionicons name="wallet-outline" size={19} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Search Bar & Cart Button */}
        <View style={styles.headerSearchRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveScreen('C17_Search')}
            style={styles.searchBar}
          >
            <Feather
              name="search"
              size={18}
              color="#9CA3AF"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder || placeholderQueries[placeholderIndex]}
              placeholderTextColor="#9CA3AF"
              editable={false}
              pointerEvents="none"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsVoiceSearchActive(true);
                setActiveScreen('C17_Search');
              }}
              style={styles.micButton}
              accessibilityLabel="Voice search"
            >
              <Ionicons name="mic" size={19} color="#E11D88" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Cart Icon Button on the Search Bar Line */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!isAuthenticated) {
                openAuthPrompt('Please sign in or register to view your cart and checkout.', 'Your Cart');
              } else {
                setActiveScreen('Blinkit_Cart');
              }
            }}
            style={styles.searchCartButton}
            accessibilityLabel="Shopping Cart"
          >
            <Feather name="shopping-bag" size={19} color="#111827" />
            {totalCartCount > 0 ? (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{totalCartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {children}
      </View>

      <NotificationCenterModal
        visible={isNotificationCenterVisible}
        onClose={() => setNotificationCenterVisible(false)}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FAF5FF',
    zIndex: 100,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  headerBgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },
  containerInner: {
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    overflow: 'hidden',
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: '100%',
    maxWidth: '100%',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  logoContainer: {
    width: 42,
    height: 42,
    backgroundColor: '#25105F',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLogoImage: {
    width: 30,
    height: 30,
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
    justifyContent: 'center',
  },
  brandTitleText: {
    color: '#E11D88',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    color: '#25105F',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 16,
    maxWidth: 180,
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
    backgroundColor: '#10B981',
  },
  locationTitle: {
    color: '#4B5563',
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 13,
  },
  headerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    width: '100%',
    maxWidth: '100%',
    gap: 8,
  },
  searchCartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    position: 'relative',
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    color: '#111827',
    padding: 0,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E9EAF1',
    marginHorizontal: 8,
  },
  micButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  badgePill: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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

export const BlinkitHeader = React.memo(BlinkitHeaderComponent);
