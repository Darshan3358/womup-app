import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { CurrentTab } from '../../types/store.types';
import { COLORS } from '../../theme/colors';

interface TabItem {
  id: CurrentTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setSubScreen, incomingOrders, pickingOrders, readyOrders } = useStore();

  const tabs: TabItem[] = [
    {
      id: 'Dashboard',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      id: 'Incoming',
      label: 'Incoming',
      icon: 'flash-outline',
      activeIcon: 'flash',
      badge: incomingOrders.length,
    },
    {
      id: 'Picking',
      label: 'Picking',
      icon: 'cube-outline',
      activeIcon: 'cube',
      badge: pickingOrders.length,
    },
    {
      id: 'Ready',
      label: 'Ready',
      icon: 'checkmark-circle-outline',
      activeIcon: 'checkmark-circle',
      badge: readyOrders.length,
    },
  ];

  const handleTabPress = (tabId: CurrentTab) => {
    setSubScreen(null);
    setCurrentTab(tabId);
  };

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBtn}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? '#EC4A9D' : '#9296A7'}
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
                {
                  color: isActive ? '#EC4A9D' : '#9296A7',
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
