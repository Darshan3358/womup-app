import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { PaymentType } from '../types';

interface PaymentOptionItem {
  id: PaymentType;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  recommended?: boolean;
}

const PAYMENT_OPTIONS: PaymentOptionItem[] = [
  {
    id: 'UPI',
    title: 'UPI',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM',
    iconName: 'flash',
    color: COLORS.hotPink,
    recommended: true,
  },
  {
    id: 'CARD',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, MasterCard, RuPay, Maestro',
    iconName: 'card',
    color: COLORS.blue,
  },
  {
    id: 'WALLET',
    title: 'Wallets',
    subtitle: 'Paytm Wallet, PhonePe Wallet',
    iconName: 'wallet',
    color: COLORS.purple,
  },
  {
    id: 'NET_BANKING',
    title: 'Net Banking',
    subtitle: 'All major Indian banks supported',
    iconName: 'business',
    color: COLORS.darkBlue,
  },
  {
    id: 'COD',
    title: 'Cash on Delivery',
    subtitle: 'Pay cash or scan QR upon delivery',
    iconName: 'cash',
    color: COLORS.success,
  },
];

export const S22_PaymentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { cartSummary, placeOrder, setActiveScreen, goBack } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<PaymentType>('UPI');
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      placeOrder(selectedMethod);
      setProcessing(false);
      setActiveScreen('C23_OrderPlaced');
    }, 800);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Payment"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total to pay banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountBannerLabel}>Total Amount to Pay</Text>
          <Text style={styles.amountBannerValue}>₹{cartSummary.totalPayable}</Text>
        </View>

        {/* Recommended Tag */}
        <Text style={styles.sectionTitle}>Recommended</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedMethod('UPI')}
          style={[
            styles.paymentCard,
            selectedMethod === 'UPI' && styles.paymentCardSelected,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFF0F7' }]}>
            <Ionicons name="flash" size={22} color={COLORS.hotPink} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>UPI</Text>
            <Text style={styles.paymentSubtitle}>Pay instantly using any UPI app</Text>
          </View>
          <View style={[styles.radio, selectedMethod === 'UPI' && styles.radioSelected]}>
            {selectedMethod === 'UPI' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Other Payment Methods */}
        <Text style={styles.sectionTitle}>Other Payment Methods</Text>
        {PAYMENT_OPTIONS.slice(1).map((opt) => {
          const isSelected = selectedMethod === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => setSelectedMethod(opt.id)}
              style={[
                styles.paymentCard,
                isSelected && styles.paymentCardSelected,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#F4F4FA' }]}>
                <Ionicons name={opt.iconName} size={22} color={opt.color} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{opt.title}</Text>
                <Text style={styles.paymentSubtitle}>{opt.subtitle}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pay CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GradientButton
          title={`Pay ₹${cartSummary.totalPayable}`}
          onPress={handlePay}
          loading={processing}
          style={styles.payButton}
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
  amountBanner: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountBannerLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  amountBannerValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  paymentCardSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF8FC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioSelected: {
    borderColor: COLORS.hotPink,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.hotPink,
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
  payButton: {
    width: '100%',
  },
});
