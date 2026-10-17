import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { COLORS } from '../../theme/colors';
import { RiderChatModal } from '../../components/modals/RiderChatModal';
import { RiderNavigationMap } from '../../components/RiderNavigationMap';
import { NavigationScreen } from './NavigationScreen';

const RIDER_STAGES = [
  { id: 'ACCEPTED', label: 'Order Accepted', desc: 'Job confirmed & active delivery' },
  { id: 'GOING_TO_STORE', label: 'Going to Store', desc: 'Heading towards dark store / warehouse' },
  { id: 'ARRIVED_AT_STORE', label: 'Arrived at Store', desc: 'At dark store awaiting package handover' },
  { id: 'PICKED_UP', label: 'Picked Up Package', desc: 'Package verified and sealed' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'On route to customer doorstep' },
  { id: 'DELIVERED', label: 'Delivered to Customer', desc: 'Handover complete & OTP verified' },
];

export const CurrentDeliveryScreen: React.FC = () => {
  const {
    activeDelivery,
    advanceStep,
    setShowOtpModal,
    setShowPickupModal,
    setShowUnavailableModal,
    fetchNewOrder,
    profile,
    availableJobs,
    jobsError,
    refreshAvailableJobs,
    acceptDelivery,
    dismissJob,
    currentLocation,
  } = useRider();

  const [isNavScreenOpen, setIsNavScreenOpen] = useState(false);
  const [navMode, setNavMode] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');

  const hasActiveJob = Boolean(
    activeDelivery &&
    activeDelivery.stepStatus !== 'OFFERED'
  );

  // Screen Tabs: Active vs Available Jobs vs Completed History
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'AVAILABLE' | 'HISTORY'>(
    hasActiveJob ? 'ACTIVE' : 'AVAILABLE'
  );
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // History State
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedPastOrder, setSelectedPastOrder] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await RiderApiService.getOrderHistory();
      setHistoryOrders(data || []);
    } catch (e) {
      console.warn('Error loading history in screen:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    refreshAvailableJobs();
  }, [loadHistory, refreshAvailableJobs]);

  useEffect(() => {
    if (hasActiveJob) {
      setActiveTab('ACTIVE');
    }
  }, [hasActiveJob]);

  // Active step and stage calculations (6-step Rider Action Flow)
  const stepStatus = activeDelivery?.stepStatus || 'OFFERED';
  let currentStageIndex = 0; // Default: Order Accepted
  if (stepStatus === 'GOING_TO_STORE') {
    currentStageIndex = 1;
  } else if (stepStatus === 'ARRIVED_AT_STORE') {
    currentStageIndex = 2;
  } else if (
    (stepStatus as string) === 'PICKUP_VERIFIED' ||
    stepStatus === 'PICKED_UP'
  ) {
    currentStageIndex = 3;
  } else if (
    stepStatus === 'OUT_FOR_DELIVERY' ||
    stepStatus === 'ARRIVED_AT_CUSTOMER'
  ) {
    currentStageIndex = 4;
  } else if (stepStatus === 'DELIVERED') {
    currentStageIndex = 5;
  }

  // Format timestamp for each step
  const getStageTime = (stageId: string, stageLabel: string) => {
    const rawTime = activeDelivery?.acceptedAt || activeDelivery?.assignedAt || activeDelivery?.createdAt;
    if (stageId === 'ACCEPTED' && rawTime) {
      try {
        const d = new Date(rawTime);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }
    if (activeDelivery?.statusHistory && activeDelivery.statusHistory.length > 0) {
      const match = activeDelivery.statusHistory.find(
        (h) => h.stage?.toLowerCase() === stageLabel?.toLowerCase() || h.status?.toLowerCase() === stageId?.toLowerCase()
      );
      if (match?.timestamp) {
        try {
          const d = new Date(match.timestamp);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          return '';
        }
      }
    }
    return '';
  };

  const handleCall = async (title: string, phone: string) => {
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Call ${title}`, `Direct dialer not supported on this device. Phone: ${phone}`);
      }
    } catch {
      Alert.alert(`Calling ${title}`, `Dialing ${phone}...`);
    }
  };

  const handleOpenMap = async (title: string, coords?: { latitude: number; longitude: number }, address?: string) => {
    let url = '';
    if (coords && coords.latitude && coords.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
    } else if (address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    } else {
      Alert.alert('Location unavailable', 'Coordinates for navigation could not be resolved.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('GPS Navigation', `Navigating to ${title}: ${url}`);
    }
  };

  const formatPastDate = (dateVal?: string | Date) => {
    if (!dateVal) return 'Recent';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  const getLiveTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Live 1m ago';
    try {
      const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      return `Live ${diffMins}m ago`;
    } catch {
      return 'Live 1m ago';
    }
  };

  const progressPercent = Math.round(
    ((currentStageIndex + (stepStatus === 'DELIVERED' ? 1 : 0.5)) / RIDER_STAGES.length) * 100
  );

  if (isNavScreenOpen && activeDelivery) {
    return (
      <NavigationScreen
        modeOverride={navMode}
        onBack={() => setIsNavScreenOpen(false)}
      />
    );
  }

  return (
    <View style={styles.mainWrapper}>
      {/* Top Segmented Navigation Tabs */}
      <View style={styles.topTabsBar}>
        <TouchableOpacity
          style={[styles.topTabButton, activeTab === 'ACTIVE' && styles.topTabButtonActive]}
          onPress={() => setActiveTab('ACTIVE')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={activeTab === 'ACTIVE' ? "flash" : "flash-outline"} size={13} color={activeTab === 'ACTIVE' ? COLORS.white : '#94A3B8'} />
            <Text style={[styles.topTabButtonText, activeTab === 'ACTIVE' && styles.topTabButtonTextActive]}>
              Active ({hasActiveJob ? '1' : '0'})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabButton, activeTab === 'AVAILABLE' && styles.topTabButtonActive]}
          onPress={() => {
            setActiveTab('AVAILABLE');
            refreshAvailableJobs();
          }}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={activeTab === 'AVAILABLE' ? "cube" : "cube-outline"} size={13} color={activeTab === 'AVAILABLE' ? COLORS.white : '#94A3B8'} />
            <Text style={[styles.topTabButtonText, activeTab === 'AVAILABLE' && styles.topTabButtonTextActive]}>
              Available ({availableJobs.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabButton, activeTab === 'HISTORY' && styles.topTabButtonActive]}
          onPress={() => {
            setActiveTab('HISTORY');
            loadHistory();
          }}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name={activeTab === 'HISTORY' ? "time" : "time-outline"} size={13} color={activeTab === 'HISTORY' ? COLORS.white : '#94A3B8'} />
            <Text style={[styles.topTabButtonText, activeTab === 'HISTORY' && styles.topTabButtonTextActive]}>
              History ({historyOrders.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ===================================================================== */}
      {/* TAB 1: ACTIVE DELIVERY VIEW                                           */}
      {/* ===================================================================== */}
      {activeTab === 'ACTIVE' && (
        hasActiveJob && activeDelivery ? (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Top Order Badge Header */}
            <View style={styles.topHeaderBar}>
              <View style={styles.statusBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.statusBadgeText}>{stepStatus.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.orderIdBadgeText}>{activeDelivery.orderNumber}</Text>
            </View>

            {/* 6-STEP RIDER ACTION FLOW TIMELINE */}
            <View style={styles.timelineCard}>
              <TouchableOpacity
                style={styles.timelineHeader}
                onPress={() => setIsTimelineExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={styles.timelineHeaderLeft}>
                  <View style={styles.timelineIconWrap}>
                    <Ionicons name="bicycle-outline" size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={styles.timelineTitle}>Rider Action Flow</Text>
                    <Text style={styles.timelineSub}>
                      Step {currentStageIndex + 1} of 6 • {RIDER_STAGES[currentStageIndex]?.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineHeaderRight}>
                  <View style={styles.progressPercentBadge}>
                    <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                  </View>
                  <Ionicons
                    name={isTimelineExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.secondaryText}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>

              {isTimelineExpanded && (
                <View style={styles.stagesList}>
                  {RIDER_STAGES.map((st, idx) => {
                    const isDone = idx < currentStageIndex || (idx === currentStageIndex && stepStatus === 'DELIVERED');
                    const isCurrent = idx === currentStageIndex && stepStatus !== 'DELIVERED';
                    const isPending = idx > currentStageIndex;
                    const stepTime = getStageTime(st.id, st.label);

                    return (
                      <View key={st.id} style={styles.stepRow}>
                        <View style={styles.indicatorColumn}>
                          <View
                            style={[
                              styles.indicatorCircle,
                              isDone && styles.indicatorDone,
                              isCurrent && styles.indicatorCurrent,
                              isPending && styles.indicatorPending,
                            ]}
                          >
                            {isDone ? (
                              <Ionicons name="checkmark" size={13} color={COLORS.white} />
                            ) : isCurrent ? (
                              <View style={styles.innerPulseDot} />
                            ) : (
                              <Text style={styles.pendingStepNum}>{idx + 1}</Text>
                            )}
                          </View>

                          {idx < RIDER_STAGES.length - 1 && (
                            <View
                              style={[
                                styles.verticalLine,
                                isDone && styles.verticalLineDone,
                                isCurrent && styles.verticalLineCurrent,
                              ]}
                            />
                          )}
                        </View>

                        <View style={[styles.stepContent, isCurrent && styles.stepContentActive]}>
                          <View style={styles.stepTitleRow}>
                            <Text
                              style={[
                                styles.stepLabel,
                                isDone && styles.stepLabelDone,
                                isCurrent && styles.stepLabelCurrent,
                                isPending && styles.stepLabelPending,
                              ]}
                            >
                              {st.label}
                            </Text>

                            {stepTime ? (
                              <View style={styles.timestampBadge}>
                                <Ionicons name="time-outline" size={11} color="#64748B" style={{ marginRight: 3 }} />
                                <Text style={styles.timestampText}>{stepTime}</Text>
                              </View>
                            ) : isCurrent ? (
                              <View style={styles.currentActiveBadge}>
                                <Text style={styles.currentActiveBadgeText}>ACTIVE NOW</Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[
                              styles.stepDesc,
                              isCurrent && styles.stepDescCurrent,
                              isPending && styles.stepDescPending,
                            ]}
                          >
                            {st.desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* NEXT ACTION HUB */}
            <View style={styles.nextActionCard}>
              <View style={styles.nextActionHeader}>
                <View style={styles.nextActionHeaderLeft}>
                  <View style={styles.nextActionPulseDot} />
                  <Text style={styles.nextActionHeaderTitle}>
                    {stepStatus === 'GOING_TO_STORE' && 'STAGE 1: TRAVEL TO DARK STORE'}
                    {stepStatus === 'ARRIVED_AT_STORE' && 'STAGE 2: COLLECT & VERIFY PACKAGE'}
                    {(stepStatus === 'PICKED_UP' || (stepStatus as string) === 'PICKUP_VERIFIED') && 'STAGE 3: DISPATCH & TRANSIT'}
                    {stepStatus === 'OUT_FOR_DELIVERY' && 'STAGE 4: DELIVER TO CUSTOMER'}
                    {stepStatus === 'ARRIVED_AT_CUSTOMER' && 'STAGE 5: DOORSTEP HANDOVER & OTP'}
                    {stepStatus === 'DELIVERED' && 'DELIVERY COMPLETED'}
                  </Text>
                </View>

                <View style={styles.quickContactRow}>
                  {/* Store Contacts if going to/at store */}
                  {(stepStatus === 'GOING_TO_STORE' || stepStatus === 'ARRIVED_AT_STORE') && (
                    <TouchableOpacity
                      style={styles.quickContactBtn}
                      onPress={() => handleCall('Dark Store', activeDelivery.storePhone || '+917940008899')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={13} color="#2563EB" />
                      <Text style={styles.quickContactText}>Call Store</Text>
                    </TouchableOpacity>
                  )}

                  {/* Customer Contacts if transit/doorstep */}
                  {(stepStatus === 'PICKED_UP' || (stepStatus as string) === 'PICKUP_VERIFIED' || stepStatus === 'OUT_FOR_DELIVERY' || stepStatus === 'ARRIVED_AT_CUSTOMER') && (
                    <>
                      <TouchableOpacity
                        style={[styles.quickContactBtn, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => setIsChatModalOpen(true)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color="#6366F1" />
                        <Text style={[styles.quickContactText, { color: '#6366F1' }]}>Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickContactBtn}
                        onPress={() => handleCall(activeDelivery.customerName || 'Customer', activeDelivery.customerPhone)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="call-outline" size={13} color="#2563EB" />
                        <Text style={styles.quickContactText}>Call</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Target Location / Info Details */}
              {(stepStatus === 'GOING_TO_STORE' || stepStatus === 'ARRIVED_AT_STORE') ? (
                <View style={styles.actionInfoBox}>
                  <View style={styles.actionTargetBadge}>
                    <Ionicons name="storefront-outline" size={14} color="#D97706" />
                    <Text style={styles.actionTargetBadgeText}>PICKUP STORE LOCATION</Text>
                  </View>
                  <Text style={styles.actionTargetName}>{activeDelivery.storeName}</Text>
                  <Text style={styles.actionTargetAddress}>{activeDelivery.storeAddress}</Text>

                  <View style={styles.orderSummaryChipRow}>
                    <View style={styles.summaryChip}>
                      <Ionicons name="cube-outline" size={12} color="#475569" />
                      <Text style={styles.summaryChipText}>{activeDelivery.itemCount || activeDelivery.items?.length || 1} items</Text>
                    </View>
                    {activeDelivery.hasPrintJob && (
                      <View style={[styles.summaryChip, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                        <Ionicons name="print-outline" size={12} color="#DB2777" />
                        <Text style={[styles.summaryChipText, { color: '#BE185D' }]}>Print Job</Text>
                      </View>
                    )}
                  </View>

                  {/* Live In-App Navigation Map (Rider -> Store) */}
                  <View style={{ marginVertical: 12, borderRadius: 14, overflow: 'hidden' }}>
                    <RiderNavigationMap
                      mode="PICKUP"
                      riderCoords={currentLocation ? {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      } : null}
                      riderHeading={currentLocation?.heading || 0}
                      targetCoords={activeDelivery.storeCoordinates ? {
                        latitude: activeDelivery.storeCoordinates.latitude,
                        longitude: activeDelivery.storeCoordinates.longitude,
                      } : null}
                      targetName={activeDelivery.storeName || 'Dark Store'}
                      targetAddress={activeDelivery.storeAddress}
                      distanceKm={activeDelivery.distanceKm || 1.2}
                      height={240}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.actionNavBtn}
                    onPress={() => {
                      setNavMode('PICKUP');
                      setIsNavScreenOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color="#1E293B" style={{ marginRight: 6 }} />
                    <Text style={styles.actionNavBtnText}>START TURN-BY-TURN NAVIGATION</Text>
                  </TouchableOpacity>

                  {/* Items breakdown when at store */}
                  {stepStatus === 'ARRIVED_AT_STORE' && activeDelivery.items && activeDelivery.items.length > 0 && (
                    <View style={styles.itemsVerificationSection}>
                      <Text style={styles.itemsVerificationTitle}>Items to Collect:</Text>
                      {activeDelivery.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={styles.itemQty}>{item.quantity}x</Text>
                          <Text style={styles.itemName}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.actionInfoBox}>
                  <View style={[styles.actionTargetBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Ionicons name="location-outline" size={14} color="#059669" />
                    <Text style={[styles.actionTargetBadgeText, { color: '#047857' }]}>CUSTOMER DROP LOCATION</Text>
                  </View>
                  <Text style={styles.actionTargetName}>{activeDelivery.customerName || 'Customer'}</Text>
                  {activeDelivery.customerPhone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="call-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.actionTargetPhone}>{activeDelivery.customerPhone}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.actionTargetAddress}>{activeDelivery.customerAddress}</Text>

                  {activeDelivery.deliveryInstructions ? (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsLabel}>Delivery Instructions:</Text>
                      <Text style={styles.instructionsText}>"{activeDelivery.deliveryInstructions}"</Text>
                    </View>
                  ) : null}

                  <View style={[styles.paymentBanner, activeDelivery.paymentMethod === 'COD' && activeDelivery.paymentStatus !== 'COMPLETED' ? styles.paymentBannerCod : styles.paymentBannerPrepaid]}>
                    <Ionicons
                      name={activeDelivery.paymentMethod === 'COD' && activeDelivery.paymentStatus !== 'COMPLETED' ? "cash-outline" : "checkmark-circle-outline"}
                      size={16}
                      color={activeDelivery.paymentMethod === 'COD' && activeDelivery.paymentStatus !== 'COMPLETED' ? "#B45309" : "#047857"}
                    />
                    <Text style={[styles.paymentBannerText, activeDelivery.paymentMethod === 'COD' && activeDelivery.paymentStatus !== 'COMPLETED' ? styles.paymentTextCod : styles.paymentTextPrepaid]}>
                      {activeDelivery.paymentMethod === 'COD' && activeDelivery.paymentStatus !== 'COMPLETED'
                        ? `Collect Cash on Delivery: ₹${activeDelivery.orderAmount}`
                        : `Prepaid Order (₹0 to collect)`}
                    </Text>
                  </View>

                  {/* Live In-App Navigation Map (Store -> Customer) */}
                  <View style={{ marginVertical: 12, borderRadius: 14, overflow: 'hidden' }}>
                    <RiderNavigationMap
                      mode="DELIVERY"
                      riderCoords={currentLocation ? {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      } : null}
                      riderHeading={currentLocation?.heading || 0}
                      targetCoords={activeDelivery.customerCoordinates ? {
                        latitude: activeDelivery.customerCoordinates.latitude,
                        longitude: activeDelivery.customerCoordinates.longitude,
                      } : null}
                      targetName={activeDelivery.customerName || 'Customer'}
                      targetAddress={activeDelivery.customerAddress}
                      distanceKm={activeDelivery.distanceKm || 2.4}
                      height={240}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.actionNavBtn}
                    onPress={() => {
                      setNavMode('DELIVERY');
                      setIsNavScreenOpen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color="#1E293B" style={{ marginRight: 6 }} />
                    <Text style={styles.actionNavBtnText}>START TURN-BY-TURN NAVIGATION</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Context-Sensitive Primary CTA Buttons */}
              {stepStatus === 'GOING_TO_STORE' && (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => advanceStep('ARRIVED_AT_STORE')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>I HAVE ARRIVED AT STORE</Text>
                </TouchableOpacity>
              )}

              {stepStatus === 'ARRIVED_AT_STORE' && (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => setShowPickupModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cube" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>CONFIRM PICKUP & DISPATCH</Text>
                </TouchableOpacity>
              )}

              {(stepStatus === 'PICKED_UP' || (stepStatus as string) === 'PICKUP_VERIFIED') && (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => advanceStep('OUT_FOR_DELIVERY')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>START TRANSIT TO CUSTOMER</Text>
                </TouchableOpacity>
              )}

              {stepStatus === 'OUT_FOR_DELIVERY' && (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => advanceStep('ARRIVED_AT_CUSTOMER')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="location" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>I HAVE ARRIVED AT CUSTOMER</Text>
                </TouchableOpacity>
              )}

              {stepStatus === 'ARRIVED_AT_CUSTOMER' && (
                <>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#7C3AED' }]}
                    onPress={() => setShowOtpModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="key" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionBtnText}>ENTER CUSTOMER OTP TO DELIVER</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.unavailableBtn, { flexDirection: 'row', justifyContent: 'center' }]}
                    onPress={() => setShowUnavailableModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} style={{ marginRight: 6 }} />
                    <Text style={styles.unavailableBtnText}>Customer Not Available / Refused</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : (
          /* Empty State for Active Deliveries */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBubble}>
              <Ionicons name="bicycle" size={44} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No Active Delivery</Text>
            <Text style={styles.emptySub}>
              You are ready for assignments. When a dark store dispatches a new order near your hub, it will appear here.
            </Text>
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={fetchNewOrder}
              activeOpacity={0.85}
            >
              <Ionicons name="flash-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.simulateBtnText}>Check For New Delivery Job</Text>
            </TouchableOpacity>

            {availableJobs.length > 0 && (
              <TouchableOpacity
                style={[styles.viewHistoryLinkBtn, { marginTop: 8 }]}
                onPress={() => setActiveTab('AVAILABLE')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="flash" size={14} color="#4F46E5" />
                  <Text style={[styles.viewHistoryLinkText, { color: '#4F46E5', fontWeight: '700' }]}>
                    {availableJobs.length} Available Job{availableJobs.length > 1 ? 's' : ''} Ready To Accept
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.viewHistoryLinkBtn}
              onPress={() => {
                setActiveTab('HISTORY');
                loadHistory();
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={14} color="#4F46E5" />
                <Text style={styles.viewHistoryLinkText}>View Completed Delivery History</Text>
                <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
              </View>
            </TouchableOpacity>
          </View>
        )
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AVAILABLE JOBS BOARD VIEW                                      */}
      {/* ===================================================================== */}
      {activeTab === 'AVAILABLE' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingJobs}
              onRefresh={async () => {
                setIsRefreshingJobs(true);
                await refreshAvailableJobs();
                setIsRefreshingJobs(false);
              }}
            />
          }
        >
          <View style={styles.historyHeaderRow}>
            <View>
              <Text style={styles.historySectionTitle}>Available Delivery Jobs</Text>
              <Text style={styles.jobBoardSubtitle}>Accept new order requests or dismiss to skip</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                setIsRefreshingJobs(true);
                await refreshAvailableJobs();
                setIsRefreshingJobs(false);
              }}
              style={styles.refreshIconBtn}
            >
              <Ionicons name="refresh" size={16} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {jobsError ? (
            <View style={styles.errorBannerBox}>
              <View style={[styles.emptyIconBubble, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={40} color="#EF4444" />
              </View>
              <Text style={[styles.emptyTitle, { color: '#991B1B' }]}>Failed to Load Jobs</Text>
              <Text style={styles.emptySub}>{jobsError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={async () => {
                  setIsRefreshingJobs(true);
                  await refreshAvailableJobs();
                  setIsRefreshingJobs(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Ionicons name="refresh" size={14} color={COLORS.white} />
                  <Text style={styles.retryButtonText}>Tap to Retry</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : availableJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBubble, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="file-tray-outline" size={38} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Live Jobs Available</Text>
              <Text style={styles.emptySub}>
                New orders will appear here as soon as they are placed. Pull down to refresh.
              </Text>
            </View>
          ) : (
            availableJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                {/* 1. Header: Order & Live Age Badge */}
                <View style={styles.jobCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="notifications-outline" size={13} color={COLORS.navy} />
                      <Text style={styles.jobOrderNumber}>Order {job.orderNumber}</Text>
                    </View>
                    {job.isFromOwnHub === false ? (
                      <View style={{ backgroundColor: '#FFF3E0', borderColor: '#FF9800', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="navigate" size={10} color="#E65100" />
                        <Text style={{ color: '#E65100', fontWeight: '800', fontSize: 10 }}>
                          NEARBY ({job.distanceToStoreKm ?? '0'} km)
                        </Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="storefront" size={10} color="#2E7D32" />
                        <Text style={{ color: '#2E7D32', fontWeight: '800', fontSize: 10 }}>
                          HOME HUB
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.freshBadge}>
                    <Ionicons name="time-outline" size={11} color="#4F46E5" style={{ marginRight: 3 }} />
                    <Text style={styles.freshBadgeText}>{getLiveTimeAgo(job.createdAt || job.offeredAt)}</Text>
                  </View>
                </View>

                {/* 2. Key Metrics Strip: Earning, Distance, ETA */}
                <View style={styles.jobMetricsStrip}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="wallet-outline" size={13} color={COLORS.onlineGreen} />
                    <Text style={styles.metricItemVal}>₹{job.payoutAmount ?? 35}</Text>
                  </View>
                  <Text style={styles.metricDotSep}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="navigate-outline" size={13} color={COLORS.navy} />
                    <Text style={styles.metricItemVal}>{job.distanceKm || '2.1'} km</Text>
                  </View>
                  <Text style={styles.metricDotSep}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="time-outline" size={13} color={COLORS.navy} />
                    <Text style={styles.metricItemVal}>{job.etaMinutes || '12'} min</Text>
                  </View>
                </View>

                {/* 3. Pickup & Drop Locations */}
                <View style={styles.jobRouteBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="storefront-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.routeRowText} numberOfLines={1}>
                      <Text style={styles.routeRowLabel}>Pickup: </Text>{job.storeName || 'Wom Up Ahmedabad Central Hub'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="location-outline" size={13} color={COLORS.hotPink} />
                    <Text style={styles.routeRowText} numberOfLines={1}>
                      <Text style={styles.routeRowLabel}>Drop: </Text>{job.customerName || 'Customer'} ({job.customerAddress?.split(',')?.[0] || 'Satellite'})
                    </Text>
                  </View>
                </View>

                {/* 4. Items & Payment Mode */}
                <View style={styles.jobFooterMeta}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="cube-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.jobFooterMetaText}>
                      {job.itemCount || 1} item{job.itemCount > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.metricDotSep}>•</Text>
                    <Ionicons name="cash-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.jobFooterMetaText}>
                      {job.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Online'}
                    </Text>
                  </View>
                </View>

                {/* 5. Full Width Action Button */}
                <TouchableOpacity
                  style={styles.jobAcceptBtnFull}
                  onPress={() => acceptDelivery(job)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
                    <Text style={styles.jobAcceptBtnFullText}>ACCEPT DELIVERY</Text>
                  </View>
                </TouchableOpacity>

                {/* Optional Subtle Dismiss */}
                <TouchableOpacity
                  style={styles.jobDismissSubtleBtn}
                  onPress={() => dismissJob(job.id)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.jobDismissSubtleText}>Dismiss this offer</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: COMPLETED DELIVERIES HISTORY VIEW                             */}
      {/* ===================================================================== */}
      {activeTab === 'HISTORY' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoadingHistory} onRefresh={loadHistory} />}
        >
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historySectionTitle}>Delivered Orders Log</Text>
            <TouchableOpacity onPress={loadHistory} style={styles.refreshIconBtn}>
              <Ionicons name="refresh" size={16} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {isLoadingHistory ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading completed deliveries...</Text>
            </View>
          ) : historyOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBubble, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={44} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Past Deliveries Yet</Text>
              <Text style={styles.emptySub}>
                When you verify handover PINs and complete customer deliveries, your full records and payouts will be listed here.
              </Text>
            </View>
          ) : (
            historyOrders.map((item) => (
              <TouchableOpacity
                key={item.id || item.orderId}
                style={styles.historyCard}
                onPress={() => {
                  setSelectedPastOrder(item);
                  setIsDetailModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                {/* Top Row: Order Number + Delivered Badge */}
                <View style={styles.historyCardTop}>
                  <View style={styles.historyOrderNumberWrap}>
                    <Text style={styles.historyOrderNumber}>{item.orderNumber}</Text>
                    <Text style={styles.historyDateText}>{formatPastDate(item.date)}</Text>
                  </View>

                  <View style={styles.deliveredBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.deliveredBadgeText}>DELIVERED</Text>
                  </View>
                </View>

                {/* Route Row: Hub -> Drop Address */}
                <View style={styles.historyRouteBox}>
                  <View style={styles.routePointRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {item.storeName || 'Satellite Hub Dark Store'}
                    </Text>
                  </View>
                  <View style={styles.routeConnectorLine} />
                  <View style={styles.routePointRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {item.customerAddress || 'Customer Doorstep'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Customer Name, Items & Earnings Payout */}
                <View style={styles.historyCardBottom}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="person-outline" size={13} color={COLORS.textPrimary} />
                      <Text style={styles.historyCustomerName}>{item.customerName || 'Customer'}</Text>
                    </View>
                    <Text style={styles.historyItemsCount}>
                      {item.itemCount || 1} item{item.itemCount !== 1 ? 's' : ''} • {item.paymentMethod || 'PREPAID'}
                    </Text>
                  </View>

                  <View style={styles.historyEarningsBadge}>
                    <Text style={styles.historyEarningsLabel}>Payout</Text>
                    <Text style={styles.historyEarningsAmount}>
                      +₹{item.earnings?.totalEarned ?? item.earnings?.total ?? 70}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ===================================================================== */}
      {/* PAST ORDER DETAIL MODAL                                              */}
      {/* ===================================================================== */}
      <Modal
        visible={isDetailModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={20} color="#6366F1" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.modalHeaderTitle}>Order Details</Text>
                  <Text style={styles.modalHeaderSubtitle}>{selectedPastOrder?.orderNumber}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsDetailModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedPastOrder ? (
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 16 }}>
                {/* Status & Date Banner */}
                <View style={styles.modalStatusBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="shield-checkmark" size={20} color="#059669" style={{ marginRight: 8 }} />
                    <View>
                      <Text style={styles.bannerStatusTitle}>Delivered & PIN Verified</Text>
                      <Text style={styles.bannerDateSubtitle}>{formatPastDate(selectedPastOrder.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 3 }} />
                    <Text style={styles.ratingPillText}>{selectedPastOrder.rating || '5.0'}</Text>
                  </View>
                </View>

                {/* Route Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionHeader}>Delivery Route</Text>

                  <View style={styles.routeDetailBox}>
                    <View style={styles.routeDetailRow}>
                      <View style={[styles.routeDot, { backgroundColor: '#3B82F6', marginTop: 4 }]} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.routeDetailLabel}>PICKUP FROM DARK STORE</Text>
                        <Text style={styles.routeDetailValue}>{selectedPastOrder.storeName}</Text>
                        <Text style={styles.routeDetailSub}>{selectedPastOrder.storeAddress}</Text>
                      </View>
                    </View>

                    <View style={[styles.routeConnectorLine, { marginLeft: 5, height: 16 }]} />

                    <View style={styles.routeDetailRow}>
                      <View style={[styles.routeDot, { backgroundColor: '#10B981', marginTop: 4 }]} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.routeDetailLabel}>DELIVERED TO CUSTOMER</Text>
                        <Text style={styles.routeDetailValue}>{selectedPastOrder.customerName}</Text>
                        {selectedPastOrder.customerPhone ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Ionicons name="call-outline" size={13} color={COLORS.primary} />
                            <Text style={styles.routeDetailPhone}>{selectedPastOrder.customerPhone}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.routeDetailSub}>{selectedPastOrder.customerAddress}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Earnings & Settlement Breakdown Card */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionHeader}>Rider Earnings Breakdown</Text>
                  <View style={styles.earningsBreakdownCard}>
                    {(() => {
                      const base = Number(selectedPastOrder.earnings?.basePay ?? 48);
                      const inc = Number(selectedPastOrder.earnings?.incentive ?? 15);
                      const tip = Number(selectedPastOrder.earnings?.tip ?? 0);
                      const total = base + inc + tip;
                      return (
                        <>
                          <View style={styles.earningsRow}>
                            <Text style={styles.earningsRowLabel}>Base Delivery Pay</Text>
                            <Text style={styles.earningsRowVal}>₹{base}</Text>
                          </View>
                          <View style={styles.earningsRow}>
                            <Text style={styles.earningsRowLabel}>Peak / On-Time Incentive</Text>
                            <Text style={styles.earningsRowVal}>+₹{inc}</Text>
                          </View>
                          <View style={styles.earningsRow}>
                            <Text style={styles.earningsRowLabel}>Customer Doorstep Tip</Text>
                            <Text style={styles.earningsRowVal}>+₹{tip}</Text>
                          </View>
                          <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                            <Text style={styles.earningsTotalLabel}>Total Earned for Order</Text>
                            <Text style={styles.earningsTotalVal}>₹{total}</Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>

                {/* Items in Order */}
                {selectedPastOrder.items && selectedPastOrder.items.length > 0 ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionHeader}>Items Delivered ({selectedPastOrder.items.length})</Text>
                    <View style={styles.modalItemsList}>
                      {selectedPastOrder.items.map((it: any, i: number) => (
                        <View key={i} style={styles.modalItemRow}>
                          <Text style={styles.modalItemQty}>{it.quantity || 1}x</Text>
                          <Text style={styles.modalItemName}>{it.name}</Text>
                          <Text style={[styles.modalItemPrice, { color: COLORS.textMuted }]}>Packed</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => setIsDetailModalOpen(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalActionBtnText}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Real-time In-App Rider Chat Modal */}
      {activeDelivery && (
        <RiderChatModal
          visible={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          orderId={activeDelivery.id || (activeDelivery as any).orderId || ''}
          orderNumber={activeDelivery.orderNumber}
          customerName={activeDelivery.customerName || 'Customer'}
          customerPhone={activeDelivery.customerPhone}
          riderId={profile?.id || (profile as any)?._id || 'rider_current'}
          riderName={profile?.name || (profile as any)?.fullName || 'Delivery Partner'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    marginHorizontal: 4,
  },
  topTabButtonActive: {
    backgroundColor: '#4F46E5',
  },
  topTabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  topTabButtonTextActive: {
    color: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },

  /* Empty State */
  errorBannerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  retryButton: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyIconBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  simulateBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  viewHistoryLinkBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  viewHistoryLinkText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Active Delivery Top Header */
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 6,
  },
  statusBadgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderIdBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },

  /* 11-Stage Timeline Card */
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  timelineSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  timelineHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginRight: 8,
  },
  progressPercentText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },

  /* Vertical Stepper */
  stagesList: {
    paddingTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  indicatorColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  indicatorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    zIndex: 2,
  },
  indicatorDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  indicatorCurrent: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  indicatorPending: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  innerPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  pendingStepNum: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  verticalLineDone: {
    backgroundColor: '#10B981',
  },
  verticalLineCurrent: {
    backgroundColor: '#C7D2FE',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 14,
  },
  stepContentActive: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepLabelDone: {
    color: '#1E293B',
  },
  stepLabelCurrent: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 13,
  },
  stepLabelPending: {
    color: '#94A3B8',
  },
  stepDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  stepDescCurrent: {
    color: '#475569',
    fontWeight: '500',
  },
  stepDescPending: {
    color: '#94A3B8',
  },
  timestampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  currentActiveBadge: {
    backgroundColor: '#FDF4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F0ABFC',
  },
  currentActiveBadgeText: {
    color: '#C026D3',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Action Cards */
  stageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  callLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  infoBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  instructionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
    marginTop: 2,
  },
  printAlert: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  itemsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  paymentHighlight: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  navBtn: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  advanceBtn: {
    backgroundColor: COLORS.onlineGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  advanceBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  otpBtn: {
    backgroundColor: COLORS.purple,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  otpBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  unavailableBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  unavailableBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 30,
  },

  /* Next Action Hub Styles */
  nextActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  nextActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  nextActionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nextActionPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  nextActionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  quickContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  quickContactText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  actionTargetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
    marginBottom: 8,
  },
  actionTargetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  actionTargetName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  actionTargetPhone: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 4,
  },
  actionTargetAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  orderSummaryChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  actionNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 4,
  },
  actionNavBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  itemsVerificationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsVerificationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  paymentBannerCod: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentBannerPrepaid: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paymentBannerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  paymentTextCod: {
    color: '#92400E',
  },
  paymentTextPrepaid: {
    color: '#065F46',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  /* ========================================================================= */
  /* HISTORY VIEW STYLES                                                       */
  /* ========================================================================= */
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  refreshIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyOrderNumberWrap: {
    flex: 1,
  },
  historyOrderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  historyDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  deliveredBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  historyRouteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  routeConnectorLine: {
    width: 2,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginLeft: 3,
    marginVertical: 2,
  },
  historyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyCustomerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  historyItemsCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyEarningsBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  historyEarningsLabel: {
    fontSize: 9,
    color: '#15803D',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyEarningsAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },

  /* ========================================================================= */
  /* MODAL STYLES                                                              */
  /* ========================================================================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
  },
  modalScroll: {
    flex: 1,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  bannerStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  bannerDateSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  routeDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDetailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  routeDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  routeDetailPhone: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginTop: 2,
  },
  routeDetailSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  earningsBreakdownCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  earningsRowLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  earningsRowVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  earningsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    marginTop: 6,
    paddingTop: 8,
  },
  earningsTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  earningsTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  modalItemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalItemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    width: 28,
  },
  modalItemName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalActionBtn: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalActionBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },

  /* Job Board & Available Jobs styles */
  tabPillBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 5,
  },
  tabPillBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  jobBoardSubtitle: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobOrderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.2,
  },
  freshBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  freshBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  jobMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },
  metricDotSep: {
    marginHorizontal: 10,
    color: '#CBD5E1',
    fontWeight: '900',
  },
  jobRouteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  routeRowText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  routeRowLabel: {
    fontWeight: '700',
    color: COLORS.navy,
  },
  jobFooterMeta: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  jobFooterMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  jobAcceptBtnFull: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  jobAcceptBtnFullText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  jobDismissSubtleBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  jobDismissSubtleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
