import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Image,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { CartService } from '../../services/cartService';

// Resolve full-screen order celebration video asset
const orderVideoAsset = require('../../../assets/gemini_generated_video_2981966f.mp4');

const getVideoSource = () => {
  if (typeof orderVideoAsset === 'string') return orderVideoAsset;
  if (orderVideoAsset?.uri) return orderVideoAsset.uri;
  if (orderVideoAsset?.default) return orderVideoAsset.default;
  try {
    const resolved = Image.resolveAssetSource(orderVideoAsset);
    if (resolved?.uri) return resolved.uri;
  } catch (e) {}
  return '/assets/assets/gemini_generated_video_2981966f.mp4';
};

export const BlinkitCheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    blinkitCartList,
    blinkitCartTotal,
    couponDiscount,
    walletBalance,
    deliveryLocation,
    currentCityName,
    currentAreaName,
    selectedAddress,
    placeOrder,
    currentOrder,
    user,
    appliedCoins,
    setAppliedCoins,
    setActiveScreen,
    goBack,
  } = useApp();

  const [selectedPayment, setSelectedPayment] = useState<'upi' | 'card' | 'cod'>('upi');
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [useCoins, setUseCoins] = useState<boolean>(appliedCoins > 0);
  const [deliveryInstruction, setDeliveryInstruction] = useState('Ring bell & leave at door');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isOrderConfirmed, setOrderConfirmed] = useState(false);

  // Full-screen 5-second video state
  const [showCelebrationVideo, setShowCelebrationVideo] = useState(false);
  const [videoSecondsLeft, setVideoSecondsLeft] = useState(5);
  const videoFadeAnim = useRef(new Animated.Value(1)).current;
  const videoProgressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<any>(null);
  const videoTimerRef = useRef<any>(null);
  const isVideoFinishedRef = useRef(false);

  const TIP_OPTIONS = [0, 10, 20, 30, 50];

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number>(40);
  const [feeBreakdown, setFeeBreakdown] = useState<any>({
    distanceKm: 3.26,
    rateUsed: 11,
    floorApplied: true,
    areaName: 'Prahlad Nagar',
    minimumPayout: 40,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchFee = async () => {
      const res = await CartService.calculateDynamicDeliveryFee({
        items: blinkitCartList.map((item) => ({
          name: item.product.name,
          price: item.product.sellingPrice,
          mrp: item.product.mrp,
          quantity: item.quantity,
        })),
        cityName: currentCityName || selectedAddress?.city || 'Ahmedabad',
        areaName: currentAreaName || selectedAddress?.areaLandmark || 'Prahlad Nagar',
        distanceKm: 3.26,
      });
      if (isMounted && res) {
        setDynamicDeliveryFee(res.deliveryFee);
        if (res.breakdown) {
          setFeeBreakdown({
            ...res.breakdown,
            distanceKm: res.distanceKm,
            rateUsed: res.rateUsed,
            areaName: res.areaName || 'Prahlad Nagar',
          });
        }
      }
    };
    fetchFee();
    return () => {
      isMounted = false;
    };
  }, [blinkitCartList, currentCityName, currentAreaName, selectedAddress]);

  const deliveryFee = dynamicDeliveryFee;
  const handlingFee = 5;
  const orderSubtotal = Math.max(0, blinkitCartTotal + deliveryFee + handlingFee - couponDiscount);
  const totalWithTip = orderSubtotal + tipAmount;

  // Shopping coins (2,000 SC or user balance, max 20% order subtotal)
  const availableCoins = user?.shoppingCoins ?? 2000;
  const maxCoinsUsable = Math.min(availableCoins, Math.max(10, Math.floor(orderSubtotal * 0.2)));
  const coinsDeduction = useCoins ? maxCoinsUsable : 0;

  // WOMUP Money wallet deduction on remaining amount
  const remainingAfterCoins = Math.max(0, totalWithTip - coinsDeduction);
  const walletDeduction = useWalletBalance ? Math.min(walletBalance, remainingAfterCoins) : 0;
  const finalPayable = Math.max(0, remainingAfterCoins - walletDeduction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gracefully complete the 5s video and transition to Order Confirmed state
  const finishCelebrationVideo = useCallback(() => {
    if (isVideoFinishedRef.current) return;
    isVideoFinishedRef.current = true;

    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {}
    }

    Animated.timing(videoFadeAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowCelebrationVideo(false);
      setOrderConfirmed(true);
    });
  }, [videoFadeAnim]);

  const startCelebrationVideo = () => {
    isVideoFinishedRef.current = false;
    setVideoSecondsLeft(5);
    videoFadeAnim.setValue(1);
    videoProgressAnim.setValue(0);
    setShowCelebrationVideo(true);

    // Smooth 5-second progress animation
    Animated.timing(videoProgressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 5-second countdown timer
    let count = 5;
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    videoTimerRef.current = setInterval(() => {
      count -= 1;
      setVideoSecondsLeft(Math.max(count, 0));
      if (count <= 0) {
        finishCelebrationVideo();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, []);

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    const paymentMethod = useWalletBalance && finalPayable === 0 ? 'WOMUP_WALLET' : selectedPayment.toUpperCase();
    setIsSubmitting(true);
    try {
      if (useCoins) {
        setAppliedCoins(coinsDeduction);
      }
      await placeOrder(paymentMethod, {
        tip: tipAmount,
        deliveryFee: deliveryFee,
        deliveryInstructions: deliveryInstruction,
        walletDeduction: useWalletBalance ? walletDeduction : 0,
      });
      // Play full screen video for 5 seconds on order place
      startCelebrationVideo();
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoneReturnHome = () => {
    setOrderConfirmed(false);
    setActiveScreen('Blinkit_Home');
  };

  const handleTrackOrder = () => {
    setOrderConfirmed(false);
    setActiveScreen('C24_OrderTracking');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={goBack}
          style={styles.circleBtn}
          accessibilityLabel="Go back"
        >
          <AppIcon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.headingMd, styles.headerTitle]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Delivery Address Card */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircle}>
              <AppIcon name="map-pin" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[TYPOGRAPHY.bodyMdMedium, styles.sectionTitle]}>
                Delivering to Home
              </Text>
              <Text style={styles.addressSubtitle}>{deliveryLocation}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Delivery Instructions */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle]}>
            Delivery instructions
          </Text>
          <View style={styles.instructionsRow}>
            {['Avoid ringing bell', 'Leave with guard', 'Do not disturb'].map((inst) => (
              <TouchableOpacity
                key={inst}
                activeOpacity={0.7}
                onPress={() => setDeliveryInstruction(inst)}
                style={[
                  styles.instructionPill,
                  deliveryInstruction === inst && styles.instructionPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.instructionText,
                    deliveryInstruction === inst && styles.instructionTextActive,
                  ]}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Delivery Partner Tip Selection */}
        <View style={styles.cardSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle, { marginBottom: 0 }]}>
              💝 Tip your delivery partner
            </Text>
            {tipAmount > 0 && (
              <TouchableOpacity onPress={() => setTipAmount(0)} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            100% of your tip goes directly to your rider partner.
          </Text>
          <View style={styles.tipButtonsRow}>
            {TIP_OPTIONS.map((amt) => (
              <TouchableOpacity
                key={amt}
                activeOpacity={0.75}
                onPress={() => setTipAmount(amt)}
                style={[
                  styles.tipPill,
                  tipAmount === amt && styles.tipPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tipPillText,
                    tipAmount === amt && styles.tipPillTextActive,
                  ]}
                >
                  {amt === 0 ? 'No tip' : `₹${amt}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Discounts & Wallet Section */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle]}>
            Discounts & Wallet
          </Text>

          {/* Shopping Coins (2,000 SC) Toggle */}
          <View style={styles.walletToggleRow}>
            <View style={styles.walletToggleLeft}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="star" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                  Use Shopping Coins
                </Text>
                <Text style={styles.walletBalText}>
                  Available: {availableCoins.toLocaleString()} Coins • Save ₹{maxCoinsUsable}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
              thumbColor={useCoins ? COLORS.white : '#f4f3f4'}
              onValueChange={(val) => {
                if (availableCoins > 0) {
                  setUseCoins(val);
                }
              }}
              value={useCoins && availableCoins > 0}
              disabled={availableCoins <= 0}
            />
          </View>
          {useCoins && coinsDeduction > 0 && (
            <View style={[styles.walletAppliedBadge, { backgroundColor: '#FEF3C7', marginBottom: 12 }]}>
              <Text style={[styles.walletAppliedText, { color: '#B45309' }]}>
                🪙 {coinsDeduction} Shopping Coins applied (-₹{coinsDeduction})
              </Text>
            </View>
          )}

          <View style={[styles.divider, { marginVertical: 10 }]} />

          {/* WOMUP Money (Wallet) Toggle */}
          <View style={styles.walletToggleRow}>
            <View style={styles.walletToggleLeft}>
              <View style={[styles.paymentIconBox, { backgroundColor: COLORS.lightPink }]}>
                <AppIcon name="wallet" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                  WOMUP Money
                </Text>
                <Text style={styles.walletBalText}>Available: ₹{walletBalance}</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
              thumbColor={useWalletBalance ? COLORS.white : '#f4f3f4'}
              onValueChange={(val) => {
                if (walletBalance > 0) {
                  setUseWalletBalance(val);
                }
              }}
              value={useWalletBalance && walletBalance > 0}
              disabled={walletBalance <= 0}
            />
          </View>
          {useWalletBalance && walletDeduction > 0 && (
            <View style={styles.walletAppliedBadge}>
              <Text style={styles.walletAppliedText}>
                ✓ ₹{walletDeduction} applied from WOMUP Money
              </Text>
            </View>
          )}
        </View>

        {/* 5. Payment Method Selection */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>
            Select Payment Method
          </Text>

          {finalPayable === 0 ? (
            <View style={styles.fullyPaidBanner}>
              <AppIcon name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.fullyPaidText}>
                Full amount covered by WOMUP Benefits! No extra payment required.
              </Text>
            </View>
          ) : (
            <>
              {/* UPI Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPayment('upi')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: COLORS.lightBlueLavender }]}>
                    <AppIcon name="zap" size={20} color={COLORS.secondary} />
                  </View>
                  <View>
                    <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                      UPI (Google Pay, PhonePe, Paytm)
                    </Text>
                    <Text style={styles.walletBalText}>Fast & secure 1-tap checkout</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'upi' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'upi' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Credit / Debit Cards */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPayment('card')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: COLORS.cardBackground }]}>
                    <AppIcon name="credit-card" size={20} color={COLORS.textPrimary} />
                  </View>
                  <View>
                    <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                      Credit / Debit Card
                    </Text>
                    <Text style={styles.walletBalText}>Visa, MasterCard, RuPay</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'card' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'card' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Cash on Delivery */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPayment('cod')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: COLORS.cardBackground }]}>
                    <AppIcon name="tag" size={20} color={COLORS.textPrimary} />
                  </View>
                  <View>
                    <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                      Cash on Delivery
                    </Text>
                    <Text style={styles.walletBalText}>Pay cash or UPI at delivery doorstep</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'cod' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'cod' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 6. Payment Summary Preview */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items Subtotal</Text>
            <Text style={styles.summaryValue}>₹{blinkitCartTotal}</Text>
          </View>
          <View style={[styles.summaryRow, { alignItems: 'flex-start', paddingVertical: 8 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.summaryLabel}>Delivery Partner Fee</Text>
              <Text style={{ fontSize: 11, color: '#62677A', marginTop: 1 }}>
                {feeBreakdown?.distanceKm || 3.26} km · ₹{feeBreakdown?.rateUsed || 11}/km
                {feeBreakdown?.floorApplied ? ` (Base: ₹${feeBreakdown?.baseFee || 35.86})` : ''}
              </Text>
              {feeBreakdown?.floorApplied && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ShieldCheck size={12} color="#4338CA" />
                  <Text style={{ fontSize: 10, color: '#4338CA', fontWeight: '600' }}>
                    +₹{(Number(feeBreakdown?.minimumPayout || 40) - Number(feeBreakdown?.baseFee || 35.86)).toFixed(2)} Floor Guarantee (Min ₹{feeBreakdown?.minimumPayout || 40})
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <CheckCircle2 size={10} color="#059669" />
                <Text style={{ fontSize: 10, color: '#059669', fontWeight: '600' }}>
                  100% passed to delivery partner
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryValue, { fontWeight: '700' }]}>
              ₹{deliveryFee}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Handling & Convenience</Text>
            <Text style={styles.summaryValue}>₹{handlingFee}</Text>
          </View>
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Partner Tip</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: '700' }]}>
                + ₹{tipAmount}
              </Text>
            </View>
          )}
          {useCoins && coinsDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shopping Coins Applied ({coinsDeduction} SC)</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{coinsDeduction}
              </Text>
            </View>
          )}
          {useWalletBalance && walletDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>WOMUP Money Deducted</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{walletDeduction}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[TYPOGRAPHY.bodyMdMedium, styles.finalPayableLabel]}>
              Amount to Pay
            </Text>
            <Text style={[TYPOGRAPHY.priceLg, styles.finalPayableValue]}>
              ₹{finalPayable}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Place Order CTA */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceText}>₹{finalPayable}</Text>
          <Text style={styles.bottomPriceSub}>AMOUNT PAYABLE</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          style={[styles.placeOrderBtn, isSubmitting && { opacity: 0.8 }]}
          disabled={isSubmitting}
          accessibilityLabel="Place Order"
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Full-Screen Order Celebration Video (First 5 Seconds Only) */}
      <Modal
        visible={showCelebrationVideo}
        transparent={false}
        animationType="fade"
      >
        <Animated.View
          style={[
            styles.fullscreenVideoOverlay,
            {
              opacity: videoFadeAnim,
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <video
              ref={videoRef}
              src={getVideoSource()}
              autoPlay
              playsInline
              muted
              onTimeUpdate={(e: any) => {
                if (e.target && e.target.currentTime >= 5.0) {
                  e.target.pause();
                  finishCelebrationVideo();
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#05052A',
              }}
            />
          ) : (
            <View style={styles.nativeVideoPlaceholder}>
              <View style={styles.videoGlowCircle}>
                <AppIcon name="check" size={48} color={COLORS.white} />
              </View>
              <Text style={styles.videoOverlayBrand}>WOM UP</Text>
              <Text style={styles.videoOverlaySub}>Order Placed Successfully!</Text>
            </View>
          )}

          {/* Top 5-second progress bar */}
          <View style={styles.videoProgressContainer}>
            <Animated.View
              style={[
                styles.videoProgressBar,
                {
                  width: videoProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Top Controls: 5s Timer Countdown Chip + Skip Button */}
          <View style={[styles.videoControlsRow, { top: Math.max(insets.top, 16) + 12 }]}>
            <View style={styles.videoCountdownChip}>
              <AppIcon name="zap" size={14} color={COLORS.hotPink} />
              <Text style={styles.videoCountdownText}>
                Confirmed • {videoSecondsLeft}s
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={finishCelebrationVideo}
              style={styles.videoSkipBtn}
            >
              <Text style={styles.videoSkipText}>Skip</Text>
              <AppIcon name="chevron-right" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom Floating Banner */}
          <View style={[styles.videoBottomBanner, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Text style={styles.videoBannerTitle}>Order Confirmed! 🎉</Text>
            <Text style={styles.videoBannerSub}>
              Preparing your items for lightning-fast delivery in 9 mins
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Order Confirmed Celebration Modal */}
      <Modal
        visible={isOrderConfirmed}
        transparent
        animationType="fade"
      >
        <View style={styles.successModalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successCheckCircle}>
              <AppIcon name="check" size={36} color={COLORS.white} />
            </View>

            <Text style={[TYPOGRAPHY.headingLg, styles.successHeading]}>
              Order Placed!
            </Text>
            {currentOrder?.orderNumber ? (
              <Text style={styles.orderNumberBadge}>
                Order {currentOrder.orderNumber}
              </Text>
            ) : null}
            <Text style={[TYPOGRAPHY.bodyMd, styles.successEta]}>
              Arriving in 9 minutes ⚡
            </Text>
            <Text style={styles.successDesc}>
              Your items are being packed at the nearest Worm Up dark store.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTrackOrder}
              style={styles.trackOrderBtn}
            >
              <AppIcon name="map-pin" size={18} color={COLORS.white} />
              <Text style={styles.trackOrderText}>Track Live Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDoneReturnHome}
              style={styles.successDoneBtn}
            >
              <Text style={styles.successDoneText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
  },
  addressSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subSectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  instructionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  instructionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionPillActive: {
    backgroundColor: COLORS.lightPink,
    borderColor: COLORS.primary,
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  instructionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tipButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 60,
    alignItems: 'center',
  },
  tipPillActive: {
    backgroundColor: COLORS.lightPink,
    borderColor: COLORS.primary,
  },
  tipPillText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  tipPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  walletToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletAppliedBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  walletAppliedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  fullyPaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    marginTop: 4,
  },
  fullyPaidText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentTitle: {
    color: COLORS.textPrimary,
  },
  walletBalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  finalPayableLabel: {
    color: COLORS.textPrimary,
  },
  finalPayableValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  bottomPriceSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  placeOrderBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orderNumberBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  successEta: {
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  trackOrderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    marginBottom: 10,
  },
  trackOrderText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successDoneBtn: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  successDoneText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  fullscreenVideoOverlay: {
    flex: 1,
    backgroundColor: '#05052A',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  nativeVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05052A',
  },
  videoGlowCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  videoOverlayBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: 6,
  },
  videoOverlaySub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  videoProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
  },
  videoProgressBar: {
    height: '100%',
    backgroundColor: COLORS.hotPink,
  },
  videoControlsRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  videoCountdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 5, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 120, 0.4)',
  },
  videoCountdownText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoSkipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  videoBottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 5, 42, 0.85)',
    paddingHorizontal: 24,
    paddingTop: 18,
    alignItems: 'center',
    zIndex: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoBannerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  videoBannerSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
});
