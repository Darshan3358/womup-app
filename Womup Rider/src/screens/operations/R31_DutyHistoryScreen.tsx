import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { DutyShift } from '../../types/rider.types';

export const DutyHistoryScreen: React.FC = () => {
  const { setSubScreen } = useRider();
  const [shifts, setShifts] = useState<DutyShift[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const list = await RiderApiService.getDutyHistory();
    setShifts(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Duty Shifts & Attendance</Text>
      <Text style={styles.screenSubtitle}>
        Logged working hours, shift timings and completed orders per session.
      </Text>

      <View style={styles.shiftsList}>
        {shifts.map((shift) => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.shiftDate}>{shift.date}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{shift.deliveriesCompleted} Deliveries</Text>
              </View>
            </View>

            <View style={styles.timesRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>ONLINE AT</Text>
                <Text style={styles.timeValue}>{shift.onlineTime}</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>OFFLINE AT</Text>
                <Text style={styles.timeValue}>{shift.offlineTime}</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>DURATION</Text>
                <Text style={styles.timeValue}>
                  {Math.floor(shift.totalActiveMinutes / 60)}h {shift.totalActiveMinutes % 60}m
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

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
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  shiftsList: {
    gap: 12,
  },
  shiftCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  activePill: {
    backgroundColor: COLORS.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 12,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 9,
    color: COLORS.secondaryText,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  bottomSpacer: {
    height: 30,
  },
});
