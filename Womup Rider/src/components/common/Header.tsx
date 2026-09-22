import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const Header: React.FC = () => {
  const { isOnline, toggleDutyStatus, setShowEmergencyModal } = useRider();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>WORM UP</Text>
          <View style={styles.partnerPill}>
            <Text style={styles.partnerText}>PARTNER</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        {/* SOS Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setShowEmergencyModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

        {/* Duty Status Toggle */}
        <TouchableOpacity
          style={[styles.dutyPill, isOnline ? styles.onlinePill : styles.offlinePill]}
          onPress={toggleDutyStatus}
          activeOpacity={0.85}
        >
          <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.dutyText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1C4B',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partnerPill: {
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  sosText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  onlinePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.onlineGreen,
  },
  offlinePill: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.offlineGray,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: COLORS.onlineGreen,
  },
  offlineDot: {
    backgroundColor: COLORS.offlineGray,
  },
  dutyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  onlineText: {
    color: COLORS.onlineGreen,
  },
  offlineText: {
    color: COLORS.secondaryText,
  },
});
