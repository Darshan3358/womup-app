import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocalVendor } from '../types/localShop.types';
import { LocalShopApi } from '../api/localShopApi';

interface QRScannerModalProps {
  visible: boolean;
  vendor?: LocalVendor | null;
  onClose: () => void;
  onPaymentSuccess: (earnedCoins: number, amount: number) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  vendor,
  onClose,
  onPaymentSuccess,
}) => {
  const [billAmount, setBillAmount] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    coins: number;
    amount: number;
  } | null>(null);

  const selectedVendor = vendor || {
    id: 'vendor_01',
    name: 'Gokul Vegetables',
    coinPercentage: 15,
    address: 'Near Nandanvan Society, Mahesana',
  };

  const calculatedCoins = Math.round(
    ((Number(billAmount) || 0) * (selectedVendor.coinPercentage || 10)) / 100
  );

  const handlePayNow = async () => {
    const amt = Number(billAmount);
    if (!amt || amt <= 0) return;

    setIsProcessing(true);
    try {
      const res = await LocalShopApi.payVendorQR({
        vendorId: selectedVendor.id,
        amount: amt,
        paymentMethod: 'UPI',
      });

      setIsProcessing(false);
      setPaymentSuccessData({
        coins: res.coinsEarned,
        amount: amt,
      });

      setTimeout(() => {
        setPaymentSuccessData(null);
        setBillAmount('500');
        onPaymentSuccess(res.coinsEarned, amt);
        onClose();
      }, 2200);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Scan & Pay at Counter</Text>
              <Text style={styles.modalSubtitle}>{selectedVendor.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Success Screen Animation Overlay */}
          {paymentSuccessData ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successAmount}>₹{paymentSuccessData.amount}</Text>

              <View style={styles.coinRewardBadge}>
                <Ionicons name="gift" size={18} color="#D97706" />
                <Text style={styles.coinRewardText}>
                  + {paymentSuccessData.coins} Shopping Coins Credited!
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Camera Scanner Simulation Frame */}
              <View style={styles.scannerViewport}>
                <View style={styles.cameraBox}>
                  {/* Scanner Laser / Crosshairs */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  <Ionicons name="qr-code-outline" size={88} color="rgba(255, 255, 255, 0.75)" />
                  <Text style={styles.scannerInstruction}>
                    Align counter QR code within frame
                  </Text>
                </View>
              </View>

              {/* Counter Bill Amount Entry */}
              <View style={styles.billInputSection}>
                <Text style={styles.inputLabel}>Enter Counter Bill Amount</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={billAmount}
                    onChangeText={setBillAmount}
                    placeholder="0"
                  />
                </View>

                {/* Instant Coin Earning Projection */}
                <View style={styles.coinPerkRow}>
                  <Ionicons name="sparkles" size={16} color="#DB2777" />
                  <Text style={styles.coinPerkText}>
                    You will earn{' '}
                    <Text style={{ fontWeight: '800', color: '#DB2777' }}>
                      {calculatedCoins} Shopping Coins ({selectedVendor.coinPercentage}%)
                    </Text>{' '}
                    instantly!
                  </Text>
                </View>
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={styles.payBtn}
                activeOpacity={0.85}
                onPress={handlePayNow}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.payBtnText}>Pay ₹{billAmount || 0} via UPI & Earn Coins</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    minHeight: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerViewport: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraBox: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#E11D48',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scannerInstruction: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  billInputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 6,
  },
  coinPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  coinPerkText: {
    fontSize: 11.5,
    color: '#831843',
    fontWeight: '600',
    flex: 1,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  coinRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinRewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
});
