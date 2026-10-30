import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

export const ST17_OrderHistoryScreen: React.FC = () => {
  const { completedOrders, refreshCompletedOrders, isLoading, store, selectOrderForDetail } = useStore();
  const [filterTab, setFilterTab] = useState<'ALL' | 'TODAY' | 'EARLIER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [earningsSummary, setEarningsSummary] = useState<{
    totalGrossSales: number;
    totalPlatformCommission: number;
    netSettlementAmount: number;
    pendingSettlement: number;
    alreadyPaid: number;
    commissionPercent: number;
  }>({
    totalGrossSales: 0,
    totalPlatformCommission: 0,
    netSettlementAmount: 0,
    pendingSettlement: 0,
    alreadyPaid: 0,
    commissionPercent: 10,
  });

  // UTR Settlement Request Modal State
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [settlementAmountInput, setSettlementAmountInput] = useState('');
  const [settlementNotesInput, setSettlementNotesInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [pastSettlementRequests, setPastSettlementRequests] = useState<any[]>([]);
  const [loadingPastRequests, setLoadingPastRequests] = useState(false);

  const fetchEarnings = async () => {
    try {
      const storeId = store?.id || (store as any)?._id || store?.code;
      if (!storeId) return;
      const res = await StoreApiService.getEarningsSummary(storeId);
      if (res) {
        setEarningsSummary({
          totalGrossSales: res.totalGrossSales || 0,
          totalPlatformCommission: res.totalPlatformCommission || 0,
          netSettlementAmount: res.netSettlementAmount || 0,
          pendingSettlement: res.pendingSettlement || 0,
          alreadyPaid: res.alreadyPaid || 0,
          commissionPercent: res.commissionPercent || 10,
        });
      }
    } catch (_) {}
  };

  const fetchSettlementRequests = async () => {
    try {
      const storeId = store?.id || (store as any)?._id || store?.code;
      if (!storeId) return;
      setLoadingPastRequests(true);
      const res = await StoreApiService.getMySettlementRequests(storeId);
      if (res?.success && Array.isArray(res.data)) {
        setPastSettlementRequests(res.data);
      }
    } catch (_) {
    } finally {
      setLoadingPastRequests(false);
    }
  };

  useEffect(() => {
    refreshCompletedOrders();
    fetchEarnings();
    fetchSettlementRequests();
  }, [refreshCompletedOrders, store?.id, store?.code]);

  const handleFullRefresh = async () => {
    await Promise.all([
      refreshCompletedOrders(),
      fetchEarnings(),
      fetchSettlementRequests(),
    ]);
  };

  const openSettlementModal = () => {
    const defaultAmount =
      earningsSummary.pendingSettlement > 0
        ? earningsSummary.pendingSettlement
        : earningsSummary.netSettlementAmount;
    setSettlementAmountInput(defaultAmount > 0 ? String(defaultAmount) : '');
    setShowUtrModal(true);
    fetchSettlementRequests();
  };

  const handleSubmitSettlement = async () => {
    const storeId = store?.id || (store as any)?._id || store?.code;
    if (!storeId) {
      Alert.alert('Error', 'Store information not loaded yet');
      return;
    }
    const amt = parseFloat(settlementAmountInput);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid settlement amount greater than 0');
      return;
    }
    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UTR / Reference number (min 6 characters)');
      return;
    }

    try {
      setIsSubmittingUtr(true);
      const res = await StoreApiService.submitSettlementRequest({
        storeId,
        amount: amt,
        utrNumber: cleanUtr,
        notes: settlementNotesInput.trim(),
      });

      if (res.success) {
        Alert.alert(
          'Request Submitted! ✅',
          `Your settlement request of ₹${amt} with UTR ${cleanUtr} has been sent to Admin for verification.`,
          [{ text: 'OK', onPress: () => setShowUtrModal(false) }]
        );
        setUtrInput('');
        setSettlementNotesInput('');
        await Promise.all([fetchEarnings(), fetchSettlementRequests()]);
      } else {
        Alert.alert('Submission Failed', res.message || res.error || 'Could not submit request');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  // Filter orders by date and search
  const filteredOrders = completedOrders.filter((order) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = (order.orderNumber || '').toLowerCase().includes(q);
      const matchCust = (order.customerName || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some((it: any) => (it.name || '').toLowerCase().includes(q));
      if (!matchNum && !matchCust && !matchItems) return false;
    }

    if (filterTab === 'ALL') return true;

    const orderDate = new Date(order.deliveredAt || order.createdAt || Date.now());
    const today = new Date();
    const isToday =
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear();

    if (filterTab === 'TODAY') return isToday;
    if (filterTab === 'EARLIER') return !isToday;

    return true;
  });

  const formatDeliveredTime = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeString}`;
    }
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeString}`;
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.screenTitle}>Completed Orders</Text>
          <Text style={styles.screenSubtitle}>
            Fulfillment history for {areaName} · {cityName}
          </Text>
        </View>

        <View style={styles.deliveredCountBadge}>
          <Ionicons name="checkmark-done" size={13} color={COLORS.primary} />
          <Text style={styles.deliveredCountText}>{completedOrders.length} DELIVERED</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order #, customer, or product..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'TODAY', 'EARLIER'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filterTab === tab && styles.filterChipActive]}
            onPress={() => setFilterTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterTab === tab && styles.filterChipTextActive]}>
              {tab}
            </Text>
            {tab === 'ALL' && completedOrders.length > 0 && (
              <View style={[styles.tabBadge, filterTab === tab && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{completedOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.settlementSummaryCard}>
            <View style={styles.settleTopRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="wallet" size={18} color="#10B981" />
                  <Text style={styles.settleCardHeading}>Settlement Breakdown</Text>
                  <View style={styles.settleLiveTag}>
                    <Text style={styles.settleLiveTagText}>Live Ledger</Text>
                  </View>
                </View>
                <Text style={styles.settleStoreName}>{store?.name || 'Dark Store Hub'}</Text>
              </View>
              <View style={styles.cycleBadge}>
                <Ionicons name="calendar-outline" size={11} color="#4F46E5" />
                <Text style={styles.cycleBadgeText}>Weekly Cycle</Text>
              </View>
            </View>

            {/* 3 Pillars: Total Sales (Gross), Platform Comm (-10%), Net Payable to You */}
            <View style={styles.threePillarsRow}>
              {/* 1. Total Sales (Gross) */}
              <View style={styles.pillarBox}>
                <Text style={styles.pillarLabel} numberOfLines={1}>Total Sales (Gross)</Text>
                <Text style={styles.pillarGrossAmount}>
                  ₹{earningsSummary.totalGrossSales.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.pillarSub}>Item Subtotals</Text>
              </View>

              {/* 2. Platform Commission (Admin ka hissa, 10%) */}
              <View style={[styles.pillarBox, styles.pillarBoxComm]}>
                <Text style={styles.pillarLabelComm} numberOfLines={1}>Platform Comm. (10%)</Text>
                <Text style={styles.pillarCommAmount}>
                  -₹{earningsSummary.totalPlatformCommission.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.pillarSubComm}>Admin ko dena hai</Text>
              </View>

              {/* 3. Net Payable to You (Store ka hissa) */}
              <View style={[styles.pillarBox, styles.pillarBoxNet]}>
                <Text style={styles.pillarLabelNet} numberOfLines={1}>Net Payable to You</Text>
                <Text style={styles.pillarNetAmount}>
                  ₹{earningsSummary.netSettlementAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.pillarSubNet}>Admin se lena hai</Text>
              </View>
            </View>

            {/* Payout Status Banner Row */}
            <View style={styles.payoutStatusRow}>
              <View style={styles.payoutStatusItem}>
                <View style={[styles.statusIconDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.payoutStatusLabel}>Pending Settlement:</Text>
                <Text style={styles.payoutPendingValue}>
                  ₹{earningsSummary.pendingSettlement.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.payoutStatusDivider} />

              <View style={styles.payoutStatusItem}>
                <View style={[styles.statusIconDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.payoutStatusLabel}>Already Settled:</Text>
                <Text style={styles.payoutSettledValue}>
                  ₹{earningsSummary.alreadyPaid.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Request Payout / Submit UTR Button */}
            <TouchableOpacity
              style={styles.requestPayoutBtn}
              onPress={openSettlementModal}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={15} color="#FFF" />
              <Text style={styles.requestPayoutBtnText}>SUBMIT UTR / REQUEST PAYOUT</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </TouchableOpacity>

            {/* Pending Requests Notice Banner if any */}
            {pastSettlementRequests.some((r) => r.status === 'PENDING') && (
              <View style={styles.pendingRequestNotice}>
                <Ionicons name="time-outline" size={13} color="#D97706" />
                <Text style={styles.pendingRequestNoticeText} numberOfLines={1}>
                  Pending Admin Approval: ₹{pastSettlementRequests.find((r) => r.status === 'PENDING')?.amount} (UTR: {pastSettlementRequests.find((r) => r.status === 'PENDING')?.utrNumber})
                </Text>
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleFullRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.orderId;
          const st = String(item.status || 'DELIVERED').toUpperCase();
            const isDelivered = st === 'DELIVERED' || st === 'COMPLETED';
            const isCancelled = st === 'CANCELLED' || st === 'PAYMENT_FAILED';
            const isAtStore = st === 'ARRIVED_AT_STORE' || st === 'GOING_TO_STORE' || st === 'ASSIGNED' || st === 'PACKED';
            const isOut = st === 'OUT_FOR_DELIVERY' || st === 'ARRIVED_AT_CUSTOMER';

            const statusLabel = isDelivered ? 'DELIVERED' : isCancelled ? 'CANCELLED' : isAtStore ? 'AT STORE' : isOut ? 'OUT FOR DELIVERY' : st;
            const statusColor = isDelivered ? '#10B981' : isCancelled ? '#EF4444' : isAtStore ? '#F59E0B' : '#3B82F6';

            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => selectOrderForDetail(item.orderId)}
                activeOpacity={0.85}
              >
                {/* Card Top: Order Number & Dynamic Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.orderNumberRow}>
                    <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.orderNumberText}>{item.orderNumber}</Text>
                  </View>

                  <View style={[styles.deliveredBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                    <Ionicons
                      name={isDelivered ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'bicycle'}
                      size={12}
                      color={statusColor}
                    />
                    <Text style={[styles.deliveredBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Bag Barcode Chip */}
                {Boolean(item.bagBarcode || item.barcode) && (
                  <View style={styles.bagBarcodeTag}>
                    <Ionicons name="barcode-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.bagBarcodeText}>
                      Bag: {item.bagBarcode || item.barcode}
                    </Text>
                  </View>
                )}

                {/* Card Meta: Date & Time */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{formatDeliveredTime(item.deliveredAt)}</Text>
                  </View>

                  {Boolean(item.customerName) && (
                    <View style={styles.metaCol}>
                      <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{item.customerName}</Text>
                    </View>
                  )}
                </View>

                {/* Items Summary Preview */}
                <View style={styles.itemsSummaryBox}>
                  <View style={styles.itemsSummaryHeader}>
                    <Text style={styles.itemsSummaryCount}>
                      {item.itemCount || (item.items ? item.items.length : 0)} items
                    </Text>
                    <Text style={styles.totalAmountText}>₹{item.totalAmount}</Text>
                  </View>

                  {/* Items list preview with barcodes */}
                  {(item.items || []).slice(0, 4).map((prod: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemBullet}>•</Text>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <View style={styles.itemBarcodeMini}>
                          <Ionicons name="barcode-outline" size={11} color={COLORS.textMuted} />
                          <Text style={styles.itemBarcodeText}>
                            Barcode: {prod.barcode || '8901030383748'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemQty}>
                        {prod.quantity}x {prod.quantityLabel || ''}
                      </Text>
                    </View>
                  ))}

                  {(item.items || []).length > 4 && (
                    <Text style={styles.moreItemsText}>
                      +{item.items.length - 4} more items
                    </Text>
                  )}
                </View>

                {/* Store Financial Breakdown Ledger */}
                {(() => {
                  const gross = Math.max(
                    0,
                    Number(item.itemSubtotal) ||
                      (item.items || []).reduce(
                        (s: number, p: any) => s + Number(p.unitPrice || p.price || 0) * (p.quantity || 1),
                        0
                      ) ||
                      Number(item.totalAmount) ||
                      0
                  );
                  const commission = Math.round(gross * 0.10);
                  const net = Math.max(0, gross - commission);
                  const isSettled = isDelivered && item.settlementStatus === 'SETTLED';

                  return (
                    <View style={styles.orderLedgerCard}>
                      <View style={styles.ledgerHeader}>
                        <Text style={styles.ledgerTitle}>FINANCIAL SETTLEMENT BREAKDOWN</Text>
                        <View style={[styles.settlePill, isSettled ? styles.settlePillPaid : styles.settlePillPending]}>
                          <Ionicons
                            name={isSettled ? 'checkmark-circle' : 'time-outline'}
                            size={11}
                            color={isSettled ? '#059669' : '#D97706'}
                          />
                          <Text style={[styles.settlePillText, isSettled ? styles.settlePillTextPaid : styles.settlePillTextPending]}>
                            {isSettled ? 'SETTLED' : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ledgerMetricsRow}>
                        <View style={styles.ledgerMetricItem}>
                          <Text style={styles.ledgerLabel}>Gross Sale</Text>
                          <Text style={styles.ledgerGrossVal}>₹{gross}</Text>
                        </View>
                        <Text style={styles.ledgerOperator}>−</Text>
                        <View style={styles.ledgerMetricItem}>
                          <Text style={styles.ledgerLabel}>Admin Comm. (10%)</Text>
                          <Text style={styles.ledgerCommVal}>-₹{commission}</Text>
                        </View>
                        <Text style={styles.ledgerOperator}>=</Text>
                        <View style={styles.ledgerMetricItem}>
                          <Text style={styles.ledgerLabel}>Your Net Payout</Text>
                          <Text style={styles.ledgerNetVal}>₹{net}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

              {/* Card Footer: Rider info & View Detail CTA */}
              <View style={styles.cardFooterRow}>
                {Boolean(item.deliveryPartner) ? (
                  <View style={styles.riderRow}>
                    <Ionicons name="bicycle-outline" size={13} color={COLORS.accentCyan} />
                    <Text style={styles.riderText} numberOfLines={1}>
                      {item.deliveryPartner.name} • {item.deliveryPartner.vehicle || 'Bike'}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                <View style={styles.viewDetailBadge}>
                  <Text style={styles.viewDetailText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Completed Orders</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'No past orders matched your search.'
                : 'Orders marked as DELIVERED from this dark store will appear here.'}
            </Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshCompletedOrders}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#FFF" />
              <Text style={styles.refreshBtnText}>REFRESH ORDERS</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Manual UPI Settlement & UTR Submission Modal */}
      <Modal
        visible={showUtrModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUtrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Store UPI Settlement</Text>
                <Text style={styles.modalSubtitle}>Submit UTR for Admin Verification</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowUtrModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary || '#FFF'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Admin Receiving UPI Details Box */}
              <View style={styles.adminUpiBox}>
                <View style={styles.adminUpiTop}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  <Text style={styles.adminUpiHeading}>Official Admin Settlement UPI</Text>
                </View>
                <View style={styles.adminUpiDetailRow}>
                  <Text style={styles.adminUpiLabel}>UPI ID:</Text>
                  <Text style={styles.adminUpiValue} selectable>wormup@okicici</Text>
                </View>
                <View style={styles.adminUpiDetailRow}>
                  <Text style={styles.adminUpiLabel}>Name:</Text>
                  <Text style={styles.adminUpiName}>Womup Technologies Pvt Ltd</Text>
                </View>
                <Text style={styles.adminUpiHelpText}>
                  Please send payout amount or commission dues to the above UPI, then enter the 12-digit UTR below for immediate ledger clearance.
                </Text>
              </View>

              {/* Settlement Form */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputFieldLabel}>Settlement Amount (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter Amount"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={settlementAmountInput}
                  onChangeText={setSettlementAmountInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputFieldLabel}>12-Digit UTR / Transaction ID *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 423512345678"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                  value={utrInput}
                  onChangeText={setUtrInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputFieldLabel}>Notes / Remarks (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { height: 42 }]}
                  placeholder="e.g. Weekly net payout settlement"
                  placeholderTextColor="#64748B"
                  value={settlementNotesInput}
                  onChangeText={setSettlementNotesInput}
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.submitSettlementBtn, isSubmittingUtr && { opacity: 0.7 }]}
                onPress={handleSubmitSettlement}
                disabled={isSubmittingUtr}
                activeOpacity={0.85}
              >
                {isSubmittingUtr ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FFF" />
                    <Text style={styles.submitSettlementBtnText}>SUBMIT SETTLEMENT REQUEST</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Past Requests History Section */}
              <View style={styles.pastRequestsSection}>
                <View style={styles.pastRequestsHeader}>
                  <Text style={styles.pastRequestsTitle}>Past Settlement Requests</Text>
                  {loadingPastRequests && <ActivityIndicator size="small" color="#10B981" />}
                </View>

                {pastSettlementRequests.length === 0 ? (
                  <Text style={styles.noPastRequestsText}>No settlement requests submitted yet.</Text>
                ) : (
                  pastSettlementRequests.map((req, idx) => {
                    const st = String(req.status || 'PENDING').toUpperCase();
                    const isApproved = st === 'APPROVED';
                    const isRejected = st === 'REJECTED';
                    const pillBg = isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                    const pillColor = isApproved ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B';

                    return (
                      <View key={req._id || req.id || idx} style={styles.pastRequestItemCard}>
                        <View style={styles.pastReqTop}>
                          <Text style={styles.pastReqAmount}>₹{Number(req.amount).toLocaleString('en-IN')}</Text>
                          <View style={[styles.statusPillBadge, { backgroundColor: pillBg }]}>
                            <Text style={[styles.statusPillText, { color: pillColor }]}>{st}</Text>
                          </View>
                        </View>
                        <View style={styles.pastReqDetailRow}>
                          <Text style={styles.pastReqUtr}>UTR: {req.utrNumber}</Text>
                          <Text style={styles.pastReqDate}>
                            {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-IN') : ''}
                          </Text>
                        </View>
                        {Boolean(req.adminRemarks) && (
                          <Text style={styles.adminRemarkText}>Admin: {req.adminRemarks}</Text>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  deliveredCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  deliveredCountText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  tabBadgeActive: {
    borderColor: COLORS.primary,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumberText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deliveredBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  itemsSummaryBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  itemsSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
  },
  itemsSummaryCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  totalAmountText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  itemBullet: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 6,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  itemQty: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  moreItemsText: {
    color: COLORS.accentCyan,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  riderText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
  },
  viewDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(236, 74, 157, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 74, 157, 0.25)',
  },
  viewDetailText: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bagBarcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 74, 157, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 74, 157, 0.2)',
  },
  bagBarcodeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  itemBarcodeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  itemBarcodeText: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Settlement Summary Card Styles
  settlementSummaryCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: COLORS.surfaceCard || '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border || '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  settleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settleCardHeading: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  settleLiveTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  settleLiveTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  settleStoreName: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  cycleBadgeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  threePillarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pillarBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border || '#334155',
    alignItems: 'center',
  },
  pillarBoxComm: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  pillarBoxNet: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  pillarLabel: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  pillarLabelComm: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  pillarLabelNet: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  pillarGrossAmount: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarCommAmount: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarNetAmount: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  pillarSub: {
    color: COLORS.textMuted || '#64748B',
    fontSize: 8.5,
    fontWeight: '500',
  },
  pillarSubComm: {
    color: 'rgba(239, 68, 68, 0.8)',
    fontSize: 8.5,
    fontWeight: '600',
  },
  pillarSubNet: {
    color: '#059669',
    fontSize: 8.5,
    fontWeight: '700',
  },
  payoutStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border || '#334155',
  },
  payoutStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  statusIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  payoutStatusLabel: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
  payoutPendingValue: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  payoutSettledValue: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  payoutStatusDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border || '#334155',
    marginHorizontal: 6,
  },
  // Order Level Ledger Breakdown
  orderLedgerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.7)',
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ledgerTitle: {
    color: COLORS.textMuted || '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  settlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settlePillPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  settlePillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  settlePillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  settlePillTextPaid: {
    color: '#10B981',
  },
  settlePillTextPending: {
    color: '#F59E0B',
  },
  ledgerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ledgerMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  ledgerLabel: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 2,
  },
  ledgerGrossVal: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  ledgerOperator: {
    color: COLORS.textMuted || '#64748B',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  ledgerCommVal: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  ledgerNetVal: {
    color: '#10B981',
    fontSize: 12.5,
    fontWeight: '900',
  },
  // Request Payout & Modal Styles
  requestPayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  requestPayoutBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pendingRequestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  pendingRequestNoticeText: {
    color: '#D97706',
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: COLORS.surfaceCard || '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: COLORS.border || '#334155',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#334155',
  },
  modalTitle: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminUpiBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  adminUpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminUpiHeading: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adminUpiDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  adminUpiLabel: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  adminUpiValue: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  adminUpiName: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 11.5,
    fontWeight: '700',
  },
  adminUpiHelpText: {
    color: COLORS.textMuted || '#64748B',
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputFieldLabel: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border || '#334155',
    color: COLORS.textPrimary || '#F8FAFC',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  submitSettlementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitSettlementBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pastRequestsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#334155',
    paddingTop: 14,
  },
  pastRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pastRequestsTitle: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '800',
  },
  noPastRequestsText: {
    color: COLORS.textMuted || '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  pastRequestItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border || '#334155',
  },
  pastReqTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pastReqAmount: {
    color: COLORS.textPrimary || '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  statusPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  pastReqDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastReqUtr: {
    color: COLORS.textSecondary || '#94A3B8',
    fontSize: 10.5,
    fontFamily: 'monospace',
  },
  pastReqDate: {
    color: COLORS.textMuted || '#64748B',
    fontSize: 10,
  },
  adminRemarkText: {
    color: '#EF4444',
    fontSize: 9.5,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
