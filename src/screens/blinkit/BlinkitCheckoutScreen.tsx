import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { useApp } from '../../context/AppContext';

export const BlinkitCheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    blinkitCartTotal,
    couponDiscount,
    walletBalance,
    deliveryLocation,
    placeOrder,
    currentOrder,
    setActiveScreen,
    goBack,
  } = useApp();

  const [selectedPayment, setSelectedPayment] = useState<'blinkit_money' | 'upi' | 'card' | 'cod'>('upi');
  const [useWalletBalance, setUseWalletBalance] = useState(walletBalance > 0);
  const [deliveryInstruction, setDeliveryInstruction] = useState('Ring bell & leave at door');
  const [isOrderConfirmed, setOrderConfirmed] = useState(false);

  const deliveryFee = blinkitCartTotal > 199 ? 0 : 15;
  const handlingFee = 5;
  const baseTotal = Math.max(0, blinkitCartTotal + deliveryFee + handlingFee - couponDiscount);
  const walletDeduction = useWalletBalance ? Math.min(walletBalance, baseTotal) : 0;
  const finalPayable = Math.max(0, baseTotal - walletDeduction);

  const handlePlaceOrder = () => {
    const paymentMethod = useWalletBalance && finalPayable === 0 ? 'WALLET' : selectedPayment.toUpperCase();
    placeOrder(paymentMethod);
    setOrderConfirmed(true);
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

        {/* 3. Payment Method Selection */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>
            Select Payment Method
          </Text>

          {/* Blinkit Money Option */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedPayment('blinkit_money');
              setUseWalletBalance(true);
            }}
            style={styles.paymentOptionRow}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[styles.paymentIconBox, { backgroundColor: COLORS.lightPink }]}>
                <AppIcon name="wallet" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                  Blinkit Money
                </Text>
                <Text style={styles.walletBalText}>Available: ₹{walletBalance}</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                selectedPayment === 'blinkit_money' && styles.radioOuterActive,
              ]}
            >
              {selectedPayment === 'blinkit_money' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

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
        </View>

        {/* 4. Payment Summary Preview */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Total</Text>
            <Text style={styles.summaryValue}>₹{baseTotal}</Text>
          </View>
          {walletDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Blinkit Money Deducted</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
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
          style={styles.placeOrderBtn}
          accessibilityLabel="Place Order"
        >
          <Text style={styles.placeOrderBtnText}>Place Order</Text>
        </TouchableOpacity>
      </View>

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
});
