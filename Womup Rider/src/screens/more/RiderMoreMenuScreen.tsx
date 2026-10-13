import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRider } from '../../context/RiderContext';
import { RiderSubScreenKey } from '../../types/rider.types';

interface MenuItem {
  key: RiderSubScreenKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  badgeColor?: string;
}

export const RiderMoreMenuScreen: React.FC = () => {
  const { profile, setSubScreen, unreadCount, logout, detectedHubName, setCurrentTab } = useRider();

  const menuItems: MenuItem[] = [
    { key: 'None', icon: 'home-outline', title: 'Dashboard' },
    { key: 'DutyHistory', icon: 'receipt-outline', title: 'Order History' },
    { key: 'None', icon: 'cash-outline', title: 'Earnings' },
    { key: 'BankSettlement', icon: 'wallet-outline', title: 'Wallet & Payouts' },
    { key: 'Profile', icon: 'person-outline', title: 'My Profile' },
    { key: 'VehicleDetails', icon: 'bicycle-outline', title: 'Vehicle Details' },
    { key: 'Documents', icon: 'document-text-outline', title: 'KYC & Documents', badge: 'VERIFIED', badgeColor: '#13B978' },
    { key: 'Performance', icon: 'stats-chart-outline', title: 'Performance & Rating', badge: '4.9 ★', badgeColor: '#F59E0B' },
    { key: 'Notifications', icon: 'notifications-outline', title: 'Alerts & Broadcasts', badge: unreadCount > 0 ? `${unreadCount} NEW` : undefined, badgeColor: '#FF3B98' },
    { key: 'Support', icon: 'headset-outline', title: 'Help & Support' },
    { key: 'Settings', icon: 'settings-outline', title: 'Settings' },
  ];

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmLogout = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Log Out of WormUp Partner?\nYou will be switched OFFLINE and stop receiving delivery assignments.')
        : true;
      if (confirmLogout) {
        await logout();
      }
    } else {
      Alert.alert(
        'Log Out of WormUp Partner?',
        'You will be switched OFFLINE and stop receiving delivery assignments.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.title === 'Earnings') {
      setCurrentTab('Earnings');
    } else if (item.title === 'Dashboard') {
      setCurrentTab('Home');
      setSubScreen('None');
    } else if (item.title === 'Help & Support') {
      setCurrentTab('Help');
    } else {
      setSubScreen(item.key);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Header Profile Block (Wireframe Screen 18) */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => setSubScreen('Profile')}
          activeOpacity={0.85}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#071B52" />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.userName}>{profile?.name || 'Darshan Parmar'}</Text>
            <Text style={styles.riderIdText}>Rider ID: #WU0123</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingText}>4.9 Partner Rating</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* 2. Menu Items List (Wireframe Screen 18) */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={`${item.title}-${idx}`}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={18} color="#071B52" />
                  </View>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                </View>

                <View style={styles.rowRight}>
                  {item.badge ? (
                    <View style={[styles.badgePill, { backgroundColor: item.badgeColor || '#FF3B98' }]}>
                      <Text style={styles.badgePillText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
              {idx < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* 3. Logout Row (Wireframe Screen 18) */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footerBrand}>WormUp Delivery Partner • Delivering Smiles</Text>
        <Text style={styles.versionText}>v1.0.0 (Build 42)</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 4. Bottom Pink Accent Wave / Bar (Wireframe Screen 18) */}
      <LinearGradient
        colors={['rgba(255, 59, 152, 0.9)', '#FF3B98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomPinkBar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#071B52',
  },
  container: {
    flex: 1,
    backgroundColor: '#071B52',
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2368',
    borderRadius: 22,
    padding: 18,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF3B98',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  riderIdText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071B52',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  footerBrand: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 30,
  },
  bottomPinkBar: {
    height: 6,
    width: '100%',
  },
});
