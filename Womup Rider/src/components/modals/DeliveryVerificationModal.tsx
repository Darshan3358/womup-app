import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRider } from '../../context/RiderContext';
import { COLORS, GRADIENTS } from '../../theme/colors';

const { width } = Dimensions.get('window');

export const DeliveryVerificationModal: React.FC = () => {
  const { showOtpModal, setShowOtpModal, verifyOtp, activeDelivery } = useRider();
  const [otp, setOtp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isDeliveredSuccess, setIsDeliveredSuccess] = useState<boolean>(false);
  const [completedOrderSnapshot, setCompletedOrderSnapshot] = useState<any>(null);

  const handleKeyPress = (char: string) => {
    if (otp.length < 4) {
      const nextOtp = otp + char;
      setOtp(nextOtp);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    if (otp.length > 0) {
      setOtp(otp.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) {
      setErrorMessage('Please enter the 4-digit code provided by customer');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    // Snapshot order details before context sets activeDelivery to null
    const snapshot = activeDelivery ? { ...activeDelivery } : null;
    setCompletedOrderSnapshot(snapshot);

    const isSuccess = await verifyOtp(otp);
    setIsVerifying(false);

    if (!isSuccess) {
      setErrorMessage('Invalid delivery PIN. Please ask customer to recheck app.');
    } else {
      setIsDeliveredSuccess(true);
    }
  };

  const handleCloseCelebration = () => {
    setIsDeliveredSuccess(false);
    setOtp('');
    setErrorMessage('');
    setCompletedOrderSnapshot(null);
    setShowOtpModal(false);
  };

  const handleDismissModal = () => {
    if (isDeliveredSuccess) {
      handleCloseCelebration();
    } else {
      setOtp('');
      setErrorMessage('');
      setShowOtpModal(false);
    }
  };

  if (!showOtpModal) return null;

  return (
    <Modal
      visible={showOtpModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismissModal}
    >
      <View style={styles.overlay}>
        {isDeliveredSuccess ? (
          /* =================================================================== */
          /* SCREEN 10 CELEBRATION VIEW: ORDER COMPLETED                         */
          /* =================================================================== */
          <View style={styles.celebrationCard}>
            <View style={styles.celebrateImageContainer}>
              <Image
                source={require('../../../assets/order_delivered_celebrate.png')}
                style={styles.celebrateImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.earningBadge}>
              <Ionicons name="sparkles" size={14} color="#059669" />
              <Text style={styles.earningBadgeText}>
                +₹{completedOrderSnapshot?.payoutAmount || 50} EARNED
              </Text>
            </View>

            <Text style={styles.celebrateTitle}>Delivery Completed!</Text>
            <Text style={styles.celebrateSubtitle}>
              Great job! The package was safely handed over to the customer.
            </Text>

            {completedOrderSnapshot && (
              <View style={styles.orderDetailsBox}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order ID</Text>
                  <Text style={styles.orderDetailValue}>
                    #{completedOrderSnapshot.orderNumber || 'WM-9021'}
                  </Text>
                </View>
                <View style={styles.orderDetailDivider} />
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Customer</Text>
                  <Text style={styles.orderDetailValue}>
                    {completedOrderSnapshot.customerName || 'Customer'}
                  </Text>
                </View>
                {completedOrderSnapshot.tip && completedOrderSnapshot.tip > 0 ? (
                  <>
                    <View style={styles.orderDetailDivider} />
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.orderDetailLabel}>Customer Tip</Text>
                      <Text style={[styles.orderDetailValue, { color: '#059669' }]}>
                        +₹{completedOrderSnapshot.tip}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={styles.ctaButtonWrapper}
              onPress={handleCloseCelebration}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={GRADIENTS.primaryPink}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaButtonText}>Back to Dashboard</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* =================================================================== */
          /* SCREEN 10 PIN ENTRY VIEW: 4-DIGIT VERIFICATION                     */
          /* =================================================================== */
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerIconWrapper}>
                <Ionicons name="shield-checkmark" size={24} color="#FF3B98" />
              </View>
              <Text style={styles.title}>Customer Delivery PIN</Text>
              <Text style={styles.subtitle}>
                Ask {activeDelivery?.customerName || 'the customer'} for the 4-digit OTP shown in their app
              </Text>
            </View>

            {/* 4 Distinct OTP Input Boxes */}
            <View style={styles.pinBoxesContainer}>
              {[0, 1, 2, 3].map((index) => {
                const digit = otp[index];
                const isCurrent = otp.length === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.pinBox,
                      isCurrent && styles.pinBoxActive,
                      digit ? styles.pinBoxFilled : null,
                    ]}
                  >
                    <Text style={styles.pinDigit}>{digit || ''}</Text>
                  </View>
                );
              })}
            </View>

            {/* Error Message */}
            {errorMessage !== '' && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* COD Cash Collection Notice */}
            {activeDelivery?.paymentMethod === 'COD' && (
              <View style={styles.codAlertBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Ionicons name="cash-outline" size={16} color="#B45309" />
                  <Text style={styles.codAlertTitle}>COLLECT CASH PAYMENT</Text>
                </View>
                <Text style={styles.codAlertAmount}>
                  Collect ₹{activeDelivery.orderAmount} in cash before handover
                </Text>
              </View>
            )}

            {/* In-App Numeric Keypad */}
            <View style={styles.keypadContainer}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadKey}
                  onPress={() => handleKeyPress(num)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keypadKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.keypadKeyEmpty} />

              <TouchableOpacity
                style={styles.keypadKey}
                onPress={() => handleKeyPress('0')}
                activeOpacity={0.7}
              >
                <Text style={styles.keypadKeyText}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keypadKey}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="backspace-outline" size={22} color="#071B52" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleDismissModal}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtnWrapper,
                  (otp.length < 4 || isVerifying) && styles.disabledBtnWrapper,
                ]}
                onPress={handleVerify}
                disabled={otp.length < 4 || isVerifying}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={otp.length === 4 ? GRADIENTS.primaryPink : ['#CBD5E1', '#94A3B8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmBtnText}>
                    {isVerifying ? 'Verifying...' : 'Confirm & Deliver'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 82, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 59, 152, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
    width: '100%',
  },
  pinBox: {
    width: 52,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxActive: {
    borderColor: '#FF3B98',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pinBoxFilled: {
    borderColor: '#071B52',
    backgroundColor: '#FFFFFF',
  },
  pinDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: '#071B52',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  codAlertBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  codAlertTitle: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 11,
  },
  codAlertAmount: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 12,
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  keypadKey: {
    width: '30%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    marginHorizontal: '1.5%',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  keypadKeyEmpty: {
    width: '30%',
    height: 44,
    marginVertical: 4,
    marginHorizontal: '1.5%',
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#071B52',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBtnWrapper: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabledBtnWrapper: {
    opacity: 0.65,
  },
  confirmGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  /* Celebration Card Styles */
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  celebrateImageContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrateImage: {
    width: 130,
    height: 130,
  },
  earningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  earningBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  celebrateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 6,
    textAlign: 'center',
  },
  celebrateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  orderDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  orderDetailValue: {
    fontSize: 13,
    color: '#071B52',
    fontWeight: '800',
  },
  orderDetailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
