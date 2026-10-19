import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../../context/AppContext';

export type LocalTabKey = 'Home' | 'Shops' | 'My Orders' | 'My Coin' | 'My Profile';

interface LocalBottomNavProps {
  currentTab: LocalTabKey;
  onSelectTab: (tab: LocalTabKey) => void;
  onBackToMainApp?: () => void;
}

export const LocalBottomNav: React.FC<LocalBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onBackToMainApp,
}) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useApp();
  const bottomPadding = Math.max(insets.bottom, 6);

  const tabs: {
    key: LocalTabKey;
    label: string;
    icon: string;
    iconType: 'ionicons' | 'material';
    isBackAction?: boolean;
  }[] = [
    { key: 'Home', label: 'Home', icon: 'home', iconType: 'ionicons' },
    { key: 'Shops', label: 'Shops', icon: 'storefront-outline', iconType: 'ionicons' },
    { key: 'My Orders', label: 'My Orders', icon: 'cart-outline', iconType: 'ionicons' },
    { key: 'My Coin', label: 'My Coin', icon: 'cash-multiple', iconType: 'material' },
    ...(isAuthenticated
      ? [{ key: 'My Profile' as LocalTabKey, label: 'My Profile', icon: 'person-outline', iconType: 'ionicons' as const }]
      : []),
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const isBack = tab.isBackAction;
          const activeColor = '#E11D48'; // Vibrant rose / pink
          const inactiveColor = isBack ? '#D97706' : '#475569'; // Amber for Womup switch tab

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => {
                if (tab.isBackAction && onBackToMainApp) {
                  onBackToMainApp();
                } else {
                  onSelectTab(tab.key);
                }
              }}
              style={[styles.tabItem, isBack && styles.backTabItem]}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={[styles.iconContainer, isBack && styles.backIconContainer]}>
                {tab.iconType === 'material' ? (
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={isBack ? 20 : 21}
                    color={isBack ? '#B45309' : isActive ? activeColor : inactiveColor}
                  />
                ) : (
                  <Ionicons
                    name={
                      (isActive && tab.key === 'Home' ? 'home' : tab.icon) as any
                    }
                    size={isBack ? 20 : 21}
                    color={isBack ? '#B45309' : isActive ? activeColor : inactiveColor}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  { color: isBack ? '#B45309' : isActive ? activeColor : inactiveColor },
                  (isActive || isBack) && styles.activeTabLabel,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  backTabItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconContainer: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
});
