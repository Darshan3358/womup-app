import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S23_OrderPlacedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentOrder, setActiveScreen } = useApp();

  const orderNum = currentOrder?.orderNumber || '#W12345678';
  const total = currentOrder?.totalAmount || 348;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.content}>
        {/* Success Checkmark Circle */}
        <View style={styles.checkmarkCircle}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Your order <Text style={styles.orderNumberBold}>{orderNum}</Text> has been placed.
        </Text>
        <Text style={styles.note}>
          You will receive a confirmation shortly and delivery updates in real-time.
        </Text>

        {/* Mini Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Total</Text>
            <Text style={styles.summaryValue}>₹{total}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery</Text>
            <Text style={styles.deliveryTime}>10 – 15 mins</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <GradientButton
          title="Track Order"
          onPress={() => setActiveScreen('C24_OrderTracking')}
          style={styles.trackButton}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveScreen('C12_Home')}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    marginTop: 60,
  },
  checkmarkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  orderNumberBold: {
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  note: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.hotPink,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  trackButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  homeButton: {
    padding: SPACING.sm,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
