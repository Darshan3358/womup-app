import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const PickupVerificationModal: React.FC = () => {
  const { showPickupModal, setShowPickupModal, pickupOrder, activeDelivery } = useRider();
  const [bagBarcode, setBagBarcode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmPickup = async () => {
    const code = bagBarcode.trim();
    if (!code) {
      Alert.alert(
        'Bag Barcode Required',
        'Please scan or enter the Bag Barcode (e.g., BAG-WORM-...) printed on the sealed grocery tote bag before confirming pickup.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await pickupOrder(code);
      setShowPickupModal(false);
      setBagBarcode('');
    } catch (err: any) {
      Alert.alert(
        'Pickup Verification Failed',
        err?.message || 'The store has not finished packing this order, or the barcode does not match.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={showPickupModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPickupModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="cube-outline" size={28} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Store Handover Verification</Text>
          <Text style={styles.subtitle}>
            Verify tote bag #{activeDelivery?.orderNumber} with store packer before dispatching.
          </Text>

          <View style={styles.bagChecklist}>
            <View style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.onlineGreen} />
              <Text style={styles.checkText}>Grocery Tote Bag sealed</Text>
            </View>
            {activeDelivery?.hasPrintJob && (
              <View style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.onlineGreen} />
                <Text style={styles.checkText}>Document Print Envelope collected</Text>
              </View>
            )}
            <View style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.onlineGreen} />
              <Text style={styles.checkText}>Temperature cold bag for dairy items</Text>
            </View>
          </View>

          <Text style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6, marginTop: 4 }}>
            SEALED BAG BARCODE <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Scan / Enter Bag Barcode (BAG-...)"
            placeholderTextColor={COLORS.secondaryText}
            value={bagBarcode}
            onChangeText={setBagBarcode}
            autoCapitalize="characters"
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowPickupModal(false)}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleConfirmPickup}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>CONFIRM PICKUP</Text>
              )}
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
  modalCard: {
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
  bagChecklist: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    padding: 12,
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkMark: {
    color: COLORS.onlineGreen,
    fontWeight: '800',
    fontSize: 14,
  },
  checkText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.offlineGrayLight,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.offlineGray,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
