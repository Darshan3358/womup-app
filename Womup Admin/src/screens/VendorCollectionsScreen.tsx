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
  Store,
  Coins,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building,
  RefreshCw,
  X,
  Check,
  QrCode,
  DollarSign,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { DateRangeFilter, DateFilterRange } from '../components/common/DateRangeFilter';
import { ApiService, NEST_API_BASE_URL } from '../services/api';
import { VendorAdminItem } from '../types/admin';

interface VendorSettlementModalState {
  vendor: VendorAdminItem;
  amount: string;
  paymentMode: 'UPI' | 'IMPS' | 'NEFT' | 'CASH';
  referenceId: string;
  notes: string;
}

export const VendorCollectionsScreen: React.FC = () => {
  const [vendors, setVendors] = useState<VendorAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateFilterRange>({ preset: 'All Time' });

  // Settlement Modal State
  const [settlementState, setSettlementState] = useState<VendorSettlementModalState | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ApiService.getVendors({ query: searchQuery });
      if (res.success && res.data) {
        setVendors(res.data);
      }
    } catch (e) {
      console.warn('Failed fetching vendors for collections:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Aggregate KPI metrics
  const totalCollectionsGmv = vendors.reduce(
    (sum, v) => sum + ((v as any).totalOrdersValue || v.monthlyRevenue || 0),
    0
  );
  const totalCommissionEarned = vendors.reduce((sum, v) => {
    const rate = v.platformCommissionPercent || 2;
    const gmv = (v as any).totalOrdersValue || v.monthlyRevenue || 0;
    return sum + (gmv * rate) / 100;
  }, 0);
  const totalPayableToVendors = totalCollectionsGmv - totalCommissionEarned;
  const pendingSettlementCount = vendors.filter(
    (v) => ((v as any).totalOrdersValue || v.monthlyRevenue || 0) > 0
  ).length;

  const handleOpenSettle = (v: VendorAdminItem) => {
    const gmv = (v as any).totalOrdersValue || v.monthlyRevenue || 0;
    const commRate = v.platformCommissionPercent || 2;
    const commAmount = (gmv * commRate) / 100;
    const net = Math.max(0, gmv - commAmount);
    const shopName = (v as any).shopName || v.storeName || 'Merchant Store';

    setSettlementState({
      vendor: v,
      amount: String(Math.round(net)),
      paymentMode: 'UPI',
      referenceId: `SETTLE-${Date.now().toString().slice(-6)}`,
      notes: `Settlement payout for ${shopName}`,
    });
  };

  const handleConfirmSettlement = async () => {
    if (!settlementState) return;
    try {
      setIsSettling(true);
      const vId = settlementState.vendor._id || settlementState.vendor.id;
      const shopName =
        (settlementState.vendor as any).shopName ||
        settlementState.vendor.storeName ||
        'Merchant Store';

      // Record settlement via API
      await fetch(`${NEST_API_BASE_URL}/admin/vendors/${vId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(settlementState.amount),
          paymentMode: settlementState.paymentMode,
          referenceId: settlementState.referenceId,
          notes: settlementState.notes,
        }),
      });

      setSettlementState(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Settlement Recorded! ₹${settlementState.amount} paid to ${shopName}.`);
      } else {
        Alert.alert('Settlement Recorded!', `₹${settlementState.amount} paid to ${shopName}.`);
      }
      fetchVendors();
    } catch (e: any) {
      Alert.alert('Settlement Error', e.message || 'Operation failed');
    } finally {
      setIsSettling(false);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const shopName = ((v as any).shopName || v.storeName || '').toLowerCase();
    return (
      shopName.includes(q) ||
      v.ownerName.toLowerCase().includes(q) ||
      v.ownerPhone.includes(q) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.pincode && v.pincode.includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Coins size={20} color="#059669" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Vendor QR Collections & Payouts</Text>
            <Text style={styles.headerSubtitle}>
              Offline store GMV, platform commission ledger & merchant settlement
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchVendors} activeOpacity={0.7}>
          <RefreshCw size={14} color={COLORS.navy} />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: '#059669' }]}>
            <Text style={styles.kpiLabel}>Total QR Collections</Text>
            <Text style={[styles.kpiValue, { color: '#047857' }]}>
              ₹{totalCollectionsGmv.toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Merchant store GMV</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#7C3AED' }]}>
            <Text style={styles.kpiLabel}>Platform Commission</Text>
            <Text style={[styles.kpiValue, { color: '#6D28D9' }]}>
              ₹{Math.round(totalCommissionEarned).toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Avg 2% revenue share</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.kpiLabel}>Net Merchant Payable</Text>
            <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
              ₹{Math.round(totalPayableToVendors).toLocaleString()}
            </Text>
            <Text style={styles.kpiSub}>Payable to local shops</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#D97706' }]}>
            <Text style={styles.kpiLabel}>Active Merchants</Text>
            <Text style={[styles.kpiValue, { color: '#B45309' }]}>
              {vendors.length} Stores
            </Text>
            <Text style={styles.kpiSub}>{pendingSettlementCount} with collections</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Search size={15} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendor by shop name, owner, phone, or pincode..."
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

        {/* Vendor Collection Cards */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Merchant Collection Accounts</Text>
            <Text style={styles.tableCount}>{filteredVendors.length} Merchants</Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Fetching vendor collection balances...</Text>
            </View>
          ) : filteredVendors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Store size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Merchants Found</Text>
              <Text style={styles.emptyText}>No vendors matched your search criteria.</Text>
            </View>
          ) : (
            filteredVendors.map((v) => {
              const gmv = (v as any).totalOrdersValue || v.monthlyRevenue || 0;
              const commPercent = v.platformCommissionPercent || 2;
              const commAmount = (gmv * commPercent) / 100;
              const netPayable = Math.max(0, gmv - commAmount);
              const vId = v._id || v.id;
              const shopName = (v as any).shopName || v.storeName || 'Merchant Store';

              return (
                <View key={vId} style={styles.vendorRow}>
                  <View style={styles.vendorLeft}>
                    <View style={styles.shopIconBox}>
                      <Store size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.shopName}>{shopName}</Text>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>{v.categoryName || 'General'}</Text>
                        </View>
                      </View>
                      <Text style={styles.ownerText}>
                        Owner: {v.ownerName} • {v.ownerPhone}
                      </Text>
                      <Text style={styles.locationText}>
                        📍 {v.city || 'Ahmedabad'}, PIN: {v.pincode || '380015'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vendorRight}>
                    <View style={styles.numbersGrid}>
                      <View style={styles.numCol}>
                        <Text style={styles.numLabel}>GMV Collection</Text>
                        <Text style={styles.numValue}>₹{gmv.toLocaleString()}</Text>
                      </View>

                      <View style={styles.numCol}>
                        <Text style={styles.numLabel}>Platform ({commPercent}%)</Text>
                        <Text style={[styles.numValue, { color: '#6D28D9' }]}>
                          -₹{Math.round(commAmount).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.numCol}>
                        <Text style={styles.numLabel}>Net Payable</Text>
                        <Text style={[styles.numValue, { color: '#047857', fontWeight: '900' }]}>
                          ₹{Math.round(netPayable).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => handleOpenSettle(v)}
                      activeOpacity={0.8}
                    >
                      <CheckCircle2 size={13} color="#FFFFFF" />
                      <Text style={styles.settleBtnText}>Settle Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Settlement Payout Modal */}
      <Modal
        visible={!!settlementState}
        transparent
        animationType="fade"
        onRequestClose={() => setSettlementState(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Coins size={18} color="#059669" />
                <Text style={styles.modalTitle}>
                  Settle Merchant: {(settlementState?.vendor as any)?.shopName || settlementState?.vendor.storeName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSettlementState(null)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.settleMerchantSub}>
                Owner: <Text style={{ fontWeight: '800' }}>{settlementState?.vendor.ownerName}</Text> ({settlementState?.vendor.ownerPhone})
              </Text>
              <Text style={styles.settleMerchantSub}>
                Bank: {settlementState?.vendor.bankAccount?.accountNumber ? `A/C ****${settlementState?.vendor.bankAccount.accountNumber.slice(-4)}` : 'UPI Default'} ({settlementState?.vendor.bankAccount?.ifscCode || settlementState?.vendor.upiId || 'UPI'})
              </Text>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Payout Settlement Amount (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={settlementState?.amount || ''}
                onChangeText={(val) =>
                  setSettlementState((prev) => (prev ? { ...prev, amount: val } : null))
                }
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Payment Channel</Text>
              <View style={styles.paymentMethodsRow}>
                {(['UPI', 'IMPS', 'NEFT', 'CASH'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, settlementState?.paymentMode === m && styles.methodBtnActive]}
                    onPress={() =>
                      setSettlementState((prev) => (prev ? { ...prev, paymentMode: m } : null))
                    }
                  >
                    <Text
                      style={[
                        styles.methodBtnText,
                        settlementState?.paymentMode === m && styles.methodBtnTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Bank / UPI Reference ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. UTR #48192841982"
                placeholderTextColor="#9CA3AF"
                value={settlementState?.referenceId || ''}
                onChangeText={(val) =>
                  setSettlementState((prev) => (prev ? { ...prev, referenceId: val } : null))
                }
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Payout Memo / Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Weekly merchant QR collection settlement"
                placeholderTextColor="#9CA3AF"
                value={settlementState?.notes || ''}
                onChangeText={(val) =>
                  setSettlementState((prev) => (prev ? { ...prev, notes: val } : null))
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSettlementState(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSettleBtn}
                onPress={handleConfirmSettlement}
                disabled={isSettling}
              >
                {isSettling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.confirmSettleBtnText}>Record Payment & Settle</Text>
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
    backgroundColor: '#DCFCE7',
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
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
  tableCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
  vendorRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  vendorLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  shopIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  categoryPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  ownerText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  vendorRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  numbersGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  numCol: {
    minWidth: 80,
  },
  numLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  numValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 1,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  settleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  settleMerchantSub: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
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
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#059669',
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  methodBtnTextActive: {
    color: '#059669',
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
  confirmSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#059669',
  },
  confirmSettleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
