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
import { OnlinePaymentModal } from '../../components/modals/OnlinePaymentModal';

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
  const [showPayAdminModal, setShowPayAdminModal] = useState(false);

  const loadData = async () => {
    try {
      const list = await RiderApiService.getSettlementHistory();
      setHistory(list || []);
    } catch {
      setHistory([]);
    }
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
      ? (settlementSummary?.netPayableToday ?? 0)
      : filter === 'WEEK'
      ? (settlementSummary?.weekEarnings ?? 0)
      : (settlementSummary?.monthEarnings ?? 0);

  const displayOrders =
    filter === 'TODAY'
      ? (settlementSummary?.todayCompleted ?? 0)
      : filter === 'WEEK'
      ? (settlementSummary?.weekOrders ?? (settlementSummary?.todayCompleted ? settlementSummary.todayCompleted * 4 : 0))
      : (settlementSummary?.monthOrders ?? (settlementSummary?.todayCompleted ? settlementSummary.todayCompleted * 15 : 0));

  const displayBase =
    filter === 'TODAY'
      ? (settlementSummary?.basePayout ?? 0)
      : filter === 'WEEK'
      ? (settlementSummary?.weekBase ?? (settlementSummary?.basePayout ? settlementSummary.basePayout * 4 : 0))
      : (settlementSummary?.monthBase ?? (settlementSummary?.basePayout ? settlementSummary.basePayout * 15 : 0));

  const displayTips =
    filter === 'TODAY'
      ? (settlementSummary?.tips ?? 0)
      : filter === 'WEEK'
      ? (settlementSummary?.weekTips ?? 0)
      : (settlementSummary?.monthTips ?? 0);

  const displayIncentives =
    filter === 'TODAY'
      ? (settlementSummary?.incentives ?? 0)
      : filter === 'WEEK'
      ? (settlementSummary?.weekIncentives ?? 0)
      : (settlementSummary?.monthIncentives ?? 0);

  const netDueToAdmin = settlementSummary?.netBalance ?? settlementSummary?.riderOwesAdmin ?? 0;
  const cashLimit = settlementSummary?.cashLimit ?? 500;
  const isCashBlocked = Boolean(settlementSummary?.isOrderBlocked || netDueToAdmin >= cashLimit);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.screenHeaderRow}>
        <View>
          <Text style={styles.screenTitle}>Earnings & Khata</Text>
          <Text style={styles.screenSubtitle}>Net Settlement · Zero Split · Order Khata</Text>
        </View>
        <TouchableOpacity
          style={styles.walletHeaderIconBtn}
          onPress={() => setSubScreen('BankSettlement')}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={20} color="#071B52" />
        </TouchableOpacity>
      </View>

      {/* 0. Khata Net Settlement Overview Card (SRS Specification) */}
      <View style={[styles.khataOverviewCard, isCashBlocked && styles.khataOverviewCardBlocked]}>
        <View style={styles.khataOverviewHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="book-outline" size={16} color="#071B52" />
            <Text style={styles.khataOverviewTitle}>Rider Ledger (Khata Hisaab)</Text>
          </View>
          <View
            style={[
              styles.khataStatusPill,
              isCashBlocked ? styles.khataStatusPillBlocked : styles.khataStatusPillActive,
            ]}
          >
            <Ionicons
              name={isCashBlocked ? 'lock-closed' : 'checkmark-circle'}
              size={11}
              color={isCashBlocked ? '#DC2626' : '#059669'}
            />
            <Text
              style={[
                styles.khataStatusPillText,
                isCashBlocked ? styles.khataStatusPillTextBlocked : styles.khataStatusPillTextActive,
              ]}
            >
              {isCashBlocked ? 'LOCKED (Dues >= ₹500)' : 'ACTIVE (Safe)'}
            </Text>
          </View>
        </View>

        {/* 3 Metrics Row */}
        <View style={styles.khataMetricRow}>
          <View style={styles.khataBox}>
            <Text style={styles.khataBoxLabel}>COD CASH IN HAND</Text>
            <Text style={[styles.khataBoxVal, { color: '#071B52' }]}>
              ₹{settlementSummary?.totalCodCollected ?? settlementSummary?.todayCod ?? 0}
            </Text>
            <Text style={styles.khataBoxSub}>Total Collected</Text>
          </View>

          <View style={styles.khataBox}>
            <Text style={styles.khataBoxLabel}>RIDER EARNINGS</Text>
            <Text style={[styles.khataBoxVal, { color: '#059669' }]}>
              ₹{settlementSummary?.totalEarnings ?? displayTotal}
            </Text>
            <Text style={styles.khataBoxSub}>Online + COD</Text>
          </View>

          <View style={[styles.khataBox, styles.khataNetBox]}>
            <Text style={styles.khataBoxLabel}>NET BALANCE</Text>
            <Text
              style={[
                styles.khataBoxVal,
                netDueToAdmin > 0
                  ? styles.khataNetValOwedAdmin
                  : netDueToAdmin < 0
                  ? styles.khataNetValOwedRider
                  : null,
              ]}
            >
              ₹{Math.abs(netDueToAdmin)}
            </Text>
            <Text
              style={[
                styles.khataBoxSub,
                netDueToAdmin > 0
                  ? { color: '#DC2626', fontWeight: '700' }
                  : netDueToAdmin < 0
                  ? { color: '#059669', fontWeight: '700' }
                  : null,
              ]}
            >
              {netDueToAdmin > 0 ? 'Owed to Admin' : netDueToAdmin < 0 ? 'Admin Owes You' : 'All Settled'}
            </Text>
          </View>
        </View>

        {/* Limit Warning / Safe Bar */}
        <View style={[styles.limitBarBox, isCashBlocked && styles.limitBarBoxBlocked]}>
          <Ionicons
            name={isCashBlocked ? 'alert-circle' : 'shield-checkmark-outline'}
            size={14}
            color={isCashBlocked ? '#DC2626' : '#64748B'}
          />
          <Text style={[styles.limitBarText, isCashBlocked && styles.limitBarTextBlocked]}>
            {isCashBlocked
              ? `₹500 Cash limit exceeded! Handover ₹${netDueToAdmin} cash to Admin to unlock new orders.`
              : `Credit Limit: ₹${netDueToAdmin} / ₹${cashLimit} dues (₹${Math.max(
                  0,
                  cashLimit - netDueToAdmin
                )} safe headroom remaining)`}
          </Text>
        </View>

        {netDueToAdmin > 0 && (
          <TouchableOpacity
            style={[styles.khataPayAdminBtn, isCashBlocked && styles.khataPayAdminBtnBlocked]}
            onPress={() => setShowPayAdminModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="card" size={15} color="#FFFFFF" />
            <Text style={styles.khataPayAdminBtnText}>Pay ₹{netDueToAdmin} via UPI to Admin</Text>
          </TouchableOpacity>
        )}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dotMarker, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.breakdownLineLabel}>Delivery Earnings</Text>
            </View>
            <Text style={styles.breakdownLineValue}>₹ {displayBase}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dotMarker, { backgroundColor: '#13B978' }]} />
              <Text style={styles.breakdownLineLabel}>Tips (100% Direct)</Text>
            </View>
            <Text style={[styles.breakdownLineValue, { color: '#13B978' }]}>+₹ {displayTips}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownLine}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
        <View
          style={[
            styles.verifiedBadge,
            {
              backgroundColor: !bankAccount
                ? '#FEE2E2'
                : bankAccount.verificationStatus === 'VERIFIED'
                ? '#DCFCE7'
                : '#FEF3C7',
            },
          ]}
        >
          <Text
            style={[
              styles.verifiedText,
              {
                color: !bankAccount
                  ? COLORS.primary
                  : bankAccount.verificationStatus === 'VERIFIED'
                  ? '#059669'
                  : '#D97706',
              },
            ]}
          >
            {!bankAccount ? 'ADD BANK' : bankAccount.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={
              !bankAccount
                ? COLORS.primary
                : bankAccount.verificationStatus === 'VERIFIED'
                ? '#059669'
                : '#D97706'
            }
          />
        </View>
      </TouchableOpacity>

      {/* 4. Order-by-Order Khata Ledger (SRS Table) */}
      <View style={styles.recentTripsHeaderRow}>
        <View>
          <Text style={styles.recentTripsTitle}>Order Ledger (Khata Entries)</Text>
          <Text style={styles.khataSubHeader}>Online payments to Admin • COD cash collected by Rider</Text>
        </View>
        <TouchableOpacity onPress={() => setSubScreen('DutyHistory')} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Trip Khata Cards List */}
      <View style={styles.historyList}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyKhataCard}>
            <View style={styles.emptyKhataIconCircle}>
              <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyKhataTitle}>No orders in ledger yet</Text>
            <Text style={styles.emptyKhataSubtitle}>
              Complete your first delivery to see order earnings, customer tips, and cash collections here.
            </Text>
          </View>
        ) : (
          filteredHistory.map((item) => {
          const isCod = item.paymentMode === 'COD';
          const orderTotal = item.totalAmount ?? (item.baseAmount + (item.adminShare ?? 0));
          const riderEarn = item.riderEarning ?? item.baseAmount ?? item.total;
          const adminCut = item.adminShare ?? (isCod ? Math.max(0, orderTotal - riderEarn) : 0);

          return (
            <View key={item.id} style={styles.khataOrderCard}>
              <View style={styles.khataOrderCardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.khataOrderNum}>{item.orderNumber}</Text>
                  <View style={[styles.modePill, isCod ? styles.modePillCod : styles.modePillOnline]}>
                    <Text style={[styles.modePillText, isCod ? styles.modePillCodText : styles.modePillOnlineText]}>
                      {isCod ? 'COD (Cash)' : 'Online Pay'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.khataOrderDate}>{item.date}</Text>
              </View>

              {/* 3-column financial calculation matching SRS */}
              <View style={styles.khataOrderCalcRow}>
                <View style={styles.khataCalcCol}>
                  <Text style={styles.khataCalcLabel}>TOTAL ORDER</Text>
                  <Text style={styles.khataCalcVal}>₹{orderTotal}</Text>
                </View>

                <View style={styles.khataCalcCol}>
                  <Text style={styles.khataCalcLabel}>RIDER SHARE (+)</Text>
                  <Text style={[styles.khataCalcVal, { color: '#059669', fontWeight: '800' }]}>
                    +₹{riderEarn}
                  </Text>
                </View>

                <View style={styles.khataCalcCol}>
                  <Text style={styles.khataCalcLabel}>ADMIN SHARE (-)</Text>
                  <Text
                    style={[
                      styles.khataCalcVal,
                      { color: adminCut > 0 ? '#DC2626' : '#64748B', fontWeight: '800' },
                    ]}
                  >
                    {adminCut > 0 ? `-₹${adminCut}` : '₹0'}
                  </Text>
                </View>
              </View>

              {/* Net Hisaab Footer */}
              <View style={styles.khataOrderFooter}>
                <Text style={styles.khataOrderFooterNote}>
                  {isCod
                    ? `Net Hisaab: Rider owes Admin ₹${adminCut}`
                    : `Net Hisaab: Added to rider payout (+₹${riderEarn})`}
                </Text>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>{item.status || 'DELIVERED'}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
      </View>

      <View style={styles.bottomSpacer} />

      <OnlinePaymentModal
        visible={showPayAdminModal}
        onClose={() => setShowPayAdminModal(false)}
        dueAmount={netDueToAdmin}
        onPaymentSuccess={() => {
          refreshDashboard();
        }}
      />
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
    paddingVertical: 5,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
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

  // Khata Overview Card Styles
  khataOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  khataOverviewCardBlocked: {
    borderColor: '#F87171',
    backgroundColor: '#FFFBFB',
    borderWidth: 1.5,
  },
  khataOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  khataOverviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  khataStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  khataStatusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  khataStatusPillBlocked: {
    backgroundColor: '#FEE2E2',
  },
  khataStatusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  khataStatusPillTextActive: {
    color: '#15803D',
  },
  khataStatusPillTextBlocked: {
    color: '#DC2626',
  },
  khataMetricRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  khataBox: {
    flex: 1,
  },
  khataNetBox: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 8,
  },
  khataBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  khataBoxVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#071B52',
    marginTop: 2,
  },
  khataNetValOwedAdmin: {
    color: '#DC2626',
  },
  khataNetValOwedRider: {
    color: '#059669',
  },
  khataBoxSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  limitBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
  },
  limitBarBoxBlocked: {
    backgroundColor: '#FEE2E2',
  },
  limitBarText: {
    flex: 1,
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
  },
  limitBarTextBlocked: {
    color: '#DC2626',
    fontWeight: '700',
  },
  khataPayAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  khataPayAdminBtnBlocked: {
    backgroundColor: '#B91C1C',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  khataPayAdminBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  khataSubHeader: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Khata Order Cards
  khataOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  khataOrderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  khataOrderNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  modePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modePillCod: {
    backgroundColor: '#FEF3C7',
  },
  modePillOnline: {
    backgroundColor: '#EEF2FF',
  },
  modePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  modePillCodText: {
    color: '#92400E',
  },
  modePillOnlineText: {
    color: '#4338CA',
  },
  khataOrderDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  khataOrderCalcRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  khataCalcCol: {
    flex: 1,
  },
  khataCalcLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  khataCalcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
    marginTop: 2,
  },
  khataOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  khataOrderFooterNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptyKhataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyKhataIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyKhataTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 6,
  },
  emptyKhataSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
