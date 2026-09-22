import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderTabKey } from '../../types/rider.types';
import { COLORS } from '../../theme/colors';

interface TabItem {
  key: RiderTabKey;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  activeIconName: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'Home', label: 'Home', iconName: 'flash-outline', activeIconName: 'flash' },
  { key: 'Deliveries', label: 'Deliveries', iconName: 'cube-outline', activeIconName: 'cube' },
  { key: 'Earnings', label: 'Earnings', iconName: 'wallet-outline', activeIconName: 'wallet' },
  { key: 'Help', label: 'Help', iconName: 'help-buoy-outline', activeIconName: 'help-buoy' },
  { key: 'More', label: 'More', iconName: 'grid-outline', activeIconName: 'grid' },
];

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setSubScreen, activeDelivery } = useRider();

  const handleTabPress = (tabKey: RiderTabKey) => {
    setSubScreen('None');
    setCurrentTab(tabKey);
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isActive ? tab.activeIconName : tab.iconName}
                size={22}
                color={isActive ? COLORS.hotPink : COLORS.secondaryText}
                style={{ marginBottom: 2 }}
              />
              {tab.key === 'Deliveries' && activeDelivery && (
                <View style={styles.badgeDot} />
              )}
            </View>
            <Text style={[styles.tabLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 62,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeLabel: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: COLORS.secondaryText,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: COLORS.hotPink,
    borderRadius: 2,
  },
});
