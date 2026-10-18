import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import { LocalShopApi } from '../api/localShopApi';
import { useApp } from '../../context/AppContext';

export interface AwaitingVerificationProps {
  requestId: string;
  vendorName: string;
  vendorCode?: string;
  billAmount: number;
  coinsUsed: number;
  cashToCollect: number;
  paymentMethod: string;
  onVerified: (newBalance?: number, coinsUsed?: number, cashPaid?: number) => void;
  onCancelledOrRejected: () => void;
}

export const AwaitingVendorVerificationScreen: React.FC<AwaitingVerificationProps> = ({
  requestId,
  vendorName,
  vendorCode,
  billAmount,
  coinsUsed,
  cashToCollect,
  paymentMethod,
  onVerified,
  onCancelledOrRejected,
}) => {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useApp();

  const [status, setStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(600); // 10 minutes
  const [cancelling, setCancelling] = useState(false);
  const [verifiedDetails, setVerifiedDetails] = useState<{
    orderNumber?: string;
    newCoinBalance?: number;
    coinsEarned?: number;
  } | null>(null);

  // Pulse animation for waiting hourglass
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // 10-Minute Countdown
  useEffect(() => {
    if (status !== 'PENDING') return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // WebSocket Listener & Live Polling Fallback
  useEffect(() => {
    if (status !== 'PENDING') return;

    const isLocalWeb =
      typeof window !== 'undefined' &&
      (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

    const wsUrl =
      (process.env.EXPO_PUBLIC_API_URL
        ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
        : isLocalWeb
        ? 'http://localhost:5050'
        : 'https://womup-app-uquz.onrender.com') + '/tracking';

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      socket.emit('join_collection', { requestId });
      const uid = user?._id || user?.id;
      if (uid) {
        socket.emit('join_user', { userId: uid });
      }
    });

    const handleVerified = (payload: any) => {
      if (!payload) return;
      if (payload.requestId && payload.requestId !== requestId) return;

      const newBalance =
        payload.newCoinBalance !== undefined
          ? payload.newCoinBalance
          : Math.max(0, (user.shoppingCoins || 2050) - coinsUsed);

      // Update global user context immediately
      setUser((prev: any) => ({
        ...prev,
        shoppingCoins: newBalance,
      }));

      setVerifiedDetails({
        orderNumber: payload.orderNumber || `WM-${requestId.slice(-4).toUpperCase()}`,
        newCoinBalance: newBalance,
        coinsEarned: payload.coinsEarned || 0,
      });
      setStatus('VERIFIED');
    };

    const handleRejected = (payload: any) => {
      if (!payload) return;
      if (payload.requestId && payload.requestId !== requestId) return;

      setRejectionReason(payload.reason || 'Merchant declined the request');
      setStatus('REJECTED');
    };

    socket.on('collection_verified', handleVerified);
    socket.on('collection_rejected', handleRejected);

    // Resilient Polling (Every 2.5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const res = await LocalShopApi.getCollectionRequestStatus(requestId);
        if (res.success && res.data) {
          if (res.data.status === 'VERIFIED') {
            clearInterval(pollInterval);
            handleVerified(res.data);
          } else if (res.data.status === 'REJECTED') {
            clearInterval(pollInterval);
            handleRejected(res.data);
          }
        }
      } catch (e) {
        // Soft fail
      }
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [requestId, status, user, coinsUsed, setUser]);

  // Format MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel Payment Request?',
      'Are you sure you want to cancel? No coins or cash will be deducted.',
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await LocalShopApi.cancelCollectionRequest(requestId);
            } catch (e) {
              console.warn('Cancel error:', e);
            } finally {
              setCancelling(false);
              onCancelledOrRejected();
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. VERIFIED SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (status === 'VERIFIED') {
    const finalNewCoins =
      verifiedDetails?.newCoinBalance !== undefined
        ? verifiedDetails.newCoinBalance
        : Math.max(0, (user?.shoppingCoins || 2050) - coinsUsed);

    return (
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.successIconHeader}>
            <Ionicons name="checkmark-circle" size={54} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.verifiedTitle}>Payment Verified! 🎉</Text>
            <Text style={styles.verifiedSubtitle}>
              {vendorName} accepted your payment
            </Text>

            <View style={styles.breakdownBox}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Total Bill</Text>
                <Text style={styles.rowValueBold}>₹{billAmount.toLocaleString()}</Text>
              </View>

              {coinsUsed > 0 && (
                <View style={styles.rowItem}>
                  <Text style={[styles.rowLabel, { color: '#E11D48' }]}>Coins Redeemed</Text>
                  <Text style={[styles.rowValueBold, { color: '#E11D48' }]}>-₹{coinsUsed}</Text>
                </View>
              )}

              {cashToCollect > 0 && (
                <View style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Cash Paid</Text>
                  <Text style={styles.rowValueBold}>₹{cashToCollect}</Text>
                </View>
              )}

              {verifiedDetails?.coinsEarned ? (
                <View style={styles.rowItem}>
                  <Text style={[styles.rowLabel, { color: '#059669' }]}>Coins Earned</Text>
                  <Text style={[styles.rowValueBold, { color: '#059669' }]}>
                    +{verifiedDetails.coinsEarned}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.rowItem}>
                <Text style={styles.balanceLabel}>New Shopping Coin Balance</Text>
                <Text style={styles.balanceValue}>{finalNewCoins} Coins</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              activeOpacity={0.85}
              onPress={() => onVerified(finalNewCoins, coinsUsed, cashToCollect)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. REJECTED / EXPIRED SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (status === 'REJECTED' || status === 'EXPIRED') {
    const isReject = status === 'REJECTED';
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.successIconHeader}>
            <Ionicons name={isReject ? 'close-circle' : 'time'} size={54} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.body}>
            <Text style={[styles.verifiedTitle, { color: '#DC2626' }]}>
              {isReject ? 'Request Declined' : 'Request Timed Out'}
            </Text>
            <Text style={styles.verifiedSubtitle}>
              {isReject
                ? rejectionReason || 'Merchant declined this counter request.'
                : '10 minutes passed without merchant verification.'}
            </Text>

            <View style={[styles.breakdownBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={{ fontSize: 13, color: '#991B1B', textAlign: 'center', lineHeight: 18 }}>
                ✅ Zero coins were deducted.{'\n'}Your Shopping Coin balance remains completely safe ({user.shoppingCoins || 2050} Coins).
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: '#475569' }]}
              activeOpacity={0.85}
              onPress={onCancelledOrRejected}
            >
              <Text style={styles.doneBtnText}>Return to Counter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. AWAITING VERIFICATION (PENDING STATE)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.card}>
        {/* Pulsing Hourglass Banner */}
        <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.waitingHeader}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.hourglassCircle}>
              <Ionicons name="hourglass" size={32} color="#D97706" />
            </View>
          </Animated.View>
          <Text style={styles.waitingHeaderTitle}>Waiting for Merchant</Text>
          <Text style={styles.waitingHeaderSub}>Verification in progress at counter</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Merchant Callout */}
          <View style={styles.merchantBox}>
            <View style={styles.merchantIconCircle}>
              <Ionicons name="storefront" size={20} color="#0D9488" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.merchantName}>{vendorName}</Text>
              <Text style={styles.merchantSub}>
                Bill #WM-{requestId.slice(-4).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Amount Breakdown */}
          <View style={styles.breakdownBox}>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Counter Bill</Text>
              <Text style={styles.rowValueBold}>₹{billAmount.toLocaleString()}</Text>
            </View>

            {coinsUsed > 0 && (
              <View style={styles.rowItem}>
                <Text style={[styles.rowLabel, { color: '#E11D48' }]}>Coins Used</Text>
                <Text style={[styles.rowValueBold, { color: '#E11D48' }]}>-₹{coinsUsed}</Text>
              </View>
            )}

            {cashToCollect > 0 && (
              <View style={[styles.rowItem, { marginTop: 4 }]}>
                <Text style={[styles.rowLabel, { fontWeight: '700', color: '#0F172A' }]}>
                  Cash to Pay
                </Text>
                <Text style={[styles.rowValueBold, { fontSize: 18, color: '#059669' }]}>
                  ₹{cashToCollect}
                </Text>
              </View>
            )}
          </View>

          {/* Cash Instruction Callout */}
          {cashToCollect > 0 ? (
            <View style={styles.cashNoticeBox}>
              <Ionicons name="cash" size={20} color="#047857" style={{ marginRight: 8 }} />
              <Text style={styles.cashNoticeText}>
                Please hand over <Text style={{ fontWeight: '800' }}>₹{cashToCollect} in physical cash</Text> to the merchant.
              </Text>
            </View>
          ) : (
            <View style={[styles.cashNoticeBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Ionicons name="checkmark-done" size={20} color="#047857" style={{ marginRight: 8 }} />
              <Text style={styles.cashNoticeText}>
                100% digital benefit. Zero cash to pay to merchant!
              </Text>
            </View>
          )}

          {/* Timer Countdown */}
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.timerText}>
              Time remaining: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{formatTime(timeLeftSec)}</Text>
            </Text>
          </View>

          {/* Cancel Request Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelRequest}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  waitingHeader: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourglassCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FDE047',
  },
  waitingHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
  },
  waitingHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 2,
  },
  successIconHeader: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
  },
  merchantBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  merchantIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  merchantSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  rowValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#047857',
  },
  cashNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  cashNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: '#64748B',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 4,
  },
  verifiedSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  doneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
