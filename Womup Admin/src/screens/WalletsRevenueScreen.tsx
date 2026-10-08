import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  TrendingUp,
  Store,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building2,
  Layers,
  ChevronRight,
  CreditCard,
  Send,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { ApiService } from '../services/api';
import {
  StoreWalletItem,
  RiderWalletItem,
  PlatformWalletData,
  WalletTransactionItem,
  WalletsSummaryData,
} from '../types/admin';

type ActiveSubTab = 'OVERVIEW' | 'STORES' | 'RIDERS' | 'PLATFORM' | 'LEDGER';

export const WalletsRevenueScreen: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [summary, setSummary] = useState<WalletsSummaryData | null>(null);
  const [storeWallets, setStoreWallets] = useState<StoreWalletItem[]>([]);
  const [riderWallets, setRiderWallets] = useState<RiderWalletItem[]>([]);
  const [platformData, setPlatformData] = useState<PlatformWalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'STORE' | 'RIDER' | 'PLATFORM'>('ALL');

  // Payout Modals
  const [selectedStore, setSelectedStore] = useState<StoreWalletItem | null>(null);
  const [payoutStoreAmount, setPayoutStoreAmount] = useState<string>('');
  const [payoutStoreNotes, setPayoutStoreNotes] = useState<string>('Weekly Bank NEFT');
  const [storePayoutLoading, setStorePayoutLoading] = useState<boolean>(false);

  const [selectedRider, setSelectedRider] = useState<RiderWalletItem | null>(null);
  const [payoutRiderAmount, setPayoutRiderAmount] = useState<string>('');
  const [payoutRiderNotes, setPayoutRiderNotes] = useState<string>('Daily Instant IMPS');
  const [riderPayoutLoading, setRiderPayoutLoading] = useState<boolean>(false);

  const loadAllWalletData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [sumRes, storesRes, ridersRes, platRes, txRes] = await Promise.all([
        ApiService.getWalletsSummary(),
        ApiService.getStoreWallets(),
        ApiService.getRiderWallets(),
        ApiService.getPlatformWallet(),
        ApiService.getWalletTransactions({ limit: 100 }),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (storesRes.success && storesRes.data) setStoreWallets(storesRes.data);
      if (ridersRes.success && ridersRes.data) setRiderWallets(ridersRes.data);
      if (platRes.success && platRes.data) setPlatformData(platRes.data);
      if (txRes.success && txRes.data) setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllWalletData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllWalletData(true);
  };

  // Handle Store Settlement
  const handleExecuteStorePayout = async () => {
    if (!selectedStore) return;
    const amountNum = parseFloat(payoutStoreAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    if (amountNum > selectedStore.balance) {
      Alert.alert('Balance Exceeded', `Cannot payout more than current balance ₹${selectedStore.balance}`);
      return;
    }

    setStorePayoutLoading(true);
    try {
      const res = await ApiService.settleStoreWallet(selectedStore.storeId, amountNum, payoutStoreNotes);
      if (res.success) {
        Alert.alert('Payout Successful', res.message || `Transferred ₹${amountNum} to ${selectedStore.storeName}`);
        setSelectedStore(null);
        setPayoutStoreAmount('');
        loadAllWalletData(true);
      } else {
        Alert.alert('Payout Failed', res.error || 'Server error processing settlement.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error.');
    } finally {
      setStorePayoutLoading(false);
    }
  };

  // Handle Rider Settlement
  const handleExecuteRiderPayout = async () => {
    if (!selectedRider) return;
    const amountNum = parseFloat(payoutRiderAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payout amount.');
      return;
    }
    if (amountNum > selectedRider.balance) {
      Alert.alert('Balance Exceeded', `Cannot payout more than rider balance ₹${selectedRider.balance}`);
      return;
    }

    setRiderPayoutLoading(true);
    try {
      const res = await ApiService.settleRiderWallet(selectedRider.riderId, amountNum, payoutRiderNotes);
      if (res.success) {
        Alert.alert('Instant Transfer Done', res.message || `IMPS payout of ₹${amountNum} sent to ${selectedRider.name}`);
        setSelectedRider(null);
        setPayoutRiderAmount('');
        loadAllWalletData(true);
      } else {
        Alert.alert('Payout Failed', res.error || 'Server error processing rider IMPS.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error.');
    } finally {
      setRiderPayoutLoading(false);
    }
  };

  // Filtered Stores
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return storeWallets;
    const q = searchQuery.toLowerCase();
    return storeWallets.filter(
      s => s.storeName.toLowerCase().includes(q) || s.area.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
    );
  }, [storeWallets, searchQuery]);

  // Filtered Riders
  const filteredRiders = useMemo(() => {
    if (!searchQuery.trim()) return riderWallets;
    const q = searchQuery.toLowerCase();
    return riderWallets.filter(
      r => r.name.toLowerCase().includes(q) || r.partnerCode.toLowerCase().includes(q) || r.phone.includes(q)
    );
  }, [riderWallets, searchQuery]);

  // Filtered Ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (ledgerFilter !== 'ALL' && t.walletType !== ledgerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.description?.toLowerCase().includes(q) ||
          t.orderNumber?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, ledgerFilter, searchQuery]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>Loading 3-Wallet Balances & Ledgers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBadge}>
            <Wallet size={22} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Order Payment Distribution & 3-Wallets</Text>
            <Text style={styles.headerSubtitle}>
              Store Revenue (90%) • Rider Fee & Tips (100%) • Platform Handling & Commission
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
            <RefreshCw size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Sub-tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabNavScroll}>
          <TouchableOpacity
            style={[styles.subTabBtn, activeSubTab === 'OVERVIEW' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('OVERVIEW')}
          >
            <Sparkles size={16} color={activeSubTab === 'OVERVIEW' ? COLORS.white : COLORS.secondaryText} />
            <Text style={[styles.subTabText, activeSubTab === 'OVERVIEW' && styles.subTabTextActive]}>
              3-Way Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, activeSubTab === 'STORES' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('STORES')}
          >
            <Store size={16} color={activeSubTab === 'STORES' ? COLORS.white : COLORS.secondaryText} />
            <Text style={[styles.subTabText, activeSubTab === 'STORES' && styles.subTabTextActive]}>
              Store Wallets ({storeWallets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, activeSubTab === 'RIDERS' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('RIDERS')}
          >
            <Bike size={16} color={activeSubTab === 'RIDERS' ? COLORS.white : COLORS.secondaryText} />
            <Text style={[styles.subTabText, activeSubTab === 'RIDERS' && styles.subTabTextActive]}>
              Rider Wallets ({riderWallets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, activeSubTab === 'PLATFORM' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('PLATFORM')}
          >
            <ShieldCheck size={16} color={activeSubTab === 'PLATFORM' ? COLORS.white : COLORS.secondaryText} />
            <Text style={[styles.subTabText, activeSubTab === 'PLATFORM' && styles.subTabTextActive]}>
              Platform Revenue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, activeSubTab === 'LEDGER' && styles.subTabBtnActive]}
            onPress={() => setActiveSubTab('LEDGER')}
          >
            <FileText size={16} color={activeSubTab === 'LEDGER' ? COLORS.white : COLORS.secondaryText} />
            <Text style={[styles.subTabText, activeSubTab === 'LEDGER' && styles.subTabTextActive]}>
              Audit Ledger ({transactions.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
        {/* ===============================================================
            TAB 1: 3-WAY OVERVIEW & SPLIT FORMULA
        =============================================================== */}
        {activeSubTab === 'OVERVIEW' && (
          <View style={styles.tabSection}>
            {/* Visual Formula Card */}
            <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.formulaCard}>
              <View style={styles.formulaHeader}>
                <Sparkles size={20} color="#FBBF24" />
                <Text style={styles.formulaTitle}>Live Payment Distribution Engine (e.g. ₹80 Bill)</Text>
              </View>

              <View style={styles.formulaSplitRow}>
                {/* Store Box */}
                <View style={styles.formulaBox}>
                  <View style={[styles.formulaBoxIcon, { backgroundColor: '#3B82F620' }]}>
                    <Store size={20} color="#60A5FA" />
                  </View>
                  <Text style={styles.formulaBoxTitle}>Store (Dark Store)</Text>
                  <Text style={styles.formulaBoxAmount}>₹60 Subtotal</Text>
                  <Text style={styles.formulaBoxSub}>-10% Comm. (₹6)</Text>
                  <View style={styles.formulaPill}>
                    <Text style={styles.formulaPillText}>Net ₹54 Credited</Text>
                  </View>
                </View>

                {/* Rider Box */}
                <View style={styles.formulaBox}>
                  <View style={[styles.formulaBoxIcon, { backgroundColor: '#10B98120' }]}>
                    <Bike size={20} color="#34D399" />
                  </View>
                  <Text style={styles.formulaBoxTitle}>Rider Wallet</Text>
                  <Text style={styles.formulaBoxAmount}>₹15 Delivery Fee</Text>
                  <Text style={styles.formulaBoxSub}>+ 100% Tips (₹0 cut)</Text>
                  <View style={[styles.formulaPill, { backgroundColor: '#065F46' }]}>
                    <Text style={[styles.formulaPillText, { color: '#6EE7B7' }]}>₹15 - ₹35+ Payout</Text>
                  </View>
                </View>

                {/* Platform Box */}
                <View style={styles.formulaBox}>
                  <View style={[styles.formulaBoxIcon, { backgroundColor: '#8B5CF620' }]}>
                    <ShieldCheck size={20} color="#A78BFA" />
                  </View>
                  <Text style={styles.formulaBoxTitle}>Platform (Wom Up)</Text>
                  <Text style={styles.formulaBoxAmount}>₹5 Handling Fee</Text>
                  <Text style={styles.formulaBoxSub}>+ ₹6 Store Comm.</Text>
                  <View style={[styles.formulaPill, { backgroundColor: '#4C1D95' }]}>
                    <Text style={[styles.formulaPillText, { color: '#C4B5FD' }]}>₹11 Total Revenue</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Top Metric Cards */}
            <View style={styles.metricsGrid}>
              {/* Store Balances Metric */}
              <View style={[styles.metricCard, { borderLeftColor: '#3B82F6' }]}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Total Store Balances</Text>
                  <Store size={18} color="#3B82F6" />
                </View>
                <Text style={styles.metricValue}>₹{(summary?.stores.totalBalance || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.metricSub}>
                  Across {summary?.stores.count || storeWallets.length} active dark stores
                </Text>
              </View>

              {/* Rider Balances Metric */}
              <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Rider Pending Earnings</Text>
                  <Bike size={18} color="#10B981" />
                </View>
                <Text style={styles.metricValue}>₹{(summary?.riders.totalBalance || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.metricSub}>
                  ₹{(summary?.riders.totalTips || 0).toLocaleString('en-IN')} tips delivered 100%
                </Text>
              </View>

              {/* Platform Revenue Metric */}
              <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6' }]}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Platform Revenue (Today)</Text>
                  <ShieldCheck size={18} color="#8B5CF6" />
                </View>
                <Text style={styles.metricValue}>
                  ₹{(platformData?.todayRevenue || summary?.platform.totalRevenue || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.metricSub}>
                  Handling fees + Store 10% commissions
                </Text>
              </View>

              {/* Platform Net Profit Metric */}
              <View style={[styles.metricCard, { borderLeftColor: '#F59E0B' }]}>
                <View style={styles.metricCardHeader}>
                  <Text style={styles.metricLabel}>Platform Net Profit</Text>
                  <TrendingUp size={18} color="#F59E0B" />
                </View>
                <Text style={styles.metricValue}>
                  ₹{(platformData?.lifetime.netProfit || summary?.platform.netProfit || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.metricSub}>
                  After server & payment gateway costs
                </Text>
              </View>
            </View>

            {/* Quick Actions & Settlement Schedules */}
            <View style={styles.scheduleCard}>
              <Text style={styles.scheduleCardTitle}>Automated Settlement Schedules</Text>
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Clock size={16} color={COLORS.purple} />
                  <Text style={styles.scheduleItemTitle}>Store Wallets:</Text>
                  <Text style={styles.scheduleItemVal}>Weekly Bank Transfer (Mondays)</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Clock size={16} color="#10B981" />
                  <Text style={styles.scheduleItemTitle}>Rider Wallets:</Text>
                  <Text style={styles.scheduleItemVal}>Daily at 11:59 PM (Instant IMPS)</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Clock size={16} color="#F59E0B" />
                  <Text style={styles.scheduleItemTitle}>Platform:</Text>
                  <Text style={styles.scheduleItemVal}>Real-time per delivery order</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===============================================================
            TAB 2: STORE WALLETS LIST
        =============================================================== */}
        {activeSubTab === 'STORES' && (
          <View style={styles.tabSection}>
            <View style={styles.filterRow}>
              <View style={styles.searchBox}>
                <Search size={18} color={COLORS.secondaryText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search store name, area, or city..."
                  placeholderTextColor={COLORS.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={COLORS.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {filteredStores.map(store => (
              <View key={store.storeId} style={styles.walletCard}>
                <View style={styles.walletCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.walletName}>{store.storeName}</Text>
                      <View style={styles.cycleBadge}>
                        <Text style={styles.cycleBadgeText}>{store.settlementCycle}</Text>
                      </View>
                    </View>
                    <Text style={styles.walletSub}>
                      {store.area}, {store.city} • Commission Rate: {store.commissionRate}%
                    </Text>
                  </View>
                  <View style={styles.balanceBadgeContainer}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>₹{store.balance.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Lifetime & Banking info */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Lifetime Gross Sales</Text>
                    <Text style={styles.statVal}>₹{store.totalEarned.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total Commission Paid</Text>
                    <Text style={[styles.statVal, { color: '#EF4444' }]}>
                      ₹{store.totalCommission.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Linked Bank Account</Text>
                    <Text style={styles.statVal}>
                      {store.bankAccount?.bankName || 'HDFC Bank'} ({store.bankAccount?.accountNumber || '•••'})
                    </Text>
                  </View>
                </View>

                {/* Settlement action */}
                <View style={styles.cardActionRow}>
                  <Text style={styles.lastSettledText}>
                    Last Payout: {store.lastSettlementAt ? new Date(store.lastSettlementAt).toLocaleDateString() : 'Pending first cycle'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.settleBtn, store.balance <= 0 && styles.settleBtnDisabled]}
                    disabled={store.balance <= 0}
                    onPress={() => {
                      setSelectedStore(store);
                      setPayoutStoreAmount(store.balance.toString());
                    }}
                  >
                    <Send size={14} color={COLORS.white} />
                    <Text style={styles.settleBtnText}>Settle Store Payout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===============================================================
            TAB 3: RIDER WALLETS LIST
        =============================================================== */}
        {activeSubTab === 'RIDERS' && (
          <View style={styles.tabSection}>
            <View style={styles.filterRow}>
              <View style={styles.searchBox}>
                <Search size={18} color={COLORS.secondaryText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search rider name, partner code, or phone..."
                  placeholderTextColor={COLORS.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color={COLORS.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {filteredRiders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Bike size={32} color={COLORS.secondaryText} />
                <Text style={styles.emptyTitle}>No Rider Wallets Found</Text>
                <Text style={styles.emptySub}>Rider wallets activate automatically upon first delivery settlement.</Text>
              </View>
            ) : (
              filteredRiders.map(rider => (
                <View key={rider.riderId} style={styles.walletCard}>
                  <View style={styles.walletCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.walletName}>{rider.name}</Text>
                        <View style={[styles.cycleBadge, { backgroundColor: '#065F46' }]}>
                          <Text style={[styles.cycleBadgeText, { color: '#6EE7B7' }]}>{rider.partnerCode}</Text>
                        </View>
                      </View>
                      <Text style={styles.walletSub}>
                        {rider.phone} • Daily Auto-Settlement at 11:59 PM
                      </Text>
                    </View>
                    <View style={styles.balanceBadgeContainer}>
                      <Text style={styles.balanceLabel}>Today's Unsettled</Text>
                      <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                        ₹{rider.balance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Earnings Breakdown */}
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Today Base Pay</Text>
                      <Text style={styles.statVal}>₹{rider.todaySettlement.basePay.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Customer Tips (100%)</Text>
                      <Text style={[styles.statVal, { color: '#F59E0B' }]}>
                        ₹{rider.todaySettlement.tip.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Lifetime Earnings</Text>
                      <Text style={styles.statVal}>₹{rider.lifetimeEarnings.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Rider Settlement action */}
                  <View style={styles.cardActionRow}>
                    <Text style={styles.lastSettledText}>
                      Linked Account: {rider.bankAccount?.bankName || 'SBI'} ({rider.bankAccount?.accountNumber || '••••'})
                    </Text>
                    <TouchableOpacity
                      style={[styles.settleBtn, { backgroundColor: '#10B981' }, rider.balance <= 0 && styles.settleBtnDisabled]}
                      disabled={rider.balance <= 0}
                      onPress={() => {
                        setSelectedRider(rider);
                        setPayoutRiderAmount(rider.balance.toString());
                      }}
                    >
                      <ArrowUpRight size={14} color={COLORS.white} />
                      <Text style={styles.settleBtnText}>Instant IMPS Payout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ===============================================================
            TAB 4: PLATFORM REVENUE & PROFIT
        =============================================================== */}
        {activeSubTab === 'PLATFORM' && (
          <View style={styles.tabSection}>
            <LinearGradient colors={['#312E81', '#1E1B4B']} style={styles.platSummaryCard}>
              <Text style={styles.platSummaryTitle}>Platform Financial Health</Text>
              <Text style={styles.platSummarySub}>Live Worm Up revenue stream metrics</Text>

              <View style={styles.platGrid}>
                <View style={styles.platCol}>
                  <Text style={styles.platColLabel}>Today's Total Revenue</Text>
                  <Text style={styles.platColVal}>₹{(platformData?.todayRevenue || 0).toLocaleString('en-IN')}</Text>
                  <Text style={styles.platColNote}>From {platformData?.todayOrdersCount || 0} completed orders</Text>
                </View>
                <View style={styles.platCol}>
                  <Text style={styles.platColLabel}>Handling & Convenience</Text>
                  <Text style={styles.platColVal}>₹{(platformData?.todayHandling || 0).toLocaleString('en-IN')}</Text>
                  <Text style={styles.platColNote}>Fixed ₹5/order fee</Text>
                </View>
                <View style={styles.platCol}>
                  <Text style={styles.platColLabel}>Store Commissions (10%)</Text>
                  <Text style={styles.platColVal}>₹{(platformData?.todayCommission || 0).toLocaleString('en-IN')}</Text>
                  <Text style={styles.platColNote}>Retained from store gross sales</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Lifetime Breakdown */}
            <View style={styles.lifetimeBox}>
              <Text style={styles.lifetimeBoxTitle}>Lifetime Financial Rollup</Text>
              <View style={styles.lifetimeRow}>
                <Text style={styles.lifetimeLabel}>Total Gross Platform Inflows:</Text>
                <Text style={styles.lifetimeVal}>₹{(platformData?.lifetime.totalRevenue || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.lifetimeRow}>
                <Text style={styles.lifetimeLabel}>Cumulative Handling Fees Collected:</Text>
                <Text style={styles.lifetimeVal}>₹{(platformData?.lifetime.handlingFees || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.lifetimeRow}>
                <Text style={styles.lifetimeLabel}>Cumulative Store Commissions Retained:</Text>
                <Text style={styles.lifetimeVal}>₹{(platformData?.lifetime.commissions || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.lifetimeRow, { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8 }]}>
                <Text style={[styles.lifetimeLabel, { fontWeight: '700', color: COLORS.white }]}>
                  Calculated Net Platform Profit:
                </Text>
                <Text style={[styles.lifetimeVal, { fontWeight: '700', color: '#10B981', fontSize: 16 }]}>
                  ₹{(platformData?.lifetime.netProfit || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ===============================================================
            TAB 5: LIVE AUDIT LEDGER
        =============================================================== */}
        {activeSubTab === 'LEDGER' && (
          <View style={styles.tabSection}>
            {/* Filter Pills */}
            <View style={styles.pillRow}>
              {(['ALL', 'STORE', 'RIDER', 'PLATFORM'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.pillBtn, ledgerFilter === tab && styles.pillBtnActive]}
                  onPress={() => setLedgerFilter(tab)}
                >
                  <Text style={[styles.pillText, ledgerFilter === tab && styles.pillTextActive]}>
                    {tab === 'ALL' ? 'All Ledgers' : `${tab} Wallet`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={32} color={COLORS.secondaryText} />
                <Text style={styles.emptyTitle}>No Transactions Logged Yet</Text>
                <Text style={styles.emptySub}>
                  Every order delivery and settlement automatically writes an immutable audit record.
                </Text>
              </View>
            ) : (
              filteredTransactions.map(tx => {
                const isCredit = tx.type === 'CREDIT';
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={[styles.txIconBox, { backgroundColor: isCredit ? '#10B98120' : '#EF444420' }]}>
                      {isCredit ? (
                        <ArrowDownLeft size={16} color="#10B981" />
                      ) : (
                        <ArrowUpRight size={16} color="#EF4444" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.txTopRow}>
                        <Text style={styles.txDescription}>{tx.description}</Text>
                        <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
                          {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.txBottomRow}>
                        <View style={styles.txTag}>
                          <Text style={styles.txTagText}>{tx.walletType}</Text>
                        </View>
                        <Text style={styles.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.txBalanceInfo}>
                          Bal: ₹{tx.balanceBefore} → ₹{tx.balanceAfter}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ===============================================================
          STORE PAYOUT SETTLEMENT MODAL
      =============================================================== */}
      <Modal visible={!!selectedStore} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Settle Store Payout</Text>
                <Text style={styles.modalSubtitle}>{selectedStore?.storeName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStore(null)}>
                <X size={20} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Available Wallet Balance:</Text>
                <Text style={styles.modalInfoVal}>₹{selectedStore?.balance.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Bank Account:</Text>
                <Text style={styles.modalInfoVal}>
                  {selectedStore?.bankAccount.bankName} ({selectedStore?.bankAccount.accountNumber})
                </Text>
              </View>

              <Text style={styles.inputLabel}>Payout Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={payoutStoreAmount}
                onChangeText={setPayoutStoreAmount}
                placeholder="Enter amount to transfer"
                placeholderTextColor={COLORS.secondaryText}
              />

              <Text style={styles.inputLabel}>Reference / Transfer Notes</Text>
              <TextInput
                style={styles.modalInput}
                value={payoutStoreNotes}
                onChangeText={setPayoutStoreNotes}
                placeholder="NEFT Reference No. / Notes"
                placeholderTextColor={COLORS.secondaryText}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setSelectedStore(null)}
                  disabled={storePayoutLoading}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmModalBtn}
                  onPress={handleExecuteStorePayout}
                  disabled={storePayoutLoading}
                >
                  {storePayoutLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Send size={16} color={COLORS.white} />
                      <Text style={styles.confirmModalBtnText}>Confirm Settlement</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===============================================================
          RIDER INSTANT IMPS SETTLEMENT MODAL
      =============================================================== */}
      <Modal visible={!!selectedRider} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Instant IMPS Rider Transfer</Text>
                <Text style={styles.modalSubtitle}>{selectedRider?.name} ({selectedRider?.partnerCode})</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRider(null)}>
                <X size={20} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Today Unsettled Earnings:</Text>
                <Text style={[styles.modalInfoVal, { color: '#10B981' }]}>
                  ₹{selectedRider?.balance.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Linked IMPS Account:</Text>
                <Text style={styles.modalInfoVal}>
                  {selectedRider?.bankAccount.bankName} ({selectedRider?.bankAccount.accountNumber})
                </Text>
              </View>

              <Text style={styles.inputLabel}>Payout Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={payoutRiderAmount}
                onChangeText={setPayoutRiderAmount}
                placeholder="Enter amount to transfer"
                placeholderTextColor={COLORS.secondaryText}
              />

              <Text style={styles.inputLabel}>IMPS Transfer Reference</Text>
              <TextInput
                style={styles.modalInput}
                value={payoutRiderNotes}
                onChangeText={setPayoutRiderNotes}
                placeholder="IMPS Reference / Bank UTR"
                placeholderTextColor={COLORS.secondaryText}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setSelectedRider(null)}
                  disabled={riderPayoutLoading}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmModalBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleExecuteRiderPayout}
                  disabled={riderPayoutLoading}
                >
                  {riderPayoutLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <ArrowUpRight size={16} color={COLORS.white} />
                      <Text style={styles.confirmModalBtnText}>Process Instant IMPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginLeft: 8,
  },
  tabNavScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    gap: 6,
  },
  subTabBtnActive: {
    backgroundColor: COLORS.purple,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  subTabTextActive: {
    color: COLORS.white,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabSection: {
    gap: 16,
  },
  formulaCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  formulaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  formulaSplitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formulaBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formulaBoxIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  formulaBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formulaBoxAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  formulaBoxSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  formulaPill: {
    marginTop: 8,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  formulaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 6,
  },
  metricSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 10,
  },
  scheduleRow: {
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  scheduleItemVal: {
    fontSize: 12,
    color: COLORS.white,
  },
  filterRow: {
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.white,
  },
  walletCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  cycleBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cycleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  walletSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  balanceBadgeContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#60A5FA',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  statBox: {
    flex: 1,
    minWidth: 100,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  lastSettledText: {
    fontSize: 11,
    color: '#64748B',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settleBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  platSummaryCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  platSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  platSummarySub: {
    fontSize: 12,
    color: '#C7D2FE',
    marginTop: 2,
    marginBottom: 14,
  },
  platGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platCol: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  platColLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  platColVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  platColNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  lifetimeBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  lifetimeBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  lifetimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifetimeLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  lifetimeVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillBtnActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pillTextActive: {
    color: COLORS.white,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  txBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  txTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
  },
  txBalanceInfo: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 'auto',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
    gap: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalInfoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.white,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  confirmModalBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.purple,
  },
  confirmModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});
