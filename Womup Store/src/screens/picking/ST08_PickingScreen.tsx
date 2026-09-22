import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { BarcodeScanner } from '../../components/common/BarcodeScanner';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SubstituteModal } from '../../components/modals/SubstituteModal';
import { COLORS } from '../../theme/colors';

export const ST08_PickingScreen: React.FC = () => {
  const { activeOrder, activePickList, scanPickItem, markOutOfStock, setSubScreen } = useStore();
  const [showOOSModal, setShowOOSModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active picking order</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Text style={styles.backText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = activePickList?.items || [];
  const pendingItems = items.filter((i) => i.status === 'PENDING');
  const pickedCount = items.filter((i) => i.status === 'PICKED').length;
  const currentItem = pendingItems[0] || items[items.length - 1];

  // If all picked, transition to packing screen
  const isAllPicked = items.length > 0 && pendingItems.length === 0;

  const handleScanBarcode = async (scannedBarcode: string) => {
    if (!currentItem) return;

    try {
      const res = await scanPickItem(activeOrder.orderId, currentItem.productId, scannedBarcode);
      setSuccessToast(`Scanned: ${currentItem.name}`);
      setTimeout(() => setSuccessToast(null), 1500);

      if (res.isCompleted) {
        setTimeout(() => {
          setSubScreen('Packing');
        }, 600);
      }
    } catch (err: any) {
      console.log('Pick scan error:', err);
    }
  };

  const handleConfirmOOS = async (reason: string) => {
    if (!currentItem) return;
    await markOutOfStock(activeOrder.orderId, currentItem.productId, reason);
    if (pendingItems.length <= 1) {
      setSubScreen('Packing');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Progress Bar */}
        <View style={styles.topProgressArea}>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderLabel}>PICKING ORDER</Text>
            <Text style={styles.orderNumber}>{activeOrder.orderNumber}</Text>
          </View>
          <ProgressBar
            current={pickedCount}
            total={items.length}
            label={`Item ${Math.min(items.length, pickedCount + 1)} of ${items.length}`}
          />
        </View>

        {/* Success Toast */}
        {successToast && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            <Text style={styles.successToastText}>{successToast} ✓</Text>
          </View>
        )}

        {/* Big Shelf Location Card */}
        <View style={styles.shelfCard}>
          <Text style={styles.shelfHeadline}>TARGET SHELF LOCATION</Text>
          <View style={styles.shelfBanner}>
            <Ionicons name="location" size={28} color="#FFF" />
            <Text style={styles.shelfLocationText}>
              {currentItem?.shelfLocation || 'A2-R3'}
            </Text>
          </View>
          <Text style={styles.shelfSub}>
            Head to Aisle {currentItem?.shelfLocation?.split('-')[0] || 'A2'}, Rack{' '}
            {currentItem?.shelfLocation?.split('-')[1] || 'R3'}
          </Text>
        </View>

        {/* Current Product Detail Card */}
        {currentItem ? (
          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyNumber}>{currentItem.quantity}x</Text>
                <Text style={styles.qtyUnit}>{currentItem.unit || 'pack'}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.productName}>{currentItem.name}</Text>
                <Text style={styles.skuTag}>SKU Barcode: {currentItem.barcode}</Text>
              </View>
            </View>

            {/* Barcode Scanner Component */}
            <BarcodeScanner
              expectedBarcode={currentItem.barcode}
              onScan={handleScanBarcode}
              title={`Scan ${currentItem.name}`}
              subtitle="Scan packaging barcode to verify item"
            />

            {/* Exception Button */}
            <TouchableOpacity
              style={styles.oosBtn}
              onPress={() => setShowOOSModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
              <Text style={styles.oosBtnText}>ITEM NOT FOUND / DAMAGED</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completeCard}>
            <Ionicons name="checkmark-done-circle" size={54} color={COLORS.primary} />
            <Text style={styles.completeTitle}>All Items Picked!</Text>
            <TouchableOpacity
              style={styles.proceedPackingBtn}
              onPress={() => setSubScreen('Packing')}
            >
              <Text style={styles.proceedPackingText}>PROCEED TO PACKING</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Out of stock modal */}
      <SubstituteModal
        visible={showOOSModal}
        onClose={() => setShowOOSModal(false)}
        itemName={currentItem?.name || 'Product'}
        onConfirmOOS={handleConfirmOOS}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
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
  topProgressArea: {
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  orderNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderNumber: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  successToastText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shelfCard: {
    backgroundColor: COLORS.shelfBadgeBg,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  shelfHeadline: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  shelfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  shelfLocationText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  shelfSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  productCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qtyBadge: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  qtyUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  skuTag: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
    fontFamily: 'monospace',
  },
  oosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.dangerBg,
    gap: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  oosBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  completeCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  completeTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 16,
  },
  proceedPackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  proceedPackingText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
