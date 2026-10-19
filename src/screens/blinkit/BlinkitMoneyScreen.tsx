import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { KycService } from '../../services/kycService';
import {
  Blinkit3DWallet,
  SingleTapIllustration,
  ZeroFailuresIllustration,
  RealTimeRefundsIllustration,
  GiftBoxIllustration,
} from '../../components/blinkit/BlinkitMoneyIllustrations';
import { FileUploadField } from '../../components/common/FileUploadField';
import { resolveImageUrl } from '../../utils/imageUrl';

export const BlinkitMoneyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, setUser, walletBalance, addWalletBalance, goBack } = useApp();

  const [isAddMoneyModalVisible, setAddMoneyModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('500');

  // Aadhaar & Bank KYC State
  const [isAadhaarModalVisible, setAadhaarModalVisible] = useState(false);
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarNameInput, setAadhaarNameInput] = useState(user.fullNameAsPerAadhaar || user.accountHolderName || user.fullName || '');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  
  // Bank Details State
  const [bankNameInput, setBankNameInput] = useState(user.bankName || '');
  const [accountNumberInput, setAccountNumberInput] = useState(user.accountNumber || (user as any).bankAccountNo || '');
  const [ifscCodeInput, setIfscCodeInput] = useState(user.ifscCode || '');
  const [accountHolderNameInput, setAccountHolderNameInput] = useState(user.accountHolderName || user.fullNameAsPerAadhaar || user.fullName || '');
  const [upiIdInput, setUpiIdInput] = useState(user.upiId || '');

  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState('');
  const [aadhaarSuccessMsg, setAadhaarSuccessMsg] = useState('');

  // ── Withdrawal Modal State ──
  const [isWithdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('600');
  const [withdrawBankInput, setWithdrawBankInput] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');

  // ── Team Dashboard Modal State ──
  const [isTeamModalVisible, setTeamModalVisible] = useState(false);
  const [teamDashboardData, setTeamDashboardData] = useState<any>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<{ [key: number]: boolean }>({ 1: true });

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  // ── Income History Modal State ──
  const [isIncomeHistoryVisible, setIsIncomeHistoryVisible] = useState(false);
  const [incomeHistoryData, setIncomeHistoryData] = useState<any>(null);
  const [isLoadingIncomeHistory, setIsLoadingIncomeHistory] = useState(false);

  const handleOpenIncomeHistory = async () => {
    setIsIncomeHistoryVisible(true);
    setIsLoadingIncomeHistory(true);
    try {
      const res = await AuthService.getIncomeHistory(1, 50);
      if (res.success && res.data) {
        setIncomeHistoryData(res.data);
      }
    } catch (e) {
      console.warn('Failed to load income history:', e);
    } finally {
      setIsLoadingIncomeHistory(false);
    }
  };

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
          monthlyPurchaseValue: (profile as any).monthlyPurchaseValue ?? prev.monthlyPurchaseValue ?? 0,
          isActiveMember: (profile as any).isActiveMember ?? prev.isActiveMember ?? false,
          direct5ActiveCount: (profile as any).direct5ActiveCount ?? prev.direct5ActiveCount ?? 0,
          teamSize: (profile as any).teamSize ?? prev.teamSize ?? 0,
        }));
      }
    });

    // Also fetch team dashboard in background to ensure qualification stats are 100% fresh
    AuthService.getTeamDashboard().then((res) => {
      if (res?.success && res.data && isMounted) {
        setTeamDashboardData(res.data);
        setUser((prev) => ({
          ...prev,
          teamSize: res.data.teamSummary?.totalTeamSize ?? prev.teamSize,
          direct5ActiveCount: res.data.personalStatus?.direct5ActiveCount ?? prev.direct5ActiveCount,
          monthlyPurchaseValue: res.data.personalStatus?.monthlyPurchaseValue ?? prev.monthlyPurchaseValue,
        }));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenTeamDashboard = async () => {
    setIsLoadingTeam(true);
    setTeamModalVisible(true);
    try {
      const res = await AuthService.getTeamDashboard();
      if (res.success && res.data) {
        setTeamDashboardData(res.data);
        setUser((prev) => ({
          ...prev,
          teamSize: res.data.teamSummary?.totalTeamSize ?? prev.teamSize,
          direct5ActiveCount: res.data.personalStatus?.direct5ActiveCount ?? prev.direct5ActiveCount,
          monthlyPurchaseValue: res.data.personalStatus?.monthlyPurchaseValue ?? prev.monthlyPurchaseValue,
        }));
      }
    } catch (e) {
      console.warn('Failed to load team dashboard:', e);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmountInput);
    if (isNaN(amt) || amt < 600) {
      setWithdrawError('Minimum withdrawal amount is ₹600 as per policy.');
      return;
    }
    const available = user.availableIncome ?? 0;
    if (amt > available) {
      setWithdrawError(`Insufficient available balance. You have ₹${available}.`);
      return;
    }
    setIsWithdrawing(true);
    setWithdrawError('');
    try {
      const res = await AuthService.withdrawIncome(amt, { destination: withdrawBankInput });
      if (res.success) {
        const remaining = res.data?.availableIncome ?? (available - amt);
        setUser((prev) => ({ ...prev, availableIncome: remaining }));
        setWithdrawSuccessMsg(res.message);
        setTimeout(() => {
          setWithdrawModalVisible(false);
          setWithdrawSuccessMsg('');
        }, 1800);
      } else {
        setWithdrawError(res.message || 'Withdrawal request failed.');
      }
    } catch (err: any) {
      setWithdrawError(err?.message || 'Withdrawal request failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleOpenKycModal = async () => {
    setAadhaarError('');
    setAadhaarSuccessMsg('');

    const currentName = user.fullNameAsPerAadhaar || user.accountHolderName || user.fullName || '';
    const currentAadhaar = user.aadhaarNumber || user.aadharNumber || '';
    const currentFront = user.aadharFrontImage || user.customer_image_aadhar_front || '';
    const currentBack = user.aadharBackImage || user.customer_image_aadhar_back || '';
    const currentBank = user.bankName || '';
    const currentAcc = user.accountNumber || (user as any).bankAccountNo || '';
    const currentIfsc = user.ifscCode || '';
    const currentHolder = user.accountHolderName || currentName;
    const currentUpi = user.upiId || '';

    setAadhaarNameInput(currentName);
    setAadhaarInput(currentAadhaar ? (currentAadhaar.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || currentAadhaar) : '');
    setAadhaarFrontUrl(currentFront);
    setAadhaarBackUrl(currentBack);
    setBankNameInput(currentBank);
    setAccountNumberInput(currentAcc);
    setIfscCodeInput(currentIfsc);
    setAccountHolderNameInput(currentHolder);
    setUpiIdInput(currentUpi);

    const hasData = !!(
      currentAadhaar ||
      currentFront ||
      currentBank ||
      currentAcc ||
      user.verificationStatus === 'VERIFIED' ||
      user.verificationStatus === 'PENDING' ||
      user.customerKycStatus === 1 ||
      user.customerKycStatus === 2
    );
    // If user already uploaded/saved data, open in View Mode. They can click "Edit Details" anytime.
    setIsEditingKyc(!hasData);
    setAadhaarModalVisible(true);

    try {
      const res = await KycService.getKycStatus();
      if (res?.success && res.data) {
        const d = res.data;
        if (d.fullNameAsPerAadhaar) setAadhaarNameInput(d.fullNameAsPerAadhaar);
        if (d.rawAadhaarNumber) {
          const raw = d.rawAadhaarNumber;
          setAadhaarInput(raw.match(/.{1,4}/g)?.join(' ') || raw);
        } else if (d.aadharNumber && !currentAadhaar) {
          setAadhaarInput(d.aadharNumber);
        }
        if (d.aadharFront || d.aadhaarFrontUrl) setAadhaarFrontUrl(d.aadharFront || d.aadhaarFrontUrl || '');
        if (d.aadharBack || d.aadhaarBackUrl) setAadhaarBackUrl(d.aadharBack || d.aadhaarBackUrl || '');
        if (d.bankDetails?.bankName || d.bankName) setBankNameInput(d.bankDetails?.bankName || d.bankName || '');
        if (d.bankDetails?.rawAccountNumber || d.accountNumber) setAccountNumberInput(d.bankDetails?.rawAccountNumber || d.accountNumber || '');
        if (d.bankDetails?.ifscCode || d.ifscCode) setIfscCodeInput(d.bankDetails?.ifscCode || d.ifscCode || '');
        if (d.bankDetails?.accountHolderName) setAccountHolderNameInput(d.bankDetails.accountHolderName);
        if (d.bankDetails?.upiId || d.upiId) setUpiIdInput(d.bankDetails?.upiId || d.upiId || '');
      }
    } catch (_) {}
  };

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
    if (!bankNameInput.trim()) {
      setAadhaarError('Please enter Bank Name');
      return;
    }
    if (!accountNumberInput.trim() || accountNumberInput.trim().length < 8) {
      setAadhaarError('Please enter a valid Account Number (minimum 8 digits)');
      return;
    }
    if (!ifscCodeInput.trim() || ifscCodeInput.trim().length < 9) {
      setAadhaarError('Please enter a valid IFSC Code (e.g. SBIN0001234)');
      return;
    }
    if (!accountHolderNameInput.trim()) {
      setAadhaarError('Please enter Account Holder Name');
      return;
    }

    setVerifyingAadhaar(true);
    setAadhaarError('');
    try {
      const payload = {
        aadhaarNumber: rawAadhaar,
        fullNameAsPerAadhaar: aadhaarNameInput.trim(),
        frontImage: aadhaarFrontUrl,
        backImage: aadhaarBackUrl,
        bankName: bankNameInput.trim(),
        accountNumber: accountNumberInput.trim(),
        ifscCode: ifscCodeInput.trim().toUpperCase(),
        accountHolderName: accountHolderNameInput.trim(),
        upiId: upiIdInput.trim(),
      };

      const res = await AuthService.verifyAadhaar(payload);

      KycService.submitKyc({
        aadharNumber: rawAadhaar,
        fullNameAsPerAadhaar: aadhaarNameInput.trim(),
        aadharFront: aadhaarFrontUrl,
        aadharBack: aadhaarBackUrl,
        bankName: bankNameInput.trim(),
        accountNumber: accountNumberInput.trim(),
        ifscCode: ifscCodeInput.trim().toUpperCase(),
        accountHolderName: accountHolderNameInput.trim(),
        upiId: upiIdInput.trim(),
      }).catch(() => {});

      if (res.success) {
        const updated = {
          ...user,
          verificationStatus: 'PENDING',
          customerKycStatus: 1,
          customerIsVerify: 2,
          aadhaarVerified: false,
          fullNameAsPerAadhaar: aadhaarNameInput.trim(),
          aadhaarNumber: rawAadhaar,
          aadharNumber: rawAadhaar,
          aadharFrontImage: aadhaarFrontUrl,
          aadharBackImage: aadhaarBackUrl,
          customer_image_aadhar_front: aadhaarFrontUrl,
          customer_image_aadhar_back: aadhaarBackUrl,
          bankName: bankNameInput.trim(),
          accountNumber: accountNumberInput.trim(),
          bankAccountNo: accountNumberInput.trim(),
          ifscCode: ifscCodeInput.trim().toUpperCase(),
          accountHolderName: accountHolderNameInput.trim(),
          upiId: upiIdInput.trim(),
          pendingIncome: res.user?.pendingIncome ?? user.pendingIncome,
          availableIncome: res.user?.availableIncome ?? user.availableIncome,
        };
        setUser(updated);
        StorageService.saveItem(StorageService.KEYS.USER, updated);
        setAadhaarSuccessMsg('KYC & Bank details submitted successfully for admin review!');
        setIsEditingKyc(false);
      } else {
        setAadhaarError(res.message || 'Verification submission failed. Please check details.');
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
    Alert.alert('Success', `₹${parsed} added to Womup Wallet successfully!`);
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
                  'Womup Wallet Settings',
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

            <Text style={styles.brandTitle}>WOMUP</Text>
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
                  <View style={styles.walletIconBadge}>
                    <Ionicons name="wallet" size={12} color="#FFFFFF" />
                    <Text style={styles.walletIconBadgeCurrency}>₹</Text>
                  </View>
                </View>
                <Text style={styles.balanceValueAvailable}>
                  ₹{Number(user.availableIncome ?? 0).toFixed(2)}
                </Text>
                <Text style={styles.balanceSubAvailable}>
                  Unlocked • Ready to spend or withdraw
                </Text>

                {/* Stacked View History & Withdraw Buttons (Matching screenshot) */}
                <View style={styles.availableBtnsCol}>
                  <TouchableOpacity
                    style={styles.viewHistoryBtnStacked}
                    onPress={handleOpenIncomeHistory}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={16} color="#4F46E5" />
                    <Text style={styles.viewHistoryBtnStackedText}>View History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.withdrawBtnStacked}
                    onPress={() => {
                      setWithdrawAmountInput(user.availableIncome && user.availableIncome >= 600 ? String(user.availableIncome) : '');
                      setWithdrawError('');
                      setWithdrawSuccessMsg('');
                      setWithdrawModalVisible(true);
                    }} 
                    activeOpacity={0.85}
                  >
                    <Ionicons name="download" size={16} color="#FFFFFF" />
                    <Text style={styles.withdrawBtnStackedText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 4. Real Income & 7-Level Team Status Card */}
            <View style={styles.teamStatusCard}>
              <View style={styles.teamCardHeader}>
                <View style={styles.teamBadgeRow}>
                  <Text style={styles.teamCardBadge}>REAL INCOME QUALIFICATION</Text>
                  <Text style={styles.teamCardIcon}>👥</Text>
                </View>
                <Text style={styles.teamCardTitle}>7-Level Team Performance</Text>
              </View>

              <View style={styles.teamStatsGrid}>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatLabel}>Personal Active</Text>
                  <Text style={[styles.teamStatVal, { color: (teamDashboardData?.personalStatus?.monthlyPurchaseValue ?? user.monthlyPurchaseValue ?? 0) >= 2000 ? '#059669' : '#DC2626' }]}>
                    {(teamDashboardData?.personalStatus?.monthlyPurchaseValue ?? user.monthlyPurchaseValue ?? 0) >= 2000 ? '✅ Active' : '❌ Need ₹2k'}
                  </Text>
                  <Text style={styles.teamStatSub}>
                    ₹{(teamDashboardData?.personalStatus?.monthlyPurchaseValue ?? user.monthlyPurchaseValue ?? 0).toFixed(0)} / ₹2,000
                  </Text>
                </View>

                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatLabel}>Direct 5 Active</Text>
                  <Text style={[styles.teamStatVal, { color: (teamDashboardData?.personalStatus?.direct5ActiveCount ?? user.direct5ActiveCount ?? 0) >= 5 ? '#059669' : '#DC2626' }]}>
                    {(teamDashboardData?.personalStatus?.direct5ActiveCount ?? user.direct5ActiveCount ?? 0) >= 5
                      ? '✅ 5/5'
                      : `❌ ${teamDashboardData?.personalStatus?.direct5ActiveCount ?? user.direct5ActiveCount ?? 0}/5`}
                  </Text>
                  <Text style={styles.teamStatSub}>5 Direct ≥ ₹2k</Text>
                </View>

                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatLabel}>7-Level Team</Text>
                  <Text style={[styles.teamStatVal, { color: '#4F46E5', fontWeight: '900' }]}>
                    {teamDashboardData?.teamSummary?.totalTeamSize ?? user.teamSize ?? 0}
                  </Text>
                  <Text style={styles.teamStatSub}>Members</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.teamDashboardBtn}
                onPress={handleOpenTeamDashboard}
                activeOpacity={0.85}
              >
                <Ionicons name="stats-chart" size={16} color="#FFFFFF" />
                <Text style={styles.teamDashboardBtnText}>View 7-Level Team Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 4. Aadhaar & Bank KYC Card */}
            {(() => {
              const isVerified = user.verificationStatus === 'VERIFIED' || user.customerKycStatus === 2 || user.aadhaarVerified;
              const isPending = user.verificationStatus === 'PENDING' || user.customerKycStatus === 1;
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
                        name={isVerified ? 'shield-checkmark' : isPending ? 'time' : 'shield-outline'}
                        size={20}
                        color={isVerified ? '#15803D' : isPending ? '#D97706' : '#DC2626'}
                      />
                      <Text
                        style={[
                          styles.verificationStatusText,
                          isVerified ? styles.textVerified : isPending ? { color: '#B45309' } : styles.textUnverified,
                        ]}
                      >
                        {isVerified ? 'VERIFIED ACCOUNT' : isPending ? 'UNDER REVIEW' : 'ACTION REQUIRED'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.verificationActionLabel,
                        isVerified
                          ? styles.labelVerified
                          : isPending
                          ? { backgroundColor: '#FEF3C7', color: '#B45309' }
                          : styles.labelActionRequired,
                      ]}
                    >
                      {isVerified ? 'UIDAI & BANK VERIFIED' : isPending ? 'PENDING ADMIN APPROVAL' : 'ACTION REQUIRED'}
                    </Text>
                  </View>

                  <Text style={styles.verificationDesc}>
                    {isVerified
                      ? `Aadhaar & Bank verified for ${user.fullNameAsPerAadhaar || user.accountHolderName || user.fullName}. Direct withdrawals and downline commissions are fully active.`
                      : isPending
                      ? `Your Aadhaar & Bank details have been submitted and are under review. You can view or edit your submitted details anytime.`
                      : 'Non-verified members cannot use income balance or make bank withdrawals. Verify Aadhaar & Bank details to unlock!'}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleOpenKycModal}
                    style={[
                      styles.verifyNowBtn,
                      isVerified
                        ? { backgroundColor: '#059669' }
                        : isPending
                        ? { backgroundColor: '#D97706' }
                        : styles.verifyNowBtn,
                    ]}
                  >
                    <Ionicons
                      name={isVerified ? 'shield-checkmark-outline' : isPending ? 'document-text-outline' : 'arrow-forward'}
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.verifyNowBtnText}>
                      {isVerified
                        ? 'View KYC & Bank Details'
                        : isPending
                        ? 'View / Edit Submitted Details'
                        : 'Verify Aadhaar & Bank Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* 5. Customer's Own Referral Code Card */}
            <View style={styles.referralCodeCard}>
              <View style={styles.referralLeftCol}>
                <Text style={styles.referralHeaderLabel}>MY REFERRAL CODE</Text>
                <Text style={styles.referralCodeBig}>{user.referralCode || 'WORM5871'}</Text>
                <Text style={styles.referralHelpText}>
                  Share with friends to earn ₹20 Direct App Download Income
                </Text>
              </View>
              <TouchableOpacity
                style={styles.referralCopyBtn}
                onPress={() => {
                  Alert.alert(
                    'Referral Code Copied!',
                    `Your referral code ${user.referralCode || 'WORM5871'} has been copied!`
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                <Text style={styles.referralCopyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
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
                  No need to wait for refunds. Womup refunds are instant!
                </Text>
              </View>
            </View>
          </View>

          {/* Primary CTA: Add Money (Signature Worm Up Gradient Button) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setAddMoneyModalVisible(true)}
            style={styles.addMoneyBtnWrapper}
            accessibilityLabel="Add Money to Womup Wallet"
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
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAddMoneyModalVisible(false)}
          />
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
        </View>
      </Modal>

      {/* Aadhaar & Bank KYC Modal */}
      <Modal
        visible={isAadhaarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAadhaarModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAadhaarModalVisible(false)}
          />
          <View style={styles.aadhaarModalCard}>
            {/* Modal Header */}
            <View style={styles.kycModalHeader}>
              <View style={styles.aadhaarShieldIcon}>
                <Ionicons name="shield-checkmark" size={22} color="#15803D" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.aadhaarModalHeading}>KYC & Bank Verification</Text>
                <Text style={styles.aadhaarModalSub}>
                  Aadhaar & Bank Account for Withdrawals
                </Text>
              </View>

              {/* Edit / Cancel Toggle Button in Header if data exists */}
              {(user.aadhaarNumber || aadhaarInput || bankNameInput || user.verificationStatus === 'VERIFIED' || user.verificationStatus === 'PENDING') && (
                <TouchableOpacity
                  onPress={() => {
                    setIsEditingKyc((prev) => !prev);
                    if (aadhaarError) setAadhaarError('');
                  }}
                  style={styles.editToggleBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isEditingKyc ? 'close-outline' : 'create-outline'}
                    size={15}
                    color="#4F46E5"
                  />
                  <Text style={styles.editToggleText}>
                    {isEditingKyc ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setAadhaarModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.kycScrollContent}
              keyboardShouldPersistTaps="handled"
            >
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

              {/* Status Banner */}
              {(() => {
                const isVerified = user.verificationStatus === 'VERIFIED' || user.customerKycStatus === 2 || user.aadhaarVerified;
                const isPending = user.verificationStatus === 'PENDING' || user.customerKycStatus === 1;
                const isRejected = user.verificationStatus === 'REJECTED' || user.customerKycStatus === 3;
                if (isVerified) {
                  return (
                    <View style={[styles.statusBannerBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <Ionicons name="shield-checkmark" size={20} color="#059669" />
                      <Text style={[styles.statusBannerText, { color: '#065F46' }]}>
                        Verified & Approved. All downline income withdrawals and wallet perks are active.
                      </Text>
                    </View>
                  );
                }
                if (isPending) {
                  return (
                    <View style={[styles.statusBannerBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                      <Ionicons name="time" size={20} color="#D97706" />
                      <Text style={[styles.statusBannerText, { color: '#92400E' }]}>
                        Under Admin Review. Your submitted documents & bank details are being verified.
                      </Text>
                    </View>
                  );
                }
                if (isRejected) {
                  return (
                    <View style={[styles.statusBannerBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                      <Ionicons name="alert-circle" size={20} color="#DC2626" />
                      <Text style={[styles.statusBannerText, { color: '#991B1B' }]}>
                        KYC Rejected: {user.kycRejectReason || 'Please review and re-submit valid documents.'}
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={[styles.statusBannerBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <Ionicons name="information-circle" size={20} color="#0284C7" />
                    <Text style={[styles.statusBannerText, { color: '#0369A1' }]}>
                      Enter Aadhaar and Bank details to enable secure direct payouts to your account.
                    </Text>
                  </View>
                );
              })()}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 1: IDENTITY (AADHAAR) */}
              {/* ──────────────────────────────────────────────────────────── */}
              <View style={styles.kycSectionHeader}>
                <Ionicons name="person-circle-outline" size={18} color="#4F46E5" />
                <Text style={styles.kycSectionTitle}>Identity Details (Aadhaar)</Text>
              </View>

              {isEditingKyc ? (
                <>
                  {/* Full Name as per Aadhaar Input */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>Full Name (As per Aadhaar) *</Text>
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
                    <Text style={styles.aadhaarLabel}>12-Digit Aadhaar Number *</Text>
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
                          const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                          setAadhaarInput(formatted);
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>

                  {/* Aadhaar Front & Back Uploads */}
                  <FileUploadField
                    label="Aadhaar Front Image"
                    required={false}
                    value={aadhaarFrontUrl}
                    folder="womup/kyc/customer"
                    onUploadComplete={(url) => setAadhaarFrontUrl(url)}
                    helperText="Upload front side showing photo & name"
                  />

                  <FileUploadField
                    label="Aadhaar Back Image"
                    required={false}
                    value={aadhaarBackUrl}
                    folder="womup/kyc/customer"
                    onUploadComplete={(url) => setAadhaarBackUrl(url)}
                    helperText="Upload back side showing permanent address"
                  />
                </>
              ) : (
                /* VIEW / DISPLAY UPLOADED DATA MODE */
                <>
                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>Full Name (As per Aadhaar)</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="person" size={16} color="#4F46E5" />
                      <Text style={styles.viewFieldValue}>
                        {aadhaarNameInput || user.fullNameAsPerAadhaar || user.fullName || 'Not provided'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>12-Digit Aadhaar Number</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="card" size={16} color="#4F46E5" />
                      <Text style={styles.viewFieldValue}>
                        {aadhaarInput || user.aadhaarNumber || 'Not provided'}
                      </Text>
                    </View>
                  </View>

                  {/* Aadhaar Front Document Card */}
                  <View style={styles.viewDocCard}>
                    {aadhaarFrontUrl ? (
                      <Image source={{ uri: resolveImageUrl(aadhaarFrontUrl) }} style={styles.viewDocThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.viewDocEmptyThumb}>
                        <Ionicons name="image-outline" size={22} color="#94A3B8" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.viewDocTitle}>Aadhaar Front Side</Text>
                      <Text style={styles.viewDocSubtitle}>
                        {aadhaarFrontUrl ? 'Uploaded & on file' : 'Not uploaded yet'}
                      </Text>
                    </View>
                    <View style={[styles.viewDocBadge, !aadhaarFrontUrl && { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons
                        name={aadhaarFrontUrl ? 'checkmark-circle' : 'close-circle'}
                        size={13}
                        color={aadhaarFrontUrl ? '#059669' : '#DC2626'}
                      />
                      <Text style={[styles.viewDocBadgeText, !aadhaarFrontUrl && { color: '#DC2626' }]}>
                        {aadhaarFrontUrl ? 'Uploaded' : 'Missing'}
                      </Text>
                    </View>
                  </View>

                  {/* Aadhaar Back Document Card */}
                  <View style={styles.viewDocCard}>
                    {aadhaarBackUrl ? (
                      <Image source={{ uri: resolveImageUrl(aadhaarBackUrl) }} style={styles.viewDocThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.viewDocEmptyThumb}>
                        <Ionicons name="image-outline" size={22} color="#94A3B8" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.viewDocTitle}>Aadhaar Back Side</Text>
                      <Text style={styles.viewDocSubtitle}>
                        {aadhaarBackUrl ? 'Uploaded & on file' : 'Not uploaded yet'}
                      </Text>
                    </View>
                    <View style={[styles.viewDocBadge, !aadhaarBackUrl && { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons
                        name={aadhaarBackUrl ? 'checkmark-circle' : 'close-circle'}
                        size={13}
                        color={aadhaarBackUrl ? '#059669' : '#DC2626'}
                      />
                      <Text style={[styles.viewDocBadgeText, !aadhaarBackUrl && { color: '#DC2626' }]}>
                        {aadhaarBackUrl ? 'Uploaded' : 'Missing'}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* SECTION 2: BANK ACCOUNT DETAILS */}
              {/* ──────────────────────────────────────────────────────────── */}
              <View style={[styles.kycSectionHeader, { marginTop: 20 }]}>
                <Ionicons name="business-outline" size={18} color="#059669" />
                <Text style={[styles.kycSectionTitle, { color: '#065F46' }]}>Bank Account Details (Payout Destination)</Text>
              </View>

              {isEditingKyc ? (
                <>
                  {/* Bank Name */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>Bank Name *</Text>
                    <View style={styles.aadhaarInputContainer}>
                      <Ionicons name="business-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.aadhaarInput}
                        placeholder="e.g. State Bank of India, HDFC, ICICI..."
                        placeholderTextColor={COLORS.secondaryText}
                        value={bankNameInput}
                        onChangeText={(t) => {
                          setBankNameInput(t);
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>

                  {/* Account Number */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>Account Number *</Text>
                    <View style={styles.aadhaarInputContainer}>
                      <Ionicons name="wallet-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.aadhaarInput}
                        placeholder="Enter full bank account number"
                        placeholderTextColor={COLORS.secondaryText}
                        keyboardType="numeric"
                        value={accountNumberInput}
                        onChangeText={(t) => {
                          setAccountNumberInput(t);
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>

                  {/* IFSC Code */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>IFSC Code *</Text>
                    <View style={styles.aadhaarInputContainer}>
                      <Ionicons name="qr-code-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.aadhaarInput}
                        placeholder="e.g. SBIN0001234 / HDFC0001234"
                        placeholderTextColor={COLORS.secondaryText}
                        autoCapitalize="characters"
                        value={ifscCodeInput}
                        onChangeText={(t) => {
                          setIfscCodeInput(t.toUpperCase());
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>

                  {/* Account Holder Name */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>Account Holder Name *</Text>
                    <View style={styles.aadhaarInputContainer}>
                      <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.aadhaarInput}
                        placeholder="Full name on bank account"
                        placeholderTextColor={COLORS.secondaryText}
                        value={accountHolderNameInput}
                        onChangeText={(t) => {
                          setAccountHolderNameInput(t);
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>

                  {/* UPI ID (Optional) */}
                  <View style={styles.aadhaarInputGroup}>
                    <Text style={styles.aadhaarLabel}>UPI ID (Optional)</Text>
                    <View style={styles.aadhaarInputContainer}>
                      <Ionicons name="at-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.aadhaarInput}
                        placeholder="e.g. mobile@upi / username@okhdfcbank"
                        placeholderTextColor={COLORS.secondaryText}
                        value={upiIdInput}
                        onChangeText={(t) => {
                          setUpiIdInput(t);
                          if (aadhaarError) setAadhaarError('');
                        }}
                      />
                    </View>
                  </View>
                </>
              ) : (
                /* VIEW / DISPLAY BANK DATA MODE */
                <>
                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>Bank Name</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="business" size={16} color="#059669" />
                      <Text style={styles.viewFieldValue}>
                        {bankNameInput || user.bankName || 'Not entered yet'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>Account Number</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="wallet" size={16} color="#059669" />
                      <Text style={styles.viewFieldValue}>
                        {accountNumberInput || user.accountNumber || (user as any).bankAccountNo || 'Not entered yet'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>IFSC Code</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="qr-code" size={16} color="#059669" />
                      <Text style={styles.viewFieldValue}>
                        {ifscCodeInput || user.ifscCode || 'Not entered yet'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>Account Holder Name</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="person" size={16} color="#059669" />
                      <Text style={styles.viewFieldValue}>
                        {accountHolderNameInput || user.accountHolderName || user.fullNameAsPerAadhaar || user.fullName || 'Not entered yet'}
                      </Text>
                    </View>
                  </View>

                  {upiIdInput ? (
                    <View style={styles.viewFieldBox}>
                      <Text style={styles.viewFieldLabel}>UPI ID</Text>
                      <View style={styles.viewFieldValueRow}>
                        <Ionicons name="at" size={16} color="#059669" />
                        <Text style={styles.viewFieldValue}>{upiIdInput}</Text>
                      </View>
                    </View>
                  ) : null}
                </>
              )}

              {/* Security Guarantee Note */}
              <View style={styles.aadhaarSecurityNote}>
                <Ionicons name="lock-closed" size={14} color="#047857" />
                <Text style={styles.aadhaarSecurityText}>
                  UIDAI & RBI Compliant. Information is encrypted end-to-end and stored securely.
                </Text>
              </View>

              {/* Action Buttons */}
              {isEditingKyc ? (
                <>
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
                          <Text style={styles.verifySubmitText}>Save & Submit for Verification</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {(user.aadhaarNumber || aadhaarInput || bankNameInput || user.verificationStatus === 'VERIFIED' || user.verificationStatus === 'PENDING') && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsEditingKyc(false);
                        if (aadhaarError) setAadhaarError('');
                      }}
                      style={styles.cancelEditBtn}
                    >
                      <Text style={styles.cancelEditText}>Cancel Edit</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsEditingKyc(true);
                    if (aadhaarError) setAadhaarError('');
                  }}
                  style={styles.editCtaBtn}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#3730A3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editCtaGradient}
                  >
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.editCtaText}>Edit KYC & Bank Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Withdrawal Modal (Min ₹600, 20% TDS, 80% Net Payout) ── */}
      <Modal
        visible={isWithdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setWithdrawModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[TYPOGRAPHY.headingMd, styles.modalHeading]}>Withdraw Income</Text>
                <Text style={styles.withdrawSub}>
                  Available: ₹{user.availableIncome ?? 0} • Minimum ₹600
                </Text>
              </View>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {withdrawError ? (
              <View style={styles.withdrawErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.withdrawErrorText}>{withdrawError}</Text>
              </View>
            ) : null}

            {withdrawSuccessMsg ? (
              <View style={styles.withdrawSuccessBox}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.withdrawSuccessText}>{withdrawSuccessMsg}</Text>
              </View>
            ) : null}

            {/* Amount Input */}
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={withdrawAmountInput}
                onChangeText={(t) => {
                  setWithdrawAmountInput(t);
                  if (withdrawError) setWithdrawError('');
                }}
              />
            </View>

            {/* Live TDS Deduction Calculation Box */}
            {(() => {
              const amt = parseFloat(withdrawAmountInput) || 0;
              const tds = Number((amt * 0.20).toFixed(2));
              const net = Number((amt - tds).toFixed(2));
              return (
                <View style={styles.tdsCalculationBox}>
                  <View style={styles.tdsRow}>
                    <Text style={styles.tdsLabel}>Withdrawal Amount</Text>
                    <Text style={styles.tdsValue}>₹{amt.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.tdsRow}>
                    <Text style={[styles.tdsLabel, { color: '#DC2626' }]}>TDS Deduction (20%)</Text>
                    <Text style={[styles.tdsValue, { color: '#DC2626' }]}>−₹{tds.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.tdsDivider} />
                  <View style={styles.tdsRow}>
                    <Text style={[styles.tdsLabel, { fontWeight: '800', color: '#065F46' }]}>Net Received (80%)</Text>
                    <Text style={[styles.tdsValue, { fontWeight: '900', color: '#065F46', fontSize: 16 }]}>₹{net.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Bank/UPI Input */}
            <View style={styles.bankInputGroup}>
              <Text style={styles.bankLabel}>UPI ID or Bank Account Details</Text>
              <TextInput
                style={styles.bankInput}
                placeholder="e.g. mobile@upi or Account No + IFSC"
                placeholderTextColor="#94A3B8"
                value={withdrawBankInput}
                onChangeText={setWithdrawBankInput}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isWithdrawing}
              onPress={handleWithdrawSubmit}
              style={styles.withdrawSubmitBtn}
            >
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.withdrawSubmitGradient}
              >
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.withdrawSubmitText}>Confirm & Transfer to Bank</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Available Income History Modal (Full Verified Ledger Audit) ── */}
      <Modal
        visible={isIncomeHistoryVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsIncomeHistoryVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsIncomeHistoryVisible(false)} />
          <View style={[styles.modalCard, styles.teamPerformanceModalCard]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[TYPOGRAPHY.headingMd, styles.modalHeading]}>Income History</Text>
                <Text style={styles.withdrawSub}>
                  Verified Ledger Audit • Reconciled Normal Wallet
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsIncomeHistoryVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1, marginTop: 8 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* Total Balance Card */}
              <View style={styles.historyBalanceCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.historyBalanceLabel}>CURRENT AVAILABLE BALANCE</Text>
                  <View style={styles.historyBalanceBadge}>
                    <Text style={styles.historyBalanceBadgeText}>UNLOCKED</Text>
                  </View>
                </View>
                <Text style={styles.historyBalanceValue}>₹{Number(incomeHistoryData?.availableBalance ?? user.availableIncome ?? 0).toFixed(2)}</Text>
                <Text style={styles.historyBalanceSub}>
                  Ready for instant bank withdrawal (Min ₹600) or grocery order checkout
                </Text>
              </View>

              {/* Source Breakdown Composition Card */}
              <View style={styles.historyBreakdownCard}>
                <Text style={styles.historySectionHeading}>BALANCE COMPOSITION</Text>

                <View style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.breakdownIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="phone-portrait-outline" size={14} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.breakdownTitle}>Download Income</Text>
                      <Text style={styles.breakdownSubtitle}>Referral downloads • Available</Text>
                    </View>
                  </View>
                  <Text style={[styles.breakdownAmount, { color: '#16A34A' }]}>
                    +₹{Number(incomeHistoryData?.breakdown?.downloadIncome ?? 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.breakdownIconBox, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="people-outline" size={14} color="#16A34A" />
                    </View>
                    <View>
                      <Text style={styles.breakdownTitle}>Monthly Team Income</Text>
                      <Text style={styles.breakdownSubtitle}>7-Level team purchase • Available</Text>
                    </View>
                  </View>
                  <Text style={[styles.breakdownAmount, { color: '#16A34A' }]}>
                    +₹{Number(incomeHistoryData?.breakdown?.monthlyTeamIncome ?? 0).toFixed(2)}
                  </Text>
                </View>

                {Number(incomeHistoryData?.breakdown?.withdrawals ?? 0) > 0 && (
                  <>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.breakdownIconBox, { backgroundColor: '#FEF2F2' }]}>
                          <Ionicons name="arrow-up-circle-outline" size={14} color="#DC2626" />
                        </View>
                        <View>
                          <Text style={styles.breakdownTitle}>Withdrawals to Bank</Text>
                          <Text style={styles.breakdownSubtitle}>Processed bank payouts</Text>
                        </View>
                      </View>
                      <Text style={[styles.breakdownAmount, { color: '#DC2626' }]}>
                        −₹{Number(incomeHistoryData?.breakdown?.withdrawals ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={[styles.breakdownDivider, { backgroundColor: '#CBD5E1', height: 1 }]} />

                <View style={[styles.breakdownRow, { marginTop: 4 }]}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>Total</Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#047857' }}>
                    ₹{Number(incomeHistoryData?.breakdown?.netAvailable ?? user.availableIncome ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Detailed Transaction Ledger */}
              <View style={{ marginTop: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.historySectionHeading}>
                  TRANSACTION LEDGER ({incomeHistoryData?.transactions?.length || 0})
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Source of Truth</Text>
              </View>

              {isLoadingIncomeHistory ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Loading ledger transactions...</Text>
                </View>
              ) : incomeHistoryData?.transactions && incomeHistoryData.transactions.length > 0 ? (
                incomeHistoryData.transactions.map((tx: any) => {
                  const isDebit = tx.amount < 0 || tx.type === 'WITHDRAWAL';
                  const isAvailable = tx.status === 'AVAILABLE';
                  const dateStr = new Date(tx.createdAt || tx.earnedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={tx.id} style={styles.txItemCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, paddingRight: 10 }}>
                        <View
                          style={[
                            styles.txIconBubble,
                            tx.type === 'TEAM_PURCHASE'
                              ? { backgroundColor: '#ECFDF5' }
                              : tx.type === 'APP_DOWNLOAD'
                              ? { backgroundColor: '#EFF6FF' }
                              : { backgroundColor: '#FEF2F2' },
                          ]}
                        >
                          <Ionicons
                            name={
                              tx.type === 'TEAM_PURCHASE'
                                ? 'people'
                                : tx.type === 'APP_DOWNLOAD'
                                ? 'phone-portrait'
                                : 'arrow-up'
                            }
                            size={16}
                            color={
                              tx.type === 'TEAM_PURCHASE'
                                ? '#059669'
                                : tx.type === 'APP_DOWNLOAD'
                                ? '#2563EB'
                                : '#DC2626'
                            }
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.txTitle}>
                              {tx.type === 'TEAM_PURCHASE'
                                ? 'Monthly Team Income'
                                : tx.type === 'APP_DOWNLOAD'
                                ? 'Download Income'
                                : tx.type === 'WITHDRAWAL'
                                ? 'Income Withdrawal'
                                : tx.type}
                            </Text>
                            <View
                              style={[
                                styles.txStatusBadge,
                                isAvailable ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEF3C7' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.txStatusText,
                                  isAvailable ? { color: '#166534' } : { color: '#92400E' },
                                ]}
                              >
                                {tx.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.txDesc} numberOfLines={2}>
                            {tx.description}
                          </Text>
                          <Text style={styles.txDate}>{dateStr}</Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.txAmount,
                            isDebit ? { color: '#DC2626' } : { color: '#059669' },
                          ]}
                        >
                          {isDebit ? '−₹' : '+₹'}
                          {Math.abs(tx.amount).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyMembersBox}>
                  <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
                  <Text style={[styles.emptyMembersText, { marginTop: 4 }]}>No income transactions recorded yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 7-Level Team Performance Dashboard Modal ── */}
      <Modal
        visible={isTeamModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTeamModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTeamModalVisible(false)} />
          <View style={[styles.modalCard, styles.teamPerformanceModalCard]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.headingMd, styles.modalHeading]}>Team Performance</Text>
                <Text style={styles.teamModalSub}>7-Level Downline & Real Income GMV</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTeamModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {isLoadingTeam ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>Calculating 7-level GMV & qualifications...</Text>
              </View>
            ) : (() => {
              const personalStatus = teamDashboardData?.personalStatus;
              const teamSummary = teamDashboardData?.teamSummary;
              const isEligible = Boolean(personalStatus?.isEligibleForTeamIncome);
              const personalSpend = Number(personalStatus?.monthlyPurchaseValue ?? user.monthlyPurchaseValue ?? 0);
              const isPersonalActive = Boolean(personalStatus?.isPersonalActive);
              const direct5Active = Number(personalStatus?.direct5ActiveCount ?? user.direct5ActiveCount ?? 0);
              const isDirectsActive = direct5Active >= 5;
              const potentialIncome = Number(teamSummary?.totalPotentialIncome ?? 0);
              const earnedIncome = isEligible ? potentialIncome : 0;

              return (
              <ScrollView
                style={{ flex: 1, marginTop: 8 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={true}
              >
                {/* 🚨 Eligibility Status Banner */}
                {!isEligible ? (
                  <View style={styles.ineligibleWarningCard}>
                    <View style={styles.ineligibleHeaderRow}>
                      <Ionicons name="warning" size={20} color="#DC2626" />
                      <Text style={styles.ineligibleTitle}>⚠️ NOT ELIGIBLE FOR TEAM INCOME</Text>
                    </View>
                    <Text style={styles.ineligibleSubtitle}>
                      Notebook Rule: Income is ONLY earned when Personal Active (≥ ₹2k) AND 5 Direct Active (≥ ₹2k) are both met every month.
                    </Text>

                    <View style={styles.ineligibleChecklist}>
                      <View style={styles.ineligibleCheckItem}>
                        <Ionicons
                          name={isPersonalActive ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={isPersonalActive ? '#059669' : '#DC2626'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ineligibleCheckLabel}>
                            Personal Purchase ≥ ₹2,000 {isPersonalActive ? '✅' : '❌'}
                          </Text>
                          <Text style={styles.ineligibleCheckValue}>
                            Your spend: ₹{personalSpend.toFixed(2)} (Need ₹{Math.max(0, 2000 - personalSpend).toFixed(2)} more)
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ineligibleCheckItem}>
                        <Ionicons
                          name={isDirectsActive ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={isDirectsActive ? '#059669' : '#DC2626'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ineligibleCheckLabel}>
                            5 Direct Referrals Active (≥ ₹2k) {isDirectsActive ? '✅' : '❌'}
                          </Text>
                          <Text style={styles.ineligibleCheckValue}>
                            Current active: {direct5Active} / 5 (Need {Math.max(0, 5 - direct5Active)} more active direct members)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.unlockActionBox}>
                      <Text style={styles.unlockActionHeading}>👉 To Unlock ₹{potentialIncome.toFixed(2)} Income:</Text>
                      <Text style={styles.unlockActionStep}>1. Purchase groceries/products worth ₹2,000+ this month</Text>
                      <Text style={styles.unlockActionStep}>2. Ensure 5 direct referrals each purchase ₹2,000+ this month</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.eligibleSuccessCard}>
                    <View style={styles.ineligibleHeaderRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      <Text style={[styles.ineligibleTitle, { color: '#065F46' }]}>✅ QUALIFIED FOR TEAM INCOME</Text>
                    </View>
                    <Text style={[styles.ineligibleSubtitle, { color: '#047857' }]}>
                      All conditions met (Personal Spend ≥ ₹2,000 and 5 Direct Active members). Full income will be credited at month-end!
                    </Text>
                  </View>
                )}

                {/* Team GMV Summary Cards */}
                <View style={styles.teamSummaryGrid}>
                  <View style={[styles.teamSummaryCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <Text style={[styles.teamSummaryLabel, { color: '#166534' }]}>Vegetable GMV (3%)</Text>
                    <Text style={[styles.teamSummaryValue, { color: '#14532D' }]}>
                      ₹{Number(teamSummary?.totalVegetableGMV ?? 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.teamSummarySub, { color: '#15803D' }]}>
                      Income: ₹{Number(teamSummary?.vegetableIncome ?? 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.teamSummaryCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Text style={[styles.teamSummaryLabel, { color: '#1E40AF' }]}>Other GMV (0.4%)</Text>
                    <Text style={[styles.teamSummaryValue, { color: '#1E3A8A' }]}>
                      ₹{Number(teamSummary?.totalOtherGMV ?? 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.teamSummarySub, { color: '#2563EB' }]}>
                      Income: ₹{Number(teamSummary?.otherIncome ?? 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Income Credited / Locked Status Banner */}
                <View
                  style={[
                    styles.totalIncomeBanner,
                    !isEligible
                      ? { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
                      : { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <View>
                      <Text
                        style={[
                          styles.totalIncomeBannerLabel,
                          { color: !isEligible ? '#92400E' : '#065F46' },
                        ]}
                      >
                        {!isEligible ? 'Earned Income (Credited)' : 'Total Earned Team Income'}
                      </Text>
                      <Text
                        style={[
                          styles.totalIncomeBannerValue,
                          { color: !isEligible ? '#B45309' : '#047857' },
                        ]}
                      >
                        ₹{earnedIncome.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: !isEligible ? '#FDE68A' : '#D1FAE5',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons
                          name={!isEligible ? 'lock-closed' : 'checkmark-done'}
                          size={13}
                          color={!isEligible ? '#92400E' : '#065F46'}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: !isEligible ? '#92400E' : '#065F46',
                          }}
                        >
                          {!isEligible ? 'LOCKED' : 'QUALIFIED'}
                        </Text>
                      </View>
                      {!isEligible && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309', marginTop: 4 }}>
                          Potential: ₹{potentialIncome.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.totalIncomeBannerSub,
                      { color: !isEligible ? '#92400E' : '#059669', textAlign: 'center', marginTop: 6 },
                    ]}
                  >
                    {!isEligible
                      ? `🔒 ₹${potentialIncome.toFixed(2)} is locked. Will be credited to your pending income once you complete personal ₹2k spend & 5 direct active.`
                      : 'Calculated at month-end • Promoted to wallet next day midnight (24h lock)'}
                  </Text>
                </View>

                {/* 7-Level Detailed Table with Accordion Expansion */}
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.levelTableHeading}>7-Level Breakdown</Text>
                    {!isEligible && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="lock-closed" size={12} color="#D97706" />
                        <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '700' }}>Locked (Need Qualification)</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1, fontWeight: '500' }}>
                    Tap any level to view individual members & income details
                  </Text>
                </View>

                <View style={styles.levelTable}>
                  <View style={styles.levelTableHeader}>
                    <Text style={[styles.levelTableTh, { width: 36 }]}>Lvl</Text>
                    <Text style={[styles.levelTableTh, { flex: 1.1 }]}>Members</Text>
                    <Text style={[styles.levelTableTh, { flex: 1.2 }]}>Veg GMV</Text>
                    <Text style={[styles.levelTableTh, { flex: 1.2 }]}>Other GMV</Text>
                    <Text style={[styles.levelTableTh, { flex: 1.1, textAlign: 'right' }]}>Income</Text>
                    <View style={{ width: 22 }} />
                  </View>

                  {(teamDashboardData?.levelBreakdown || [1, 2, 3, 4, 5, 6, 7].map((lvl: number) => ({
                    level: lvl,
                    memberCount: 0,
                    activeMemberCount: 0,
                    vegetableGMV: 0,
                    otherGMV: 0,
                    incomeEarned: 0,
                    members: [],
                  }))).map((row: any) => {
                    const isExpanded = !!expandedLevels[row.level];
                    return (
                      <View key={row.level} style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleLevel(row.level)}
                          style={[styles.levelTableRow, isExpanded && styles.levelTableRowActive]}
                        >
                          <Text style={[styles.levelTableTd, { width: 36, fontWeight: '800', color: '#6366F1' }]}>
                            L{row.level}
                          </Text>
                          <View style={{ flex: 1.1 }}>
                            <Text style={[styles.levelTableTd, { fontWeight: '700' }]}>{row.memberCount}</Text>
                            <Text style={{ fontSize: 9, color: '#64748B' }}>{row.activeMemberCount} active</Text>
                          </View>
                          <Text style={[styles.levelTableTd, { flex: 1.2, color: '#166534', fontWeight: '600' }]}>
                            ₹{Number(row.vegetableGMV).toFixed(2)}
                          </Text>
                          <Text style={[styles.levelTableTd, { flex: 1.2, color: '#1E40AF', fontWeight: '600' }]}>
                            ₹{Number(row.otherGMV).toFixed(2)}
                          </Text>
                          <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
                            <Text style={[styles.levelTableTd, { fontWeight: '800', color: !isEligible ? '#64748B' : '#0F172A' }]}>
                              ₹{Number(row.incomeEarned).toFixed(2)}
                            </Text>
                            {!isEligible && (
                              <Text style={{ fontSize: 9, color: '#D97706', fontWeight: '700' }}>🔒 Locked</Text>
                            )}
                          </View>
                          <View style={{ width: 22, alignItems: 'flex-end', justifyContent: 'center' }}>
                            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={15} color="#6366F1" />
                          </View>
                        </TouchableOpacity>

                        {/* Accordion / Dropdown Body with Individual Members */}
                        {isExpanded && (
                          <View style={styles.membersContainer}>
                            {row.members && row.members.length > 0 ? (
                              <>
                                <View style={styles.membersHeaderRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.membersSectionTitle}>
                                      Level {row.level} Members ({row.members.length} total · {row.activeMemberCount} active)
                                    </Text>
                                    {row.members.length > 2 && (
                                      <Text style={styles.membersScrollHint}>
                                        ↕ Scroll down to view all {row.members.length} members
                                      </Text>
                                    )}
                                  </View>
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.membersTotalIncomeText}>
                                      Level Income: ₹{Number(row.incomeEarned).toFixed(2)}
                                    </Text>
                                    <Text style={styles.membersReconciledTag}>✓ Reconciled</Text>
                                  </View>
                                </View>

                                <ScrollView
                                  style={row.members.length > 2 ? styles.membersListScroll : undefined}
                                  nestedScrollEnabled={true}
                                  showsVerticalScrollIndicator={true}
                                  contentContainerStyle={{ paddingBottom: 4 }}
                                >
                                  {row.members.map((member: any, mIdx: number) => (
                                    <View key={member.id || mIdx} style={styles.memberCard}>
                                      <View style={styles.memberCardTop}>
                                        <View style={{ flex: 1, paddingRight: 6 }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                                            <View style={[styles.memberStatusBadge, member.isActive ? styles.memberStatusActive : styles.memberStatusInactive]}>
                                              <Text style={[styles.memberStatusText, member.isActive ? styles.memberStatusTextActive : styles.memberStatusTextInactive]}>
                                                {member.isActive ? 'Active' : 'Inactive'}
                                              </Text>
                                            </View>
                                          </View>
                                          <Text style={styles.memberCode}>ID: {member.memberCode || 'WORMUP'}</Text>
                                        </View>
                                        
                                        <View style={{ alignItems: 'flex-end' }}>
                                          <Text style={styles.memberIncomeLabel}>Member Income</Text>
                                          <Text style={styles.memberIncomeVal}>₹{Number(member.incomeEarned).toFixed(2)}</Text>
                                        </View>
                                      </View>

                                      {/* GMV Breakdown Row */}
                                      <View style={styles.memberGmvRow}>
                                        <View style={styles.memberGmvItem}>
                                          <Text style={styles.memberGmvLabel}>Veg GMV (3%)</Text>
                                          <Text style={[styles.memberGmvVal, { color: '#166534' }]}>₹{Number(member.vegetableGMV).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.memberGmvDivider} />
                                        <View style={styles.memberGmvItem}>
                                          <Text style={styles.memberGmvLabel}>Other GMV (0.4%)</Text>
                                          <Text style={[styles.memberGmvVal, { color: '#1E40AF' }]}>₹{Number(member.otherGMV).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.memberGmvDivider} />
                                        <View style={styles.memberGmvItem}>
                                          <Text style={styles.memberGmvLabel}>Total Spend</Text>
                                          <Text style={[styles.memberGmvVal, { color: '#475569' }]}>₹{Number(member.monthlyPurchaseValue).toFixed(2)}</Text>
                                        </View>
                                      </View>
                                    </View>
                                  ))}
                                </ScrollView>
                              </>
                            ) : (
                              <View style={styles.emptyMembersBox}>
                                <Ionicons name="people-outline" size={20} color="#94A3B8" />
                                <Text style={styles.emptyMembersText}>No members joined at Level {row.level} yet.</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              );
            })()}
          </View>
        </View>
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
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  balanceValueAvailable: {
    fontSize: 24,
    fontWeight: '900',
    color: '#047857',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  balanceSubAvailable: {
    fontSize: 10.5,
    color: '#065F46',
    fontWeight: '500',
    lineHeight: 14,
  },
  availableBtnsCol: {
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  viewHistoryBtnStacked: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewHistoryBtnStackedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.2,
  },
  withdrawBtnStacked: {
    width: '100%',
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 8.5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  withdrawBtnStackedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  walletIconBadge: {
    backgroundColor: '#047857',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  walletIconBadgeCurrency: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
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
  // AADHAAR & BANK KYC MODAL STYLES
  // ══════════════════════════════════════════════════════════════
  aadhaarModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  kycModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginLeft: 4,
  },
  kycScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  statusBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  kycSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  kycSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  viewFieldBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  viewFieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
    flex: 1,
  },
  viewDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewDocThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  viewDocEmptyThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewDocSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  viewDocBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cancelEditBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginTop: 8,
  },
  cancelEditText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  editCtaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  editCtaGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  aadhaarShieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarModalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  aadhaarModalSub: {
    fontSize: 11,
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
    fontSize: 14,
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
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifySubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  referralCodeCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  referralHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9333EA',
    letterSpacing: 0.8,
  },
  referralCodeBig: {
    fontSize: 22,
    fontWeight: '900',
    color: '#581C87',
    letterSpacing: 1.5,
    marginVertical: 2,
  },
  referralHelpText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  referralCopyBtn: {
    backgroundColor: '#7E22CE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  referralCopyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  withdrawSmallBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  withdrawSmallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  teamStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  teamCardHeader: {
    marginBottom: 12,
  },
  teamBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamCardBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.6,
  },
  teamCardIcon: {
    fontSize: 16,
  },
  teamCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  teamStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  teamStatItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  teamStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  teamStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  teamStatSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  teamDashboardBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  teamDashboardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  withdrawSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  withdrawErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    gap: 8,
  },
  withdrawErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  withdrawSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    gap: 8,
  },
  withdrawSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  tdsCalculationBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  tdsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  tdsLabel: {
    fontSize: 13,
    color: '#475569',
  },
  tdsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tdsDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  bankInputGroup: {
    marginVertical: 8,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  bankInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  withdrawSubmitBtn: {
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  withdrawSubmitGradient: {
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teamModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  qualificationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  qualBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  qualText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  teamSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  teamSummaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  teamSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamSummaryValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  teamSummarySub: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalIncomeBanner: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalIncomeBannerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  totalIncomeBannerValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3730A3',
    marginVertical: 4,
  },
  totalIncomeBannerSub: {
    fontSize: 11,
    color: '#6366F1',
  },
  levelTableHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  levelTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  levelTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  levelTableTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
  },
  levelTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  levelTableTd: {
    fontSize: 11,
    color: '#334155',
  },
  ineligibleWarningCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  eligibleSuccessCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  ineligibleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ineligibleTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  ineligibleSubtitle: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
    marginBottom: 10,
  },
  ineligibleChecklist: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
    marginBottom: 10,
  },
  ineligibleCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ineligibleCheckLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  ineligibleCheckValue: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  unlockActionBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
  },
  unlockActionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  unlockActionStep: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  levelTableRowActive: {
    backgroundColor: '#EEF2FF',
  },
  membersContainer: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  membersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  membersSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.3,
  },
  membersTotalIncomeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  membersScrollHint: {
    fontSize: 9.5,
    color: '#6366F1',
    fontWeight: '700',
    marginTop: 2,
  },
  membersReconciledTag: {
    fontSize: 9.5,
    color: '#059669',
    fontWeight: '800',
    marginTop: 2,
  },
  membersListScroll: {
    maxHeight: 330,
  },
  teamPerformanceModalCard: {
    height: '88%',
    maxHeight: '92%',
    paddingBottom: 16,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 140,
  },
  memberCode: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  memberStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  memberStatusActive: {
    backgroundColor: '#DCFCE7',
  },
  memberStatusInactive: {
    backgroundColor: '#FEE2E2',
  },
  memberStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  memberStatusTextActive: {
    color: '#166534',
  },
  memberStatusTextInactive: {
    color: '#991B1B',
  },
  memberIncomeLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  memberIncomeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  memberGmvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  memberGmvItem: {
    flex: 1,
    alignItems: 'center',
  },
  memberGmvDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },
  memberGmvLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  memberGmvVal: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  emptyMembersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyMembersText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  historyBalanceCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  historyBalanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  historyBalanceBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyBalanceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  historyBalanceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#047857',
    marginTop: 4,
    marginBottom: 4,
  },
  historyBalanceSub: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
  },
  historyBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historySectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  breakdownSubtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownDivider: {
    height: 0.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  txItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  txIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  txStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  txStatusText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  txDesc: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  txDate: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 3,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});

