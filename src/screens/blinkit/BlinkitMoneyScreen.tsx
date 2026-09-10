import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { useApp } from '../../context/AppContext';
import {
  Blinkit3DWallet,
  SingleTapIllustration,
  ZeroFailuresIllustration,
  RealTimeRefundsIllustration,
  GiftBoxIllustration,
} from '../../components/blinkit/BlinkitMoneyIllustrations';

export const BlinkitMoneyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { walletBalance, addWalletBalance, goBack } = useApp();

  const [isAddMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('500');

  const presetAmounts = [100, 200, 500, 1000];

  const handleAddMoneySubmit = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    addWalletBalance(parsed);
    setAddMoneyModalVisible(false);
    Alert.alert('Success', `₹${parsed} added to Worm Up Wallet successfully!`);
  };

  return (
    <View style={styles.container}>
      {/* Signature Worm Up Deep Navy to Soft Lavender/White Gradient */}
      <LinearGradient
        colors={['#05062A', '#0D0F3F', '#1B1754', '#2B1963', '#F6F4FD', '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.18, 0.32, 0.46, 0.64, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        >
          {/* Top Header Row with Glassmorphism Back Button and Settings Gear */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goBack}
              style={styles.glassHeaderBtn}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Worm Up Wallet Settings',
                  `Current Balance: ₹${walletBalance}\nAuto-Reload and Payment preferences.`
                )
              }
              style={styles.glassHeaderBtn}
              accessibilityLabel="Wallet Settings"
            >
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Hero Section: 3D Luxury Wallet & Worm Up Typography */}
          <View style={styles.heroSection}>
            <Blinkit3DWallet size={125} />

            <Text style={styles.brandTitle}>WORM UP</Text>
            <Text style={styles.walletTitle}>WALLET</Text>
          </View>

          {/* Three Separate Feature Cards with Soft Lavender/Pink Borders */}
          <View style={styles.cardsContainer}>
            {/* Card 1: Single tap payments */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <SingleTapIllustration size={44} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Single tap payments</Text>
                <Text style={styles.cardDesc}>
                  Enjoy seamless payments without the wait for OTPs
                </Text>
              </View>
            </View>

            {/* Card 2: Zero failures */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <ZeroFailuresIllustration size={44} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Zero failures</Text>
                <Text style={styles.cardDesc}>
                  Zero payment failures ensure you never miss an order
                </Text>
              </View>
            </View>

            {/* Card 3: Real-time refunds */}
            <View style={styles.featureCard}>
              <View style={styles.iconContainer}>
                <RealTimeRefundsIllustration size={44} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Real-time refunds</Text>
                <Text style={styles.cardDesc}>
                  No need to wait for refunds. Worm Up refunds are instant!
                </Text>
              </View>
            </View>
          </View>

          {/* Primary CTA: Add Money (Signature Worm Up Gradient Button) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setAddMoneyModalVisible(true)}
            style={styles.addMoneyBtnWrapper}
            accessibilityLabel="Add Money to Worm Up Wallet"
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addMoneyBtnGradient}
            >
              <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.addMoneyBtnText}>Add Money</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Claim Gift Card Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Claim Gift Card', 'Enter voucher code to claim.')}
            style={styles.giftCardContainer}
          >
            <View style={styles.giftCardLeft}>
              <GiftBoxIllustration size={42} />
            </View>
            <View style={styles.giftCardTextCol}>
              <Text style={styles.giftCardTitle}>Claim Gift Card</Text>
              <Text style={styles.giftCardDesc}>
                Enter gift card details to claim your balance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.purple} />
          </TouchableOpacity>

          {/* Faint Watermark Text at Bottom */}
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>Enjoy seamless</Text>
            <Text style={styles.watermarkText}>one tap payments</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      {/* Add Money Modal */}
      <Modal
        visible={isAddMoneyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddMoneyModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAddMoneyModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={[TYPOGRAPHY.headingMd, styles.modalHeading]}>Add Money to Wallet</Text>
            <Text style={[TYPOGRAPHY.bodySm, styles.modalSub]}>
              Current balance: ₹{walletBalance}. Enter amount or pick a preset.
            </Text>

            {/* Input Row */}
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
              />
            </View>

            {/* Preset Amount Chips */}
            <View style={styles.presetsRow}>
              {presetAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.75}
                  onPress={() => setAmountInput(amt.toString())}
                  style={[
                    styles.presetChip,
                    amountInput === amt.toString() && styles.presetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      amountInput === amt.toString() && styles.presetChipTextActive,
                    ]}
                  >
                    +₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddMoneySubmit}
              style={styles.modalConfirmBtnWrapper}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalConfirmGradient}
              >
                <Text style={styles.modalConfirmText}>Proceed to Add ₹{amountInput || 0}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  glassHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.hotPink,
    marginTop: 10,
    letterSpacing: 2,
  },
  walletTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginTop: -2,
    textShadowColor: 'rgba(131, 100, 230, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.18)',
    shadowColor: '#8364E6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F8F6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.lightBlueLavender,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  addMoneyBtnWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  addMoneyBtnGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoneyBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  giftCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.18)',
    shadowColor: '#8364E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 28,
  },
  giftCardLeft: {
    marginRight: 12,
  },
  giftCardTextCol: {
    flex: 1,
  },
  giftCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  giftCardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  watermarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  watermarkText: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(131, 100, 230, 0.09)',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 38,
  },
  modalHeading: {
    color: COLORS.navy,
    marginBottom: 4,
    fontWeight: '800',
  },
  modalSub: {
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FE',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.hotPink,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 54,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.navy,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F4F4FA',
    borderWidth: 1,
    borderColor: '#E2E6F9',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: COLORS.lightPink,
    borderWidth: 1.5,
    borderColor: COLORS.hotPink,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  presetChipTextActive: {
    color: COLORS.deepPurple,
    fontWeight: '800',
  },
  modalConfirmBtnWrapper: {
    borderRadius: 14,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalConfirmGradient: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

