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

export const ST18_StoreInfoScreen: React.FC = () => {
  const { store, staff, setSubScreen } = useStore();

  const handleCopy = (label: string, text: string) => {
    Alert.alert('Copied', `${label} (${text}) copied.`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Store Information</Text>
          <Text style={styles.headerSubtitle}>Dark Store Hub & Terminal Details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hub Badge Banner */}
        <View style={styles.hubBanner}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="business" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerStoreName}>{store?.name || 'Wom Up Dark Store'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: staff?.isOnShift ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {staff?.isOnShift ? 'TERMINAL ACTIVE · ON SHIFT' : 'OFF DUTY'}
              </Text>
            </View>
          </View>
        </View>

        {/* Identity & Codes */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Terminal Credentials</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="key-outline" size={18} color="#6366F1" />
              <Text style={styles.infoLabel}>Store ID / Code</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCopy('Store ID', store?.code || 'DS-001')}
              style={styles.copyBadge}
            >
              <Text style={styles.infoVal}>{store?.code || 'STORE-01'}</Text>
              <Ionicons name="copy-outline" size={14} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="person-circle-outline" size={18} color="#6366F1" />
              <Text style={styles.infoLabel}>Terminal Login ID</Text>
            </View>
            <Text style={styles.infoVal}>{store?.loginId || store?.code || 'store@wormup'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="id-card-outline" size={18} color="#6366F1" />
              <Text style={styles.infoLabel}>Staff Code</Text>
            </View>
            <Text style={styles.infoVal}>{staff?.employeeCode || '#STF-01'}</Text>
          </View>
        </View>

        {/* Location & Service Area */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Location & Operating Zone</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="location-outline" size={18} color="#EF4444" />
              <Text style={styles.infoLabel}>Assigned Area</Text>
            </View>
            <Text style={styles.infoVal}>{store?.areaName || 'Chandlodiya - Tragad'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="map-outline" size={18} color="#EF4444" />
              <Text style={styles.infoLabel}>City</Text>
            </View>
            <Text style={styles.infoVal}>{store?.cityName || store?.city || 'Ahmedabad'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="mail-outline" size={18} color="#EF4444" />
              <Text style={styles.infoLabel}>Postal Pincode</Text>
            </View>
            <Text style={styles.infoVal}>{store?.pincode || '382481'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRowStacked}>
            <View style={[styles.infoLeft, { marginBottom: 6 }]}>
              <Ionicons name="navigate-outline" size={18} color="#EF4444" />
              <Text style={styles.infoLabel}>Physical Dark Store Address</Text>
            </View>
            <Text style={styles.addressVal}>
              {store?.address || 'Near Tragad Circle, S.G. Highway Bypass, Ahmedabad, Gujarat - 382481'}
            </Text>
          </View>
        </View>

        {/* Dispatch Operations */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Operations & Logistics</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="time-outline" size={18} color="#10B981" />
              <Text style={styles.infoLabel}>Operating Hours</Text>
            </View>
            <Text style={styles.infoVal}>7:00 AM – 11:00 PM</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="flash-outline" size={18} color="#10B981" />
              <Text style={styles.infoLabel}>Target Delivery ETA</Text>
            </View>
            <Text style={[styles.infoVal, { color: '#10B981', fontWeight: '700' }]}>9 Minutes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="radio-outline" size={18} color="#10B981" />
              <Text style={styles.infoLabel}>Hyperlocal Coverage</Text>
            </View>
            <Text style={styles.infoVal}>6.0 KM Radius</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => setSubScreen(null)}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStoreName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoRowStacked: {
    paddingVertical: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addressVal: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  doneBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
