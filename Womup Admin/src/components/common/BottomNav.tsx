import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
} from 'lucide-react-native';
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
  const bottomPadding = Math.max(insets.bottom, 10);

  const handleTabPress = (key: ActiveTab) => {
    setSubView('none');
    setActiveTab(key);
  };

  return (
    <View
      style={[styles.outerWrapper, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
    >
      <View style={styles.navContainer} pointerEvents="auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const activeColor = '#F20B87';
          const inactiveColor = '#657493';
          const labelColor = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={22}
                  color={isActive ? activeColor : '#8886AE'}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
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
  tabButton: {
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
