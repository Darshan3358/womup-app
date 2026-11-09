import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  QrCode,
  Receipt,
  Wallet,
  BarChart2,
  Settings,
} from 'lucide-react-native';
import { useVendor } from '../context/VendorAuthContext';
import { VendorTab } from '../types/vendor';

export const VendorBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useVendor();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const tabs: { key: VendorTab; label: string; icon: any }[] = [
    { key: 'Dashboard', label: 'Home', icon: LayoutDashboard },
    { key: 'QRCode', label: 'Store QR', icon: QrCode },
    { key: 'Transactions', label: 'History', icon: Receipt },
    { key: 'Wallet', label: 'Wallet', icon: Wallet },
    { key: 'Analytics', label: 'Analytics', icon: BarChart2 },
    { key: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <View
      style={[styles.outerWrapper, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
    >
      <View style={styles.navContainer} pointerEvents="auto">
        {tabs.map((t) => {
          const IconComponent = t.icon;
          const isActive = activeTab === t.key;
          const activeColor = '#F20B87';
          const inactiveColor = '#657493';
          const labelColor = isActive ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabBtn}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t.label} tab`}
            >
              <View style={styles.iconContainer}>
                <IconComponent
                  size={20}
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
                {t.label}
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
    paddingHorizontal: 6,
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
    paddingHorizontal: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    marginBottom: 2,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
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
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F20B87',
  },
});
