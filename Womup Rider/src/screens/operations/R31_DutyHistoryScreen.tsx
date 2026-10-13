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
import { DutyShift, SettlementHistoryItem } from '../../types/rider.types';

type HistoryFilter = 'ALL' | 'DELIVERED' | 'CANCELLED' | 'SHIFTS';

export const DutyHistoryScreen: React.FC = () => {
  const { setSubScreen } = useRider();
  const [shifts, setShifts] = useState<DutyShift[]>([]);
  const [orders, setOrders] = useState<SettlementHistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [shiftsList, settlementsList] = await Promise.all([
      RiderApiService.getDutyHistory(),
      RiderApiService.getSettlementHistory(),
    ]);
    setShifts(shiftsList);
    setOrders(settlementsList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Build combined list
  const filteredOrders = orders.filter((o) => {
    if (filter === 'DELIVERED') return o.status?.toUpperCase() !== 'CANCELLED';
    if (filter === 'CANCELLED') return o.status?.toUpperCase() === 'CANCELLED';
    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Back Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen('None')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#071B52" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Order History</Text>
          <Text style={styles.screenSubtitle}>Delivering Smiles • Fast · Safe · Together</Text>
        </View>
      </View>

      {/* Filter Tabs (Wireframe Screen 12: All / Delivered / Cancelled) */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFilter('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'ALL' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'DELIVERED' && styles.filterTabActive]}
          onPress={() => setFilter('DELIVERED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'DELIVERED' && styles.filterTabTextActive]}>
            Delivered
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'CANCELLED' && styles.filterTabActive]}
          onPress={() => setFilter('CANCELLED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'CANCELLED' && styles.filterTabTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'SHIFTS' && styles.filterTabActive]}
          onPress={() => setFilter('SHIFTS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTabText, filter === 'SHIFTS' && styles.filterTabTextActive]}>
            Shifts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      {filter !== 'SHIFTS' ? (
        <View style={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>Completed orders in this category will appear here</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isCancelled ? '#EF4444' : '#13B978' },
                          ]}
                        >
                          {isCancelled ? 'Cancelled' : 'Delivered'}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.orderAmount,
                        { color: isCancelled ? '#94A3B8' : '#13B978' },
                      ]}
                    >
                      {isCancelled ? '₹0' : `+₹${order.total}`}
                    </Text>
                  </View>

                  <Text style={styles.orderDate}>{order.date}</Text>

                  <View style={styles.orderBottomRow}>
                    <View style={styles.tagsRow}>
                      <Text style={styles.itemTag}>Base: ₹{order.baseAmount}</Text>
                      {order.bonus > 0 && (
                        <Text style={styles.bonusTag}>Bonus: +₹{order.bonus}</Text>
                      )}
                      {order.tip > 0 && (
                        <Text style={styles.tipTag}>Tip: +₹{order.tip}</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={13} color="#64748B" />
                      <Text style={styles.hubTag}>Ahmedabad Hub</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : (
        /* Shifts Section */
        <View style={styles.shiftsList}>
          {shifts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Duty Shifts Recorded</Text>
              <Text style={styles.emptySubtitle}>Log in and go online to record duty hours</Text>
            </View>
          ) : (
            shifts.map((shift) => (
              <View key={shift.id} style={styles.shiftCard}>
                <View style={styles.shiftCardHeader}>
                  <Text style={styles.shiftDate}>{shift.date}</Text>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>
                      {shift.deliveriesCompleted} Deliveries
                    </Text>
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
                      {Math.floor(shift.totalActiveMinutes / 60)}h{' '}
                      {shift.totalActiveMinutes % 60}m
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FF3B98',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  orderDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 10,
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  itemTag: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  bonusTag: {
    fontSize: 10,
    color: '#FF3B98',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  tipTag: {
    fontSize: 10,
    color: '#13B978',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  hubTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  shiftsList: {
    gap: 12,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  activePill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B98',
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  timeDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 36,
  },
});
