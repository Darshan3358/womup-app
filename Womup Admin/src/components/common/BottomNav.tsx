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
                color={isActive ? COLORS.hotPink : COLORS.textMuted}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? COLORS.hotPink : COLORS.textMuted, fontWeight: isActive ? '700' : '500' },
              ]}
              numberOfLines={1}
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
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    padding: 4,
    borderRadius: RADIUS.pill,
  },
  activeIconContainer: {
    backgroundColor: COLORS.lightPink,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
