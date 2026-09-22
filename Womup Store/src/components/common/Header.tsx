import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const Header: React.FC = () => {
  const { staff, store, subScreen, setSubScreen, toggleShift } = useStore();

  const isOnShift = staff?.isOnShift ?? false;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          {subScreen ? (
            <TouchableOpacity style={styles.backButton} onPress={() => setSubScreen(null)}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.hubIcon}>
              <Ionicons name="storefront" size={20} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.storeTextWrapper}>
            <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">
              {store?.name || 'Wom Up Dark Store'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnShift ? COLORS.primary : COLORS.danger }]} />
              <Text style={styles.staffCode} numberOfLines={1} ellipsizeMode="tail">
                {staff?.employeeCode || '—'}{staff?.fullName && staff.fullName !== store?.name ? ` • ${staff.fullName}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Shift Duty Toggle Button */}
        <TouchableOpacity
          style={[
            styles.shiftBtn,
            { backgroundColor: isOnShift ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
          ]}
          onPress={() => toggleShift(!isOnShift)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOnShift ? 'radio-button-on' : 'radio-button-off'}
            size={13}
            color={isOnShift ? COLORS.primary : COLORS.danger}
          />
          <Text style={[styles.shiftBtnText, { color: isOnShift ? COLORS.primary : COLORS.danger }]}>
            {isOnShift ? 'ON SHIFT' : 'OFF DUTY'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  hubIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  storeTextWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  storeName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    minWidth: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
    flexShrink: 0,
  },
  staffCode: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  shiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    flexShrink: 0,
  },
  shiftBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
