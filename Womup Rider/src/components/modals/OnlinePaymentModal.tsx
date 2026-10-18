import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RiderApiService } from '../../services/riderApi';
import { COLORS } from '../../theme/colors';

interface OnlinePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  dueAmount: number;
  onPaymentSuccess?: () => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  visible,
  onClose,
  dueAmount,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  const [paymentInfo, setPaymentInfo] = useState<{
    adminUpiId: string;
    adminUpiName: string;
    supportPhone: string;
    riderOwesAdmin: number;
    hasPendingVerification: boolean;
    pendingRequest?: {
      id: string;
      amount: number;
      utrNumber: string;
      status: string;
      requestedAt: string;
    } | null;
  }>({
    adminUpiId: 'wormup@okicici',
    adminUpiName: 'WormUp Technologies Pvt Ltd',
    supportPhone: '+91 98765 43210',
    riderOwesAdmin: dueAmount,
    hasPendingVerification: false,
    pendingRequest: null,
  });

  useEffect(() => {
    if (visible) {
      fetchPaymentInfo();
      setUtrNumber('');
      setCopied(false);
    }
  }, [visible]);

  const fetchPaymentInfo = async () => {
    setLoading(true);
    try {
      const data = await RiderApiService.getPaymentInfo();
      setPaymentInfo(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert('UPI ID', text);
    }
  };

  const openUpiApp = async () => {
    const amountToPay = paymentInfo.riderOwesAdmin || dueAmount;
    const upiUrl = `upi://pay?pa=${paymentInfo.adminUpiId}&pn=${encodeURIComponent(
      paymentInfo.adminUpiName
    )}&am=${amountToPay}&cu=INR&tn=RiderCOD`;

    try {
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen || Platform.OS === 'web') {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          'UPI App Not Found',
          `Please copy the UPI ID (${paymentInfo.adminUpiId}) and make the payment of ₹${amountToPay} from your GPay, PhonePe, or Paytm app.`
        );
      }
    } catch {
      Alert.alert(
        'UPI ID Copied',
        `Please open Google Pay, PhonePe, or Paytm and send ₹${amountToPay} to: ${paymentInfo.adminUpiId}`
      );
    }
  };

  const handleSubmitProof = async () => {
    const amountToPay = paymentInfo.riderOwesAdmin || dueAmount;
    const cleanUtr = utrNumber.trim();

    if (!cleanUtr || cleanUtr.length < 6) {
      Alert.alert('Invalid UTR', 'Please enter a valid 12-digit UTR or Transaction Reference number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await RiderApiService.submitSettlementProof(amountToPay, cleanUtr);
      if (res.success) {
        if (Platform.OS === 'web') {
          window.alert(
            `Proof Submitted Successfully! ✅\n\nYour payment of ₹${amountToPay} with UTR: ${cleanUtr} has been sent to Admin for verification. Your account will automatically unlock once approved.`
          );
          if (onPaymentSuccess) onPaymentSuccess();
          onClose();
        } else {
          Alert.alert(
            'Proof Submitted Successfully! ✅',
            `Your payment of ₹${amountToPay} with UTR: ${cleanUtr} has been sent to Admin for verification. Your account will automatically unlock once approved.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onPaymentSuccess) onPaymentSuccess();
                  onClose();
                },
              },
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(`Submission Failed: ${res.message}`);
        } else {
          Alert.alert('Submission Failed', res.message);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong while submitting proof.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDue = paymentInfo.riderOwesAdmin || dueAmount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="card" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Pay Cash Due to Admin</Text>
                <Text style={styles.headerSubtitle}>Settle your COD cash online via UPI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Due Amount Highlight Card */}
              <LinearGradient
                colors={['#DC2626', '#991B1B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.amountCard}
              >
                <View style={styles.amountCardHeader}>
                  <Text style={styles.amountCardLabel}>TOTAL DUE TO ADMIN (COD)</Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>INSTANT UNLOCK</Text>
                  </View>
                </View>
                <Text style={styles.amountCardValue}>₹{currentDue}</Text>
                <Text style={styles.amountCardNote}>
                  Clear this due balance to reset your cash liability to ₹0 and keep receiving delivery orders.
                </Text>
              </LinearGradient>

              {/* Pending Request Alert (If any) */}
              {paymentInfo.hasPendingVerification && paymentInfo.pendingRequest && (
                <View style={styles.pendingVerificationBox}>
                  <View style={styles.pendingVerificationHeader}>
                    <Ionicons name="hourglass-outline" size={18} color="#D97706" />
                    <Text style={styles.pendingVerificationTitle}>Verification in Progress</Text>
                  </View>
                  <Text style={styles.pendingVerificationText}>
                    You recently submitted proof for ₹{paymentInfo.pendingRequest.amount} (UTR: {paymentInfo.pendingRequest.utrNumber}). Admin is verifying your payment.
                  </Text>
                  <View style={styles.pendingNoticeBadge}>
                    <Text style={styles.pendingNoticeBadgeText}>
                      Your account will automatically unlock once verified!
                    </Text>
                  </View>
                </View>
              )}

              {/* Step 1: Admin UPI Details */}
              <View style={styles.sectionCard}>
                <View style={styles.stepTitleRow}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Pay to Company UPI ID</Text>
                </View>

                <View style={styles.upiDetailsBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upiLabel}>Official UPI ID</Text>
                    <Text style={styles.upiValue}>{paymentInfo.adminUpiId}</Text>
                    <Text style={styles.payeeName}>Account: {paymentInfo.adminUpiName}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                    onPress={() => copyToClipboard(paymentInfo.adminUpiId)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={copied ? 'checkmark-circle' : 'copy-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Direct Pay Button */}
                <TouchableOpacity
                  style={styles.openUpiBtn}
                  onPress={openUpiApp}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flash" size={18} color="#059669" />
                  <Text style={styles.openUpiBtnText}>
                    Open UPI App (GPay / PhonePe / Paytm)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Step 2: Submit UTR / Transaction Proof */}
              <View style={styles.sectionCard}>
                <View style={styles.stepTitleRow}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Enter 12-Digit UTR / Ref Number</Text>
                </View>

                <Text style={styles.inputInstruction}>
                  After paying ₹{currentDue}, copy the 12-digit UTR or Transaction ID from your payment receipt and paste below:
                </Text>

                <TextInput
                  style={styles.utrInput}
                  placeholder="e.g. 428910284918"
                  placeholderTextColor="#94A3B8"
                  value={utrNumber}
                  onChangeText={setUtrNumber}
                  keyboardType="default"
                  autoCapitalize="characters"
                  maxLength={30}
                />

                <TouchableOpacity
                  style={[
                    styles.submitProofBtn,
                    (!utrNumber.trim() || submitting) && styles.submitProofBtnDisabled,
                  ]}
                  onPress={handleSubmitProof}
                  disabled={!utrNumber.trim() || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.submitProofBtnText}>
                        Submit Payment Proof (₹{currentDue})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Security Guarantee Note */}
              <View style={styles.securityNoteRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
                <Text style={styles.securityNoteText}>
                  Verified by WormUp Finance Team • Automated Khata Sync
                </Text>
              </View>
            </ScrollView>
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  amountCard: {
    borderRadius: 16,
    padding: 18,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  amountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEE2E2',
    letterSpacing: 0.6,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  amountCardValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  amountCardNote: {
    fontSize: 12,
    color: '#FEE2E2',
    lineHeight: 17,
  },
  pendingVerificationBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  pendingVerificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingVerificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  pendingVerificationText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  pendingNoticeBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingNoticeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  upiDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  upiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  upiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  payeeName: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 12,
  },
  openUpiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  inputInstruction: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  utrInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 1,
  },
  submitProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitProofBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitProofBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  securityNoteText: {
    fontSize: 11,
    color: '#64748B',
  },
});
