import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S20_CheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    selectedAddress,
    cartSummary,
    setActiveScreen,
    goBack,
  } = useApp();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Checkout"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={18} color={COLORS.hotPink} />
              <Text style={styles.cardTitle}>Deliver to</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveScreen('C11_AddAddress')}>
              <Text style={styles.changeAction}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressBody}>
            <Text style={styles.addressType}>{selectedAddress.type}</Text>
            <Text style={styles.addressLine}>{selectedAddress.houseFlat}, {selectedAddress.areaLandmark}</Text>
            <Text style={styles.addressLine}>{selectedAddress.city} {selectedAddress.pincode}</Text>
            <Text style={styles.phoneText}>Phone: {selectedAddress.phoneNumber}</Text>
          </View>
        </View>

        {/* Delivery Slot Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="time" size={18} color={COLORS.purple} />
              <Text style={styles.cardTitle}>Delivery Slot</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeAction}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotBody}>
            <View style={styles.slotBadge}>
              <Ionicons name="flash" size={14} color={COLORS.hotPink} />
              <Text style={styles.slotBadgeText}>Express</Text>
            </View>
            <Text style={styles.slotText}>Today, 10:00 AM – 12:00 PM</Text>
          </View>
        </View>

        {/* Shopping Coin Applied Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveScreen('C21_ApplyShoppingCoin')}
          style={styles.coinCard}
        >
          <View style={styles.coinLeft}>
            <Ionicons name="ribbon" size={22} color={COLORS.purple} />
            <View>
              <Text style={styles.coinTitle}>Shopping Coin Applied</Text>
              <Text style={styles.coinSubtitle}>
                {cartSummary.shoppingCoinDiscount} SC used for ₹{cartSummary.shoppingCoinDiscount} discount
              </Text>
            </View>
          </View>
          <Text style={styles.changeAction}>Modify</Text>
        </TouchableOpacity>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartSummary.subtotalSelling}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, styles.greenText]}>
              -₹{cartSummary.couponDiscount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shopping Coin</Text>
            <Text style={[styles.summaryValue, styles.greenText]}>
              -₹{cartSummary.shoppingCoinDiscount}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, styles.greenText]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{cartSummary.totalPayable}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.bottomTotal}>₹{cartSummary.totalPayable}</Text>
          <Text style={styles.bottomSavings}>You save ₹{cartSummary.totalSavings}</Text>
        </View>

        <GradientButton
          title="Place Order"
          onPress={() => setActiveScreen('C22_Payment')}
          style={styles.placeOrderButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  changeAction: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  addressBody: {
    paddingTop: 4,
  },
  addressType: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginTop: 4,
  },
  slotBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E6F9',
    marginBottom: SPACING.md,
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  coinSubtitle: {
    fontSize: 12,
    color: COLORS.purple,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  greenText: {
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.compact,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bottomSavings: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  placeOrderButton: {
    flex: 1,
    marginLeft: SPACING.md,
  },
});
