import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState, ActiveTab } from '../../context/AdminStateContext';

interface TabItem {
  key: ActiveTab;
  label: string;
  icon: React.ElementType;
}

// Exactly 4 screens on the bottom navigation bar
const TABS: TabItem[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Users', label: 'Users', icon: Users },
  { key: 'Inventory', label: 'Inventory', icon: Package },
  { key: 'Orders', label: 'Orders', icon: ShoppingBag },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setSubView } = useAdminState();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 6);

  const handleTabPress = (key: ActiveTab) => {
    setSubView('none');
    setActiveTab(key);
  };

  return (
    <View style={[styles.container, { height: 60 + bottomPadding, paddingBottom: bottomPadding }]}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Icon
                size={22}
                color={isActive ? '#F12A9B' : '#8E8CA7'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? '#F12A9B' : '#8E8CA7', fontWeight: isActive ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
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
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.2,
    borderTopColor: '#E7D9FF',
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#762DEB',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    flexShrink: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(241, 42, 155, 0.12)',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F12A9B',
  },
});
