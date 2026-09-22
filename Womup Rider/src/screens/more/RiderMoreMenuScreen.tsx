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
import { useRider } from '../../context/RiderContext';
import { RiderSubScreenKey } from '../../types/rider.types';
import { COLORS } from '../../theme/colors';

interface MenuItem {
  key: RiderSubScreenKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  badge?: string;
  badgeColor?: string;
}

export const RiderMoreMenuScreen: React.FC = () => {
  const { profile, setSubScreen, unreadCount, logout, detectedHubName } = useRider();

  const menuGroups: { groupTitle: string; items: MenuItem[] }[] = [
    {
      groupTitle: 'ACCOUNT & FLEET VERIFICATION',
      items: [
        { key: 'Profile', icon: 'person-outline', iconColor: '#4F46E5', iconBg: '#EEF2FF', title: 'Rider Profile & Contact' },
        { key: 'Documents', icon: 'document-text-outline', iconColor: '#059669', iconBg: '#ECFDF5', title: 'KYC & Legal Documents', badge: 'VERIFIED', badgeColor: COLORS.onlineGreen },
        { key: 'VehicleDetails', icon: 'bicycle-outline', iconColor: '#D97706', iconBg: '#FEF3C7', title: 'Registered Vehicle Details' },
        { key: 'BankSettlement', icon: 'card-outline', iconColor: '#2563EB', iconBg: '#EFF6FF', title: 'Bank Account & Payout Info' },
      ],
    },
    {
      groupTitle: 'PERFORMANCE & DUTY LOGS',
      items: [
        {
          key: 'Performance',
          icon: 'stats-chart-outline',
          iconColor: '#E11D48',
          iconBg: '#FFF1F2',
          title: 'Performance Metrics & Rating',
          badge: profile?.rating ? `${profile.rating} / 5` : undefined,
          badgeColor: COLORS.hotPink,
        },
        { key: 'DutyHistory', icon: 'time-outline', iconColor: '#7C3AED', iconBg: '#F5F3FF', title: 'Duty Shift & Attendance History' },
        {
          key: 'Notifications',
          icon: 'notifications-outline',
          iconColor: '#EA580C',
          iconBg: '#FFF7ED',
          title: 'System Alerts & Hub Broadcasts',
          badge: unreadCount > 0 ? `${unreadCount} NEW` : undefined,
          badgeColor: COLORS.blue,
        },
      ],
    },
    {
      groupTitle: 'APP PREFERENCES',
      items: [
        { key: 'Settings', icon: 'settings-outline', iconColor: '#475569', iconBg: '#F1F5F9', title: 'App Settings & Navigation Preferences' },
      ],
    },
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Bar */}
      <TouchableOpacity
        style={styles.profileHeader}
        onPress={() => setSubScreen('Profile')}
        activeOpacity={0.8}
      >
        <View style={styles.avatarPill}>
          <Ionicons name="person" size={24} color={COLORS.navy} />
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.nameText}>{profile?.name || 'Rider Partner'}</Text>
          <Text style={styles.idText}>
            Partner ID: #{profile?.id || '---'} • {detectedHubName ? detectedHubName.split('(')[0].trim() : 'No Hub Selected'}
          </Text>
          <View style={[styles.statusPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name="shield-checkmark" size={11} color="#059669" />
            <Text style={styles.statusText}>KYC APPROVED FLEET PARTNER</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* Grouped Menus */}
      {menuGroups.map((group) => (
        <View key={group.groupTitle} style={styles.groupContainer}>
          <Text style={styles.groupHeading}>{group.groupTitle}</Text>
          <View style={styles.groupCard}>
            {group.items.map((item, idx) => (
              <React.Fragment key={item.key}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setSubScreen(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: item.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={item.icon} size={18} color={item.iconColor} />
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>

                  <View style={styles.itemRight}>
                    {item.badge ? (
                      <View style={[styles.badge, { backgroundColor: item.badgeColor || COLORS.hotPink }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
                {idx < group.items.length - 1 && <View style={styles.itemDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      {/* Logout CTA */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Log Out of Partner Account</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>WormUp Delivery Partner v1.0.0 (Build 42)</Text>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  avatarPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B1E5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileMeta: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  idText: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    color: COLORS.onlineGreen,
    fontSize: 9,
    fontWeight: '800',
  },
  headerChevron: {
    color: COLORS.secondaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  groupContainer: {
    marginBottom: 18,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.cardBackground,
    marginLeft: 48,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.secondaryText,
    marginBottom: 10,
  },
  bottomSpacer: {
    height: 30,
  },
});
