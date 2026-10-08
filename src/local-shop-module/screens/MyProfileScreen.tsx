import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

interface MyProfileScreenProps {
  coinBalance?: number;
  onGoBack: () => void;
  onOpenWallet: () => void;
}

export const MyProfileScreen: React.FC<MyProfileScreenProps> = ({
  coinBalance = 2000,
  onGoBack,
  onOpenWallet,
}) => {
  const insets = useSafeAreaInsets();
  const { user, setActiveScreen } = useApp();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of WOMUP Local?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setActiveScreen('Blinkit_Home');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
            }}
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Manish Shah'}</Text>
            <View style={styles.userIdBadge}>
              <Text style={styles.userIdText}>User ID : WM100258</Text>
            </View>
            <Text style={styles.userPhone}>{user?.phoneNumber || '+91 98765 43210'}</Text>
            <Text style={styles.userCity}>📍 Mahesana, Gujarat</Text>
          </View>
        </View>

        {/* Coin Balance Quick Card */}
        <TouchableOpacity
          style={styles.coinBannerCard}
          activeOpacity={0.85}
          onPress={onOpenWallet}
        >
          <View style={styles.coinBannerLeft}>
            <View style={styles.coinCircle}>
              <Ionicons name="cash" size={22} color="#D97706" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.coinBannerLabel}>My Shopping Coins</Text>
              <Text style={styles.coinBannerValue}>{coinBalance.toLocaleString('en-IN')} Coins</Text>
              <Text style={styles.coinBannerSub}>Worth ₹{coinBalance.toLocaleString('en-IN')} cash value</Text>
            </View>
          </View>

          <View style={styles.coinBannerRight}>
            <Text style={styles.viewWalletText}>View</Text>
            <Ionicons name="chevron-forward" size={16} color="#DB2777" />
          </View>
        </TouchableOpacity>

        {/* Section 1: Account Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          {[
            {
              icon: 'location-outline',
              label: 'Saved Delivery Addresses',
              sub: 'Home, Work, Parents (Mahesana)',
              onPress: () => Alert.alert('Saved Addresses', '1. Near Nandanvan Society, Mahesana\n2. Saket Plaza, Mahesana'),
            },
            {
              icon: 'card-outline',
              label: 'Payment Methods & UPI',
              sub: 'GPay, PhonePe, Saved Cards',
              onPress: () => Alert.alert('Payment Methods', 'UPI IDs linked: manish@okaxis, 9876543210@ybl'),
            },
            {
              icon: 'notifications-outline',
              label: 'Notification Preferences',
              sub: 'Order updates, cashback offers',
              onPress: () => Alert.alert('Notifications', 'All cashback and order notifications are enabled.'),
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 2: Support & Legal */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support & Policies</Text>

          {[
            {
              icon: 'headset-outline',
              label: 'Help Center & Chat Support',
              sub: 'Instant 24x7 resolution for offline store billing',
              onPress: () => Alert.alert('Help Support', 'Calling customer support at 1800-WOMUP-SHOP...'),
            },
            {
              icon: 'document-text-outline',
              label: 'Shopping Coin Terms & Rules',
              sub: '1 Coin = ₹1 cash value rules & expiry',
              onPress: () => Alert.alert('Coin Rules', '• 1 Coin = ₹1.00\n• Coins never expire for active users\n• Redeemable on local shops and 9-min delivery.'),
            },
            {
              icon: 'shield-checkmark-outline',
              label: 'Privacy Policy',
              sub: 'Safe & secure digital transactions',
              onPress: () => Alert.alert('Privacy Policy', 'WOMUP is PCI-DSS compliant and RBI licensed.'),
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color="#64748B" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>WOMUP Local App • Version 2.4.0 (Build 52)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    padding: 14,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FCE7F3',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  userIdBadge: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  userIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  userCity: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  coinBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  coinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBannerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  coinBannerValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DB2777',
  },
  coinBannerSub: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 1,
  },
  coinBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewWalletText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DB2777',
    marginRight: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
});
