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
            <Text style={styles.codeText}>{staff?.employeeCode || '—'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{staff?.role || 'STAFF'}</Text>
          </View>
        </View>
      </View>

      {/* Hub Location Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardHeader}>ASSIGNED FULFILLMENT HUB</Text>
        <View style={styles.hubInfoRow}>
          <Ionicons name="storefront" size={20} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.hubTitle}>{store?.name || 'Unassigned Hub'}</Text>
            <Text style={styles.hubAddress}>{store?.address || 'No address configured'}</Text>
          </View>
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
          onPress={() => setSubScreen('ShiftHistory')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkText}>Past Shift History</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => setSubScreen('Performance')}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="podium-outline" size={20} color={COLORS.accentCyan} />
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
  cardHeader: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  hubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hubTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  hubAddress: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
