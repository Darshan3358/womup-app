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

type FilterPeriod = 'ALL' | 'TODAY' | 'WEEK';

export const EarningsSettlementScreen: React.FC = () => {
  const {
    settlementSummary,
    bankAccount,
    setSubScreen,
    requestPayout,
    refreshDashboard,
  } = useRider();

  const [history, setHistory] = useState<SettlementHistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>('ALL');
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
      Alert.alert('Zero Balance', 'No pending earnings available for instant transfer.');
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

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Primary Settlement Banner */}
      <View style={styles.balanceCard}>
        <Text style={styles.cardHeaderLabel}>TODAY'S OPERATIONAL SETTLEMENT</Text>
        <Text style={styles.balanceAmount}>₹{settlementSummary?.netPayableToday || 0}</Text>
        <Text style={styles.settlementNote}>Automatic daily transfer to bank at 11:59 PM</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Base Pay</Text>
            <Text style={styles.breakdownValue}>₹{settlementSummary?.basePayout || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Incentives</Text>
            <Text style={styles.breakdownValue}>+₹{settlementSummary?.incentives || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Customer Tips</Text>
            <Text style={styles.breakdownValue}>+₹{settlementSummary?.tips || 0}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch' }}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600' }}>
            100% Tips Passed Directly: Wom Up takes ₹0 commission on customer tips.
          </Text>
        </View>

        {(settlementSummary?.pendingTransfer || 0) > 0 && (
          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={handleInstantPayout}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="flash" size={15} color={COLORS.white} />
              <Text style={styles.payoutBtnText}>
                Instant Payout ₹{settlementSummary?.pendingTransfer}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Aggregate Period Earnings */}
      <View style={styles.aggregateRow}>
        <View style={styles.aggregateCard}>
          <Text style={styles.aggregateLabel}>This Week</Text>
          <Text style={styles.aggregateValue}>₹{settlementSummary?.weekEarnings || 0}</Text>
          <Text style={styles.aggregateSub}>SLA Incentive Eligible</Text>
        </View>
        <View style={styles.aggregateCard}>
          <Text style={styles.aggregateLabel}>This Month</Text>
          <Text style={styles.aggregateValue}>₹{settlementSummary?.monthEarnings || 0}</Text>
          <Text style={styles.aggregateSub}>Direct Bank Deposited</Text>
        </View>
      </View>

      {/* Bank Account Details Pill */}
      <TouchableOpacity
        style={styles.bankPill}
        onPress={() => setSubScreen('BankSettlement')}
        activeOpacity={0.75}
      >
        <View style={styles.bankLeft}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name="business-outline" size={20} color="#2563EB" />
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
        <View style={[styles.verifiedBadge, { flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
          <Text style={styles.verifiedText}>{bankAccount ? 'VERIFIED' : 'ADD BANK'}</Text>
          <Ionicons name="chevron-forward" size={13} color={bankAccount ? '#059669' : COLORS.primary} />
        </View>
      </TouchableOpacity>

      {/* Filter Tabs */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Trip Earnings</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'TODAY' && styles.filterPillActive]}
            onPress={() => setFilter('TODAY')}
          >
            <Text style={[styles.filterText, filter === 'TODAY' && styles.filterTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'WEEK' && styles.filterPillActive]}
            onPress={() => setFilter('WEEK')}
          >
            <Text style={[styles.filterText, filter === 'WEEK' && styles.filterTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Itemized Payouts History */}
      <View style={styles.historyList}>
        {filteredHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyOrder}>{item.orderNumber}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
              <View style={styles.itemTags}>
                <Text style={styles.tagText}>Base: ₹{item.baseAmount}</Text>
                {item.bonus > 0 && <Text style={styles.bonusTag}>Bonus: +₹{item.bonus}</Text>}
                {item.tip > 0 && <Text style={styles.tipTag}>Tip: +₹{item.tip}</Text>}
              </View>
            </View>

            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>+₹{item.total}</Text>
              <View style={styles.settledBadge}>
                <Text style={styles.settledText}>{item.status}</Text>
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
  balanceCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardHeaderLabel: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 6,
  },
  settlementNote: {
    color: COLORS.hotPink,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#13154A',
    borderRadius: 14,
    padding: 12,
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#26295C',
  },
  payoutBtn: {
    backgroundColor: COLORS.onlineGreen,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payoutBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  aggregateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  aggregateCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aggregateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  aggregateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 4,
  },
  aggregateSub: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  bankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankEmoji: {
    fontSize: 22,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accountNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: COLORS.onlineGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onlineGreenDark,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
  },
  filterPillActive: {
    backgroundColor: COLORS.hotPink,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyOrder: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  itemTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textMuted,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusTag: {
    fontSize: 10,
    color: COLORS.hotPink,
    backgroundColor: COLORS.lightPink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  tipTag: {
    fontSize: 10,
    color: COLORS.onlineGreenDark,
    backgroundColor: COLORS.onlineGreenLight,
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
    fontWeight: '800',
    color: COLORS.onlineGreen,
    marginBottom: 4,
  },
  settledBadge: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settledText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  bottomSpacer: {
    height: 30,
  },
});
