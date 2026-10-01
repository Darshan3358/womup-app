import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ST15_StaffProfileScreen: React.FC = () => {
  const { staff, store, toggleShift, logout, setSubScreen } = useStore();

  const isOnShift = staff?.isOnShift ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Staff Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.staffName}>{staff?.fullName || 'Dark Store Picker'}</Text>
        <Text style={styles.staffPhone}>{staff?.email || staff?.phoneNumber || 'No contact info'}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{staff?.employeeCode || store?.code || 'STF-001'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{staff?.role || 'STAFF'}</Text>
          </View>
        </View>
      </View>

      {/* Service Location Breakdown Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>SERVICE LOCATION</Text>
          <View style={styles.lockedStatusBadge}>
            <Ionicons name="lock-closed" size={10} color={COLORS.accentCyan} />
            <Text style={styles.lockedStatusText}>LOCKED</Text>
          </View>
        </View>

        <View style={styles.locationTable}>
          <View style={styles.locRow}>
            <View style={styles.locLabelBox}>
              <Ionicons name="business" size={14} color={COLORS.accentCyan} />
              <Text style={styles.locLabel}>City</Text>
            </View>
            <Text style={styles.locValue}>{store?.cityName || store?.city || 'Ahmedabad'}</Text>
          </View>

          <View style={styles.locRow}>
            <View style={styles.locLabelBox}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.locLabel}>Area</Text>
            </View>
            <Text style={styles.locValue}>
              {store?.areaName ||
                (store?.name
                  ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
                  : 'Chandlodiya - Tragad')}
            </Text>
          </View>

          <View style={styles.locRow}>
            <View style={styles.locLabelBox}>
              <Ionicons name="storefront" size={14} color={COLORS.warning} />
              <Text style={styles.locLabel}>Store</Text>
            </View>
            <Text style={[styles.locValue, { fontWeight: '700' }]} numberOfLines={2}>
              {store?.name || 'Wom Up Dark Store'}
            </Text>
          </View>

          <View style={styles.locRow}>
            <View style={styles.locLabelBox}>
              <Ionicons name="mail" size={14} color={COLORS.accentPurple} />
              <Text style={styles.locLabel}>Pincode</Text>
            </View>
            <Text style={styles.locValue}>{store?.pincode || '382481'}</Text>
          </View>

          <View style={[styles.locRow, { borderBottomWidth: 0 }]}>
            <View style={styles.locLabelBox}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
              <Text style={styles.locLabel}>Status</Text>
            </View>
            <View style={styles.adminLockBadge}>
              <Text style={styles.adminLockText}>Locked by Admin</Text>
            </View>
          </View>
        </View>

        {/* 🔐 Admin Rule Notice */}
        <View style={styles.policyNotice}>
          <Ionicons name="information-circle" size={16} color={COLORS.accentCyan} />
          <Text style={styles.policyNoticeText}>
            Your dark store is permanently locked to this area to guarantee 9-minute deliveries. To request store re-assignment, contact Head Admin.
          </Text>
        </View>
      </View>

      {/* Duty Shift Toggle */}
      <View style={styles.infoCard}>
        <Text style={styles.cardHeader}>DUTY & AVAILABILITY</Text>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>
              {isOnShift ? 'Active on Shift' : 'Off Shift (Inactive)'}
            </Text>
            <Text style={styles.toggleSubtitle}>
              {isOnShift ? 'You can receive incoming customer orders' : 'Incoming order ping paused'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.switchBtn, { backgroundColor: isOnShift ? COLORS.primary : COLORS.surfaceElevated }]}
            onPress={() => toggleShift(!isOnShift)}
          >
            <Text style={[styles.switchBtnText, { color: isOnShift ? '#FFF' : COLORS.textMuted }]}>
              {isOnShift ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Navigation Links */}
      <View style={styles.linksCard}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setSubScreen('AddProduct')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkText}>Add Local Product to Catalog</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setSubScreen('ShiftHistory')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.accentCyan} />
            <Text style={styles.linkText}>Past Shift History</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setSubScreen('Performance')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="podium-outline" size={20} color={COLORS.accentPurple} />
            <Text style={styles.linkText}>Dark Store Leaderboard</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setSubScreen('InventoryLogs')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="time-outline" size={20} color={COLORS.warning} />
            <Text style={styles.linkText}>Stock Audit Trail</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>SIGN OUT OF TERMINAL</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>WORM UP STORE TERMINAL v1.0.0 (Port 8084)</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  staffName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  staffPhone: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  codeBadge: {
    backgroundColor: COLORS.shelfBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  roleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeader: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  lockedStatusText: {
    color: COLORS.accentCyan,
    fontSize: 9.5,
    fontWeight: '800',
  },
  locationTable: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  locLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 90,
  },
  locLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  locValue: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  adminLockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  adminLockText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  policyNoticeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  switchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  linksCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerBg,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
