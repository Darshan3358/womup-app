import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { COLORS } from '../../theme/colors';
import { OnlinePaymentModal } from '../../components/modals/OnlinePaymentModal';

export const RiderDashboardScreen: React.FC = () => {
  const {
    profile,
    isOnline,
    activeDelivery,
    incomingJobOffer,
    availableJobs,
    acceptDelivery,
    setShowRejectModal,
    setShowNewRequestModal,
    settlementSummary,
    toggleDutyStatus,
    setCurrentTab,
    setSubScreen,
    fetchNewOrder,
    refreshDashboard,
    detectedHubName,
    detectedAddress,
    currentLocation,
    availableHubs,
    detectLocation,
    setSimulatedHub,
    clearSelectedHub,
    riderUnreadCount,
    refreshRiderUnreadCount,
  } = useRider();

  const [showHubModal, setShowHubModal] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showPayAdminModal, setShowPayAdminModal] = useState(false);

  const isRealDelivery = Boolean(
    activeDelivery &&
    activeDelivery.stepStatus !== 'OFFERED'
  );

  // Duty-state-aware GPS detection:
  // Detects location once upon going online or starting an active delivery.
  // Continuous GPS streaming during delivery is handled cleanly by RiderContext / LocationTrackerService,
  // preventing redundant hardware GPS polling loops and unnecessary HTTP requests.
  useEffect(() => {
    if (!isOnline && !isRealDelivery) {
      return;
    }

    // Detect location once on duty state change
    detectLocation();
  }, [isOnline, isRealDelivery, detectLocation]);

  const [refreshing, setRefreshing] = useState(false);
  const [pendingSettlementRequest, setPendingSettlementRequest] = useState<any | null>(null);

  const checkPendingSettlements = useCallback(async () => {
    try {
      const requests = await RiderApiService.getMySettlementRequests();
      const pending = requests?.find((r: any) => r.status === 'PENDING') || null;
      setPendingSettlementRequest(pending);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { 
    // Defer pending settlements check to avoid startup connection congestion
    const timer = setTimeout(() => {
      checkPendingSettlements();
    }, 800);
    return () => clearTimeout(timer);
  }, [checkPendingSettlements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDashboard(), checkPendingSettlements()]);
    setRefreshing(false);
  };

  const netDueToAdmin = settlementSummary?.netBalance ?? settlementSummary?.riderOwesAdmin ?? 0;
  const cashLimit = settlementSummary?.cashLimit ?? 500;
  const isCashBlocked = Boolean(settlementSummary?.isOrderBlocked || netDueToAdmin >= cashLimit);
  const isPendingApproval = Boolean(profile && profile.status !== 'APPROVED');

    return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 🟠 ACCOUNT UNDER REVIEW / PENDING ADMIN APPROVAL BANNER */}
      {isPendingApproval && (
        <View style={styles.pendingReviewBanner}>
          <View style={styles.pendingReviewContent}>
            <View style={styles.pendingIconCircle}>
              <Ionicons name="time" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingAlertTitle}>
                Account Under Review
              </Text>
              <Text style={styles.pendingAlertSubtitle}>
                Admin approval is pending. You cannot go online or accept orders yet.
              </Text>
            </View>
          </View>
          <View style={styles.pendingBadgePill}>
            <Text style={styles.pendingBadgeText}>PENDING</Text>
          </View>
        </View>
      )}

      {/* 🚨 ACCOUNT LOCKED RED BANNER (₹500 Cash Limit Rule) */}
      {isCashBlocked && (
        <View style={styles.redLockAlertBanner}>
          <View style={styles.redLockAlertContent}>
            <View style={styles.redLockIconCircle}>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.redLockAlertTitle}>
                ⚠️ Account Locked: ₹{cashLimit} Cash Limit Exceeded
              </Text>
              <Text style={styles.redLockAlertSubtitle}>
                Please deposit ₹{netDueToAdmin} to Admin to unlock new orders.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.redLockSettleBtn}
            onPress={() => setShowPayAdminModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="card" size={13} color="#DC2626" />
            <Text style={styles.redLockSettleBtnText}>Pay Online</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 1. Header Greeting Bar (Wireframe Screen 4) */}
      <View style={styles.topHeaderRow}>
        <View style={styles.topGreetingLeft}>
          <Text style={styles.helloTitle}>
            Hello, {profile?.name ? profile.name.split(' ')[0] : 'Darshan'}
          </Text>
          <View style={styles.onlineBadgePill}>
            <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
            <Text style={[styles.onlineBadgeText, !isOnline && { color: '#94A3B8' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setSubScreen('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="#071B52" />
          {riderUnreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{riderUnreadCount > 99 ? '99+' : riderUnreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Today's Earning Big Pink Card (Wireframe Screen 4) */}
      <LinearGradient
        colors={['#FF3B98', '#E11D48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.todayEarningCard}
      >
        <View style={styles.earningLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="cash-outline" size={16} color="#FFF" />
            <Text style={styles.todayEarningLabel}>Today's Total Earning</Text>
          </View>
          <Text style={styles.todayEarningAmount}>
            ₹ {settlementSummary?.totalEarnings ?? settlementSummary?.netPayableToday ?? 0}
          </Text>
          <Text style={styles.todayOrdersCount}>
            {settlementSummary?.todayCompleted ?? 0} Orders Delivered
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewDetailsPillBtn}
          onPress={() => setCurrentTab('Earnings')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewDetailsPillText}>Khata Details</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 3. Rider Khata 3-Metric Summary (SRS Flow) */}
      <View style={styles.khataThreeColRow}>
        <View style={styles.khataColCard}>
          <Text style={styles.khataColLabel}>TODAY'S EARNING</Text>
          <Text style={[styles.khataColValue, { color: '#059669' }]}>
            ₹{settlementSummary?.totalEarnings ?? settlementSummary?.netPayableToday ?? 0}
          </Text>
          <Text style={styles.khataColSub}>Online + COD</Text>
        </View>
        <View style={styles.khataColCard}>
          <Text style={styles.khataColLabel}>CASH IN HAND (COD)</Text>
          <Text style={[styles.khataColValue, { color: '#071B52' }]}>
            ₹{settlementSummary?.totalCodCollected ?? settlementSummary?.todayCod ?? 0}
          </Text>
          <Text style={styles.khataColSub}>Collected</Text>
        </View>
        <View style={[styles.khataColCard, isCashBlocked && styles.khataColCardAlert]}>
          <Text style={[styles.khataColLabel, isCashBlocked && { color: '#DC2626' }]}>
            {netDueToAdmin > 0 ? 'PENDING TO PAY' : 'ADMIN OWES'}
          </Text>
          <Text style={[styles.khataColValue, netDueToAdmin > 0 ? { color: '#DC2626' } : { color: '#059669' }]}>
            ₹{Math.abs(netDueToAdmin)}
          </Text>
          <Text style={[styles.khataColSub, isCashBlocked && { color: '#DC2626', fontWeight: '700' }]}>
            {isCashBlocked ? 'Locked (>= ₹500)' : 'Net Hisaab'}
          </Text>
        </View>
      </View>

      {/* 4. 3-Column Stats Row (Wireframe Screen 4) */}
      <View style={styles.statsThreeColRow}>
        <View style={styles.statColCard}>
          <Text style={styles.statColValue}>{settlementSummary?.todayCompleted ?? 0}</Text>
          <Text style={styles.statColLabel}>Completed</Text>
        </View>
        <View style={styles.statColCard}>
          <Text style={styles.statColValue}>{isRealDelivery ? '1' : '0'}</Text>
          <Text style={styles.statColLabel}>Ongoing</Text>
        </View>
        <View style={styles.statColCard}>
          <Text style={styles.statColValue}>0</Text>
          <Text style={styles.statColLabel}>Cancelled</Text>
        </View>
      </View>

      {/* 🟡 PAYMENT VERIFICATION PENDING BANNER (SRS Step 3) */}
      {pendingSettlementRequest && (
        <View style={styles.pendingVerifCard}>
          <View style={styles.pendingVerifLeft}>
            <View style={styles.pendingVerifIconCircle}>
              <Ionicons name="time" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingVerifTitle}>Payment Verification Pending</Text>
              <Text style={styles.pendingVerifSubtitle}>
                ₹{pendingSettlementRequest.amount} (UTR: {pendingSettlementRequest.utrNumber}) submitted. Admin will verify and unlock your account.
              </Text>
            </View>
          </View>
          <View style={styles.pendingVerifBadge}>
            <Text style={styles.pendingVerifBadgeText}>IN REVIEW</Text>
          </View>
        </View>
      )}

      {/* 🔴 ONLINE RIDER SETTLEMENT ACTION BUTTON (When Net Due > 0) */}
      {netDueToAdmin > 0 && (
        <TouchableOpacity
          style={[
            styles.payAdminActionBtn,
            isCashBlocked && styles.payAdminActionBtnBlocked,
            pendingSettlementRequest && { shadowColor: '#F59E0B' },
          ]}
          onPress={() => setShowPayAdminModal(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={
              pendingSettlementRequest
                ? ['#F59E0B', '#D97706']
                : isCashBlocked
                ? ['#DC2626', '#B91C1C']
                : ['#EF4444', '#DC2626']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payAdminGradient}
          >
            <View style={styles.payAdminLeft}>
              <View style={[styles.payAdminIconCircle, pendingSettlementRequest && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Ionicons
                  name={pendingSettlementRequest ? 'time-outline' : 'card-outline'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payAdminTitle}>
                  {pendingSettlementRequest
                    ? `Verification Pending (₹${pendingSettlementRequest.amount})`
                    : `Pay ₹${netDueToAdmin} to Admin`}
                </Text>
                <Text style={styles.payAdminSubtitle}>
                  {pendingSettlementRequest
                    ? `UTR: ${pendingSettlementRequest.utrNumber} • Waiting for Admin approval`
                    : isCashBlocked
                    ? 'Account Locked • Pay via UPI to Instant Unlock'
                    : 'Settle Cash in Hand (COD) via UPI'}
                </Text>
              </View>
            </View>
            <View style={styles.payAdminRight}>
              <View style={[styles.payAdminBadge, pendingSettlementRequest && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={styles.payAdminBadgeText}>
                  {pendingSettlementRequest ? 'IN REVIEW' : 'PAY NOW'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* 4. Two Large Action Buttons: Go Online + Order History (Wireframe Screen 4) */}
      <View style={styles.twoActionButtonsRow}>
        <TouchableOpacity
          style={[
            styles.bigActionBtn,
            isPendingApproval
              ? { backgroundColor: '#94A3B8' }
              : { backgroundColor: isOnline ? '#13B978' : '#059669' },
          ]}
          onPress={() => {
            if (isPendingApproval) {
              Alert.alert(
                'Account Pending Approval',
                'Your account and documents are currently under review by Admin. You cannot go online until approved.'
              );
              return;
            }
            toggleDutyStatus();
          }}
          activeOpacity={0.85}
        >
          <View style={styles.bigActionIconCircle}>
            <Ionicons
              name={isPendingApproval ? 'lock-closed' : isOnline ? 'pause' : 'play'}
              size={20}
              color={isPendingApproval ? '#94A3B8' : isOnline ? '#13B978' : '#059669'}
            />
          </View>
          <Text style={styles.bigActionBtnText}>
            {isPendingApproval ? 'Approval Pending' : isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigActionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => setSubScreen('DutyHistory')}
          activeOpacity={0.85}
        >
          <View style={styles.bigActionIconCircle}>
            <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.bigActionBtnText}>Order History</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Better Rides More Earnings Banner Card (Wireframe Screen 4) */}
      <View style={styles.promoBannerCard}>
        <Image
          source={require('../../../assets/rider_promo_banner.png')}
          style={styles.promoBannerImage}
          resizeMode="cover"
        />
        <View style={styles.promoBannerOverlay}>
          <Text style={styles.promoBannerTitle}>Better Rides, More Earnings</Text>
          <Text style={styles.promoBannerSubtitle}>Deliver with WormUp fleet & earn guaranteed incentives</Text>
        </View>
      </View>

      {/* Location Bar & Telemetry */}
      <View style={styles.heroCard}>

        {/* GPS Live Telemetry & Address Card */}
        <View style={styles.locationBar}>
          {/* Top Bar: Live Status & Controls */}
          <View style={styles.locationHeaderRow}>
            <View style={styles.locationPulseWrap}>
              <View style={[styles.locationPulseDot, !detectedHubName && { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.locationBarLabel, !detectedHubName && { color: '#FDE68A' }]}>
                {detectedHubName ? 'LIVE GPS' : 'LOCATION STATUS'}
              </Text>
            </View>
            <View style={styles.locationBarBtns}>
              <TouchableOpacity
                style={[
                  styles.detectGpsBtn,
                  detectedHubName && { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981', borderWidth: 1 },
                ]}
                onPress={async () => {
                  setIsDetecting(true);
                  await detectLocation();
                  setIsDetecting(false);
                }}
                disabled={isDetecting}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDetecting ? 'sync-outline' : detectedHubName ? 'checkmark-circle' : 'navigate-outline'}
                  size={11}
                  color={detectedHubName ? '#10B981' : COLORS.white}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.detectGpsBtnText, detectedHubName && { color: '#10B981', fontWeight: '800' }]}>
                  {isDetecting ? '...' : detectedHubName ? 'Auto-GPS' : 'Detect'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.switchHubBtn}
                onPress={() => setShowHubModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="business-outline" size={11} color={COLORS.white} style={{ marginRight: 3 }} />
                <Text style={styles.switchHubBtnText}>Hubs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Store / Hub + Distance */}
          <View style={styles.locationStoreRow}>
            <Ionicons
              name={detectedHubName ? "location-sharp" : "alert-circle"}
              size={14}
              color={detectedHubName ? "#38BDF8" : "#F59E0B"}
              style={{ marginRight: 3 }}
            />
            <Text
              style={[
                styles.locationStoreName,
                !detectedHubName && { color: '#FDE68A', fontStyle: 'italic' }
              ]}
              numberOfLines={1}
            >
              {detectedHubName ? detectedHubName.split('(')[0].trim() : 'No Hub Selected'}
            </Text>
            <View
              style={[
                styles.locationDistanceBadge,
                !detectedHubName && { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.5)' }
              ]}
            >
              <Text
                style={[
                  styles.locationDistanceText,
                  !detectedHubName && { color: '#FDE68A', fontWeight: '700' }
                ]}
              >
                {detectedHubName && detectedHubName.includes('(')
                  ? detectedHubName.split('(')[1].replace(')', '').trim()
                  : (detectedHubName ? '0.1 km away' : 'NOT CONNECTED')}
              </Text>
            </View>
          </View>

          {/* Live Street Address */}
          <View style={styles.addressLineRow}>
            <Ionicons
              name={detectedAddress ? "home-outline" : "information-circle-outline"}
              size={13}
              color={detectedAddress ? "rgba(255, 255, 255, 0.75)" : "rgba(253, 230, 138, 0.85)"}
              style={{ marginRight: 5, marginTop: 1 }}
            />
            <Text
              style={[
                styles.addressLineText,
                !detectedAddress && { color: '#FDE68A' }
              ]}
              numberOfLines={2}
            >
              {detectedAddress || 'Tap "Detect" or "Hubs" to connect to an operational dark store'}
            </Text>
          </View>

          {/* Footer with GPS Coords and Status */}
          <View style={styles.locationFooterRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="locate-outline" size={11} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.coordsText}>
                {currentLocation ? `${currentLocation.latitude.toFixed(4)}° N, ${currentLocation.longitude.toFixed(4)}° E` : 'GPS Location Not Detected'}
              </Text>
            </View>
            <View
              style={[
                styles.liveGpsPill,
                !detectedHubName && { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.5)' }
              ]}
            >
              <View
                style={[
                  styles.gpsPulseDot,
                  !detectedHubName && { backgroundColor: '#F59E0B' }
                ]}
              />
              <Text
                style={[
                  styles.liveGpsPillText,
                  !detectedHubName && { color: '#FDE68A' }
                ]}
              >
                {detectedHubName ? 'DISPATCH READY' : 'NO HUB SELECTED'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Incoming Job Offer Card (Priority Offer Gate) */}
      {incomingJobOffer && (
        <View style={styles.offerCard}>
          <View style={styles.orderCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              <View style={styles.offerPill}>
                <View style={styles.offerPulseDot} />
                <Text style={styles.offerPillText}>INCOMING JOB OFFER</Text>
              </View>
              <View style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="bicycle" size={11} color="#059669" />
                <Text style={{ color: '#047857', fontWeight: '800', fontSize: 10 }}>DELIVERY ORDER</Text>
              </View>
            </View>
            <Text style={styles.orderIdText}>{incomingJobOffer.orderNumber}</Text>
          </View>

          <View style={[styles.orderRouteRow, { flexDirection: 'column', gap: 10 }]}>
            <View style={styles.locationBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <Ionicons name="storefront" size={13} color="#2563EB" />
                <Text style={styles.locLabel}>PICKUP FROM DARK STORE / VENDOR</Text>
              </View>
              <Text style={[styles.locTitle, { fontSize: 13 }]}>
                {incomingJobOffer.storeName || 'Dark Store / Vendor'}
              </Text>
              <Text style={[styles.locSubText, { color: '#334155', fontSize: 12, lineHeight: 16, marginTop: 2 }]}>
                {incomingJobOffer.storeAddress || 'Address details available upon dispatch'}
              </Text>
            </View>

            <View style={[styles.locationBlock, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <Ionicons name="location" size={13} color={COLORS.hotPink} />
                <Text style={styles.locLabel}>DROP TO CUSTOMER</Text>
              </View>
              <Text style={[styles.locTitle, { fontSize: 13 }]}>
                {incomingJobOffer.customerName || 'Customer'}
              </Text>
              <Text style={[styles.locSubText, { color: '#334155', fontSize: 12, lineHeight: 16, marginTop: 2 }]}>
                {incomingJobOffer.customerAddress || 'Customer Address'}
              </Text>
            </View>
          </View>

          <View style={styles.orderMetaBar}>
            {incomingJobOffer.distanceToStoreKm != null && (
              <>
                <Text style={styles.metaItem}>Pickup: {incomingJobOffer.distanceToStoreKm} km</Text>
                <Text style={styles.metaItem}>•</Text>
              </>
            )}
            <Text style={styles.metaItem}>Drop: {incomingJobOffer.distanceKm} km</Text>
            <Text style={styles.metaItem}>•</Text>
            <Text style={styles.metaPayout}>Earning: ₹{incomingJobOffer.payoutAmount}</Text>
            {incomingJobOffer.ratePerKm != null && (
              <>
                <Text style={styles.metaItem}>•</Text>
                <Text style={[styles.metaItem, { color: '#059669', fontWeight: '700' }]}>
                  ₹{incomingJobOffer.ratePerKm}/km
                </Text>
              </>
            )}
          </View>

          <View style={styles.offerActionsRow}>
            <TouchableOpacity
              style={styles.offerRejectBtn}
              onPress={() => setShowRejectModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.offerRejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.offerAcceptBtn}
              onPress={() => acceptDelivery()}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.offerAcceptText}>ACCEPT DELIVERY</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active Delivery Card (if any real accepted delivery exists) */}
      {isRealDelivery && activeDelivery ? (
        <View style={styles.activeOrderCard}>
          <View style={styles.orderCardHeader}>
            <View style={styles.activePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePillText}>
                {activeDelivery.stepStatus.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={styles.orderIdText}>{activeDelivery.orderNumber}</Text>
          </View>

          <View style={styles.orderRouteRow}>
            <View style={styles.locationBlock}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locTitle} numberOfLines={1}>
                {activeDelivery.storeName}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={COLORS.hotPink} style={{ marginHorizontal: 6 }} />
            <View style={styles.locationBlock}>
              <Text style={styles.locLabel}>DROP</Text>
              <Text style={styles.locTitle} numberOfLines={1}>
                {activeDelivery.customerName}
              </Text>
            </View>
          </View>

          <View style={styles.orderMetaBar}>
            <Text style={styles.metaItem}>ETA: {activeDelivery.etaMinutes} mins</Text>
            <Text style={styles.metaItem}>•</Text>
            <Text style={styles.metaItem}>Distance: {activeDelivery.distanceKm} km</Text>
            <Text style={styles.metaItem}>•</Text>
            <Text style={styles.metaPayout}>Payout: ₹{activeDelivery.payoutAmount}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewDeliveryBtn}
            onPress={() => setCurrentTab('Deliveries')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={styles.viewDeliveryText}>CONTINUE DELIVERY NAVIGATION</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      ) : !incomingJobOffer ? (
        /* Idle Waiting Card */
        <View style={styles.waitingCard}>
          {!detectedHubName ? (
            <>
              <View style={[styles.radarIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location-outline" size={38} color="#D97706" />
              </View>
              <Text style={[styles.waitingTitle, { color: '#92400E' }]}>
                No Hub Selected
              </Text>
              <Text style={styles.waitingSub}>
                You haven't detected your GPS location or selected an operational hub yet. Please detect your live GPS or select an operating dark store hub to start receiving delivery dispatches.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, width: '100%', justifyContent: 'center' }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.navy,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    gap: 6,
                  }}
                  onPress={async () => {
                    setIsDetecting(true);
                    await detectLocation();
                    setIsDetecting(false);
                  }}
                  disabled={isDetecting}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                    {isDetecting ? 'Detecting...' : 'Detect GPS Hub'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    gap: 6,
                  }}
                  onPress={() => setShowHubModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="business-outline" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                    Select Hub
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.radarIconWrap}>
                <Ionicons name="radio-outline" size={38} color={COLORS.primary} />
              </View>
              <Text style={styles.waitingTitle}>
                {isOnline ? 'Searching for Nearby Deliveries...' : 'You are currently offline'}
              </Text>
              <Text style={styles.waitingSub}>
                {isOnline
                  ? `Ready at ${detectedHubName ? detectedHubName.split('(')[0].trim() : (profile?.city || 'Dark Store Hub')}. Orders dispatched by automated dark store system will appear here instantly.`
                  : 'Switch duty toggle online to receive delivery requests and start earning.'}
              </Text>

              {isOnline ? (
                <TouchableOpacity
                  style={styles.testDispatchBtn}
                  onPress={fetchNewOrder}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.testDispatchText}>Check For New Order Dispatch</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.goOnlineBtn, isPendingApproval && { backgroundColor: '#94A3B8' }]}
                  onPress={() => {
                    if (isPendingApproval) {
                      Alert.alert(
                        'Account Pending Approval',
                        'Your account is currently under review by Admin. Please wait for verification.'
                      );
                      return;
                    }
                    toggleDutyStatus();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isPendingApproval ? 'lock-closed' : 'power'} size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.goOnlineText}>{isPendingApproval ? 'Approval Pending' : 'Go Online Now'}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : null}

      {/* Available Jobs Board Notification Banner */}
      {availableJobs && availableJobs.length > 0 && !isPendingApproval && (
        <TouchableOpacity
          style={styles.availableJobsCard}
          onPress={() => setCurrentTab('Deliveries')}
          activeOpacity={0.85}
        >
          <View style={styles.availableJobsLeft}>
            <View style={styles.availableJobsIconWrap}>
              <Ionicons name="cube" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.availableJobsTitle}>
                {availableJobs.length} Delivery Job{availableJobs.length > 1 ? 's' : ''} Available
              </Text>
              <Text style={styles.availableJobsSub}>
                Orders waiting nearby • Tap to view & accept
              </Text>
            </View>
          </View>
          <View style={styles.availableJobsBadge}>
            <Text style={styles.availableJobsBadgeText}>VIEW</Text>
            <Ionicons name="chevron-forward" size={11} color="#fff" style={{ marginLeft: 3 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Today's KPI Metrics */}
      <Text style={styles.sectionHeading}>Today's Operational Summary</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{settlementSummary?.todayCompleted ?? 0}</Text>
          <Text style={styles.kpiLabel}>Completed</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{isRealDelivery ? '1' : '0'}</Text>
          <Text style={styles.kpiLabel}>In Progress</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: COLORS.onlineGreen }]}>
            ₹{settlementSummary?.netPayableToday ?? 0}
          </Text>
          <Text style={styles.kpiLabel}>Earnings</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Text style={styles.kpiValue}>{profile?.rating ? profile.rating.toFixed(1) : '5.0'}</Text>
            <Ionicons name="star" size={13} color="#F59E0B" />
          </View>
          <Text style={styles.kpiLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Operational Actions */}
      <Text style={styles.sectionHeading}>Quick Actions</Text>
      <View style={styles.quickActionsList}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setSubScreen('DutyHistory')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Duty Shifts & Attendance</Text>
              <Text style={styles.actionDesc}>View past completed drops & times</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setCurrentTab('Earnings')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="wallet-outline" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Settlement & Bank Payouts</Text>
              <Text style={styles.actionDesc}>Daily base pay, tips and bonuses</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setSubScreen('BankSettlement')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="card-outline" size={18} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Manage Bank Account</Text>
              <Text style={styles.actionDesc}>Verify IFSC, Account number or UPI ID</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setCurrentTab('Help')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="headset-outline" size={18} color="#EC4899" />
            </View>
            <View>
              <Text style={styles.actionTitle}>Dark Store Support</Text>
              <Text style={styles.actionDesc}>Direct helpline & customer issue reporting</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />

      {/* Quick Hub Switcher Modal for Testing Any Store */}
      <Modal
        visible={showHubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHubModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.hubModalSheet}>
            <View style={styles.hubModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hubModalTitle}>Simulate Location / Switch Hub</Text>
                <Text style={styles.hubModalSub}>
                  Select any Dark Store area in Ahmedabad to test nearby order discovery
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHubModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {availableHubs.map((hub) => (
                <TouchableOpacity
                  key={hub.id}
                  style={styles.hubItemCard}
                  onPress={async () => {
                    await setSimulatedHub(hub);
                    setShowHubModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hubItemName}>{hub.name}</Text>
                    <Text style={styles.hubItemAddress}>{hub.address}</Text>
                    <Text style={styles.hubItemCoords}>
                      GPS: {hub.latitude}, {hub.longitude}
                    </Text>
                  </View>
                  <View style={styles.hubSelectArrow}>
                    <Text style={styles.hubSelectArrowText}>Select</Text>
                    <Ionicons name="chevron-forward" size={10} color="#fff" style={{ marginLeft: 3 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.realGpsRestoreBtn, { flex: 1, marginTop: 0 }]}
                onPress={async () => {
                  await detectLocation();
                  setShowHubModal(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="locate" size={14} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.realGpsRestoreText}>Detect GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.realGpsRestoreBtn, { flex: 1, marginTop: 0, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                onPress={async () => {
                  await clearSelectedHub();
                  setShowHubModal(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={[styles.realGpsRestoreText, { color: '#DC2626' }]}>Clear Hub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Online UPI Settlement to Admin Modal */}
      <OnlinePaymentModal
        visible={showPayAdminModal}
        onClose={() => setShowPayAdminModal(false)}
        dueAmount={netDueToAdmin}
        onPaymentSuccess={() => {
          refreshDashboard();
          checkPendingSettlements();
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  pendingVerifCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingVerifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  pendingVerifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingVerifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  pendingVerifSubtitle: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  pendingVerifBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingVerifBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  payAdminActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payAdminActionBtnBlocked: {
    shadowColor: '#991B1B',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  payAdminGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  payAdminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  payAdminIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payAdminTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  payAdminSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  payAdminRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payAdminBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  payAdminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },
  topGreetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helloTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  onlineBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  onlineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#13B978',
  },
  bellBtn: {
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
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B98',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  todayEarningCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  earningLeft: {
    flex: 1,
  },
  todayEarningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  todayEarningAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  todayOrdersCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  viewDetailsPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewDetailsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF3B98',
  },
  statsThreeColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statColCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statColValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#071B52',
  },
  statColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  twoActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bigActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bigActionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingLabel: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: '500',
  },
  riderName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  hubLocation: {
    color: COLORS.hotPink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleBadge: {
    backgroundColor: '#1E2260',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 18,
  },
  vehicleNumber: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  dutyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  onlineBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.onlineGreen,
  },
  offlineBtn: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.secondaryText,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineDot: {
    backgroundColor: COLORS.onlineGreen,
  },
  offlineDot: {
    backgroundColor: COLORS.offlineGray,
  },
  dutyBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  offerCard: {
    backgroundColor: '#FFF5F8',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.error,
    marginBottom: 20,
    elevation: 6,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE3E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  offerPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  offerPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.error,
    letterSpacing: 0.5,
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  offerRejectBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  offerRejectText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  offerAcceptBtn: {
    flex: 2,
    backgroundColor: COLORS.onlineGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.onlineGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  offerAcceptText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeOrderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.hotPink,
    marginBottom: 20,
    elevation: 4,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.hotPink,
  },
  activePillText: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 11,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  locationBlock: {
    flex: 1,
  },
  locLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondaryText,
  },
  locTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  routeArrow: {
    marginHorizontal: 8,
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  orderMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaItem: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaPayout: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onlineGreen,
  },
  viewDeliveryBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDeliveryText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  waitingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radarIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  radarEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  waitingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  testDispatchBtn: {
    backgroundColor: COLORS.lightBlueLavender,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  testDispatchText: {
    color: COLORS.blue,
    fontWeight: '700',
    fontSize: 12,
  },
  goOnlineBtn: {
    backgroundColor: COLORS.onlineGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goOnlineText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionsList: {
    gap: 10,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
  availableJobsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableJobsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  availableJobsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableJobsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730A3',
  },
  availableJobsSub: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
  },
  availableJobsBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  availableJobsBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  locationBar: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationPulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  locationBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
  },
  locationBarBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectGpsBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  detectGpsBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  switchHubBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  switchHubBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  locationStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationStoreIcon: {
    fontSize: 13,
  },
  locationStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    flex: 1,
  },
  locationDistanceBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  locationDistanceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
  },
  addressLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  addressPinIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  addressLineText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  locationFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  coordsText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: 'monospace',
  },
  liveGpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gpsPulseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  liveGpsPillText: {
    color: '#00E676',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nearbyHubBadge: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nearbyHubBadgeText: {
    color: '#E65100',
    fontWeight: '800',
    fontSize: 10,
  },
  ownHubBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownHubBadgeText: {
    color: '#2E7D32',
    fontWeight: '800',
    fontSize: 10,
  },
  locSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  hubModalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  hubModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hubModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  hubModalSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  hubItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hubItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hubItemAddress: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  hubItemCoords: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  hubSelectArrow: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  hubSelectArrowText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  realGpsRestoreBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  realGpsRestoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  promoBannerCard: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#071B52',
    height: 94,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.35)',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  promoBannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  promoBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(7, 27, 82, 0.82)',
  },
  promoBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  promoBannerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F472B6',
    marginTop: 1,
  },

  // Red Lock & Khata Styles
  redLockAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  redLockAlertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redLockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redLockAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  redLockAlertSubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 15,
  },
  redLockSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  redLockSettleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  khataThreeColRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  khataColCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  khataColCardAlert: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  khataColLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  khataColValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#071B52',
    marginTop: 3,
  },
  khataColSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  pendingReviewBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingReviewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingAlertSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  pendingBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.5,
  },
});
