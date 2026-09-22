import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const CustomerUnavailableModal: React.FC = () => {
  const { showUnavailableModal, setShowUnavailableModal, activeDelivery, advanceStep } = useRider();
  const [callAttempts, setCallAttempts] = useState<number>(1);

  const handleCallCustomer = async () => {
    setCallAttempts((prev) => prev + 1);
    const phone = activeDelivery?.customerPhone || '+919898012345';
    const cleanNumber = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Calling Customer', `Dialing ${phone}...`);
      }
    } catch {
      Alert.alert('Calling Customer', `Dialing ${phone}...`);
    }
  };

  const handleReturnToStore = async () => {
    Alert.alert(
      'Return to Store Confirmed',
      'Please return this parcel to the dark store. Inventory manager has been notified.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await advanceStep('FAILED');
            setShowUnavailableModal(false);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={showUnavailableModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUnavailableModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="hourglass-outline" size={28} color="#D97706" />
          </View>
          <Text style={styles.title}>Customer Unavailable</Text>
          <Text style={styles.subtitle}>
            Doorstep SOP: Please attempt to call the customer at least 3 times before declaring an undeliverable order.
          </Text>

          <View style={styles.attemptBox}>
            <Text style={styles.attemptLabel}>Call Attempts Registered:</Text>
            <Text style={styles.attemptCount}>{callAttempts} / 3</Text>
          </View>

          <TouchableOpacity
            style={[styles.callBtn, { flexDirection: 'row', justifyContent: 'center' }]}
            onPress={handleCallCustomer}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.callBtnText}>Call Customer Now</Text>
          </TouchableOpacity>

          <View style={styles.timerWaitBox}>
            <Text style={styles.timerWaitText}>Recommended wait time: 5 minutes at door</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowUnavailableModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>Keep Waiting</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.returnBtn, callAttempts < 3 && styles.disabledBtn]}
              onPress={handleReturnToStore}
              disabled={callAttempts < 3}
              activeOpacity={0.85}
            >
              <Text style={styles.returnBtnText}>Return to Store</Text>
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
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  attemptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  attemptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  attemptCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.hotPink,
  },
  callBtn: {
    width: '100%',
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  callBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  timerWaitBox: {
    marginBottom: 16,
  },
  timerWaitText: {
    fontSize: 11,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.offlineGrayLight,
    alignItems: 'center',
  },
  backBtnText: {
    color: COLORS.offlineGray,
    fontWeight: '700',
  },
  returnBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  returnBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
