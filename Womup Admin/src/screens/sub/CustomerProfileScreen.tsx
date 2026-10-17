import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
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
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { Order, PrintOrder } from '../../types/admin';
import { KYCTab } from '../../components/KYCTab';

export const CustomerProfileScreen: React.FC = () => {
  const {
    selectedCustomer,
    toggleBlockCustomer,
    setActiveModal,
    navigateSubView,
    orders,
    printOrders,
    setSelectedOrder,
    setSelectedPrintOrder,
    openLabelPrint,
    updateCustomer,
  } = useAdminState();

  const [activeTab, setActiveTab] = useState<'Profile' | 'Orders' | 'Wallet' | 'KYC'>('Orders');
  const [ordersSubTab, setOrdersSubTab] = useState<'All' | 'Store Orders' | 'Paper Print'>('All');

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.profileHeaderCard}>
        <Image source={{ uri: selectedCustomer.avatar }} style={styles.avatar} />

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
          </View>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabRow}>
        {(['Profile', 'Orders', 'Wallet', 'KYC'] as const).map((tab) => {
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
              {customerStoreOrders.length + customerPrintOrders.length} Total
            </Text>
          </View>

          {/* Sub Filters: All, Store Orders, Paper Print */}
          <View style={styles.orderFilterPills}>
            <TouchableOpacity
              style={[styles.filterPill, ordersSubTab === 'All' && styles.filterPillActive]}
              onPress={() => setOrdersSubTab('All')}
            >
              <Text style={[styles.filterPillText, ordersSubTab === 'All' && styles.filterPillTextActive]}>
                All ({customerStoreOrders.length + customerPrintOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, ordersSubTab === 'Store Orders' && styles.filterPillActive]}
              onPress={() => setOrdersSubTab('Store Orders')}
            >
              <ShoppingBag size={12} color={ordersSubTab === 'Store Orders' ? COLORS.white : COLORS.purple} style={{ marginRight: 4 }} />
              <Text style={[styles.filterPillText, ordersSubTab === 'Store Orders' && styles.filterPillTextActive]}>
                Store ({customerStoreOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, ordersSubTab === 'Paper Print' && styles.filterPillActive]}
              onPress={() => setOrdersSubTab('Paper Print')}
            >
              <Printer size={12} color={ordersSubTab === 'Paper Print' ? COLORS.white : COLORS.hotPink} style={{ marginRight: 4 }} />
              <Text style={[styles.filterPillText, ordersSubTab === 'Paper Print' && styles.filterPillTextActive]}>
                Paper Print ({customerPrintOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          {customerStoreOrders.length === 0 && customerPrintOrders.length === 0 ? (
            <Text style={[styles.emptyText, { paddingVertical: SPACING.md, textAlign: 'center' }]}>
              No orders placed by this customer yet.
            </Text>
          ) : (
            <View>
              {/* STORE ORDERS */}
              {(ordersSubTab === 'All' || ordersSubTab === 'Store Orders') &&
                customerStoreOrders.map((order: Order) => (
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

              {/* PAPER PRINT ORDERS */}
              {(ordersSubTab === 'All' || ordersSubTab === 'Paper Print') &&
                customerPrintOrders.map((printOrder: PrintOrder) => (
                  <TouchableOpacity
                    key={printOrder.id}
                    style={[styles.orderItemCard, styles.printOrderCard]}
                    activeOpacity={0.7}
                    onPress={() => handleOpenPrintOrderDetail(printOrder)}
                  >
                    <View style={[styles.orderIconBox, { backgroundColor: '#FCE1F5' }]}>
                      <Printer size={18} color={COLORS.hotPink} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.orderHeaderRow}>
                        <Text style={[styles.orderIdText, { color: COLORS.hotPink }]}>
                          {printOrder.printOrderNumber}
                        </Text>
                        <Text style={styles.orderTimeText}>{printOrder.timestamp}</Text>
                      </View>
                      <Text style={styles.orderSubText} numberOfLines={1}>
                        📄 {printOrder.originalFileName || 'Document.pdf'} ({printOrder.pageCount} pgs, {printOrder.numberOfCopies} copy)
                      </Text>
                      <View style={styles.printMetaRow}>
                        <View style={[styles.statusPillSmall, { backgroundColor: '#FCE1F5' }]}>
                          <Text style={[styles.statusPillSmallText, { color: COLORS.hotPink }]}>
                            {printOrder.status}
                          </Text>
                        </View>
                        <Text style={styles.printSpecLabel}>
                          {printOrder.isColor ? 'Color' : 'B&W'} • {printOrder.paperQuality}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderRightCol}>
                      <Text style={styles.orderPrice}>₹{printOrder.totalAmount}</Text>
                      <TouchableOpacity
                        style={[styles.labelBtn, { borderColor: COLORS.hotPink }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          openLabelPrint({
                            orderId: printOrder.printOrderNumber,
                            type: 'PRINT',
                            customerName: selectedCustomer.name,
                            customerPhone: selectedCustomer.phone,
                            address: printOrder.deliveryAddress || selectedCustomer.address,
                            items: [
                              {
                                name: `${printOrder.originalFileName || 'Document'} (${printOrder.pageCount} pgs)`,
                                quantity: printOrder.numberOfCopies,
                                subtotal: printOrder.totalAmount,
                              },
                            ],
                            total: printOrder.totalAmount,
                            paymentMethod: 'UPI Online Paid',
                            specs: {
                              pageCount: printOrder.pageCount,
                              copies: printOrder.numberOfCopies,
                              color: printOrder.isColor,
                              paperQuality: printOrder.paperQuality,
                            },
                          });
                        }}
                      >
                        <Printer size={12} color={COLORS.hotPink} style={{ marginRight: 3 }} />
                        <Text style={[styles.labelBtnText, { color: COLORS.hotPink }]}>Label</Text>
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
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.metricLabel}>Direct Referrals</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {selectedCustomer.referredUsersCount ?? 0} ({selectedCustomer.verifiedReferralsCount ?? 0} Verified)
              </Text>
            </View>
          </View>

          {/* Referral Code & Sponsor ID Row */}
          <View style={[styles.metricsRow, { marginTop: 8 }]}>
            <View style={[styles.metricBox, { backgroundColor: '#FDF4FF', borderWidth: 1, borderColor: '#F0ABFC' }]}>
              <Text style={[styles.metricLabel, { color: '#A21CAF', fontWeight: '700' }]}>User Referral Code</Text>
              <Text style={[styles.metricValue, { color: '#86198F', fontSize: 15, fontWeight: '900' }]}>
                {selectedCustomer.referralCode || 'WORM5871'}
              </Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
              <Text style={[styles.metricLabel, { color: '#1D4ED8', fontWeight: '700' }]}>Sponsor ID (Upline)</Text>
              <Text style={[styles.metricValue, { color: '#1E40AF', fontSize: 15, fontWeight: '900' }]}>
                {selectedCustomer.sponsorCode || 'WORMUP001'}
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
});
