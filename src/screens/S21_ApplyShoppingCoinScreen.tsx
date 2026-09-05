import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S21_ApplyShoppingCoinScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, appliedCoins, setAppliedCoins, cartSummary, setActiveScreen, goBack } = useApp();

  // Max usable coins: 20% of subtotal or balance
  const maxCoins = Math.min(Math.floor(cartSummary.subtotalSelling * 0.2), user.shoppingCoins);
  const [selectedCoins, setSelectedCoins] = useState<number>(appliedCoins || 20);

  const coinOptions = [10, 20, 30, 40, 50].filter((val) => val <= maxCoins);

  const handleApply = () => {
    setAppliedCoins(selectedCoins);
    goBack();
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Apply Shopping Coin"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Available Balance Highlight Card */}
        <View style={styles.balanceCard}>
          <View style={styles.coinIconCircle}>
            <Ionicons name="ribbon" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>{user.shoppingCoins.toLocaleString()} SC</Text>
          <Text style={styles.balanceSubtext}>1 SC = ₹1 instant discount</Text>
        </View>

        {/* Use Shopping Coin Section */}
        <View style={styles.card}>
          <View style={styles.sliderHeader}>
            <Text style={styles.cardTitle}>Use Shopping Coin</Text>
            <View style={styles.amountPill}>
              <Text style={styles.amountText}>₹{selectedCoins}</Text>
            </View>
          </View>

          {/* Quick Coin Select Buttons */}
          <Text style={styles.selectLabel}>Select Amount to Redeem</Text>
          <View style={styles.pillsRow}>
            {coinOptions.map((amount) => {
              const isSelected = selectedCoins === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCoins(amount)}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {amount} SC (₹{amount})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.minNote}>• Min 10 SC can be used per order</Text>
          <Text style={styles.minNote}>• Maximum 20% discount applicable per order</Text>
        </View>

        {/* Order Discount Preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discount Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Order Value</Text>
            <Text style={styles.breakdownValue}>₹{cartSummary.subtotalSelling}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Shopping Coin</Text>
            <Text style={[styles.breakdownValue, styles.greenText]}>-₹{selectedCoins}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Payable</Text>
            <Text style={styles.totalValue}>
              ₹{Math.max(0, cartSummary.subtotalSelling - selectedCoins - cartSummary.couponDiscount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Apply CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GradientButton
          title={`Apply ${selectedCoins} SC`}
          onPress={handleApply}
          style={styles.applyButton}
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
    paddingBottom: 90,
  },
  balanceCard: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  coinIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.hotPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    marginVertical: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: COLORS.softPinkGradient,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  amountPill: {
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.hotPink,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  selectLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  pill: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pillTextSelected: {
    color: COLORS.white,
  },
  minNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  breakdownValue: {
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
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    width: '100%',
  },
});
