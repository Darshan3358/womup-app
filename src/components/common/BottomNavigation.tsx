import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

export type TabKey = 'Home' | 'Categories' | 'Cart' | 'Orders' | 'Account';

interface BottomNavigationProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { cartCount } = useApp();

  const isSmallDevice = width <= 360;
  const isLargeDevice = width > 430;

  const tabs: { key: TabKey; label: string; activeIcon: keyof typeof Ionicons.glyphMap; inactiveIcon: keyof typeof Ionicons.glyphMap }[] = [
    {
      key: 'Home',
      label: 'Home',
      activeIcon: 'home',
      inactiveIcon: 'home-outline',
    },
    {
      key: 'Categories',
      label: 'Categories',
      activeIcon: 'grid',
      inactiveIcon: 'grid-outline',
    },
    {
      key: 'Cart',
      label: 'Cart',
      activeIcon: 'cart',
      inactiveIcon: 'cart-outline',
    },
    {
      key: 'Orders',
      label: 'Orders',
      activeIcon: 'receipt',
      inactiveIcon: 'receipt-outline',
    },
    {
      key: 'Account',
      label: 'Account',
      activeIcon: 'person',
      inactiveIcon: 'person-outline',
    },
  ];

  // Dynamic bottom padding: handles Android 3-button/gesture and iPhone home indicator
  const bottomPadding = Math.max(insets.bottom, 6);
  const barHeight = isSmallDevice ? 52 : 58;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <View
        style={[
          styles.container,
          { height: barHeight },
          isLargeDevice && styles.tabletContainer,
        ]}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const iconColor = isActive ? COLORS.blue : COLORS.textMuted;
          const labelColor = isActive ? COLORS.blue : COLORS.textMuted;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={isSmallDevice ? 20 : 23}
                  color={iconColor}
                />
                {tab.key === 'Cart' && cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  { color: labelColor },
                  isSmallDevice && styles.smallTabLabel,
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 440,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  smallTabLabel: {
    fontSize: 11,
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.hotPink,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
