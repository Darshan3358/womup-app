import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { OnlinePaymentModal } from '../../components/modals/OnlinePaymentModal';

// Reusable mini sparkline wave for metric cards
const SparklineWave: React.FC<{ color: string }> = ({ color }) => (
  <View style={styles.sparklineContainer}>
    <Svg width="100%" height={20} viewBox="0 0 80 20" style={{ overflow: 'visible' }}>
      <Path
        d="M 0 14 Q 15 4, 30 11 T 55 6 T 80 12"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

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
    locationError,
    currentLocation,
    detectLocation,
    riderUnreadCount,
    refreshRiderUnreadCount,
  } = useRider();

  const [isDetecting, setIsDetecting] = useState(false);
  const [showPayAdminModal, setShowPayAdminModal] = useState(false);

  const isRealDelivery = Boolean(
    activeDelivery &&
    activeDelivery.stepStatus !== 'OFFERED'
  );

  // Stable ref ensures 5s interval is never reset on re-renders
  const detectLocationRef = useRef(detectLocation);
  detectLocationRef.current = detectLocation;

  useEffect(() => {
    if (!isOnline && !isRealDelivery) {
      return;
    }

    // Pehli baar turant detect karo
    detectLocationRef.current();

    // Phir har 5 second me detect karo
    const intervalId = setInterval(() => {
      detectLocationRef.current();
    }, 5000); // 5000 ms = 5 seconds

    // Cleanup: Jab screen chhodein ya offline ho toh interval clear karein
    return () => clearInterval(intervalId);
  }, [isOnline, isRealDelivery]);

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

  const riderFirstName = profile?.name ? profile.name.split(' ')[0] : 'Test';
  const totalEarningsAmount = settlementSummary?.totalEarnings ?? settlementSummary?.netPayableToday ?? 0;
  const todayDeliveredCount = settlementSummary?.todayCompleted ?? 0;
  const cashInHandAmount = settlementSummary?.totalCodCollected ?? settlementSummary?.todayCod ?? 0;
  const adminBalanceAmount = Math.abs(netDueToAdmin);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
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
              <Text style={styles.pendingAlertTitle}>Account Under Review</Text>
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

      {/* 🟡 PAYMENT VERIFICATION PENDING BANNER */}
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

      {/* 1. WELCOME SECTION (Greeting + 3D Rider Boy Illustration) */}
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeTextColumn}>
          <Text style={styles.welcomeGreetingTitle}>
            Hello, {riderFirstName} 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Ready to deliver today?
          </Text>
        </View>
        <View style={styles.welcomeRiderImgWrap}>
          <Image
            source={require('../../../assets/ridermen2.png')}
            style={styles.welcomeRiderImg}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 2. MAIN TODAY'S TOTAL EARNINGS CARD */}
      <LinearGradient
        colors={['#FF21A7', '#C30CB6', '#7227DF', '#233DF0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.mainEarningsCard}
      >
        {/* Floating coins background decoration */}
        <View style={styles.floatingCoinsWrap}>
          <Text style={styles.floatingCoinOne}>🪙</Text>
          <Text style={styles.floatingCoinTwo}>🪙</Text>
        </View>

        <View style={styles.earningsCardContent}>
          {/* Left: 3D Wallet Icon Container */}
          <View style={styles.walletIllustrationWrap}>
            <View style={styles.walletInnerBox}>
              <Ionicons name="wallet" size={24} color="#8428E8" />
              <View style={styles.walletCoinPill}>
                <Text style={styles.walletCoinPillText}>₹</Text>
              </View>
            </View>
          </View>

          {/* Center Info */}
          <View style={styles.earningsCenterWrap}>
            <View style={styles.earningsTitleRow}>
              <Text style={styles.earningsLabelText}>Today's Total Earnings</Text>
              <Ionicons name="information-circle-outline" size={15} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.earningsAmountValue}>₹{totalEarningsAmount}</Text>
            <View style={styles.deliveredCountRow}>
              <Ionicons name="cube-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.deliveredCountText}>
                {todayDeliveredCount} Orders Delivered
              </Text>
            </View>
          </View>

          {/* Right Action: Khata Details Pill Button */}
          <TouchableOpacity
            style={styles.khataDetailsBtn}
            onPress={() => setCurrentTab('Earnings')}
            activeOpacity={0.85}
          >
            <Text style={styles.khataDetailsText}>Khata Details</Text>
            <Ionicons name="arrow-forward" size={12} color="#10215A" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 3. THREE FINANCIAL SUMMARY CARDS */}
      <View style={styles.threeCardsRow}>
        {/* Card 1: Today's Earning */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FDF2F8' }]}>
            <Text style={[styles.metricCurrencySymbol, { color: '#F51BA0' }]}>₹</Text>
          </View>
          <Text style={styles.metricLabelText}>Today's Earning</Text>
          <Text style={styles.metricValueText}>₹{totalEarningsAmount}</Text>
          <View style={styles.metricTrendRow}>
            <Ionicons name="arrow-up" size={10} color="#06BF7B" />
            <Text style={[styles.metricTrendText, { color: '#06BF7B' }]}>+0% vs yesterday</Text>
          </View>
          <SparklineWave color="#F51BA0" />
        </View>

        {/* Card 2: Cash In Hand */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#F4EAFE' }]}>
            <Ionicons name="hand-right" size={16} color="#8428E8" />
          </View>
          <Text style={styles.metricLabelText}>Cash In Hand</Text>
          <Text style={styles.metricValueText}>₹{cashInHandAmount}</Text>
          <Text style={styles.metricSubText}>Collected</Text>
          <SparklineWave color="#8428E8" />
        </View>

        {/* Card 3: Admin Owes */}
        <View style={[styles.metricCard, isCashBlocked && styles.metricCardAlert]}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="people" size={16} color="#06BF7B" />
          </View>
          <Text style={[styles.metricLabelText, isCashBlocked && { color: '#DC2626' }]}>
            {netDueToAdmin > 0 ? 'Pending to Pay' : 'Admin Owes'}
          </Text>
          <Text style={[styles.metricValueText, netDueToAdmin > 0 ? { color: '#DC2626' } : { color: '#10215A' }]}>
            ₹{adminBalanceAmount}
          </Text>
          <Text style={[styles.metricSubText, isCashBlocked && { color: '#DC2626', fontWeight: '700' }]}>
            {isCashBlocked ? 'Locked (>= ₹500)' : 'Net Khata'}
          </Text>
          <SparklineWave color={netDueToAdmin > 0 ? '#F43E53' : '#06BF7B'} />
        </View>
      </View>

      {/* 4. THREE DELIVERY PERFORMANCE CARDS */}
      <View style={styles.threeCardsRow}>
        {/* Card 1: Completed */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="checkmark" size={17} color="#2676F4" />
          </View>
          <Text style={styles.metricLabelText}>Completed</Text>
          <Text style={styles.metricValueText}>{todayDeliveredCount}</Text>
          <Text style={styles.metricSubText}>Today</Text>
          <SparklineWave color="#2676F4" />
        </View>

        {/* Card 2: Ongoing */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="time" size={16} color="#F28B37" />
          </View>
          <Text style={styles.metricLabelText}>Ongoing</Text>
          <Text style={styles.metricValueText}>{isRealDelivery ? '1' : '0'}</Text>
          <Text style={styles.metricSubText}>In Progress</Text>
          <SparklineWave color="#F28B37" />
        </View>

        {/* Card 3: Cancelled */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="close" size={17} color="#8428E8" />
          </View>
          <Text style={styles.metricLabelText}>Cancelled</Text>
          <Text style={styles.metricValueText}>0</Text>
          <Text style={styles.metricSubText}>Today</Text>
          <SparklineWave color="#8428E8" />
        </View>
      </View>

      {/* 5. TWO PRIMARY ACTION BUTTONS (Go Offline + Order History) */}
      <View style={styles.actionButtonsRow}>
        {/* Green Go Offline / Go Online Button */}
        <TouchableOpacity
          style={styles.actionBtnOuter}
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
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isPendingApproval ? ['#94A3B8', '#64748B'] : ['#06BF7B', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradientBtn}
          >
            <View style={styles.actionBtnIconCircle}>
              <Ionicons
                name={isPendingApproval ? 'lock-closed' : isOnline ? 'pause' : 'play'}
                size={16}
                color={isPendingApproval ? '#94A3B8' : '#06BF7B'}
              />
            </View>
            <Text style={styles.actionGradientBtnText}>
              {isPendingApproval ? 'Approval Pending' : isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Blue Order History Button */}
        <TouchableOpacity
          style={styles.actionBtnOuter}
          onPress={() => setSubScreen('DutyHistory')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#2676F4', '#1E40AF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradientBtn}
          >
            <View style={styles.actionBtnIconCircle}>
              <Ionicons name="reader-outline" size={16} color="#2676F4" />
            </View>
            <Text style={styles.actionGradientBtnText}>Order History →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 6. PROMOTIONAL BANNER: DELIVER MORE, EARN MORE! */}
      <LinearGradient
        colors={['#FF21A7', '#B5179E', '#7209B7', '#25105F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.promoBannerWrap}
      >
        <View style={styles.promoLeftColumn}>
          <View style={styles.promoHeaderRow}>
            <Text style={styles.promoGiftIcon}>🎁</Text>
            <Text style={styles.promoTitleText}>Deliver More, Earn More!</Text>
          </View>
          <Text style={styles.promoSubtitleText}>
            Complete more orders & boost your earnings today!
          </Text>
          <TouchableOpacity
            style={styles.viewTipsPillBtn}
            onPress={() => setSubScreen('DutyHistory')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewTipsPillText}>View Tips →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promoRightImageWrap}>
          <Image
            source={require('../../../assets/BANNERSIDEBIKE.png')}
            style={styles.promoBikeImage}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* 7. LIVE GPS AND HUB INFORMATION CARD */}
      <View style={[styles.liveGpsDarkCard, !detectedHubName && { borderColor: '#DC2626', borderWidth: 1.5 }]}>
        {/* Top Header: LIVE GPS + Controls */}
        <View style={styles.gpsCardHeaderRow}>
          <View style={styles.liveGpsIndicatorRow}>
            <View style={[styles.pulseDotGreen, !detectedHubName && { backgroundColor: '#DC2626' }]} />
            <Text style={[styles.liveGpsHeaderTitle, !detectedHubName && { color: '#FCA5A5' }]}>
              {detectedHubName ? 'LIVE GPS' : 'LOCATION ERROR'}
            </Text>
          </View>

          <View style={styles.gpsControlButtonsRow}>
            <TouchableOpacity
              style={styles.autoGpsPillBtn}
              onPress={async () => {
                setIsDetecting(true);
                await detectLocation();
                setIsDetecting(false);
              }}
              disabled={isDetecting}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isDetecting ? 'sync-outline' : 'flash'}
                size={11}
                color="#06BF7B"
                style={{ marginRight: 3 }}
              />
              <Text style={styles.autoGpsPillText}>
                {isDetecting ? '...' : 'Auto-GPS'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hub / Area Name */}
        <View style={styles.gpsLocationInfoRow}>
          <Ionicons
            name={detectedHubName ? "location" : "alert-circle"}
            size={18}
            color={detectedHubName ? "#2676F4" : "#DC2626"}
            style={{ marginTop: 2, marginRight: 6 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.gpsHubNameText, !detectedHubName && { color: '#FCA5A5' }]} numberOfLines={1}>
              {detectedHubName ? detectedHubName.split('(')[0].trim() : (isDetecting ? 'Detecting Nearest Hub...' : 'NO SERVICEABLE HUB')}
            </Text>
            <Text style={[styles.gpsHubAddressText, !detectedHubName && { color: '#F87171' }]} numberOfLines={2}>
              {detectedHubName
                ? detectedAddress
                : (locationError || (isDetecting ? 'Fetching your real GPS location...' : 'Please turn on GPS and move to an active delivery area.'))}
            </Text>
          </View>

          {/* Mini Stylized Map Indicator Graphic */}
          <View style={styles.miniMapGraphicWrap}>
            <View style={styles.miniMapRouteLine} />
            <View style={styles.miniMapPinMarker}>
              <Ionicons name="location" size={18} color={detectedHubName ? "#F51BA0" : "#DC2626"} />
            </View>
          </View>
        </View>
      </View>

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

      {/* 8. INCOMING JOB OFFER CARD (Priority Offer Gate) */}
      {incomingJobOffer && (
        <View style={styles.offerCard}>
          <View style={styles.orderCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              <View style={styles.offerPill}>
                <View style={styles.offerPulseDot} />
                <Text style={styles.offerPillText}>INCOMING JOB OFFER</Text>
              </View>
              <View style={styles.deliveryOrderBadge}>
                <Ionicons name="bicycle" size={11} color="#059669" />
                <Text style={styles.deliveryOrderBadgeText}>DELIVERY ORDER</Text>
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
              <Text style={styles.locSubText}>
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
              <Text style={styles.locSubText}>
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

      {/* 9. ACTIVE DELIVERY CARD */}
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
        /* Out of Radius / Location Error State Card */
        isOnline && !detectedHubName ? (
          <View style={[styles.waitingCard, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}>
            <View style={[styles.radarIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={36} color="#DC2626" />
            </View>
            <Text style={[styles.waitingTitle, { color: '#DC2626' }]}>
              No Dark Store Nearby
            </Text>
            <Text style={[styles.waitingSub, { color: '#7F1D1D' }]}>
              {locationError || 'You are outside our delivery radius (10 km). Please move closer to a serviceable dark store area to receive orders.'}
            </Text>
            <TouchableOpacity
              style={[styles.testDispatchBtn, { borderColor: '#DC2626' }]}
              onPress={async () => {
                setIsDetecting(true);
                await detectLocation();
                setIsDetecting(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={[styles.testDispatchText, { color: '#DC2626' }]}>Retry Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Idle Waiting State Card */
          <View style={styles.waitingCard}>
            <View style={styles.radarIconWrap}>
              <Ionicons name="radio-outline" size={36} color="#F51BA0" />
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
                <Ionicons name="refresh" size={14} color="#F51BA0" style={{ marginRight: 6 }} />
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
          </View>
        )
      ) : null}

      {/* Available Jobs Board Notification Banner */}
      {availableJobs && availableJobs.length > 0 && !isPendingApproval && (
        <TouchableOpacity
          style={styles.availableJobsCard}
          onPress={() => setCurrentTab('Deliveries')}
          activeOpacity={0.85}
        >
          <View style={styles.availableJobsLeft}>
            <View style={styles.availableBadgeCount}>
              <Text style={styles.availableBadgeCountText}>{availableJobs.length}</Text>
            </View>
            <View>
              <Text style={styles.availableJobsTitle}>New Deliveries Ready in Area</Text>
              <Text style={styles.availableJobsSub}>Tap to view and accept batch orders</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.secondaryText} />
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpacer} />

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
    backgroundColor: '#F8F9FD',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
  },
  bottomSpacer: {
    height: 20,
  },

  // 1. Welcome Section
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 2,
    position: 'relative',
    minHeight: 80,
  },
  welcomeTextColumn: {
    flex: 1,
    paddingRight: 8,
  },
  welcomeGreetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10215A',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#657493',
    marginTop: 3,
  },
  welcomeRiderImgWrap: {
    width: 110,
    height: 90,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  welcomeRiderImg: {
    width: '100%',
    height: '100%',
  },

  // 2. Main Today's Total Earnings Card
  mainEarningsCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#7227DF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCoinsWrap: {
    position: 'absolute',
    top: 8,
    right: 90,
    flexDirection: 'row',
    gap: 12,
    opacity: 0.9,
  },
  floatingCoinOne: {
    fontSize: 18,
    transform: [{ rotate: '15deg' }],
  },
  floatingCoinTwo: {
    fontSize: 14,
    transform: [{ rotate: '-10deg' }],
    marginTop: 4,
  },
  earningsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletIllustrationWrap: {
    marginRight: 12,
  },
  walletInnerBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  walletCoinPill: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  walletCoinPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  earningsCenterWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  earningsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.95,
  },
  earningsAmountValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 1,
  },
  deliveredCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deliveredCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.92,
  },
  khataDetailsBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  khataDetailsText: {
    color: '#10215A',
    fontSize: 12,
    fontWeight: '800',
  },

  // 3 & 4. Three Cards Rows (Financial and Performance)
  threeCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0D7FA',
    shadowColor: '#10215A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'flex-start',
  },
  metricCardAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricCurrencySymbol: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10215A',
    marginBottom: 2,
  },
  metricValueText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10215A',
    letterSpacing: -0.3,
  },
  metricTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  metricTrendText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  metricSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#657493',
    marginTop: 2,
  },
  sparklineContainer: {
    width: '100%',
    height: 18,
    marginTop: 2,
  },

  // 5. Action Buttons (Go Offline + Order History)
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
    marginBottom: 14,
  },
  actionBtnOuter: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionGradientBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionBtnIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGradientBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // 6. Promotional Banner
  promoBannerWrap: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#7209B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  promoLeftColumn: {
    flex: 1,
    paddingRight: 8,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  promoGiftIcon: {
    fontSize: 15,
  },
  promoTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  promoSubtitleText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
    fontWeight: '500',
  },
  viewTipsPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  viewTipsPillText: {
    color: '#25105F',
    fontSize: 11,
    fontWeight: '800',
  },
  promoRightImageWrap: {
    width: 120,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBikeImage: {
    width: '100%',
    height: '100%',
  },

  // 7. Live GPS Card
  liveGpsDarkCard: {
    backgroundColor: '#0D153B',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gpsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveGpsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06BF7B',
  },
  liveGpsHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gpsControlButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoGpsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 191, 123, 0.18)',
    borderColor: '#06BF7B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  autoGpsPillText: {
    color: '#06BF7B',
    fontSize: 11,
    fontWeight: '800',
  },
  hubsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  hubsPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  gpsLocationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsHubNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  gpsHubAddressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  miniMapGraphicWrap: {
    width: 44,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 8,
  },
  miniMapRouteLine: {
    position: 'absolute',
    width: 28,
    height: 2,
    backgroundColor: '#2676F4',
    transform: [{ rotate: '25deg' }],
  },
  miniMapPinMarker: {
    position: 'absolute',
    top: 4,
    right: 6,
  },

  // 8. Alerts & Administrative Notice Styles
  pendingReviewBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingReviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  pendingIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
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
    marginTop: 1,
  },
  pendingBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  redLockAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redLockAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  redLockIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redLockAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  redLockAlertSubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  redLockSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  redLockSettleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  pendingVerifCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingVerifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  pendingVerifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingVerifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingVerifSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  pendingVerifBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingVerifBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },

  // Pay Admin Button
  payAdminActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  payAdminActionBtnBlocked: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  payAdminGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  payAdminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  payAdminIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payAdminTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  payAdminSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    marginTop: 1,
  },
  payAdminRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payAdminBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  payAdminBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '900',
  },

  // 9. Operational Cards (Incoming Offer, Active Delivery, Waiting)
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F51BA0',
    shadowColor: '#F51BA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderColor: '#F51BA0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  offerPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F51BA0',
  },
  offerPillText: {
    color: '#F51BA0',
    fontSize: 10,
    fontWeight: '900',
  },
  deliveryOrderBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryOrderBadgeText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 10,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10215A',
  },
  orderRouteRow: {
    marginBottom: 12,
  },
  locationBlock: {
    flex: 1,
  },
  locLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#657493',
    letterSpacing: 0.5,
  },
  locTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10215A',
    marginTop: 1,
  },
  locSubText: {
    color: '#657493',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  orderMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    borderRadius: 10,
    padding: 8,
    gap: 6,
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 11,
    color: '#657493',
    fontWeight: '600',
  },
  metaPayout: {
    fontSize: 11,
    color: '#06BF7B',
    fontWeight: '800',
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  offerRejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerRejectText: {
    color: '#657493',
    fontWeight: '700',
    fontSize: 13,
  },
  offerAcceptBtn: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#06BF7B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerAcceptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Active Order Card
  activeOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#2676F4',
    shadowColor: '#2676F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#2676F4',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2676F4',
  },
  activePillText: {
    color: '#2676F4',
    fontSize: 10,
    fontWeight: '900',
  },
  viewDeliveryBtn: {
    backgroundColor: '#2676F4',
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  viewDeliveryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Waiting Card
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0D7FA',
  },
  radarIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  waitingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10215A',
    textAlign: 'center',
    marginBottom: 4,
  },
  waitingSub: {
    fontSize: 12,
    color: '#657493',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 290,
    marginBottom: 12,
  },
  testDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#F0D7FA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  testDispatchText: {
    color: '#F51BA0',
    fontSize: 12,
    fontWeight: '800',
  },
  goOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06BF7B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goOnlineText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Available Jobs Board Banner
  availableJobsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0D7FA',
    marginBottom: 14,
  },
  availableJobsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availableBadgeCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F51BA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  availableJobsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10215A',
  },
  availableJobsSub: {
    fontSize: 11,
    color: '#657493',
  },

  // Hub Switcher Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  hubModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  hubModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  hubModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10215A',
  },
  hubModalSub: {
    fontSize: 11.5,
    color: '#657493',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 4,
  },
  hubItemCard: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEFF8',
  },
  hubItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10215A',
  },
  hubItemAddress: {
    fontSize: 11,
    color: '#657493',
    marginTop: 2,
  },
  hubItemCoords: {
    fontSize: 10,
    color: '#9AA5BC',
    marginTop: 2,
  },
  hubSelectArrow: {
    backgroundColor: '#F51BA0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hubSelectArrowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  realGpsRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
  },
  realGpsRestoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10215A',
  },
});
