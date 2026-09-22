import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { BarcodeScanner } from '../../components/common/BarcodeScanner';
import { COLORS } from '../../theme/colors';

export const ST11b_HandoverScanScreen: React.FC = () => {
  const { activeOrder, activePickList, completeHandover, setSubScreen } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoverSuccess, setHandoverSuccess] = useState(false);

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No order selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Text style={styles.backText}>Return to Shelves</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bagBarcode =
    activePickList?.bagBarcode ||
    activeOrder.bagBarcode ||
    'UNSEALED';

  const shelfSlot = activePickList?.shelfSlot || activeOrder.shelfSlot || 'UNASSIGNED';

  const handleScan = async (scannedCode: string) => {
    setIsSubmitting(true);
    try {
      await completeHandover(activeOrder.orderId, scannedCode);
      setHandoverSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setSubScreen(null);
      }, 1500);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSubScreen(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Delivery Handover</Text>
          <Text style={styles.subtitle}>Order {activeOrder.orderNumber}</Text>
        </View>
      </View>

      {/* Success Notification */}
      {handoverSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Handover Verified!</Text>
            <Text style={styles.successSub}>
              Order marked OUT_FOR_DELIVERY. Inventory stock deducted.
            </Text>
          </View>
        </View>
      )}

      {/* Target Shelf Card */}
      <View style={styles.shelfCard}>
        <View style={styles.shelfCol}>
          <Text style={styles.shelfLabel}>RETRIEVE FROM SHELF</Text>
          <Text style={styles.shelfValue}>{shelfSlot}</Text>
        </View>
        <View style={styles.shelfColRight}>
          <Text style={styles.shelfLabel}>BAG SECURITY BARCODE</Text>
          <Text style={styles.bagCode}>{bagBarcode}</Text>
        </View>
      </View>

      {/* Assigned Delivery Partner Card */}
      <View style={styles.riderCard}>
        <View style={styles.riderIcon}>
          <Ionicons name="bicycle" size={24} color={COLORS.accentCyan} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.riderLabel}>ASSIGNED DELIVERY PARTNER</Text>
          <Text style={styles.riderName}>
            {activeOrder.assignedRider?.name || 'Awaiting rider assignment'}
          </Text>
          {activeOrder.assignedRider ? (
            <Text style={styles.riderMeta}>
              Vehicle: {activeOrder.assignedRider.vehicleNumber || '—'} • {activeOrder.assignedRider.phone || '—'}
            </Text>
          ) : (
            <Text style={styles.riderMeta}>Rider has not been assigned yet</Text>
          )}
        </View>
      </View>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        expectedBarcode={bagBarcode}
        onScan={handleScan}
        title="Scan Bag Barcode on Package"
        subtitle="Verify barcode before handing over to rider"
      />

      {/* Manual Quick Match */}
      <TouchableOpacity
        style={[styles.instantHandoverBtn, isSubmitting && styles.disabledBtn]}
        onPress={() => handleScan(bagBarcode)}
        disabled={isSubmitting || handoverSuccess}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
            <Text style={styles.instantHandoverText}>CONFIRM HANDOVER TO RIDER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  successSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  shelfCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.shelfBadgeBg,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  shelfCol: {
    flex: 1,
  },
  shelfColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  shelfLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shelfValue: {
    color: COLORS.shelfBadgeText,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  bagCode: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  riderIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderLabel: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  riderName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  riderMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  instantHandoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  instantHandoverText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
