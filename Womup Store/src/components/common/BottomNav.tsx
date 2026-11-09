import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../context/StoreContext';
import { CurrentTab } from '../../types/store.types';

interface TabItem {
  id: CurrentTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setSubScreen, incomingOrders, pickingOrders } = useStore();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const tabs: TabItem[] = [
    {
      id: 'Dashboard',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      id: 'Incoming',
      label: 'Orders',
      icon: 'receipt-outline',
      activeIcon: 'receipt',
      badge: incomingOrders.length + pickingOrders.length,
    },
    {
      id: 'Inventory',
      label: 'Inventory',
      icon: 'cube-outline',
      activeIcon: 'cube',
    },
    {
      id: 'History',
      label: 'Earnings',
      icon: 'cash-outline',
      activeIcon: 'cash',
    },
    {
      id: 'Profile',
      label: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
    },
  ];

  const handleTabPress = (tabId: CurrentTab) => {
    setSubScreen(null);
    setCurrentTab(tabId);
  };

  return (
    <View
      style={[styles.outerWrapper, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
    >
      <View style={styles.navContainer} pointerEvents="auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const activeColor = '#F20B87';
          const inactiveColor = '#657493';
          const labelColor = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? activeColor : '#8886AE'}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tab.badge! > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: labelColor },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 66,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 11, 135, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#4327C9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(67, 39, 201, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
      } as any,
    }),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingBottom: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    marginBottom: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F20B87',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: -0.2,
  },
  activeTabLabel: {
    fontWeight: '800',
    color: '#F20B87',
  },
  activeBar: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F20B87',
  },
});
