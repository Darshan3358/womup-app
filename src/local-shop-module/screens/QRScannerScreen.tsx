import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Easing,
  Platform,
  Vibration,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalVendor } from '../types/localShop.types';
import { LocalShopApi } from '../api/localShopApi';

const { width: SCREEN_W } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN_W * 0.72, 280);

interface QRScannerScreenProps {
  initialVendor?: LocalVendor | null;
  onGoBack: () => void;
  onPaymentSuccess: (earnedCoins: number, amount: number, vendorName: string) => void;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  initialVendor,
  onGoBack,
  onPaymentSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const [selectedVendor, setSelectedVendor] = useState<LocalVendor | null>(
    initialVendor || null
  );

  const [isStoreCodeModalOpen, setIsStoreCodeModalOpen] = useState(false);
  const [storeCodeInput, setStoreCodeInput] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [amountInput, setAmountInput] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState<'COIN' | 'WALLET' | 'CASH' | 'UPI'>('COIN');
  const [coinBalance, setCoinBalance] = useState(2000);
  const [appDownloadBalance, setAppDownloadBalance] = useState(1000);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccessBlast, setShowSuccessBlast] = useState(false);
  const [earnedCoinsFinal, setEarnedCoinsFinal] = useState(0);
  const [cashPaidFinal, setCashPaidFinal] = useState(0);
  const [coinsUsedFinal, setCoinsUsedFinal] = useState(0);

  // Fetch customer coin balance & app download wallet balance
  useEffect(() => {
    (async () => {
      try {
        const walletData = await LocalShopApi.getCustomerWalletData();
        setCoinBalance(walletData.shoppingCoins);
        setAppDownloadBalance(walletData.appDownloadIncome);
      } catch (e) {
        // non-fatal
      }
    })();
  }, []);

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: SCAN_FRAME_SIZE - 20,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  // Real-time Barcode / QR Scanner Handler
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isVerifyingQR) return;

    console.log('[QRScannerScreen] Scanned raw QR data:', data);

    // Validate QR format: womup://vendor/VND001 or URL
    let vendorCode = '';
    if (data.startsWith('womup://vendor/')) {
      vendorCode = data.replace('womup://vendor/', '').trim().toUpperCase();
    } else if (data.includes('/pay/')) {
      vendorCode = data.split('/pay/')[1].trim().toUpperCase();
    } else if (data.toUpperCase().startsWith('VND')) {
      vendorCode = data.trim().toUpperCase();
    }

    if (!vendorCode) {
      if (Platform.OS !== 'web') Vibration.vibrate(200);
      Alert.alert(
        'Invalid Counter QR',
        'This is not an official WormUp partner counter QR code. Please scan the QR code displayed at the store counter.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setScanned(true);
    setIsVerifyingQR(true);
    if (Platform.OS !== 'web') Vibration.vibrate(80);

    try {
      // Fetch ONLY this real vendor from backend
      const vendorData = await LocalShopApi.getVendorByCode(vendorCode);
      if (vendorData) {
        setSelectedVendor(vendorData);
        setIsVerifyingQR(false);
        setIsManualModalOpen(true);
      } else {
        setIsVerifyingQR(false);
        setScanned(false);
        Alert.alert('Store Not Found', `No registered merchant found for code "${vendorCode}".`, [
          { text: 'Scan Again', onPress: () => setScanned(false) },
        ]);
      }
    } catch (err: any) {
      setIsVerifyingQR(false);
      setScanned(false);
      Alert.alert('Store Lookup Failed', 'Could not fetch store details. Please try again.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  const handleVerifyManualStoreCode = async () => {
    const code = storeCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Store Code Required', 'Please enter a valid Merchant Code (e.g. VND001).');
      return;
    }
    setIsVerifyingCode(true);
    try {
      const vendorData = await LocalShopApi.getVendorByCode(code);
      if (vendorData) {
        setSelectedVendor(vendorData);
        setIsStoreCodeModalOpen(false);
        setStoreCodeInput('');
        setIsManualModalOpen(true);
      } else {
        Alert.alert('Store Not Found', `No registered merchant found for code "${code}".`);
      }
    } catch {
      Alert.alert('Verification Error', 'Failed to verify store code. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // ── Automatic Admin-Controlled Shopping Coin Benefit & Payment Math ──────────
  const numAmount = parseFloat(amountInput) || 0;
  const vendorBenefitPercent = selectedVendor
    ? selectedVendor.shoppingCoinPercent || selectedVendor.coinPercentage || 18
    : 18;
  const maxEligibleCoins = Math.round((numAmount * vendorBenefitPercent) / 100);
  const coinsApplied = Math.min(maxEligibleCoins, Math.max(0, coinBalance));
  const remainingCash = Math.max(0, numAmount - coinsApplied);

  const handleConfirmPayment = async () => {
    if (!selectedVendor) {
      Alert.alert('No Store Selected', 'Please scan or enter a store counter code first.');
      return;
    }
    if (numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount.');
      return;
    }

    // 1. Coins Method: Customer must have at least 1 coin
    if (paymentMethod === 'COIN' && coinBalance <= 0) {
      Alert.alert(
        'No Shopping Coins Available',
        'Your Shopping Coin balance is 0. Please select Cash at Store or Income Wallet.'
      );
      return;
    }

    // 2. Income Wallet Method: 100% full bill deduction
    if (paymentMethod === 'WALLET' && appDownloadBalance < numAmount) {
      Alert.alert(
        'Insufficient Income Wallet Balance',
        `Your Income Wallet balance is ₹${appDownloadBalance}. You need ₹${numAmount} for 100% full bill payment.`
      );
      return;
    }

    setIsConfirming(true);
    try {
      const actualCoinsUsed = paymentMethod === 'COIN' ? coinsApplied : 0;
      const actualWalletUsed = paymentMethod === 'WALLET' ? numAmount : 0;
      const actualCashToCollect = paymentMethod === 'COIN' ? remainingCash : paymentMethod === 'CASH' ? numAmount : 0;
      const actualUpiAmount = paymentMethod === 'UPI' ? numAmount : 0;

      // 1. Submit real-time collection request to vendor terminal
      try {
        await LocalShopApi.submitCollectionRequest({
          vendorCode: (selectedVendor as any).vendorCode || selectedVendor.id || 'VND001',
          vendorId: selectedVendor.id,
          amount: numAmount,
          paymentMethod,
          coinsUsed: actualCoinsUsed,
          walletUsed: actualWalletUsed,
          cashToCollect: actualCashToCollect,
          upiAmount: actualUpiAmount,
          coinsEarned: 0,
          customerName: 'Local Shopper',
        });
      } catch (wsErr) {
        console.warn('Real-time collection notice error:', wsErr);
      }

      // 2. Finalize payment record
      await LocalShopApi.payVendorQR({
        vendorId: selectedVendor.id,
        amount: numAmount,
        paymentMethod,
        coinsUsed: actualCoinsUsed,
      });

      setIsConfirming(false);
      setIsManualModalOpen(false);
      setEarnedCoinsFinal(actualCoinsUsed);
      setCashPaidFinal(actualCashToCollect);
      setCoinsUsedFinal(actualCoinsUsed);
      setShowSuccessBlast(true);
    } catch {
      setIsConfirming(false);
      Alert.alert('Payment Failed', 'Could not process payment. Please try again.');
    }
  };

  const handleDone = () => {
    setShowSuccessBlast(false);
    onPaymentSuccess(earnedCoinsFinal, numAmount, selectedVendor?.name || selectedVendor?.storeName || 'Merchant');
    onGoBack();
  };

  // Permission not granted state (Mobile only)
  if (Platform.OS !== 'web' && permission && !permission.granted) {
    return (
      <View style={[styles.container, styles.permissionBox, { paddingTop: insets.top + 40 }]}>
        <View style={styles.permIconBox}>
          <Ionicons name="camera-outline" size={56} color="#E11D48" />
        </View>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSubtitle}>
          WormUp needs camera permission to scan vendor counter QR codes for instant billing and Shopping Coin rewards.
        </Text>

        {permission.canAskAgain ? (
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.permBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.permBtn}
            onPress={() => Linking.openSettings()}
            activeOpacity={0.85}
          >
            <Text style={styles.permBtnText}>Open Device Settings</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualFallbackBtn}
          onPress={() => setIsManualModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="keypad-outline" size={18} color="#071B52" />
          <Text style={styles.manualFallbackText}>Enter Bill Amount Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.permCloseBtn} onPress={onGoBack}>
          <Text style={styles.permCloseText}>Cancel & Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real Native Camera Feed */}
      {Platform.OS !== 'web' ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#070E20' }]} />
      )}

      {/* Dark Translucent Viewfinder Overlays */}
      <View style={styles.overlay}>
        {/* Top Action Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onGoBack} style={styles.circleIconBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Scan Counter QR</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {Platform.OS !== 'web' && (
              <>
                <TouchableOpacity
                  onPress={() => setTorchOn((prev) => !prev)}
                  style={[styles.circleIconBtn, torchOn && { backgroundColor: '#F59E0B' }]}
                >
                  <Ionicons
                    name={torchOn ? 'flash' : 'flash-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
                  style={styles.circleIconBtn}
                >
                  <Ionicons name="camera-reverse-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => setIsManualModalOpen(true)}
              style={styles.circleIconBtn}
            >
              <Ionicons name="keypad-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Target Viewfinder Frame */}
        <View style={styles.centerContainer}>
          <View style={styles.targetFrame}>
            {/* 4 Corner Markers */}
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />

            {/* Red Laser Line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: scanAnim }] },
              ]}
            />

            {isVerifyingQR && (
              <View style={styles.verifyingOverlay}>
                <ActivityIndicator color="#E11D48" size="large" />
                <Text style={styles.verifyingText}>Verifying store QR...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Banner: Detected Vendor Card OR Clean Camera Instructions */}
        {selectedVendor ? (
          <View style={[styles.detectedCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.detectedHeader}>
              <View style={styles.detectedIconBox}>
                <Ionicons name="storefront" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detectedStoreName} numberOfLines={1}>
                  {selectedVendor.storeName || selectedVendor.name}
                </Text>
                <Text style={styles.detectedSubText} numberOfLines={1}>
                  Counter: {(selectedVendor as any).vendorCode || selectedVendor.id} • {selectedVendor.category || 'Local Partner'}
                </Text>
              </View>
              <View style={styles.detectedCoinBadge}>
                <Ionicons name="sparkles" size={12} color="#D97706" />
                <Text style={styles.detectedCoinText}>{vendorBenefitPercent}% COIN BENEFIT</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.proceedBillBtn}
              onPress={() => setIsManualModalOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.proceedBillBtnText}>Enter Bill Amount & Pay →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanDifferentBtn}
              onPress={() => {
                setSelectedVendor(null);
                setScanned(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="scan-outline" size={15} color="#CBD5E1" style={{ marginRight: 6 }} />
              <Text style={styles.scanDifferentText}>Scan Different Merchant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.instructionsTitle}>Align Counter QR Code</Text>
            <Text style={styles.instructionsText}>
              Point camera at the WOMUP QR code on the merchant's counter or printed standee.
            </Text>

            <TouchableOpacity
              style={styles.manualEntryBtn}
              onPress={() => setIsStoreCodeModalOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="keypad-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.manualEntryBtnText}>Enter Store Code Manually</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Manual Amount & Confirm Payment Modal */}
      <Modal
        visible={isManualModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsManualModalOpen(false);
          setScanned(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.vendorHeaderRow}>
              <View>
                <Text style={styles.modalVendorName}>
                  {selectedVendor?.name || selectedVendor?.storeName || 'Merchant Store'}
                </Text>
                <Text style={styles.modalVendorCategory}>
                  {selectedVendor?.category || 'Local Partner'} • {selectedVendor?.address || 'Counter'}
                </Text>
              </View>
              <View style={styles.coinBadge}>
                <Ionicons name="sparkles" size={12} color="#D97706" />
                <Text style={styles.coinBadgeText}>{vendorBenefitPercent}% COIN BENEFIT</Text>
              </View>
            </View>

            {/* Bill Amount Input */}
            <View style={styles.amountInputGroup}>
              <Text style={styles.amountLabel}>ENTER BILL AMOUNT</Text>
              <View style={styles.currencyRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountField}
                  keyboardType="numeric"
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>
            </View>

            {/* Payment Method Selector (4 Methods) */}
            <Text style={styles.methodLabel}>SELECT PAYMENT METHOD</Text>
            <View style={styles.paymentMethodGrid}>
              {[
                {
                  id: 'COIN',
                  title: 'Use Coins',
                  sub: `${vendorBenefitPercent}% benefit`,
                  icon: 'sparkles',
                  color: '#D97706',
                  activeBg: '#FFFBEB',
                  activeBorder: '#D97706',
                },
                {
                  id: 'WALLET',
                  title: 'Income Wallet',
                  sub: 'Full bill',
                  icon: 'wallet-outline',
                  color: '#4F46E5',
                  activeBg: '#EEF2FF',
                  activeBorder: '#4F46E5',
                },
                {
                  id: 'CASH',
                  title: 'Cash at Store',
                  sub: 'Full bill',
                  icon: 'cash-outline',
                  color: '#059669',
                  activeBg: '#ECFDF5',
                  activeBorder: '#059669',
                },
                {
                  id: 'UPI',
                  title: 'Counter UPI',
                  sub: 'Full bill',
                  icon: 'qr-code-outline',
                  color: '#0284C7',
                  activeBg: '#F0F9FF',
                  activeBorder: '#0284C7',
                },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.paymentMethodCard,
                      isSelected && {
                        borderColor: m.activeBorder,
                        backgroundColor: m.activeBg,
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={() => setPaymentMethod(m.id as any)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.methodCardTop}>
                      <Ionicons
                        name={m.icon as any}
                        size={16}
                        color={isSelected ? m.color : '#64748B'}
                      />
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && { borderColor: m.color, backgroundColor: m.color },
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.methodCardTitle,
                        isSelected && { color: m.color, fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {m.title}
                    </Text>
                    <Text style={styles.methodCardSub} numberOfLines={1}>
                      {m.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dynamic Calculation Breakdown (Single Active Method) */}
            {paymentMethod === 'COIN' && (
              <View style={styles.calculationCard}>
                <View style={styles.calcHeaderRow}>
                  <Text style={styles.calcTitle}>SHOPPING COINS CALCULATION</Text>
                  <Text style={styles.calcBalance}>Bal: {coinBalance} Coins</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Total shop bill</Text>
                  <Text style={styles.calcVal}>₹{numAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Admin-set coin rate</Text>
                  <Text style={styles.calcVal}>
                    {vendorBenefitPercent}%{maxEligibleCoins > coinsApplied ? ` (Max ₹${maxEligibleCoins})` : ''}
                  </Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: '#D97706', fontWeight: '700' }]}>
                    Coins applied
                  </Text>
                  <Text style={[styles.calcVal, { color: '#D97706', fontWeight: '800' }]}>
                    −₹{coinsApplied.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.calcDivider} />

                <View style={styles.calcRow}>
                  <View>
                    <Text style={styles.remainingCashLabel}>Remaining cash</Text>
                    <Text style={styles.remainingCashSub}>Vendor ko pay karna hai</Text>
                  </View>
                  <Text style={styles.remainingCashAmount}>
                    ₹{remainingCash.toLocaleString('en-IN')}
                  </Text>
                </View>

                <Text style={styles.calcFootnote}>
                  💡 Customer pays ₹{remainingCash} in physical cash. Vendor will tap "COLLECT & VERIFY".
                </Text>
              </View>
            )}

            {paymentMethod === 'WALLET' && (
              <View style={[styles.calculationCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <View style={styles.calcHeaderRow}>
                  <Text style={[styles.calcTitle, { color: '#4338CA' }]}>INCOME WALLET PAYMENT</Text>
                  <Text style={[styles.calcBalance, { color: '#4F46E5' }]}>Bal: ₹{appDownloadBalance}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Total shop bill</Text>
                  <Text style={styles.calcVal}>₹{numAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: '#4338CA', fontWeight: '700' }]}>
                    Income Wallet deduction (100%)
                  </Text>
                  <Text style={[styles.calcVal, { color: '#4338CA', fontWeight: '800' }]}>
                    −₹{numAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.calcDivider, { backgroundColor: '#C7D2FE' }]} />

                <View style={styles.calcRow}>
                  <View>
                    <Text style={styles.remainingCashLabel}>Remaining cash to pay</Text>
                    <Text style={styles.remainingCashSub}>100% paid from wallet</Text>
                  </View>
                  <Text style={[styles.remainingCashAmount, { color: '#059669' }]}>₹0</Text>
                </View>

                <Text style={[styles.calcFootnote, { color: '#4F46E5' }]}>
                  💼 100% full bill deducted from Income Wallet. Zero cash needed at counter.
                </Text>
              </View>
            )}

            {paymentMethod === 'CASH' && (
              <View style={[styles.calculationCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <View style={styles.calcHeaderRow}>
                  <Text style={[styles.calcTitle, { color: '#065F46' }]}>CASH AT STORE</Text>
                  <Text style={[styles.calcBalance, { color: '#047857' }]}>Full Bill in Cash</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Total shop bill</Text>
                  <Text style={styles.calcVal}>₹{numAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Coins applied</Text>
                  <Text style={styles.calcVal}>₹0</Text>
                </View>

                <View style={[styles.calcDivider, { backgroundColor: '#A7F3D0' }]} />

                <View style={styles.calcRow}>
                  <View>
                    <Text style={styles.remainingCashLabel}>Physical Cash to Give</Text>
                    <Text style={styles.remainingCashSub}>Vendor will collect at counter</Text>
                  </View>
                  <Text style={[styles.remainingCashAmount, { color: '#047857' }]}>
                    ₹{numAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <Text style={[styles.calcFootnote, { color: '#047857' }]}>
                  🤝 Give poore ₹{numAmount} physical cash to vendor. Vendor will tap "COLLECT & VERIFY".
                </Text>
              </View>
            )}

            {paymentMethod === 'UPI' && (
              <View style={[styles.calculationCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                <View style={styles.calcHeaderRow}>
                  <Text style={[styles.calcTitle, { color: '#0369A1' }]}>COUNTER UPI PAYMENT</Text>
                  <Text style={[styles.calcBalance, { color: '#0284C7' }]}>Digital Gateway</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Total shop bill</Text>
                  <Text style={styles.calcVal}>₹{numAmount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: '#0369A1', fontWeight: '700' }]}>
                    Digital UPI payment (100%)
                  </Text>
                  <Text style={[styles.calcVal, { color: '#0369A1', fontWeight: '800' }]}>
                    ₹{numAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.calcDivider, { backgroundColor: '#BAE6FD' }]} />

                <View style={styles.calcRow}>
                  <View>
                    <Text style={styles.remainingCashLabel}>Physical cash to pay</Text>
                    <Text style={styles.remainingCashSub}>Digital instant payment</Text>
                  </View>
                  <Text style={[styles.remainingCashAmount, { color: '#059669' }]}>₹0</Text>
                </View>

                <Text style={[styles.calcFootnote, { color: '#0284C7' }]}>
                  ⚡ Pay ₹{numAmount} via UPI directly at the counter. Verified instantly via server gateway.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsManualModalOpen(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmPayment}
                disabled={isConfirming || numAmount <= 0}
              >
                {isConfirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {paymentMethod === 'COIN'
                      ? `Pay ₹${coinsApplied} Coins & ₹${remainingCash} Cash`
                      : paymentMethod === 'WALLET'
                      ? `Pay ₹${numAmount} from Wallet`
                      : paymentMethod === 'CASH'
                      ? `Send to Vendor (₹${numAmount} Cash)`
                      : `Pay ₹${numAmount} via UPI`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Store Code Entry Modal */}
      <Modal
        visible={isStoreCodeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStoreCodeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />

            <View style={{ gap: 4 }}>
              <Text style={styles.storeCodeModalTitle}>Enter Merchant Code</Text>
              <Text style={styles.storeCodeModalSubtitle}>
                Type the Store / Counter Code displayed on the counter standee (e.g. VND001)
              </Text>
            </View>

            <View style={styles.storeCodeInputBox}>
              <Ionicons name="pricetag-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.storeCodeInputField}
                placeholder="e.g. VND001"
                placeholderTextColor="#94A3B8"
                value={storeCodeInput}
                onChangeText={setStoreCodeInput}
                autoCapitalize="characters"
                autoFocus
              />
            </View>

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsStoreCodeModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, isVerifyingCode && { opacity: 0.7 }]}
                onPress={handleVerifyManualStoreCode}
                disabled={isVerifyingCode}
              >
                {isVerifyingCode ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Verify Store →</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Celebration Blast Modal */}
      <Modal visible={showSuccessBlast} transparent animationType="fade">
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconBubble}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Payment Verified!</Text>
            <Text style={styles.successSubtitle}>
              {paymentMethod === 'COIN'
                ? `Paid ₹${cashPaidFinal} Cash + ₹${coinsUsedFinal} Coins to ${selectedVendor?.name || selectedVendor?.storeName || 'Merchant'}`
                : paymentMethod === 'WALLET'
                ? `Paid ₹${numAmount} from Income Wallet to ${selectedVendor?.name || selectedVendor?.storeName || 'Merchant'}`
                : paymentMethod === 'CASH'
                ? `Paid ₹${cashPaidFinal} Cash to ${selectedVendor?.name || selectedVendor?.storeName || 'Merchant'}`
                : `Paid ₹${numAmount} via UPI to ${selectedVendor?.name || selectedVendor?.storeName || 'Merchant'}`}
            </Text>

            {coinsUsedFinal > 0 && (
              <View style={styles.earnedRewardBox}>
                <Ionicons name="sparkles" size={18} color="#D97706" />
                <Text style={styles.earnedRewardText}>
                  Applied ₹{coinsUsedFinal} via {vendorBenefitPercent}% Shopping Coin Benefit!
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Done</Text>
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
    backgroundColor: '#000000',
  },
  permissionBox: {
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  permIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    textAlign: 'center',
    marginBottom: 8,
  },
  permSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  manualFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  manualFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071B52',
  },
  permCloseBtn: {
    marginTop: 16,
    padding: 10,
  },
  permCloseText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  circleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#E11D48',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laserLine: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 10,
  },
  verifyingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
  detectedCard: {
    paddingHorizontal: 20,
    backgroundColor: '#0F172A',
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  detectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedStoreName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detectedSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  detectedCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  detectedCoinText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  proceedBillBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  proceedBillBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  scanDifferentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  scanDifferentText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  storeCodeModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeCodeModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  storeCodeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeCodeInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  manualEntryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalVendorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalVendorCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  coinBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  amountInputGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginRight: 6,
  },
  amountField: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  methodLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    justifyContent: 'space-between',
  },
  paymentMethodCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  methodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  methodCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  methodCardSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  calculationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 8,
    marginTop: 4,
  },
  calcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  calcTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  calcBalance: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#FCD34D',
    marginVertical: 4,
  },
  remainingCashLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  remainingCashSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  remainingCashAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  calcFootnote: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 14,
    marginTop: 2,
  },
  modalBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  successIconBubble: {
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  earnedRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginVertical: 12,
  },
  earnedRewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
