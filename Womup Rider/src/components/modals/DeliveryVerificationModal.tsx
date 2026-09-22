import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const DeliveryVerificationModal: React.FC = () => {
  const { showOtpModal, setShowOtpModal, verifyOtp, activeDelivery } = useRider();
  const [otp, setOtp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    if (otp.length < 4) {
      setErrorMessage('Please enter the 4-digit code provided by customer');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    const isSuccess = await verifyOtp(otp);
    setIsVerifying(false);

    if (!isSuccess) {
      setErrorMessage('Invalid delivery PIN. Please ask customer to recheck app.');
    } else {
      setOtp('');
      Alert.alert('Delivery Successful!', 'Order marked as completed. Earnings added to settlement.');
    }
  };

  return (
    <Modal
      visible={showOtpModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOtpModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="lock-closed" size={26} color="#4F46E5" />
            </View>
            <Text style={styles.title}>Customer Delivery PIN</Text>
            <Text style={styles.subtitle}>
              Ask {activeDelivery?.customerName || 'customer'} for the 4-digit OTP shown in their Worm Up app.
            </Text>
          </View>

          {/* PIN Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                setErrorMessage('');
              }}
              placeholder="• • • •"
              placeholderTextColor={COLORS.secondaryText}
              autoFocus
            />
          </View>

          {errorMessage !== '' && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {activeDelivery?.paymentMethod === 'COD' && (
            <View style={styles.codAlertBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="alert-circle" size={16} color="#B45309" />
                <Text style={styles.codAlertTitle}>COLLECT CASH PAYMENT</Text>
              </View>
              <Text style={styles.codAlertAmount}>Collect ₹{activeDelivery.orderAmount} before handover</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowOtpModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isVerifying && styles.disabledBtn]}
              onPress={handleVerify}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>
                {isVerifying ? 'VERIFYING...' : 'CONFIRM & DELIVER'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  otpInput: {
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.purple,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    color: COLORS.navy,
    backgroundColor: '#FAF5FF',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  codAlertBox: {
    backgroundColor: COLORS.busyOrangeLight,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.busyOrange,
    alignItems: 'center',
  },
  codAlertTitle: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 2,
  },
  codAlertAmount: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.offlineGrayLight,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.offlineGray,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.onlineGreen,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
