import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalVendor } from '../types/localShop.types';
import { MOCK_LOCAL_VENDORS } from '../data/mockLocalShops';

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
  const [selectedVendor, setSelectedVendor] = useState<LocalVendor>(
    initialVendor || MOCK_LOCAL_VENDORS[0]
  );
  const [amountInput, setAmountInput] = useState('500');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccessBlast, setShowSuccessBlast] = useState(false);
  const [earnedCoinsFinal, setEarnedCoinsFinal] = useState(75);

  // Scan line animation
  const [scanAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 200,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const numAmount = parseFloat(amountInput) || 0;
  const projectedCoins = Math.round((numAmount * selectedVendor.coinPercentage) / 100);

  const handleSimulateScan = (vendor: LocalVendor) => {
    setSelectedVendor(vendor);
    setIsManualModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount.');
      return;
    }

    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setIsManualModalOpen(false);
      setEarnedCoinsFinal(projectedCoins);
      setShowSuccessBlast(true);
    }, 1000);
  };

  const handleDone = () => {
    setShowSuccessBlast(false);
    onPaymentSuccess(earnedCoinsFinal, numAmount, selectedVendor.name);
    onGoBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Overlay Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack} style={styles.circleIconBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Scan Counter QR</Text>
        <TouchableOpacity
          onPress={() => setIsManualModalOpen(true)}
          style={styles.circleIconBtn}
        >
          <Ionicons name="keypad-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder (Simulated Viewport) */}
      <View style={styles.cameraViewport}>
        <View style={styles.darkOverlayTop} />

        <View style={styles.viewfinderRow}>
          <View style={styles.darkOverlaySide} />

          {/* Center Target Frame */}
          <View style={styles.targetFrame}>
            {/* 4 Corner Markers */}
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />

            {/* Laser Line */}
            <Animated.View
              style={[
                styles.laserLine,
                { transform: [{ translateY: scanAnim }] },
              ]}
            />

            <View style={styles.frameCenterContent}>
              <Ionicons name="qr-code-outline" size={64} color="rgba(255,255,255,0.4)" />
              <Text style={styles.alignQRText}>Align Store QR Code</Text>
            </View>
          </View>

          <View style={styles.darkOverlaySide} />
        </View>

        <View style={styles.darkOverlayBottom}>
          <Text style={styles.instructionsText}>
            Point your camera at the WOMUP counter QR code to pay instantly & earn up to 15% Shopping Coins.
          </Text>

          {/* Quick Select Partner Counter (Testing / Simulation) */}
          <Text style={styles.quickShopLabel}>Or select counter to test scan:</Text>
          <View style={styles.testShopsRow}>
            {MOCK_LOCAL_VENDORS.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.testShopPill,
                  selectedVendor.id === v.id && styles.testShopPillActive,
                ]}
                onPress={() => handleSimulateScan(v)}
              >
                <Text
                  style={[
                    styles.testShopText,
                    selectedVendor.id === v.id && styles.testShopTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {v.name.split(' ')[0]} ({v.coinPercentage}%)
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.manualEntryBtn}
            onPress={() => setIsManualModalOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.manualEntryBtnText}>Enter Amount Manually</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Amount & Confirm Modal */}
      <Modal
        visible={isManualModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsManualModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetShopName}>{selectedVendor.name}</Text>
                <Text style={styles.sheetShopAddress}>{selectedVendor.address}</Text>
              </View>
              <View style={[styles.sheetCoinBadge, { backgroundColor: selectedVendor.badgeColor }]}>
                <Text style={styles.sheetCoinBadgeText}>
                  {selectedVendor.coinPercentage}% Shopping Coins
                </Text>
              </View>
            </View>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Enter Bill Amount (₹)</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94A3B8"
                autoFocus
              />
            </View>

            {/* Coin Cashback Callout */}
            <View style={styles.cashbackCallout}>
              <Ionicons name="sparkles" size={20} color="#D97706" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cashbackTitle}>
                  You will earn {projectedCoins} Shopping Coins!
                </Text>
                <Text style={styles.cashbackSub}>
                  {selectedVendor.coinPercentage}% of ₹{numAmount} credited immediately to your WOMUP Coin Wallet.
                </Text>
              </View>
            </View>

            {/* Quick Amount Chips */}
            <View style={styles.chipsRow}>
              {[100, 250, 500, 1000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.amountChip}
                  onPress={() => setAmountInput(amt.toString())}
                >
                  <Text style={styles.amountChipText}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirm Pay Button */}
            <TouchableOpacity
              style={styles.confirmPayBtn}
              onPress={handleConfirmPayment}
              disabled={isConfirming}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmPayText}>
                {isConfirming ? 'Authorizing Payment...' : `Pay ₹${numAmount} & Earn Coins`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Coin Blast Modal */}
      <Modal visible={showSuccessBlast} transparent animationType="fade">
        <View style={styles.blastBackdrop}>
          <View style={styles.blastCard}>
            <View style={styles.blastCoinOuter}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>

            <Text style={styles.blastSuccessTitle}>Payment Successful!</Text>
            <Text style={styles.blastStoreName}>Paid to {selectedVendor.name}</Text>
            <Text style={styles.blastAmountPaid}>₹{numAmount}</Text>

            <View style={styles.coinRewardBox}>
              <Ionicons name="gift" size={24} color="#D97706" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.coinRewardNumber}>+{earnedCoinsFinal} Coins Earned</Text>
                <Text style={styles.coinRewardSub}>Added to your WOMUP Wallet</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.blastDoneBtn} onPress={handleDone}>
              <Text style={styles.blastDoneText}>Done & View Wallet</Text>
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
    backgroundColor: '#0F172A',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraViewport: {
    flex: 1,
  },
  darkOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  viewfinderRow: {
    flexDirection: 'row',
    height: 250,
  },
  darkOverlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  targetFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  cornerMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#E11D48',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    height: 3,
    backgroundColor: '#E11D48',
    width: '100%',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  frameCenterContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignQRText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  darkOverlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#E2E8F0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  quickShopLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  testShopsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  testShopPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  testShopPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  testShopText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  testShopTextActive: {
    fontWeight: '800',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  manualEntryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetShopName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetShopAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetCoinBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sheetCoinBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E11D48',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  rupeeSymbol: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  cashbackCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  cashbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  cashbackSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  amountChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
  },
  amountChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  confirmPayBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmPayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  blastBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blastCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  blastCoinOuter: {
    marginBottom: 12,
  },
  blastSuccessTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  blastStoreName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  blastAmountPaid: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 10,
  },
  coinRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginVertical: 12,
  },
  coinRewardNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B45309',
  },
  coinRewardSub: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },
  blastDoneBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  blastDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
