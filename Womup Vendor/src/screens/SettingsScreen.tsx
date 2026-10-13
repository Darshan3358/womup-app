import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Settings,
  Store,
  Clock,
  QrCode,
  Building,
  Bell,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const SettingsScreen: React.FC = () => {
  const { vendor, logout } = useVendor();
  const [audioNotification, setAudioNotification] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
      if (Platform.OS === 'web') {
        window.alert('Failed to log out. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to log out. Please try again.');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Log out of merchant terminal? You will need your Vendor ID and password to log back in.')) {
          performLogout();
        }
      } else {
        performLogout();
      }
    } else {
      Alert.alert(
        'Log Out?',
        'Are you sure you want to log out of this store terminal? You will need your Vendor ID and password to log back in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Settings size={22} color={COLORS.rose} />
        <View>
          <Text style={styles.title}>Merchant Settings</Text>
          <Text style={styles.subtitle}>Store configuration & terminals</Text>
        </View>
      </View>

      {/* Admin Coin % Controlled Card */}
      <View style={styles.adminCoinBox}>
        <View style={styles.coinTop}>
          <Sparkles size={20} color="#D97706" />
          <Text style={styles.coinTitle}>Shopping Coin Rate (Admin Controlled)</Text>
        </View>
        <Text style={styles.coinBigText}>{vendor?.shoppingCoinPercent || 15}% Cashback</Text>
        <Text style={styles.coinSub}>
          Configured by WormUp Admin panel. To adjust this rate, submit a request via support or call your territory manager.
        </Text>
      </View>

      {/* Store Info */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>STORE INFORMATION</Text>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Store Name</Text>
          <Text style={styles.itemVal}>{vendor?.storeName}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Vendor Code</Text>
          <Text style={styles.itemVal}>{vendor?.vendorCode}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Category</Text>
          <Text style={styles.itemVal}>{vendor?.categoryName}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Address</Text>
          <Text style={[styles.itemVal, { maxWidth: 200, textAlign: 'right' }]}>
            {vendor?.address}
          </Text>
        </View>
      </View>

      {/* Hours & UPI */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>PAYMENTS & HOURS</Text>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Operating Hours</Text>
          <Text style={styles.itemVal}>
            {vendor?.openingTime || '8:00 AM'} - {vendor?.closingTime || '9:00 PM'}
          </Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Counter UPI ID</Text>
          <Text style={styles.itemVal}>{vendor?.upiId || 'gokul@okhdfcbank'}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Linked Bank</Text>
          <Text style={styles.itemVal}>HDFC Bank (••••9182)</Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>TERMINAL PREFERENCES</Text>

        <View style={styles.rowItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLabel}>Counter Sound Chime</Text>
            <Text style={styles.prefSub}>Audible voice alert on customer payment</Text>
          </View>
          <Switch
            value={audioNotification}
            onValueChange={setAudioNotification}
            thumbColor={audioNotification ? COLORS.rose : '#CBD5E1'}
            trackColor={{ true: '#FECDD3', false: '#E2E8F0' }}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, isLoggingOut && { opacity: 0.6 }]}
        onPress={handleLogout}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#EF4444" size="small" />
        ) : (
          <>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out of Store Terminal</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  adminCoinBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  coinTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  coinBigText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#B45309',
  },
  coinSub: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  prefSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
});
