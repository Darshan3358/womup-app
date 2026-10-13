import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { SettlementHistoryItem } from '../../types/rider.types';

type FilterPeriod = 'TODAY' | 'WEEK' | 'MONTH';

export const EarningsSettlementScreen: React.FC = () => {
  const {
    settlementSummary,
    bankAccount,
    setSubScreen,
    requestPayout,
    refreshDashboard,
  } = useRider();

  const [history, setHistory] = useState<SettlementHistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>('TODAY');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const list = await RiderApiService.getSettlementHistory();
    setHistory(list);
    await refreshDashboard();
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleInstantPayout = async () => {
    const pending = settlementSummary?.pendingTransfer || 0;
    if (pending <= 0) {
      Alert.alert('Settled', 'Your earnings are already settled. Next payout auto-transfers at 11:59 PM.');
      return;
    }

    if (!bankAccount) {
      Alert.alert(
        'Bank Account Needed',
        'Please link and verify your destination bank account first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Link Bank', onPress: () => setSubScreen('BankSettlement') },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Instant IMPS Transfer',
      `Send ₹${pending} directly to ${bankAccount.bankName} (${bankAccount.accountNumberMasked})? Transfer completes in under 60 seconds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer Now',
          onPress: async () => {
            const res = await requestPayout(pending);
            Alert.alert('Payout Successful', res.message);
            await loadData();
          },
        },
      ]
    );
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'TODAY') {
      return item.date.includes('Today');
    }
    if (filter === 'WEEK') {
      return !item.date.includes('Aug'); // recent
    }
    return true;
  });

  const displayTotal =
    filter === 'TODAY'
      ? (settlementSummary?.netPayableToday || 520)
      : filter === 'WEEK'
      ? (settlementSummary?.weekEarnings || 2450)
      : (settlementSummary?.monthEarnings || 9800);

  const displayOrders =
    filter === 'TODAY'
      ? (settlementSummary?.todayCompleted || 3)
      : filter === 'WEEK'
      ? 18
      : 74;

  const displayBase =
    filter === 'TODAY'
      ? (settlementSummary?.basePayout || 420)
      : filter === 'WEEK'
      ? 2000
      : 8000;

  const displayTips =
    filter === 'TODAY'
      ? (settlementSummary?.tips || 50)
      : filter === 'WEEK'
      ? 250
      : 1000;

  const displayIncentives =
    filter === 'TODAY'
      ? (settlementSummary?.incentives || 50)
      : filter === 'WEEK'
      ? 200
      : 800;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.screenHeaderRow}>
        <View>
          <Text style={styles.screenTitle}>Earnings</Text>
          <Text style={styles.screenSubtitle}>Fast · Safe · Transparent Settlements</Text>
        </View>
        <TouchableOpacity
          style={styles.walletHeaderIconBtn}
          onPress={() => setSubScreen('BankSettlement')}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={20} color="#071B52" />
        </TouchableOpacity>
      </View>

      {/* 1. Period Selector Tabs (Wireframe Screen 11: Today / Week / Month) */}
      <View style={styles.periodTabsRow}>
        <TouchableOpacity
          style={[styles.periodTab, filter === 'TODAY' && styles.periodTabActive]}
          onPress={() => setFilter('TODAY')}
          activeOpacity={0.8}
        >
          <Text style={[styles.periodTabText, filter === 'TODAY' && styles.periodTabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodTab, filter === 'WEEK' && styles.periodTabActive]}
          onPress={() => setFilter('WEEK')}
          activeOpacity={0.8}
        >
          <Text style={[styles.periodTabText, filter === 'WEEK' && styles.periodTabTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodTab, filter === 'MONTH' && styles.periodTabActive]}
          onPress={() => setFilter('MONTH')}
          activeOpacity={0.8}
        >
          <Text style={[styles.periodTabText, filter === 'MONTH' && styles.periodTabTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Total Earnings Main Card (Wireframe Screen 11) */}
      <View style={styles.mainEarningsCard}>
        <View style={styles.earningsTopRow}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <View style={styles.growthBadge}>
            <Ionicons name="trending-up" size={13} color="#13B978" />
            <Text style={styles.growthText}>+12%</Text>
          </View>
        </View>

        <Text style={styles.totalEarningsAmount}>₹ {displayTotal}</Text>
        <Text style={styles.totalOrdersSubtext}>{displayOrders} Orders</Text>

        {/* Breakdown Items List */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.dotMarker, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.breakdownLineLabel}>Delivery Earnings</Text>
            </View>
            <Text style={styles.breakdownLineValue}>₹ {displayBase}</Text>
          </View>

          <View style={styles.breakdownLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.dotMarker, { backgroundColor: '#13B978' }]} />
              <Text style={styles.breakdownLineLabel}>Tips (100% Direct)</Text>
            </View>
            <Text style={[styles.breakdownLineValue, { color: '#13B978' }]}>+₹ {displayTips}</Text>
          </View>

          <View style={styles.breakdownLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.dotMarker, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.breakdownLineLabel}>Incentives</Text>
            </View>
            <Text style={[styles.breakdownLineValue, { color: '#F59E0B' }]}>+₹ {displayIncentives}</Text>
          </View>
        </View>

        {/* Pink CTA Button (Wireframe Screen 11: View Details / Payout) */}
        <TouchableOpacity
          style={styles.pinkActionBtn}
          onPress={handleInstantPayout}
          activeOpacity={0.85}
        >
          <Text style={styles.pinkActionBtnText}>
            {(settlementSummary?.pendingTransfer || 0) > 0
              ? `Instant Payout ₹${settlementSummary?.pendingTransfer}`
              : 'View Details'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Destination Bank Account */}
      <TouchableOpacity
        style={styles.bankPill}
        onPress={() => setSubScreen('BankSettlement')}
        activeOpacity={0.75}
      >
        <View style={styles.bankLeft}>
          <View style={styles.bankIconCircle}>
            <Ionicons name="business" size={18} color="#2563EB" />
          </View>
          {bankAccount ? (
            <View>
              <Text style={styles.bankName}>{bankAccount.bankName}</Text>
              <Text style={styles.accountNumber}>
                A/C: {bankAccount.accountNumberMasked} • IFSC: {bankAccount.ifscCode}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.bankName}>No Bank Account Linked</Text>
              <Text style={styles.accountNumber}>Tap to link payout bank account</Text>
            </View>
          )}
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>{bankAccount ? 'VERIFIED' : 'ADD BANK'}</Text>
          <Ionicons name="chevron-forward" size={13} color={bankAccount ? '#059669' : COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* 4. Recent Trips Header */}
      <View style={styles.recentTripsHeaderRow}>
        <Text style={styles.recentTripsTitle}>Recent Trips</Text>
        <TouchableOpacity onPress={() => setSubScreen('DutyHistory')} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Trip Earnings List */}
      <View style={styles.historyList}>
        {filteredHistory.map((item) => (
          <View key={item.id} style={styles.historyItemCard}>
            <View style={styles.historyLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.historyOrder}>{item.orderNumber}</Text>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.historyDate}>{item.date}</Text>
              <View style={styles.itemTags}>
                <Text style={styles.tagText}>Base: ₹{item.baseAmount}</Text>
                {item.bonus > 0 && <Text style={styles.bonusTag}>Bonus: +₹{item.bonus}</Text>}
                {item.tip > 0 && <Text style={styles.tipTag}>Tip: +₹{item.tip}</Text>}
              </View>
            </View>

            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>+₹{item.total}</Text>
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
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  screenHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
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
  walletHeaderIconBtn: {
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
  periodTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: '#FF3B98',
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mainEarningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  earningsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalEarningsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#13B978',
  },
  totalEarningsAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#071B52',
    letterSpacing: -0.5,
    marginTop: 6,
  },
  totalOrdersSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  breakdownLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLineLabel: {
    fontSize: 13,
    color: '#071B52',
    fontWeight: '600',
  },
  breakdownLineValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  pinkActionBtn: {
    backgroundColor: '#FF3B98',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  pinkActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bankIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  accountNumber: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#13B978',
  },
  recentTripsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentTripsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B98',
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  historyLeft: {
    flex: 1,
  },
  historyOrder: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  settledBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settledText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 6,
  },
  itemTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tagText: {
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
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#13B978',
  },
  bottomSpacer: {
    height: 36,
  },
});
