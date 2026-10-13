import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Inbox,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';
import { VendorApi, VendorWalletData } from '../services/api';

export const WalletScreen: React.FC = () => {
  const { vendor, refreshData } = useVendor();
  const [walletData, setWalletData] = useState<VendorWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await VendorApi.getWallet(vendor?.vendorCode || 'VND001');
      if (data) setWalletData(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [vendor?.vendorCode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), refreshData()]);
  };

  const handleWithdraw = () => {
    const available = walletData?.availableBalance ?? (vendor?.walletBalance || 0);
    if (available <= 0) {
      Alert.alert('No Balance', 'Your available wallet balance is ₹0. Receive customer collections to withdraw.');
      return;
    }

    Alert.alert(
      'Withdraw to Bank',
      `Transfer available balance of ₹${available.toLocaleString()} to ${walletData?.bankAccount.bankName || 'HDFC Bank'} (${walletData?.bankAccount.accountMasked || '••••9182'})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Transfer',
          onPress: async () => {
            const res = await VendorApi.withdrawToBank(available, vendor?.vendorCode || 'VND001');
            if (res.success) {
              Alert.alert('Payout Successful ✅', res.message || 'Withdrawal initiated successfully!');
              await onRefresh();
            } else {
              Alert.alert('Withdrawal Failed', res.message || 'Could not process withdrawal.');
            }
          },
        },
      ]
    );
  };

  const availableBal = walletData?.availableBalance ?? (vendor?.walletBalance || 0);
  const onHoldBal = walletData?.pendingBalance ?? (vendor?.pendingBalance || 0);
  const settlements = walletData?.recentSettlements || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.rose]} />
      }
    >
      {/* Balance Card */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.balanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderLabel}>MERCHANT WALLET</Text>
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={12} color="#10B981" />
            <Text style={styles.verifiedText}>Auto-Settling</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>
          ₹{availableBal.toLocaleString()}
        </Text>
        <Text style={styles.balanceSub}>Available for instant bank withdrawal</Text>

        <View style={styles.holdRow}>
          <Clock size={14} color="#F59E0B" />
          <Text style={styles.holdText}>
            On Hold: ₹{onHoldBal.toLocaleString()} ({walletData?.pendingCount || 0} pending counter collections)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.withdrawBtn, availableBal <= 0 && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={handleWithdraw}
        >
          <ArrowUpRight size={18} color="#0F172A" />
          <Text style={styles.withdrawBtnText}>Withdraw to Bank Account</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Linked Bank Card */}
      <View style={styles.bankCard}>
        <View style={styles.bankHeader}>
          <Building size={20} color={COLORS.navy} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.bankTitle}>{walletData?.bankAccount.bankName || 'HDFC Bank Ltd'}</Text>
            <Text style={styles.bankMeta}>
              Account: {walletData?.bankAccount.accountMasked || '•••• •••• 9182'} • IFSC: {walletData?.bankAccount.ifsc || 'HDFC0000123'}
            </Text>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Primary</Text>
          </View>
        </View>
      </View>

      {/* Recent Settlements */}
      <View style={styles.settlementsSection}>
        <Text style={styles.sectionTitle}>Recent Bank Settlements</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.rose} style={{ marginVertical: 20 }} />
        ) : settlements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Inbox size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Past Settlements</Text>
            <Text style={styles.emptySub}>
              When you withdraw your wallet balance, bank IMPS transfer records will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.settlementList}>
            {settlements.map((s) => (
              <View key={s.id} style={styles.settlementItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.checkCircle}>
                    <CheckCircle2 size={16} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.settleDate}>{s.date}</Text>
                    <Text style={styles.settleUtr}>UTR: {s.utrNumber}</Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <Text style={styles.settleAmount}>₹{s.amount.toLocaleString()}</Text>
                  <Text style={styles.settleStatus}>{s.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  balanceSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  holdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  holdText: {
    fontSize: 11,
    color: '#FCD34D',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  withdrawBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  settlementsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  settlementList: {
    gap: 8,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  settleUtr: {
    fontSize: 11,
    color: '#64748B',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  settleAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  settleStatus: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
});
