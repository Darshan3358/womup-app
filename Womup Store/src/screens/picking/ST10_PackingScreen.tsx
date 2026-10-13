import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

export const ST10_PackingScreen: React.FC = () => {
  const { activeOrder, activePickList, completePacking, placeOnReadyShelf, setSubScreen, setCurrentTab } = useStore();
  const [selectedBagSize, setSelectedBagSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [bagBarcode, setBagBarcode] = useState<string | null>(
    activePickList?.bagBarcode || activeOrder?.bagBarcode || null
  );
  const [shelfSlot, setShelfSlot] = useState<string | null>(
    activePickList?.shelfSlot || activeOrder?.shelfSlot || 'READY-01'
  );
  const [isGeneratingBag, setIsGeneratingBag] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  if (!activeOrder) return null;

  const items = activePickList?.items || [];
  const pickedItems = items.filter((i) => i.status === 'PICKED');

  const handleGenerateBag = async () => {
    if (bagBarcode) return; // Locked once generated
    setIsGeneratingBag(true);
    try {
      const res = await StoreApiService.generateBagBarcode(activeOrder.orderId);
      setBagBarcode(res.bagBarcode);
    } catch (e: any) {
      alert(e?.message || 'Failed to generate bag barcode');
    } finally {
      setIsGeneratingBag(false);
    }
  };

  const handleSealAndMoveToShelf = async () => {
    if (!bagBarcode) {
      alert('Please generate bag barcode first before sealing.');
      return;
    }
    const targetShelf = shelfSlot || 'READY-01';
    setIsSubmitting(true);
    try {
      await completePacking(activeOrder.orderId, bagBarcode, 1.85);
      await placeOnReadyShelf(activeOrder.orderId, targetShelf);
      setIsSealed(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setCurrentTab('Ready');
        setSubScreen(null);
      }, 1000);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Packing & Bag Sealing</Text>
        <Text style={styles.subtitle}>Order {activeOrder.orderNumber} • {pickedItems.length} items packed</Text>
      </View>

      {/* Bag Selection */}
      <Text style={styles.sectionTitle}>1. SELECT BAG SIZE</Text>
      <View style={styles.bagRow}>
        {(['SMALL', 'MEDIUM', 'LARGE'] as const).map((size) => {
          const isSelected = selectedBagSize === size;
          return (
            <TouchableOpacity
              key={size}
              style={[styles.bagCard, isSelected && styles.bagCardSelected]}
              onPress={() => setSelectedBagSize(size)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bag-handle"
                size={24}
                color={isSelected ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.bagName, isSelected && styles.bagNameSelected]}>{size}</Text>
              <Text style={styles.bagCapacity}>
                {size === 'SMALL' ? '1-3 items' : size === 'MEDIUM' ? '4-8 items' : '8+ items'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Thermal Bag Label Barcode */}
      <Text style={styles.sectionTitle}>2. BAG SECURITY BARCODE</Text>
      <View style={styles.barcodeTicket}>
        <View style={styles.barcodeTop}>
          <Text style={styles.brandTitle}>WORM UP QUICK COMMERCE</Text>
          <Text style={styles.tagline}>AHMEDABAD DARK STORE</Text>
        </View>

        {!bagBarcode ? (
          <View style={styles.generateContainer}>
            <Ionicons name="barcode-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.noBarcodeText}>No Bag Barcode Generated</Text>
            <TouchableOpacity
              style={[styles.generateBtn, isGeneratingBag && styles.disabledBtn]}
              onPress={handleGenerateBag}
              disabled={isGeneratingBag}
              activeOpacity={0.8}
            >
              {isGeneratingBag ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="barcode-outline" size={18} color="#FFF" />
                  <Text style={styles.generateBtnText}>GENERATE BAG BARCODE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.barcodeVisual}>
              <Ionicons name="barcode" size={48} color={COLORS.textPrimary} />
              <Text style={styles.barcodeCode}>{bagBarcode}</Text>
              <Text style={styles.orderNumberRef}>{activeOrder.orderNumber}</Text>
            </View>

            <View style={styles.barcodeMeta}>
              <Text style={styles.metaText}>Size: {selectedBagSize}</Text>
              <Text style={styles.metaText}>Items: {pickedItems.length}</Text>
              <Text style={styles.metaText}>Seal: CRYPTO-VERIFIED</Text>
            </View>
          </>
        )}
      </View>

      {/* Ready Shelf Slot Destination */}
      <Text style={styles.sectionTitle}>3. DESIGNATED SHELF SLOT</Text>
      <View style={styles.shelfSlotCard}>
        <Ionicons name="cube" size={24} color={COLORS.shelfBadgeText} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.shelfSlotHeadline}>Transfer Bag to Ready Rack</Text>
          <Text style={styles.shelfSlotSub}>Delivery partner will scan and retrieve from this slot</Text>
        </View>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>{shelfSlot || 'READY-01'}</Text>
        </View>
      </View>

      {/* Items Checklist Summary */}
      <Text style={styles.sectionTitle}>PACKED ITEMS CHECKLIST ({pickedItems.length})</Text>
      <View style={styles.checklistCard}>
        {pickedItems.map((item, idx) => (
          <View key={idx} style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
            <Text style={styles.checkItemName} numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.checkItemShelf}>{item.shelfLocation}</Text>
          </View>
        ))}
      </View>

      {/* Bottom CTA */}
      <TouchableOpacity
        style={[styles.sealButton, (isSubmitting || isSealed || !bagBarcode) && styles.disabledBtn]}
        onPress={handleSealAndMoveToShelf}
        disabled={isSubmitting || isSealed || !bagBarcode}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : isSealed ? (
          <>
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
            <Text style={styles.sealButtonText}>BAG SEALED & SHELVED ✓</Text>
          </>
        ) : (
          <>
            <Ionicons name="lock-closed" size={20} color="#FFF" />
            <Text style={styles.sealButtonText}>
              {bagBarcode ? `SEAL BAG & PLACE ON ${shelfSlot || 'READY-01'}` : 'GENERATE BAG BARCODE FIRST'}
            </Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  bagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  bagCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bagCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  bagName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  bagNameSelected: {
    color: COLORS.primary,
  },
  bagCapacity: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  barcodeTicket: {
    backgroundColor: '#05070D',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 10,
  },
  barcodeTop: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  barcodeVisual: {
    alignItems: 'center',
    marginVertical: 6,
  },
  barcodeCode: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  orderNumberRef: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  barcodeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 8,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  shelfSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.shelfBadgeBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 10,
  },
  shelfSlotHeadline: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  shelfSlotSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  slotBadge: {
    backgroundColor: COLORS.shelfBadgeText,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  slotBadgeText: {
    color: '#05070D',
    fontSize: 13,
    fontWeight: '900',
  },
  checklistCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkItemName: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  checkItemShelf: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.8,
  },
  sealButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  generateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noBarcodeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
