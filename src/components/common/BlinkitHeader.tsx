import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon, IconName } from './AppIcon';
import { useApp } from '../../context/AppContext';

interface BlinkitHeaderProps {
  variant?: 'gradient' | 'plain';
  etaLabel?: string; // e.g. "Delivery in" or "Prints in"
  etaTime?: string;  // e.g. "9 minutes" or "10 minutes"
  searchPlaceholder?: string;
  activeCategoryTab?: string;
  onSelectCategoryTab?: (tab: string) => void;
  showCategoryTabs?: boolean;
  plainTitle?: string;
  onBackPress?: () => void;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export const BlinkitHeader: React.FC<BlinkitHeaderProps> = ({
  variant = 'gradient',
  etaLabel = 'Delivery in',
  etaTime = '9 minutes',
  searchPlaceholder = 'Search "birthday gift"',
  activeCategoryTab = 'All',
  onSelectCategoryTab,
  showCategoryTabs = true,
  plainTitle,
  onBackPress,
  showSettings = false,
  onSettingsPress,
}) => {
  const insets = useSafeAreaInsets();
  const {
    walletBalance,
    deliveryLocation,
    currentStoreName,
    isServiceable,
    deliveryEtaMinutes,
    setLocationModalVisible,
    setActiveScreen,
    goBack,
    wishlist,
    setIsVoiceSearchActive,
  } = useApp();

  // Search placeholder animation simulation
  const placeholderQueries = [
    searchPlaceholder,
    'Search "amul milk"',
    'Search "cold drinks"',
    'Search "atta & rice"',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderQueries.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [placeholderQueries.length]);

  const categoryTabs: { id: string; label: string; icon: IconName }[] = [
    { id: 'All', label: 'All', icon: 'shopping-bag' },
    { id: 'Ganeshotsav', label: 'Ganeshotsav', icon: 'ganesh' },
    { id: 'Electronics', label: 'Electronics', icon: 'headphones' },
    { id: 'Beauty', label: 'Beauty', icon: 'beauty' },
  ];

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

  return (
    <LinearGradient
      colors={GRADIENTS.navyHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradientContainer, { paddingTop: insets.top + 8 }]}
    >
      {/* Top Row: ETA + Right Buttons */}
      <View style={styles.topRow}>
        <View style={styles.etaContainer}>
          <Text style={styles.etaLabelText}>
            {!isServiceable ? 'Status' : (!etaLabel || etaLabel.toLowerCase().includes('blinkit')) ? 'Delivery in' : etaLabel}
          </Text>
          <Text style={[styles.etaHeroText, !isServiceable && { fontSize: 20, color: '#FCD34D' }]}>
            {isServiceable ? (etaTime || `${deliveryEtaMinutes || 9} minutes`) : 'Outside Zone'}
          </Text>

          {/* Location Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setLocationModalVisible(true)}
            style={styles.locationButton}
            accessibilityLabel="Select delivery address"
          >
            <Text style={styles.locationText} numberOfLines={1}>
              {deliveryLocation}
            </Text>
            <AppIcon name="chevron-down" size={16} color={COLORS.white} />
          </TouchableOpacity>

          {/* Dark Store Hub Indicator */}
          <View style={styles.storeHubPill}>
            <View style={[styles.statusDot, { backgroundColor: isServiceable ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.storeHubText} numberOfLines={1}>
              {isServiceable ? (currentStoreName || 'Ahmedabad Dark Store') : 'No Dark Store Nearby'}
            </Text>
          </View>
        </View>

        {/* Action buttons: Wishlist, Wallet & Profile */}
        <View style={styles.topRightActions}>
          {/* Wishlist button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveScreen('Blinkit_Wishlist')}
            style={styles.actionButtonContainer}
            accessibilityLabel="Your Wishlist"
          >
            <View style={styles.whiteCircleButton}>
              <AppIcon
                name="heart"
                size={20}
                color={wishlist.length > 0 ? '#E11D48' : COLORS.textPrimary}
              />
            </View>
            {wishlist.length > 0 && (
              <View style={[styles.walletBadge, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}>
                <Text style={[styles.walletBadgeText, { color: COLORS.white }]}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Wallet circular button with balance badge */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveScreen('Blinkit_Money')}
            style={styles.actionButtonContainer}
            accessibilityLabel="Blinkit Money Wallet"
          >
            <View style={styles.whiteCircleButton}>
              <AppIcon name="wallet" size={20} color={COLORS.textPrimary} />
            </View>
            <View style={styles.walletBadge}>
              <Text style={styles.walletBadgeText}>₹{walletBalance}</Text>
            </View>
          </TouchableOpacity>

          {/* Profile circular button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveScreen('Blinkit_Profile')}
            style={styles.actionButtonContainer}
            accessibilityLabel="Your Profile"
          >
            <View style={styles.whiteCircleButton}>
              <AppIcon name="user" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setActiveScreen('C17_Search')}
        style={styles.searchBarWrapper}
      >
        <View style={styles.searchIconLeft}>
          <AppIcon name="search" size={20} color={COLORS.textMuted} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholderQueries[placeholderIndex]}
          placeholderTextColor={COLORS.textMuted}
          editable={true}
          onFocus={() => setActiveScreen('C17_Search')}
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
          <AppIcon name="mic" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Category Tab Strip */}
      {/* Category Tab Strip matching Image 2 */}
      {showCategoryTabs && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabScroll}
        >
          {categoryTabs.map((tab) => {
            const isActive = activeCategoryTab === tab.id;
            const itemColor = isActive ? COLORS.hotPink : 'rgba(255, 255, 255, 0.75)';
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.75}
                onPress={() => onSelectCategoryTab && onSelectCategoryTab(tab.id)}
                style={styles.tabItem}
              >
                <AppIcon
                  name={tab.icon}
                  size={24}
                  color={itemColor}
                  isActive={isActive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: itemColor },
                    isActive && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  circularBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  circularRightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  circularRightPlaceholder: {
    width: 40,
    height: 40,
  },
  plainTitleText: {
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  etaContainer: {
    flex: 1,
  },
  etaLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 16,
  },
  etaHeroText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: '85%',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 4,
  },
  storeHubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: '90%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  storeHubText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonContainer: {
    alignItems: 'center',
  },
  whiteCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  walletBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  micButton: {
    padding: 4,
  },
  categoryTabScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 24,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    position: 'relative',
    gap: 4,
    minWidth: 54,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  activeTabLabel: {
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    left: 2,
    right: 2,
    height: 3.5,
    backgroundColor: COLORS.hotPink,
    borderRadius: 2,
  },
});
