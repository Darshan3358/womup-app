import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { useApp } from '../../context/AppContext';
import { CartService } from '../../services/cartService';
import { resolveImageThumbnail } from '../../utils/imageUrl';
import { matchAreaByName } from '../../data/areas';
import { CartScreenSkeleton, Skeleton } from '../../components/common/Skeleton';

export const BlinkitCartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    blinkitCartList,
    blinkitCartCount,
    blinkitCartTotal,
    blinkitMrpTotal,
    updateBlinkitQty,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    deliveryLocation,
    currentCityName,
    currentAreaName,
    currentStoreId,
    selectedAddress,
    selectedAddressSource,
    setActiveScreen,
    goBack,
    setLocationModalVisible,
    syncCartFromSummary,
  } = useApp();

  const isSavedAddress = selectedAddressSource === 'SAVED' && selectedAddress && selectedAddress.type !== 'Current';

  const matchedArea = matchAreaByName(
    (isSavedAddress ? (selectedAddress?.areaLandmark || (selectedAddress as any)?.area || selectedAddress?.street || selectedAddress?.houseFlat) : null) ||
    currentAreaName ||
    selectedAddress?.areaLandmark ||
    (selectedAddress as any)?.area ||
    deliveryLocation
  );
  const activeLat = isSavedAddress
    ? (matchedArea?.lat || Number(selectedAddress?.latitude) || 23.0125)
    : (Number(selectedAddress?.latitude) || matchedArea?.lat || 23.0125);
  const activeLng = isSavedAddress
    ? (matchedArea?.lng || Number(selectedAddress?.longitude) || 72.5082)
    : (Number(selectedAddress?.longitude) || matchedArea?.lng || 72.5082);
  const areaKey = (isSavedAddress ? (selectedAddress?.areaLandmark || matchedArea?.name) : null) ||
    matchedArea?.name || currentAreaName || selectedAddress?.areaLandmark || 'Prahlad Nagar';
  const cityKey = (isSavedAddress ? selectedAddress?.city : null) || currentCityName || 'Ahmedabad';
  const currentDistanceKm = 1.2;

  const [couponInput, setCouponInput] = useState('');

  // Check cached delivery fee synchronously to avoid any 1-frame price flicker
  const initialCachedFee = CartService.getCachedDeliveryFee({
    cityName: cityKey,
    areaName: areaKey,
    distanceKm: currentDistanceKm,
    items: blinkitCartList.map((item) => ({
      name: item.product.name,
      price: item.product.sellingPrice,
      mrp: item.product.mrp,
      quantity: item.quantity,
    })),
  });

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number | null>(
    initialCachedFee ? initialCachedFee.deliveryFee : null
  );
  const [feeBreakdown, setFeeBreakdown] = useState<any>(
    initialCachedFee ? initialCachedFee.breakdown : null
  );
  const [isCalculatingFee, setIsCalculatingFee] = useState<boolean>(!initialCachedFee);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    let timer: any = null;

    const fetchFee = async () => {
      // Check cache first
      const cached = CartService.getCachedDeliveryFee({
        cityName: cityKey,
        areaName: areaKey,
        distanceKm: currentDistanceKm,
        items: blinkitCartList.map((item) => ({
          name: item.product.name,
          price: item.product.sellingPrice,
          mrp: item.product.mrp,
          quantity: item.quantity,
        })),
      });

      if (cached) {
        if (isMounted) {
          setDynamicDeliveryFee(cached.deliveryFee);
          if (cached.breakdown) {
            setFeeBreakdown(cached.breakdown);
          }
          setIsCalculatingFee(false);
        }
      } else if (dynamicDeliveryFee === null) {
        setIsCalculatingFee(true);
      }

      try {
        const res = await CartService.calculateDynamicDeliveryFee(
          {
            items: blinkitCartList.map((item) => ({
              id: item.product.id,
              productId: item.product.id,
              name: item.product.name,
              price: item.product.sellingPrice,
              sellingPrice: item.product.sellingPrice,
              mrp: item.product.mrp,
              quantity: item.quantity,
              variantId: (item.product as any).selectedVariantId,
            })),
            cityName: cityKey,
            areaName: areaKey,
            storeId: currentStoreId || undefined,
            distanceKm: currentDistanceKm,
            deliveryAddress: {
              latitude: activeLat,
              longitude: activeLng,
              area: areaKey,
              city: cityKey,
            },
            forceRefresh: true,
          },
          abortController.signal
        );

        if (isMounted && res) {
          setDynamicDeliveryFee(res.deliveryFee);
          if (res.breakdown) {
            setFeeBreakdown({
              ...res.breakdown,
              distanceKm: res.distanceKm || currentDistanceKm,
              rateUsed: res.rateUsed || 12,
              areaName: res.areaName || areaKey,
            });
          }
          // Do not call syncCartFromSummary inside fetchFee to avoid triggering infinite re-renders
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[BlinkitCart] calculate fee error:', err);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingFee(false);
        }
      }
    };

    timer = setTimeout(fetchFee, 200);

    return () => {
      isMounted = false;
      abortController.abort();
      if (timer) clearTimeout(timer);
    };
  }, [blinkitCartCount, areaKey, cityKey, activeLat, activeLng, currentStoreId]);

  const deliveryFee = dynamicDeliveryFee ?? 0;
  const handlingFee = 5;
  const grandTotal = Math.max(0, blinkitCartTotal + deliveryFee + handlingFee - couponDiscount);
  const totalSavings = (blinkitMrpTotal - blinkitCartTotal) + couponDiscount;

  const handleApplyCouponCode = () => {
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim());
    if (success) {
      Alert.alert('Coupon Applied!', `Coupon ${couponInput.toUpperCase()} has been applied.`);
      setCouponInput('');
    } else {
      Alert.alert('Invalid Coupon', 'Try "AUCC30" for ₹16 OFF or "BLINKIT50" for ₹50 OFF.');
    }
  };

  if (blinkitCartCount === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.plainHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.circleBtn}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow-left" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={[TYPOGRAPHY.headingMd, styles.headerTitle]}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartEmoji}>🛒</Text>
          <Text style={[TYPOGRAPHY.headingLg, styles.emptyHeading]}>Your cart is empty</Text>
          <Text style={[TYPOGRAPHY.bodySm, styles.emptySubtext]}>
            Explore thousands of items delivered in 9 minutes!
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveScreen('Blinkit_Home')}
            style={styles.browseProductsBtn}
          >
            <Text style={styles.browseProductsText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (blinkitCartCount > 0 && isCalculatingFee && dynamicDeliveryFee === null && !initialCachedFee) {
    return <CartScreenSkeleton />;
  }

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
        <View style={styles.headerCenter}>
          <Text style={[TYPOGRAPHY.headingMd, styles.headerTitle]}>My Cart</Text>
          <Text style={styles.headerSubtitle}>
            {blinkitCartCount} {blinkitCartCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery ETA banner (Interactive Location Selector) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setLocationModalVisible(true)}
          style={styles.etaBanner}
        >
          <View style={styles.etaLeft}>
            <AppIcon name="clock" size={18} color={COLORS.primary} />
            <Text style={styles.etaTitle}>Delivery in 9 minutes</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end', marginLeft: 8 }}>
            <Text style={styles.etaLocationText} numberOfLines={1}>
              {deliveryLocation}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>Change</Text>
          </View>
        </TouchableOpacity>

        {/* Itemized Cart List */}
        <View style={styles.itemsCard}>
          {blinkitCartList.map((entry, index) => {
            const isLast = index === blinkitCartList.length - 1;
            const itemVariantId = (entry.product as any).selectedVariantId;
            const itemKey = itemVariantId
              ? `${entry.product.id}_${itemVariantId}`
              : entry.product.id;
            return (
              <View
                key={itemKey}
                style={[styles.itemRow, !isLast && styles.itemRowBorder]}
              >
                <View style={styles.itemEmojiContainer}>
                  <Image
                    source={{ uri: resolveImageThumbnail(entry.product.imageUrl) }}
                    style={styles.itemRealImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.itemDetails}>
                  <Text style={[TYPOGRAPHY.bodySmBold, styles.itemName]} numberOfLines={2}>
                    {entry.product.name}
                  </Text>
                  <Text style={styles.itemPackSize}>{entry.product.packSize || '1 unit'}</Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={TYPOGRAPHY.priceLg}>
                      ₹{entry.product.sellingPrice * entry.quantity}
                    </Text>
                    {entry.product.mrp > entry.product.sellingPrice && (
                      <Text style={[TYPOGRAPHY.priceStrike, styles.itemMrp]}>
                        ₹{entry.product.mrp * entry.quantity}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Stepper */}
                <View style={styles.itemStepper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => updateBlinkitQty(entry.product, -1, itemVariantId)}
                    style={styles.stepperActionBtn}
                  >
                    <AppIcon name="minus" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQtyNum}>{entry.quantity}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => updateBlinkitQty(entry.product, 1, itemVariantId)}
                    style={styles.stepperActionBtn}
                  >
                    <AppIcon name="plus" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupon Code Card */}
        <View style={styles.couponCard}>
          <View style={styles.couponHeaderRow}>
            <View style={styles.couponIconCircle}>
              <AppIcon name="tag" size={18} color={COLORS.primary} />
            </View>
            <Text style={[TYPOGRAPHY.bodyMdMedium, styles.couponHeading]}>
              Coupons & Offers
            </Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCouponRow}>
              <View>
                <Text style={styles.appliedCouponText}>
                  {appliedCoupon} applied • You saved ₹{couponDiscount}
                </Text>
                <Text style={styles.appliedCouponSub}>Bank offer applied successfully</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                nativeID="coupon-code-input"
                accessibilityLabel="Enter coupon code"
                style={styles.couponTextInput}
                placeholder="Enter coupon code (e.g. AUCC30)"
                placeholderTextColor={COLORS.textMuted}
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleApplyCouponCode}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bill Breakdown */}
        <View style={styles.billCard}>
          <Text style={[TYPOGRAPHY.headingMd, styles.billTitle]}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total (MRP)</Text>
            <Text style={styles.billValue}>₹{blinkitMrpTotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Product Discount</Text>
            <Text style={[styles.billValue, { color: COLORS.success }]}>
              - ₹{blinkitMrpTotal - blinkitCartTotal}
            </Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount ({appliedCoupon})</Text>
              <Text style={[styles.billValue, { color: COLORS.success }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}

          {/* Delivery Partner Fee */}
          <View style={styles.deliveryFeeSection}>
            <View style={styles.billRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.billLabel}>Delivery Partner Fee</Text>
              </View>
              {isCalculatingFee ? (
                <Skeleton width={65} height={16} borderRadius={4} />
              ) : (
                <Text style={[styles.billValue, { fontWeight: '700', fontSize: 14 }]}>
                  ₹{deliveryFee}
                </Text>
              )}
            </View>

            {!isCalculatingFee && (
              <View style={styles.directPassRow}>
                <CheckCircle2 size={11} color="#059669" />
                <Text style={styles.directPassText}>
                  100% of delivery fee is paid to your delivery partner
                </Text>
              </View>
            )}
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling & Convenience Fee</Text>
            <Text style={styles.billValue}>₹{handlingFee}</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.grandTotalRow}>
            <Text style={[TYPOGRAPHY.headingMd, styles.grandTotalLabel]}>To Pay</Text>
            {isCalculatingFee ? (
              <Skeleton width={80} height={20} borderRadius={4} />
            ) : (
              <Text style={[TYPOGRAPHY.priceLg, styles.grandTotalValue]}>₹{grandTotal}</Text>
            )}
          </View>

          {totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Text style={styles.savingsText}>🎉 You are saving ₹{totalSavings} on this order</Text>
            </View>
          )}
        </View>

        {/* Cancellation Policy Note */}
        <View style={styles.policyCard}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyDesc}>
            Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be issued.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom "Proceed to Checkout" CTA */}
      <View style={[styles.stickyBottomCheckoutBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceCol}>
          {isCalculatingFee ? (
            <Skeleton width={70} height={20} borderRadius={4} />
          ) : (
            <Text style={styles.bottomTotalText}>₹{grandTotal}</Text>
          )}
          <Text style={styles.bottomTotalSub}>TOTAL</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveScreen('Blinkit_Checkout')}
          style={[
            styles.proceedCheckoutBtn,
            isCalculatingFee && { opacity: 0.6 }
          ]}
          disabled={isCalculatingFee}
          accessibilityLabel="Proceed to Checkout"
        >
          <Text style={styles.proceedCheckoutText}>
            {isCalculatingFee ? 'Calculating Total...' : 'Proceed to Checkout ▸'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  etaBanner: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  etaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  etaLocationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: '45%',
  },
  itemsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  itemRealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: COLORS.textPrimary,
  },
  itemPackSize: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginVertical: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemMrp: {
    color: COLORS.textMuted,
  },
  itemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 70,
    justifyContent: 'space-between',
  },
  stepperActionBtn: {
    padding: 4,
  },
  stepperQtyNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    paddingHorizontal: 4,
  },
  couponCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  couponIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponHeading: {
    color: COLORS.textPrimary,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 168, 107, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  appliedCouponText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  appliedCouponSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  billTitle: {
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    color: COLORS.textPrimary,
  },
  grandTotalValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  savingsBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(34, 168, 107, 0.12)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  policyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  policyDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  stickyBottomCheckoutBar: {
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
  bottomTotalText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  bottomTotalSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  proceedCheckoutBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  proceedCheckoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 60,
  },
  emptyCartEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyHeading: {
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  browseProductsBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  browseProductsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  deliveryFeeSection: {
    paddingVertical: 4,
  },
  infoTouchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  infoTouchText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
  },
  feeSubText: {
    fontSize: 11,
    color: '#62677A',
    marginTop: 2,
  },
  floorNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  floorNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  floorNoticeDesc: {
    fontSize: 10,
    color: '#5B21B6',
    marginTop: 2,
    lineHeight: 14,
  },
  feeDetailsDrawer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  drawerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  drawerDot: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 4,
  },
  drawerText: {
    fontSize: 10,
    color: '#475569',
    flex: 1,
    lineHeight: 14,
  },
  directPassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  directPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  directPassText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
});
