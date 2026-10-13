import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  LayoutDashboard,
  QrCode,
  Receipt,
  Wallet,
  BarChart2,
  Settings,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';
import { VendorTab } from '../types/vendor';

export const VendorBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useVendor();

  const tabs: { key: VendorTab; label: string; icon: any }[] = [
    { key: 'Dashboard', label: 'Home', icon: LayoutDashboard },
    { key: 'QRCode', label: 'Store QR', icon: QrCode },
    { key: 'Transactions', label: 'History', icon: Receipt },
    { key: 'Wallet', label: 'Wallet', icon: Wallet },
    { key: 'Analytics', label: 'Analytics', icon: BarChart2 },
    { key: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const IconComponent = t.icon;
        const isActive = activeTab === t.key;

        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabBtn}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
              <IconComponent
                size={20}
                color={isActive ? COLORS.rose : COLORS.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t.label}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconBox: {
    padding: 4,
    borderRadius: 8,
  },
  iconBoxActive: {
    backgroundColor: '#FFE4E6',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.rose,
    fontWeight: '800',
  },
});
