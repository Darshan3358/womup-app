import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Phone,
  MapPin,
  Edit3,
  ShieldOff,
  ShieldCheck,
  Wallet,
  ShoppingBag,
  FileCheck,
  Printer,
  ChevronRight,
  FileText,
  Trash2,
  Eye,
  Users,
  Coins,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { Order, PrintOrder } from '../../types/admin';
import { KYCTab } from '../../components/KYCTab';
import { CustomerLevelDetailModal } from '../modals/CustomerLevelDetailModal';
import { NEST_API_BASE_URL } from '../../services/api';

export const CustomerProfileScreen: React.FC = () => {
  const {
    selectedCustomer,
    toggleBlockCustomer,
    deleteCustomer,
    setActiveModal,
    navigateSubView,
    goBackSubView,
    orders,
    printOrders,
    setSelectedOrder,
    setSelectedPrintOrder,
    openLabelPrint,
    updateCustomer,
  } = useAdminState();

  const [activeTab, setActiveTab] = useState<'Profile' | 'Orders' | 'Wallet' | 'KYC' | 'Token & Income History'>('Orders');
  const [ordersSubTab, setOrdersSubTab] = useState<'All' | 'Store Orders'>('All');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'Token & Income History' && selectedCustomer) {
      const fetchCoinHistory = async () => {
        try {
          setLoadingHistory(true);
          const custId = selectedCustomer.id || (selectedCustomer as any)._id;
          const res = await fetch(`${NEST_API_BASE_URL}/coins/user/${custId}/history`);
          if (res.ok) {
            const data = await res.json();
            setTokenHistory(data.transactions || []);
          }
        } catch (e) {
          console.warn('Failed fetching coin history for profile:', e);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchCoinHistory();
    }
  }, [activeTab, selectedCustomer]);

  if (!selectedCustomer) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No customer selected</Text>
      </View>
    );
  }

  const isBlocked = selectedCustomer.status === 'Blocked';

  const customerStoreOrders = orders.filter(
    (o: Order) =>
      o.customerId === selectedCustomer.id ||
      (o.customerName && o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()) ||
      o.customerPhone === selectedCustomer.phone
  );

  const customerPrintOrders = printOrders.filter(
    (p: PrintOrder) =>
      p.userId === selectedCustomer.id ||
      (p.customerName && p.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()) ||
      p.customerPhone === selectedCustomer.phone
  );

  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    navigateSubView('OrderInspector');
  };

  const handleOpenPrintOrderDetail = (printOrder: PrintOrder) => {
    setSelectedPrintOrder(printOrder);
    setActiveModal('PrintOrderDetails');
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!selectedCustomer) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(selectedCustomer.id, selectedCustomer.phone);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Customer ${selectedCustomer.name} has been deleted successfully.`);
      } else {
        Alert.alert('Deleted', `Customer ${selectedCustomer.name} has been deleted successfully.`);
      }
      goBackSubView();
    } catch (_) {
      goBackSubView();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer || isDeleting) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (
        window.confirm(
          `Are you sure you want to permanently delete customer "${selectedCustomer.name}" (${selectedCustomer.phone})?\n\nThis will remove their profile, addresses, and cart data from the database. This action cannot be undone.`
        )
      ) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Customer',
        `Are you sure you want to permanently delete "${selectedCustomer.name}" (${selectedCustomer.phone})?\n\nThis will remove their profile, addresses, and cart data from the database. This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.profileHeaderCard}>
        {selectedCustomer.avatar ? (
          <Image source={{ uri: selectedCustomer.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <User size={24} color={COLORS.purple} />
          </View>
        )}

        <View style={styles.profileMain}>
          <Text style={styles.customerName}>{selectedCustomer.name}</Text>
          <View style={styles.phoneRow}>
            <Phone size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.phoneText}>{selectedCustomer.phone}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8, flexWrap: 'wrap' }}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isBlocked ? '#FCECEE' : '#E8F8F0' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBlocked ? COLORS.error : COLORS.success },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isBlocked ? COLORS.error : COLORS.success },
                ]}
              >
                {selectedCustomer.status}
              </Text>
            </View>

            {selectedCustomer.referralCode ? (
              <View style={styles.refPill}>
                <Text style={styles.refPillLabel}>REF: </Text>
                <Text style={styles.refPillCode}>{selectedCustomer.referralCode}</Text>
              </View>
            ) : null}

            {Boolean(selectedCustomer.customerOtp || selectedCustomer.otp) && (
              <View style={[styles.refPill, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Text style={[styles.refPillLabel, { color: '#4F46E5' }]}>OTP: </Text>
                <Text style={[styles.refPillCode, { color: '#4338CA', fontWeight: '800', letterSpacing: 1 }]}>
                  {selectedCustomer.customerOtp || selectedCustomer.otp}
                </Text>
              </View>
            )}

            {Boolean(selectedCustomer.customerOtp || selectedCustomer.otp) && (
              <View style={[styles.refPill, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Text style={[styles.refPillLabel, { color: '#4F46E5' }]}>OTP: </Text>
                <Text style={[styles.refPillCode, { color: '#4338CA', fontWeight: '800', letterSpacing: 1 }]}>
                  {selectedCustomer.customerOtp || selectedCustomer.otp}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabRow}>
        {(['Profile', 'Orders', 'Wallet', 'KYC', 'Token & Income History'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isSelected && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Contents */}
      {activeTab === 'Profile' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details & Saved Addresses</Text>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>Customer ID</Text>
            <Text style={styles.value}>{selectedCustomer.id}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>Customer Type</Text>
            <Text style={styles.value}>{selectedCustomer.type}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{selectedCustomer.email}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>Registration OTP (Used on Signup)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {selectedCustomer.customerOtp || selectedCustomer.otp ? (
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#C7D2FE' }}>
                  <Text style={{ fontWeight: '800', color: '#4338CA', fontSize: 16, letterSpacing: 2 }}>
                    {selectedCustomer.customerOtp || selectedCustomer.otp}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.value, { color: COLORS.textMuted }]}>None / Not Available</Text>
              )}
            </View>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>Registration OTP (Used on Signup)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {selectedCustomer.customerOtp || selectedCustomer.otp ? (
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#C7D2FE' }}>
                  <Text style={{ fontWeight: '800', color: '#4338CA', fontSize: 16, letterSpacing: 2 }}>
                    {selectedCustomer.customerOtp || selectedCustomer.otp}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.value, { color: COLORS.textMuted }]}>None / Not Available</Text>
              )}
            </View>
          </View>

          <Text style={[styles.cardTitle, { marginTop: SPACING.md }]}>Saved Delivery Addresses</Text>
          {selectedCustomer.addresses.map((addr: any) => (
            <View key={addr.id} style={styles.addressBox}>
              <View style={styles.addressHeader}>
                <MapPin size={14} color={COLORS.purple} style={{ marginRight: 6 }} />
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.zoneTag}>({addr.zone})</Text>
              </View>
              <Text style={styles.addressText}>{addr.address}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'Orders' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Customer Orders</Text>
            <Text style={styles.totalBadge}>
              {customerStoreOrders.length} Total
            </Text>
          </View>

          {/* Sub Filters: All, Store Orders */}
          <View style={styles.orderFilterPills}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                ordersSubTab === 'All' && styles.filterPillActive,
                { position: 'relative', paddingRight: customerStoreOrders.length > 0 ? 22 : 12 },
              ]}
              onPress={() => setOrdersSubTab('All')}
            >
              <Text style={[styles.filterPillText, ordersSubTab === 'All' && styles.filterPillTextActive]}>
                All
              </Text>
              {customerStoreOrders.length > 0 && (
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>{customerStoreOrders.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                ordersSubTab === 'Store Orders' && styles.filterPillActive,
                { position: 'relative', paddingRight: customerStoreOrders.length > 0 ? 22 : 12 },
              ]}
              onPress={() => setOrdersSubTab('Store Orders')}
            >
              <ShoppingBag size={12} color={ordersSubTab === 'Store Orders' ? COLORS.white : COLORS.purple} style={{ marginRight: 4 }} />
              <Text style={[styles.filterPillText, ordersSubTab === 'Store Orders' && styles.filterPillTextActive]}>
                Store
              </Text>
              {customerStoreOrders.length > 0 && (
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>{customerStoreOrders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {customerStoreOrders.length === 0 ? (
            <Text style={[styles.emptyText, { paddingVertical: SPACING.md, textAlign: 'center' }]}>
              No orders placed by this customer yet.
            </Text>
          ) : (
            <View>
              {/* STORE ORDERS */}
              {customerStoreOrders.map((order: Order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderItemCard}
                    activeOpacity={0.7}
                    onPress={() => handleOpenOrderDetail(order)}
                  >
                    <View style={styles.orderIconBox}>
                      <ShoppingBag size={18} color={COLORS.purple} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.orderHeaderRow}>
                        <Text style={styles.orderIdText}>{order.id}</Text>
                        <Text style={styles.orderTimeText}>{order.timestamp}</Text>
                      </View>
                      <Text style={styles.orderSubText} numberOfLines={1}>
                        {order.items.map((i: any) => i.name).join(', ')}
                      </Text>
                      <View style={styles.statusPillSmall}>
                        <Text style={styles.statusPillSmallText}>{order.status}</Text>
                      </View>
                    </View>

                    <View style={styles.orderRightCol}>
                      <Text style={styles.orderPrice}>₹{order.total}</Text>
                      <TouchableOpacity
                        style={styles.labelBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          openLabelPrint({
                            orderId: order.id,
                            type: 'GROCERY',
                            customerName: selectedCustomer.name,
                            customerPhone: selectedCustomer.phone,
                            address: order.address || selectedCustomer.address,
                            items: order.items,
                            total: order.total,
                            paymentMethod: 'Online UPI',
                          });
                        }}
                      >
                        <Printer size={12} color={COLORS.purple} style={{ marginRight: 3 }} />
                        <Text style={styles.labelBtnText}>Label</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'Wallet' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Wallet & Coins</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Wallet Cash</Text>
              <Text style={styles.metricValue}>₹{selectedCustomer.walletBalance}</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#FCE1F5' }]}>
              <Text style={styles.metricLabel}>Shopping Coins</Text>
              <Text style={[styles.metricValue, { color: COLORS.hotPink }]}>
                {selectedCustomer.shoppingCoinBalance} SC
              </Text>
            </View>
          </View>

          {/* MLM Level & Direct Referral Income Structure */}
          <Text style={[styles.cardTitle, { marginTop: SPACING.md }]}>Level & Direct Income</Text>
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, { backgroundColor: '#EDE9FE' }]}>
              <Text style={styles.metricLabel}>Tree Level</Text>
              <Text style={[styles.metricValue, { color: '#6D28D9' }]}>
                Level {selectedCustomer.level ?? 1}
              </Text>
              <TouchableOpacity
                style={styles.viewLevelBtnInBox}
                onPress={() => setShowLevelModal(true)}
                activeOpacity={0.7}
              >
                <Eye size={11} color="#6D28D9" style={{ marginRight: 4 }} />
                <Text style={styles.viewLevelBtnInBoxText}>View Level Detail</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.metricLabel}>Direct Referrals</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {selectedCustomer.referredUsersCount ?? 0} ({selectedCustomer.verifiedReferralsCount ?? 0} Verified)
              </Text>
            </View>
          </View>

          {/* Full 7-Level Detail Action Banner */}
          <TouchableOpacity
            style={styles.viewLevelDetailBannerBtn}
            onPress={() => setShowLevelModal(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Users size={15} color="#FFFFFF" />
              <Text style={styles.viewLevelDetailBannerBtnText}>View Level Detail (7-Level Breakdown)</Text>
            </View>
            <ChevronRight size={15} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Referral Code & Sponsor ID Row */}
          <View style={[styles.metricsRow, { marginTop: 8 }]}>
            <View style={[styles.metricBox, { backgroundColor: '#FDF4FF', borderWidth: 1, borderColor: '#F0ABFC' }]}>
              <Text style={[styles.metricLabel, { color: '#A21CAF', fontWeight: '700' }]}>User Referral Code</Text>
              <Text style={[styles.metricValue, { color: '#86198F', fontSize: 15, fontWeight: '900' }]}>
                {selectedCustomer.referralCode || 'WOMUP5871'}
              </Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
              <Text style={[styles.metricLabel, { color: '#1D4ED8', fontWeight: '700' }]}>Sponsor ID (Upline)</Text>
              <Text style={[styles.metricValue, { color: '#1E40AF', fontSize: 15, fontWeight: '900' }]}>
                {selectedCustomer.sponsorCode || 'WOMUP001'}
              </Text>
            </View>
          </View>

          <View style={[styles.metricsRow, { marginTop: 8 }]}>
            <View style={[styles.metricBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.metricLabel}>Direct App Income</Text>
              <Text style={[styles.metricValue, { color: '#B45309' }]}>
                ₹{selectedCustomer.appDownloadIncome ?? 0}
              </Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#F3F4F6' }]}>
              <Text style={styles.metricLabel}>Pending Income</Text>
              <Text style={[styles.metricValue, { color: '#4B5563' }]}>
                ₹{selectedCustomer.pendingIncome ?? 0}
              </Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'KYC' && (
        <KYCTab
          customer={selectedCustomer}
          onStatusChange={(newStatus) =>
            updateCustomer(selectedCustomer.id, { kycStatus: newStatus })
          }
        />
      )}

      {/* Item 8: Token (Shopping Coins) & MLM Income Use History */}
      {activeTab === 'Token & Income History' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Shopping Coins & Income History</Text>
            <View style={styles.tokenBalanceBadge}>
              <Text style={styles.tokenBalanceText}>
                Balance: {selectedCustomer.shoppingCoinBalance ?? 0} SC
              </Text>
            </View>
          </View>

          {/* Quick Balance Summary Box */}
          <View style={styles.tokenSummaryGrid}>
            <View style={[styles.tokenSummaryCard, { backgroundColor: '#FDF2F8' }]}>
              <Text style={styles.tokenSummaryLabel}>Shopping Coins</Text>
              <Text style={[styles.tokenSummaryVal, { color: '#BE185D' }]}>
                {selectedCustomer.shoppingCoinBalance ?? 0} SC
              </Text>
              <Text style={styles.tokenSummarySub}>1 SC = ₹1.00</Text>
            </View>

            <View style={[styles.tokenSummaryCard, { backgroundColor: '#EDE9FE' }]}>
              <Text style={styles.tokenSummaryLabel}>Wallet Cash</Text>
              <Text style={[styles.tokenSummaryVal, { color: '#6D28D9' }]}>
                ₹{selectedCustomer.walletBalance ?? 0}
              </Text>
              <Text style={styles.tokenSummarySub}>Withdrawable</Text>
            </View>

            <View style={[styles.tokenSummaryCard, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.tokenSummaryLabel}>App Download Income</Text>
              <Text style={[styles.tokenSummaryVal, { color: '#059669' }]}>
                ₹{selectedCustomer.appDownloadIncome ?? 0}
              </Text>
              <Text style={styles.tokenSummarySub}>Referral bonus</Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { marginTop: SPACING.md, fontSize: 13 }]}>
            Shopping Coins Activity Ledger
          </Text>

          {loadingHistory ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#BE185D" />
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                Loading coin transactions...
              </Text>
            </View>
          ) : tokenHistory.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Coins size={28} color="#CBD5E1" />
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
                No shopping coin transactions found for this customer yet.
              </Text>
            </View>
          ) : (
            <View style={styles.tokenTxList}>
              {tokenHistory.map((tx) => {
                const isEarn = tx.type === 'EARN';
                return (
                  <View key={tx._id || tx.id} style={styles.tokenTxRow}>
                    <View style={styles.tokenTxLeft}>
                      <View style={[styles.tokenTxIconBox, isEarn ? styles.tokenTxIconEarn : styles.tokenTxIconSpend]}>
                        <Coins size={14} color={isEarn ? '#16A34A' : '#DC2626'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tokenTxDesc} numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text style={styles.tokenTxDate}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tokenTxRight}>
                      <Text style={[styles.tokenTxCoins, isEarn ? styles.tokenTxEarn : styles.tokenTxSpend]}>
                        {isEarn ? '+' : '-'}{tx.coins} SC
                      </Text>
                      <Text style={styles.tokenTxBalanceAfter}>
                        Bal: {tx.balanceAfter} SC
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Customer Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Lifetime Spend</Text>
          <Text style={styles.metricValue}>₹{selectedCustomer.spend.toLocaleString()}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Orders</Text>
          <Text style={styles.metricValue}>
            {customerStoreOrders.length + customerPrintOrders.length}
          </Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setActiveModal('EditCustomer')}
        >
          <Edit3 size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Edit Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.blockBtn, isBlocked && styles.unblockBtn]}
          onPress={() => toggleBlockCustomer(selectedCustomer.id)}
        >
          {isBlocked ? (
            <ShieldCheck size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          ) : (
            <ShieldOff size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.btnText}>{isBlocked ? 'Unblock' : 'Block User'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteCustomerBtn}
        onPress={handleDeleteCustomer}
        disabled={isDeleting}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color="#DC2626" style={{ marginRight: 6 }} />
        <Text style={styles.deleteCustomerBtnText}>
          {isDeleting ? 'Deleting Customer...' : 'Delete Customer Permanently'}
        </Text>
      </TouchableOpacity>

      {/* Customer 7-Level Downline Performance Modal */}
      <CustomerLevelDetailModal
        isOpen={showLevelModal}
        customerId={selectedCustomer.id}
        customerName={selectedCustomer.name}
        customerCode={selectedCustomer.referralCode}
        onClose={() => setShowLevelModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  profileMain: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeTab: {
    backgroundColor: COLORS.purple,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  orderFilterPills: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: SPACING.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
  },
  pillBadge: {
    position: 'absolute',
    top: -4,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 3,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  filterPillActive: {
    backgroundColor: COLORS.purple,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  printOrderCard: {
    backgroundColor: '#FFF8FD',
    borderColor: '#FCE1F5',
  },
  orderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginRight: 6,
  },
  orderSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginVertical: 2,
  },
  statusPillSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  statusPillSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  printMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  printSpecLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  orderRightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.purple,
    backgroundColor: COLORS.white,
  },
  labelBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  infoGroup: {
    marginVertical: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  value: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.sm,
    borderRadius: RADIUS.input,
    marginTop: SPACING.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 4,
  },
  zoneTag: {
    fontSize: 11,
    color: COLORS.purple,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
    marginHorizontal: 3,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  viewLevelBtnInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDD6FE',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  viewLevelBtnInBoxText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  viewLevelDetailBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6D28D9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewLevelDetailBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginRight: 6,
  },
  blockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginLeft: 6,
  },
  unblockBtn: {
    backgroundColor: COLORS.success,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  refPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 98, 175, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.35)',
  },
  refPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  refPillCode: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  deleteCustomerBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  deleteCustomerBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  tokenBalanceBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenBalanceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE185D',
  },
  tokenSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  tokenSummaryCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
  },
  tokenSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  tokenSummaryVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  tokenSummarySub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  tokenTxList: {
    marginTop: 8,
  },
  tokenTxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  tokenTxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  tokenTxIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenTxIconEarn: {
    backgroundColor: '#DCFCE7',
  },
  tokenTxIconSpend: {
    backgroundColor: '#FEE2E2',
  },
  tokenTxDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  tokenTxDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  tokenTxRight: {
    alignItems: 'flex-end',
  },
  tokenTxCoins: {
    fontSize: 13,
    fontWeight: '800',
  },
  tokenTxEarn: {
    color: '#15803D',
  },
  tokenTxSpend: {
    color: '#DC2626',
  },
  tokenTxBalanceAfter: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
});
