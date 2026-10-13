import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ST15_StaffProfileScreen: React.FC = () => {
  const { staff, store, logout, setSubScreen } = useStore();

  const handleStoreInfo = () => {
    Alert.alert(
      'Store Information',
      `Store: ${store?.name || 'Green Park Dark Store'}\nStore ID: ${store?.code || 'DS-003'}\nCity: ${store?.cityName || store?.city || 'Ahmedabad'}\nAddress: ${store?.address || '123, Green Park, Ahmedabad - 380015'}\nOperating Hours: 7:00 AM - 11:00 PM`
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Please contact your Dark Store Admin or Operations Manager to update terminal credentials.'
    );
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Current app language is English (Default).');
  };

  const handleHelp = () => {
    Alert.alert(
      'Dark Store Support',
      'For immediate dispatch assistance, call toll-free: 1800-WOMUP-STORE or email ops@womup.in'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your terminal session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card Matching Wireframe Screen 15 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#FFFFFF" />
        </View>

        <Text style={styles.staffName}>{staff?.fullName || 'Darshan Thanki'}</Text>
        <Text style={styles.staffRole}>Dark Store Partner</Text>
        <Text style={styles.storeId}>Store ID: {store?.code || 'DS-003'}</Text>
      </View>

      {/* Menu List */}
      <View style={styles.menuCard}>
        {/* Store Information */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleStoreInfo}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="storefront-outline" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.menuLabel}>Store Information</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Change Password */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleChangePassword}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.menuLabel}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Language */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleLanguage}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="globe-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.menuLabel}>Language</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.langValue}>English</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Help & Support */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleHelp}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="help-circle-outline" size={18} color="#FF3B98" />
            </View>
            <Text style={styles.menuLabel}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Shift / Audit shortcuts */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setSubScreen('ShiftHistory')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Shift History & Attendance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.menuLabel, { color: '#EF4444' }]}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>WormUp Dark Store Partner v2.4.0</Text>
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
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#071B52',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  staffName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#071B52',
  },
  staffRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  storeId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    marginBottom: 20,
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071B52',
  },
  langValue: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
