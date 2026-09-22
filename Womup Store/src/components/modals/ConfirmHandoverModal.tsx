import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ConfirmHandoverModal: React.FC = () => {
  const { riderArrivalAlert, dismissRiderAlert, completeHandover, readyOrders } = useStore();
  const [bagBarcode, setBagBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!riderArrivalAlert) return null;

  const matchedOrder = readyOrders.find(
    (o) => o.orderNumber === riderArrivalAlert.orderNumber || o.orderId === riderArrivalAlert.orderId
  );

  const expectedBag = matchedOrder?.bagBarcode;

  if (!expectedBag) {
    return (
      <Modal visible={Boolean(riderArrivalAlert)} transparent animationType="fade" onRequestClose={dismissRiderAlert}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.alertHeader}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.warning }]}>
                <Ionicons name="alert-circle" size={26} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Order Not Ready</Text>
                <Text style={styles.orderBadge}>{riderArrivalAlert.orderNumber}</Text>
              </View>
              <TouchableOpacity onPress={dismissRiderAlert}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginVertical: 14, lineHeight: 20 }}>
              Bag barcode has not been generated yet. Please complete packing and seal the bag before handing over to the rider.
            </Text>
            <TouchableOpacity style={styles.handoverBtn} onPress={dismissRiderAlert}>
              <Text style={styles.handoverText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const handleConfirm = async () => {
    const code = (bagBarcode.trim() || expectedBag).toUpperCase();
    if (!matchedOrder?.orderId && !riderArrivalAlert.orderId) return;

    setIsSubmitting(true);
    try {
      const orderId = matchedOrder?.orderId || riderArrivalAlert.orderId!;
      await completeHandover(orderId, code);
      setIsSubmitting(false);
      dismissRiderAlert();
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={Boolean(riderArrivalAlert)} transparent animationType="fade" onRequestClose={dismissRiderAlert}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.alertHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="bicycle" size={26} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Rider at Counter!</Text>
              <Text style={styles.orderBadge}>{riderArrivalAlert.orderNumber}</Text>
            </View>
            <TouchableOpacity onPress={dismissRiderAlert}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Rider Info Card */}
          <View style={styles.riderCard}>
            <View style={styles.riderRow}>
              <Ionicons name="person-circle" size={36} color={COLORS.accentCyan} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.riderName}>{riderArrivalAlert.riderName}</Text>
                <Text style={styles.riderPhone}>{riderArrivalAlert.phoneNumber || 'Phone unavailable'}</Text>
              </View>
              {riderArrivalAlert.vehicleNumber ? (
                <View style={styles.vehicleBadge}>
                  <Text style={styles.vehicleText}>{riderArrivalAlert.vehicleNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Shelf Slot & Bag Barcode Details */}
          <View style={styles.shelfBox}>
            <View style={styles.shelfCol}>
              <Text style={styles.shelfLabel}>Shelf Slot</Text>
              <Text style={styles.shelfValue}>{matchedOrder?.shelfSlot || 'UNASSIGNED'}</Text>
            </View>
            <View style={styles.shelfCol}>
              <Text style={styles.shelfLabel}>Expected Bag Barcode</Text>
              <Text style={styles.bagValue}>{expectedBag}</Text>
            </View>
          </View>

          {/* Scan / Input Barcode */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Scan or Confirm Rider Bag Barcode:</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.barcodeInput}
                value={bagBarcode}
                onChangeText={setBagBarcode}
                placeholder={expectedBag}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.autoFillBtn}
                onPress={() => setBagBarcode(expectedBag)}
              >
                <Text style={styles.autoFillText}>MATCH</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={dismissRiderAlert}>
              <Text style={styles.cancelText}>DISMISS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.handoverBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFF" />
              <Text style={styles.handoverText}>
                {isSubmitting ? 'VERIFYING...' : 'CONFIRM HANDOVER'}
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  orderBadge: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  riderCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  riderPhone: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  vehicleBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
  },
  shelfBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.shelfBadgeBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  shelfCol: {
    flex: 1,
  },
  shelfLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  shelfValue: {
    color: COLORS.shelfBadgeText,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  bagValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  autoFillBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  handoverBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  handoverText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
