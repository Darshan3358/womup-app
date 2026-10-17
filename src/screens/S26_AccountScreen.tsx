import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { useApp } from '../context/AppContext';

export const S26_AccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout, setActiveScreen } = useApp();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out from Worm Up?') : true;
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out from Worm Up?',
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

  const menuItems = [
    {
      title: 'My Addresses',
      subtitle: `${user.savedAddresses?.length || 0} saved address${(user.savedAddresses?.length || 0) === 1 ? '' : 'es'}`,
      icon: 'location-outline',
      color: COLORS.hotPink,
      action: () => setActiveScreen('C11_AddAddress'),
    },
    {
      title: 'KYC & Bank Verification',
      subtitle: 'Aadhaar front/back, bank details & payouts',
      badge: 'Verify',
      icon: 'shield-checkmark-outline',
      color: '#059669',
      action: () => setActiveScreen('KYC'),
    },
    {
      title: 'Payment Methods',
      subtitle: 'Saved UPI, Cards & Wallets',
      icon: 'card-outline',
      color: COLORS.blue,
      action: () => setActiveScreen('C22_Payment'),
    },
    {
      title: 'My Orders',
      subtitle: 'Track, view or reorder past items',
      icon: 'receipt-outline',
      color: COLORS.purple,
      action: () => setActiveScreen('C25_OrderHistory'),
    },
    {
      title: 'My Referrals',
      subtitle: `You earned ${user.shoppingCoins || 0} SC`,
      badge: `${user.shoppingCoins || 0} SC`,
      icon: 'gift-outline',
      color: COLORS.hotPink,
      action: () => setActiveScreen('C09_ReferralCode'),
    },
    {
      title: 'Help & Support',
      subtitle: 'FAQs, live chat, call center',
      icon: 'help-circle-outline',
      color: COLORS.darkBlue,
      action: () => Alert.alert('Support', '24x7 Customer Support is available at support@wormup.in'),
    },
    {
      title: 'Settings',
      subtitle: 'Notifications, language, privacy',
      icon: 'settings-outline',
      color: COLORS.textMuted,
      action: () => Alert.alert('Settings', 'App version: v1.0.0 (Production)'),
    },
  ];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="My Account"
        showBack={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={COLORS.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName || 'Valued Customer'}</Text>
            {user.email ? <Text style={styles.profileEmail}>{user.email}</Text> : null}
            <Text style={styles.profilePhone}>
              {user.phoneNumber ? `+91 ${user.phoneNumber}` : 'No mobile linked'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setActiveScreen('C08_CreateAccount')}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.navy} />
          </TouchableOpacity>
        </View>

        {/* Shopping Coin Highlight Card with Gradient */}
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.coinCard}
        >
          <View style={styles.coinCardLeft}>
            <View style={styles.coinBadgeIcon}>
              <Ionicons name="ribbon" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.coinCardLabel}>Shopping Coin</Text>
              <Text style={styles.coinCardBalance}>{user.shoppingCoins.toLocaleString()} SC</Text>
              <Text style={styles.coinValueText}>Worth ₹{user.shoppingCoins} on your next order</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveScreen('C21_ApplyShoppingCoin')}
            style={styles.coinHistoryButton}
          >
            <Text style={styles.coinHistoryText}>Use Coins</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu Items List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={item.action}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuItemBorder,
              ]}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              {item.badge ? (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.compact,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  editButton: {
    padding: 6,
  },
  coinCard: {
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  coinCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  coinCardBalance: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  coinValueText: {
    fontSize: 11,
    color: '#FFF0F7',
    fontWeight: '500',
  },
  coinHistoryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  coinHistoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.card,
    backgroundColor: '#FFF5F6',
    borderWidth: 1,
    borderColor: '#FDECEE',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
});
