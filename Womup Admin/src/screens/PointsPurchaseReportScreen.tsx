import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Coins,
  Search,
  Plus,
  TrendingUp,
  CreditCard,
  User,
  Phone,
  Calendar,
  RefreshCw,
  Check,
  X,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { DateRangeFilter, DateFilterRange } from '../components/common/DateRangeFilter';
import { NEST_API_BASE_URL } from '../services/api';

export const PointsPurchaseReportScreen: React.FC = () => {
  const [reportData, setReportData] = useState<any>({
    stats: {
      totalCoinsPurchased: 0,
      totalRevenue: 0,
      uniqueUsersCount: 0,
      totalTransactions: 0,
    },
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: 'All Time' });

  // Credit / Purchase Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [coinAmount, setCoinAmount] = useState('1000');
  const [amountPaid, setAmountPaid] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'PORTAL_OFFER'>('UPI');
  const [referenceNotes, setReferenceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const res = await fetch(`${NEST_API_BASE_URL}/coins/purchases/report?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.warn('Failed fetching points purchase report:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, dateRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleOpenCreditModal = () => {
    setUserQuery('');
    setCoinAmount('1000');
    setAmountPaid('1000');
    setPaymentMethod('UPI');
    setReferenceNotes('');
    setShowCreditModal(true);
  };

  const handlePointsChange = (val: string) => {
    setCoinAmount(val);
    setAmountPaid(val); // 1 Coin = ₹1
  };

  const handleSubmitCredit = async () => {
    if (!userQuery.trim()) {
      Alert.alert('Customer Required', 'Please enter a customer mobile number, user ID, or referral code.');
      return;
    }
    const coinsNum = Number(coinAmount);
    if (!coinsNum || coinsNum <= 0) {
      Alert.alert('Invalid Points', 'Please enter a valid points amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${NEST_API_BASE_URL}/coins/purchases/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userQuery.trim(),
          phone: userQuery.trim(),
          coins: coinsNum,
          amountPaid: Number(amountPaid) || coinsNum,
          paymentMethod,
          notes: referenceNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed recording points purchase');
      }

      setShowCreditModal(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Points Credited! ${coinsNum} Shopping Points added to ${data.user?.name || userQuery}.`);
      } else {
        Alert.alert('Points Credited!', `${coinsNum} Shopping Points added to ${data.user?.name || userQuery}.`);
      }
      fetchReport();
    } catch (e: any) {
      Alert.alert('Credit Error', e.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = reportData.stats || {
    totalCoinsPurchased: 0,
    totalRevenue: 0,
    uniqueUsersCount: 0,
    totalTransactions: 0,
  };
  const transactions = reportData.transactions || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Coins size={20} color="#DB2777" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Points Purchase & Recharge Report</Text>
            <Text style={styles.headerSubtitle}>
              Shopping coin purchases, user credit requests & package revenue
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.creditBtn} onPress={handleOpenCreditModal} activeOpacity={0.8}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.creditBtnText}>Purchase / Credit Points</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
        {/* KPI Summary Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#DB2777' }]}>
            <Text style={styles.kpiLabel}>Total Points Purchased</Text>
            <Text style={[styles.kpiValue, { color: '#BE185D' }]}>
              {stats.totalCoinsPurchased.toLocaleString()} SC
            </Text>
            <Text style={styles.kpiSub}>Shopping coin units</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#16A34A' }]}>
            <Text style={styles.kpiLabel}>Total Revenue (₹)</Text>
            <Text style={[styles.kpiValue, { color: '#15803D' }]}>
              ₹{stats.totalRevenue.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>1 Coin = ₹1.00</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.kpiLabel}>Unique Purchasers</Text>
            <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
              {stats.uniqueUsersCount.toLocaleString()} Users
            </Text>
            <Text style={styles.kpiSub}>Active point buyers</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#7C3AED' }]}>
            <Text style={styles.kpiLabel}>Total Transactions</Text>
            <Text style={[styles.kpiValue, { color: '#6D28D9' }]}>
              {stats.totalTransactions.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Recharges recorded</Text>
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Search size={15} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer name, phone, or reference ID..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <DateRangeFilter
            currentPreset={dateRange.preset}
            onFilterChange={setDateRange}
          />
        </View>

        {/* Purchases Table / List */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Recent Points Purchase Ledger</Text>
            <TouchableOpacity onPress={fetchReport} style={styles.tableRefreshBtn}>
              <RefreshCw size={13} color={COLORS.purple} />
              <Text style={styles.tableRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#DB2777" />
              <Text style={styles.loadingText}>Fetching points purchase transactions...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Coins size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Points Purchases Found</Text>
              <Text style={styles.emptyText}>
                No points purchases or credits match the selected period and query.
              </Text>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View style={styles.txIconBox}>
                    <Coins size={16} color="#DB2777" />
                  </View>
                  <View>
                    <View style={styles.userRow}>
                      <Text style={styles.userName}>{tx.user?.name || 'Customer'}</Text>
                      {tx.user?.referralCode ? (
                        <View style={styles.refBadge}>
                          <Text style={styles.refBadgeText}>{tx.user.referralCode}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.subUserRow}>
                      <Phone size={10} color="#64748B" />
                      <Text style={styles.userPhone}>{tx.user?.phone || 'No Phone'}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.txDescription} numberOfLines={1}>
                      {tx.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRight}>
                  <Text style={styles.txCoins}>+{tx.coins} SC</Text>
                  <Text style={styles.txAmount}>₹{tx.amountPaid || tx.coins}</Text>
                  <View style={styles.methodBadge}>
                    <Text style={styles.methodBadgeText}>{tx.paymentMethod || 'UPI'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Manual Purchase / Credit Points Modal */}
      <Modal
        visible={showCreditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Coins size={18} color="#DB2777" />
                <Text style={styles.modalTitle}>Credit / Purchase Shopping Points</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreditModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Customer Mobile No. or Referral Code *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9825000099 or WOM41314"
                placeholderTextColor="#9CA3AF"
                value={userQuery}
                onChangeText={setUserQuery}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Points to Credit *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={coinAmount}
                onChangeText={handlePointsChange}
              />

              {/* Quick Packages */}
              <View style={styles.quickPackagesRow}>
                {['500', '1000', '2000', '5000'].map((pkg) => (
                  <TouchableOpacity
                    key={pkg}
                    style={[styles.pkgBtn, coinAmount === pkg && styles.pkgBtnActive]}
                    onPress={() => handlePointsChange(pkg)}
                  >
                    <Text style={[styles.pkgBtnText, coinAmount === pkg && styles.pkgBtnTextActive]}>
                      +{pkg} SC
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Amount Received (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={amountPaid}
                onChangeText={setAmountPaid}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Payment Mode</Text>
              <View style={styles.paymentMethodsRow}>
                {(['UPI', 'CASH', 'BANK_TRANSFER', 'PORTAL_OFFER'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod(m)}
                  >
                    <Text style={[styles.methodBtnText, paymentMethod === m && styles.methodBtnTextActive]}>
                      {m.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Reference / Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. UTR / UPI Ref #938491823 or Diwali bonus package"
                placeholderTextColor="#9CA3AF"
                value={referenceNotes}
                onChangeText={setReferenceNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmCreditBtn}
                onPress={handleSubmitCredit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.confirmCreditText}>Confirm & Add Points</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  creditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DB2777',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  creditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
      default: { elevation: 1 },
    }),
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FAFAFC',
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  tableRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  centered: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  refBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  refBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  subUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  dot: {
    color: '#94A3B8',
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
  },
  txDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txCoins: {
    fontSize: 15,
    fontWeight: '900',
    color: '#BE185D',
  },
  txAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 1,
  },
  methodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalBody: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  quickPackagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pkgBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    alignItems: 'center',
  },
  pkgBtnActive: {
    backgroundColor: '#DB2777',
    borderColor: '#DB2777',
  },
  pkgBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DB2777',
  },
  pkgBtnTextActive: {
    color: '#FFFFFF',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: COLORS.purple,
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  methodBtnTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  confirmCreditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#DB2777',
  },
  confirmCreditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
