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
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setSubScreen, incomingOrders, pickingOrders, readyOrders } = useStore();

  const tabs: TabItem[] = [
    { id: 'Dashboard', label: 'Home', icon: 'speedometer-outline' },
    { id: 'Incoming', label: 'Incoming', icon: 'flash-outline', badge: incomingOrders.length },
    { id: 'Picking', label: 'Picking', icon: 'barcode-outline', badge: pickingOrders.length },
    { id: 'Ready', label: 'Ready', icon: 'checkmark-done-circle-outline', badge: readyOrders.length },
    { id: 'Inventory', label: 'Stock', icon: 'file-tray-stacked-outline' },
    { id: 'Profile', label: 'Profile', icon: 'person-outline' },
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
                name={tab.icon}
                size={22}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
              {Boolean(tab.badge && tab.badge > 0) && (
                <View style={[styles.badge, tab.id === 'Incoming' ? styles.incomingBadge : styles.normalBadge]}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? COLORS.primary : COLORS.textMuted }]}>
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
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  incomingBadge: {
    backgroundColor: COLORS.danger,
  },
  normalBadge: {
    backgroundColor: COLORS.accentCyan,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  },
});
