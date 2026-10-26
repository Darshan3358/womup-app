import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
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
  }[] = [
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
          const activeColor = '#E11D48'; // Vibrant rose / pink
          const inactiveColor = '#475569';

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                {tab.iconType === 'material' ? (
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={21}
                    color={isActive ? activeColor : inactiveColor}
                  />
                ) : (
                  <Ionicons
                    name={
                      (isActive && tab.key === 'Shops' ? 'storefront' : tab.icon) as any
                    }
                    size={21}
                    color={isActive ? activeColor : inactiveColor}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? activeColor : inactiveColor },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Circular WOMUP Logo Button ("App" -> Returns to Customer Express App, pixel-matched to Customer BottomNav) */}
        {onBackToMainApp && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBackToMainApp}
            style={styles.womupAppTabItem}
            accessibilityLabel="Back to WOMART Express App"
          >
            <View style={styles.womupAppCircle}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.womupAppIconImage}
                resizeMode="cover"
              />
            </View>

            <Text
              style={[
                styles.tabLabel,
                styles.womupAppLabel,
                { color: '#475569' },
              ]}
              numberOfLines={1}
            >
              App
            </Text>
          </TouchableOpacity>
        )}
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
    height: 64,
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
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Distinctive Circular WOMUP App Button (Matching Customer App Image 2)
  womupAppTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  womupAppCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#C026D3', // Neon purple/magenta glowing rim
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(192, 38, 211, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
      } as any,
      default: {
        shadowColor: '#C026D3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 6,
      },
    }),
  },
  womupAppIconImage: {
    width: '100%',
    height: '100%',
  },
  womupAppLabel: {
    fontWeight: '700',
    fontSize: 11,
    marginTop: 3,
  },
});
