import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { BarcodeScanner } from '../../components/common/BarcodeScanner';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SubstituteModal } from '../../components/modals/SubstituteModal';
import { EditShelfModal } from '../../components/modals/EditShelfModal';
import { COLORS } from '../../theme/colors';

export const ST08_PickingScreen: React.FC = () => {
  const {
    activeOrder,
    activePickList,
    scanPickItem,
    markOutOfStock,
    setSubScreen,
    setCurrentTab,
    store,
    updateShelfLocation,
  } = useStore();
  const [showOOSModal, setShowOOSModal] = useState(false);
  const [showEditShelfModal, setShowEditShelfModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');
  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  if (!activeOrder) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={54} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>No Active Picking Order</Text>
        <Text style={styles.emptyDesc}>Accept an incoming order from the queue to start picking.</Text>
        <View style={styles.servingBadge}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.servingText}>
            Serving: {areaName} · {cityName}
          </Text>
        </View>
        <Text style={styles.emptySubDesc}>
          New orders from this area will appear here.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentTab('Incoming')}>
          <Ionicons name="flash" size={15} color="#FFF" />
          <Text style={styles.backText}>VIEW INCOMING QUEUE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = activePickList?.items || [];
  const pendingItems = items.filter((i) => i.status === 'PENDING');
  const pickedCount = items.filter((i) => i.status === 'PICKED').length;
  const currentItem = pendingItems[0] || items[items.length - 1];

  const isShelfAssigned =
    Boolean(currentItem?.shelfLocation) &&
    currentItem.shelfLocation !== 'UNASSIGNED' &&
    currentItem.shelfLocation !== 'Not set';

  const aisle =
    isShelfAssigned && currentItem.shelfLocation.includes('-')
      ? currentItem.shelfLocation.split('-')[0]
      : null;
  const rack =
    isShelfAssigned && currentItem.shelfLocation.includes('-')
      ? currentItem.shelfLocation.split('-')[1]
      : null;

  const handleSaveShelf = async (productId: string, newShelf: string) => {
    try {
      await updateShelfLocation(productId, newShelf);
      if (currentItem && currentItem.productId === productId) {
        currentItem.shelfLocation = newShelf;
      }
      setSuccessToast(`Shelf assigned: ${newShelf}`);
      setTimeout(() => setSuccessToast(null), 2000);
    } catch (e: any) {
      setSuccessToast(e.message || 'Failed to update shelf');
      setTimeout(() => setSuccessToast(null), 2000);
    }
  };

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
          <View style={styles.shelfCardHeader}>
            <Text style={styles.shelfHeadline}>TARGET SHELF LOCATION</Text>
            <TouchableOpacity
              style={styles.editShelfQuickBtn}
              onPress={() => setShowEditShelfModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={12} color={COLORS.accentCyan} />
              <Text style={styles.editShelfQuickText}>
                {isShelfAssigned ? 'CHANGE' : 'ASSIGN SHELF'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.shelfBanner, !isShelfAssigned && styles.shelfBannerUnassigned]}>
            <Ionicons name="location" size={26} color="#FFF" />
            <Text style={styles.shelfLocationText}>
              {isShelfAssigned ? currentItem.shelfLocation : 'Not set'}
            </Text>
          </View>
          <Text style={styles.shelfSub}>
            {isShelfAssigned
              ? (aisle && rack ? `Head to Aisle ${aisle}, Rack ${rack}` : `Shelf slot: ${currentItem.shelfLocation}`)
              : 'Tap "ASSIGN SHELF" above to set location'}
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

      {/* Quick Edit Shelf Modal */}
      <EditShelfModal
        visible={showEditShelfModal}
        onClose={() => setShowEditShelfModal(false)}
        item={
          currentItem
            ? ({
                productId: currentItem.productId,
                name: currentItem.name,
                shelfLocation: currentItem.shelfLocation,
                quantityLabel: currentItem.unit,
                availableQty: currentItem.quantity,
              } as any)
            : null
        }
        onSave={handleSaveShelf}
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
    padding: 24,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  servingText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptySubDesc: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
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
    width: '100%',
  },
  shelfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  shelfHeadline: {
    color: COLORS.shelfBadgeText,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  editShelfQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  editShelfQuickText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shelfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  shelfBannerUnassigned: {
    opacity: 0.85,
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
