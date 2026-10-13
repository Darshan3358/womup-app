import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import {
  Blinkit3DWallet,
  SingleTapIllustration,
  ZeroFailuresIllustration,
  RealTimeRefundsIllustration,
  GiftBoxIllustration,
} from '../../components/blinkit/BlinkitMoneyIllustrations';

export const BlinkitMoneyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, setUser, walletBalance, addWalletBalance, goBack } = useApp();

  const [isAddMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('500');

  // Aadhaar Verification State
  const [isAadhaarModalVisible, setAadhaarModalVisible] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarNameInput, setAadhaarNameInput] = useState(user.fullNameAsPerAadhaar || user.fullName || '');
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState('');
  const [aadhaarSuccessMsg, setAadhaarSuccessMsg] = useState('');

  const presetAmounts = [100, 200, 500, 1000];

  // Refresh profile & wallet balances from backend on mount
  useEffect(() => {
    let isMounted = true;
    AuthService.getProfile().then((profile) => {
      if (profile && isMounted) {
        setUser((prev) => ({
          ...prev,
          ...profile,
          shoppingCoins: profile.shoppingCoins ?? prev.shoppingCoins ?? 2000,
          verificationStatus: profile.verificationStatus || (profile.aadhaarVerified ? 'VERIFIED' : 'NON_VERIFIED'),
          aadhaarVerified: profile.aadhaarVerified,
          pendingIncome: profile.pendingIncome ?? 0,
          availableIncome: profile.availableIncome ?? 0,
          appDownloadIncome: profile.appDownloadIncome ?? 0,
        }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerifyAadhaarSubmit = async () => {
    const rawAadhaar = aadhaarInput.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(rawAadhaar)) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!aadhaarNameInput.trim()) {
      setAadhaarError('Please enter full name as per Aadhaar');
      return;
    }
    setVerifyingAadhaar(true);
    setAadhaarError('');
    try {
      const res = await AuthService.verifyAadhaar(rawAadhaar, aadhaarNameInput.trim());
      if (res.success) {
        const updated = {
          ...user,
          verificationStatus: 'VERIFIED',
          aadhaarVerified: true,
          fullNameAsPerAadhaar: aadhaarNameInput.trim(),
          pendingIncome: res.user?.pendingIncome ?? user.pendingIncome,
          availableIncome: res.user?.availableIncome ?? user.availableIncome,
        };
        setUser(updated);
        StorageService.saveItem(StorageService.KEYS.USER, updated);
        setAadhaarSuccessMsg('Aadhaar verified successfully! Full benefits unlocked.');
        setTimeout(() => {
          setAadhaarModalVisible(false);
          setAadhaarSuccessMsg('');
        }, 1200);
      } else {
        setAadhaarError(res.message || 'Verification failed. Please check details.');
      }
    } catch (err: any) {
      setAadhaarError(err?.message || 'Verification error occurred.');
    } finally {
      setVerifyingAadhaar(false);
    }
  };

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
            <Blinkit3DWallet size={120} />

            <Text style={styles.brandTitle}>WORM UP</Text>
            <Text style={styles.walletTitle}>WALLET & BALANCES</Text>
          </View>

          {/* ══════════════════════════════════════════════════════════════
              SRS 4-BALANCE SYSTEM: Shopping Coins, Today's Income,
              Available Income, and Aadhaar Verification Status
             ══════════════════════════════════════════════════════════════ */}
          <View style={styles.balancesSection}>
            <Text style={styles.balancesSectionTitle}>Account Balances</Text>

            {/* 1. Shopping Coins Card */}
            <View style={styles.balanceCardDark}>
              <View style={styles.balanceCardTop}>
                <View style={styles.badgeRow}>
                  <Text style={styles.balanceBadgeDark}>SHOPPING COINS</Text>
                  <View style={styles.bonusTag}>
                    <Text style={styles.bonusTagText}>WELCOME BONUS</Text>
                  </View>
                </View>
                <Text style={styles.balanceIcon}>🪙</Text>
              </View>
              <Text style={styles.balanceValueDark}>{user.shoppingCoins ?? 2000}</Text>
              <Text style={styles.balanceSubDark}>
                Worth ₹{user.shoppingCoins ?? 2000} • 1 Coin = ₹1 Discount on grocery orders
              </Text>
            </View>

            {/* Row of 2 Cards: Today's Income & Available Income */}
            <View style={styles.twoCardsRow}>
              {/* 2. Today's Pending Income */}
              <View style={[styles.balanceCardHalf, styles.pendingCard]}>
                <View style={styles.balanceCardTop}>
                  <Text style={styles.balanceBadgePending}>TODAY'S INCOME</Text>
                  <Text style={styles.balanceIconSmall}>⏳</Text>
                </View>
                <Text style={styles.balanceValuePending}>₹{user.pendingIncome ?? 0}</Text>
                <Text style={styles.balanceSubPending}>
                  From downline • Auto-promoted at 00:00 midnight
                </Text>
              </View>

              {/* 3. Available Income */}
              <View style={[styles.balanceCardHalf, styles.availableCard]}>
                <View style={styles.balanceCardTop}>
                  <Text style={styles.balanceBadgeAvailable}>AVAILABLE INCOME</Text>
                  <Text style={styles.balanceIconSmall}>💰</Text>
                </View>
                <Text style={styles.balanceValueAvailable}>₹{user.availableIncome ?? 0}</Text>
                <Text style={styles.balanceSubAvailable}>
                  Unlocked • Ready to spend on grocery orders
                </Text>
              </View>
            </View>

            {/* 4. Aadhaar Verification Status Card */}
            {(() => {
              const isVerified = user.verificationStatus === 'VERIFIED' || user.aadhaarVerified;
              return (
                <View
                  style={[
                    styles.verificationCard,
                    isVerified ? styles.verificationCardVerified : styles.verificationCardUnverified,
                  ]}
                >
                  <View style={styles.verificationCardHeader}>
                    <View style={styles.verificationBadgeWrap}>
                      <Ionicons
                        name={isVerified ? 'shield-checkmark' : 'shield-outline'}
                        size={20}
                        color={isVerified ? '#15803D' : '#D97706'}
                      />
                      <Text
                        style={[
                          styles.verificationStatusText,
                          isVerified ? styles.textVerified : styles.textUnverified,
                        ]}
                      >
                        {isVerified ? 'VERIFIED ACCOUNT' : 'NON-VERIFIED MEMBER'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.verificationActionLabel,
                        isVerified ? styles.labelVerified : styles.labelActionRequired,
                      ]}
                    >
                      {isVerified ? 'UIDAI VALIDATED' : 'ACTION REQUIRED'}
                    </Text>
                  </View>

                  <Text style={styles.verificationDesc}>
                    {isVerified
                      ? `Aadhaar verified as ${user.fullNameAsPerAadhaar || user.fullName}. All downline commissions and income usage features are fully unlocked.`
                      : 'Non-verified members cannot use income balance or earn downline download commissions. Verify Aadhaar to unlock!'}
                  </Text>

                  {!isVerified && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setAadhaarInput('');
                        setAadhaarNameInput(user.fullNameAsPerAadhaar || user.fullName || '');
                        setAadhaarError('');
                        setAadhaarModalVisible(true);
                      }}
                      style={styles.verifyNowBtn}
                    >
                      <Text style={styles.verifyNowBtnText}>Verify Aadhaar Now</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
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

      {/* Aadhaar Verification Modal */}
      <Modal
        visible={isAadhaarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAadhaarModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAadhaarModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View
            style={styles.aadhaarModalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.aadhaarModalHeader}>
              <View style={styles.aadhaarShieldIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#15803D" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.aadhaarModalHeading}>Aadhaar Verification</Text>
                <Text style={styles.aadhaarModalSub}>
                  Unlock downline income & full wallet access
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAadhaarModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Error & Success Alerts */}
            {aadhaarError ? (
              <View style={styles.aadhaarErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.aadhaarErrorText}>{aadhaarError}</Text>
              </View>
            ) : null}

            {aadhaarSuccessMsg ? (
              <View style={styles.aadhaarSuccessBox}>
                <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.aadhaarSuccessText}>{aadhaarSuccessMsg}</Text>
              </View>
            ) : null}

            {/* Full Name as per Aadhaar Input */}
            <View style={styles.aadhaarInputGroup}>
              <Text style={styles.aadhaarLabel}>Full Name (As per Aadhaar)</Text>
              <View style={styles.aadhaarInputContainer}>
                <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.aadhaarInput}
                  placeholder="Legal name on Aadhaar"
                  placeholderTextColor={COLORS.secondaryText}
                  value={aadhaarNameInput}
                  onChangeText={(t) => {
                    setAadhaarNameInput(t);
                    if (aadhaarError) setAadhaarError('');
                  }}
                />
              </View>
            </View>

            {/* 12-Digit Aadhaar Input */}
            <View style={styles.aadhaarInputGroup}>
              <Text style={styles.aadhaarLabel}>12-Digit Aadhaar Number</Text>
              <View style={styles.aadhaarInputContainer}>
                <Ionicons name="card-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.aadhaarInput}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="numeric"
                  maxLength={14}
                  value={aadhaarInput}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/\D/g, '').slice(0, 12);
                    // Format with spaces
                    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                    setAadhaarInput(formatted);
                    if (aadhaarError) setAadhaarError('');
                  }}
                />
              </View>
            </View>

            {/* Security Guarantee Note */}
            <View style={styles.aadhaarSecurityNote}>
              <Ionicons name="lock-closed" size={14} color="#047857" />
              <Text style={styles.aadhaarSecurityText}>
                UIDAI Compliant. We do not store biometric data. Information is encrypted end-to-end.
              </Text>
            </View>

            {/* Submit Verification Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={verifyingAadhaar}
              onPress={handleVerifyAadhaarSubmit}
              style={styles.verifySubmitBtn}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifySubmitGradient}
              >
                {verifyingAadhaar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.verifySubmitText}>Verify & Unlock Income</Text>
                  </>
                )}
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

  // ══════════════════════════════════════════════════════════════
  // SRS 4-BALANCE SECTION STYLES
  // ══════════════════════════════════════════════════════════════
  balancesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  balancesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  balanceCardDark: {
    backgroundColor: '#071B52',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceBadgeDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  bonusTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
  },
  balanceIcon: {
    fontSize: 22,
  },
  balanceValueDark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  balanceSubDark: {
    fontSize: 12,
    color: '#FCD34D',
    fontWeight: '600',
    marginTop: 4,
  },
  twoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  balanceCardHalf: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  pendingCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  balanceBadgePending: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  balanceIconSmall: {
    fontSize: 16,
  },
  balanceValuePending: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B45309',
    marginVertical: 4,
  },
  balanceSubPending: {
    fontSize: 10,
    color: '#78350F',
    fontWeight: '500',
    lineHeight: 14,
  },
  availableCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  balanceBadgeAvailable: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  balanceValueAvailable: {
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
    marginVertical: 4,
  },
  balanceSubAvailable: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '500',
    lineHeight: 14,
  },
  verificationCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
  },
  verificationCardVerified: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  verificationCardUnverified: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  verificationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verificationStatusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  textVerified: {
    color: '#15803D',
  },
  textUnverified: {
    color: '#B45309',
  },
  verificationActionLabel: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelVerified: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  labelActionRequired: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  verificationDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  verifyNowBtn: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyNowBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ══════════════════════════════════════════════════════════════
  // AADHAAR MODAL STYLES
  // ══════════════════════════════════════════════════════════════
  aadhaarModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 38,
  },
  aadhaarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  aadhaarShieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarModalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  aadhaarModalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  aadhaarErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  aadhaarSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  aadhaarSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  aadhaarInputGroup: {
    marginBottom: 14,
  },
  aadhaarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  aadhaarInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    paddingHorizontal: 14,
  },
  aadhaarInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  aadhaarSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
    gap: 8,
  },
  aadhaarSecurityText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
  },
  verifySubmitBtn: {
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  verifySubmitGradient: {
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifySubmitText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

