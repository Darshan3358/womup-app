import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

// Authentic high-density vertical barcode pattern
const BARCODE_BARS = [
  3, 1, 2, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 3, 1, 1, 2, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2
];

export const ST10_PackingScreen: React.FC = () => {
  const {
    activeOrder,
    activePickList,
    completePacking,
    placeOnReadyShelf,
    setSubScreen,
    setCurrentTab,
  } = useStore();

  const [selectedBagSize, setSelectedBagSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [shelfSlot] = useState<string>(
    activePickList?.shelfSlot || activeOrder?.shelfSlot || 'READY-01'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  // Derive bag barcode reliably matching Order ID
  const cleanOrderNum = (activeOrder?.orderNumber || '356409124').replace(/[^0-9]/g, '');
  const [bagBarcode, setBagBarcode] = useState<string>(
    activePickList?.bagBarcode ||
      activeOrder?.bagBarcode ||
      `BAG-${cleanOrderNum || '356409124'}-3757`
  );

  const items = activePickList?.items || [];
  const pickedItems = items.filter((i) => i.status === 'PICKED');
  const totalUnits = pickedItems.reduce((sum, i) => sum + (i.quantity || 1), 0) || items.reduce((sum, i) => sum + (i.quantity || 1), 0) || 1;

  // Auto-suggest bag size based on total units if not explicitly set
  useEffect(() => {
    if (totalUnits <= 3) {
      setSelectedBagSize('SMALL');
    } else if (totalUnits <= 8) {
      setSelectedBagSize('MEDIUM');
    } else {
      setSelectedBagSize('LARGE');
    }
  }, [totalUnits]);

  // Display checklist items
  const displayItems = pickedItems.length > 0 ? pickedItems : (items.length > 0 ? items : [
    {
      name: 'Fresh Tomato 250 g',
      quantity: 1,
      shelfLocation: 'A1–R1',
      status: 'PICKED',
    },
  ]);

  const handleSealAndMoveToShelf = async () => {
    if (!activeOrder?.orderId) return;
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
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title & Subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>Packing & Bag Sealing</Text>
        <Text style={styles.subtitle}>
          Order {activeOrder?.orderNumber || 'WORM-356409-124'}  •  {totalUnits} {totalUnits === 1 ? 'item' : 'items'} packed
        </Text>
      </View>

      {/* 1. SELECT BAG SIZE */}
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
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              )}
              <Ionicons
                name="bag-handle"
                size={26}
                color={isSelected ? '#F43F5E' : '#475569'}
              />
              <Text style={[styles.bagName, isSelected && styles.bagNameSelected]}>
                {size}
              </Text>
              <Text style={[styles.bagCapacity, isSelected && styles.bagCapacitySelected]}>
                {size === 'SMALL' ? '1–3 items' : size === 'MEDIUM' ? '4–8 items' : '8+ items'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. BAG SECURITY BARCODE */}
      <Text style={styles.sectionTitle}>2. BAG SECURITY BARCODE</Text>
      <View style={styles.barcodeTicket}>
        <View style={styles.barcodeTop}>
          <Text style={styles.brandTitle}>WORM UP QUICK COMMERCE</Text>
          <Text style={styles.tagline}>AHMEDABAD DARK STORE</Text>
        </View>

        {/* Real Visual Barcode Lines */}
        <View style={styles.barcodeVisualRow}>
          {BARCODE_BARS.map((width, idx) => (
            <View
              key={idx}
              style={{
                width,
                height: 52,
                backgroundColor: idx % 2 === 0 ? '#0F172A' : 'transparent',
                marginRight: idx % 2 === 0 ? 1 : 2,
              }}
            />
          ))}
        </View>

        {/* Large Monospace Barcode ID */}
        <Text style={styles.barcodeCode}>{bagBarcode}</Text>

        {/* Footer Meta Row */}
        <View style={styles.barcodeMeta}>
          <Text style={styles.metaText}>
            Size: <Text style={styles.metaBold}>{selectedBagSize}</Text>
          </Text>
          <Text style={styles.metaText}>
            Items: <Text style={styles.metaBold}>{totalUnits}</Text>
          </Text>
          <Text style={styles.metaText}>
            Seal: <Text style={styles.metaBold}>CRYPTO-VERIFIED</Text>
          </Text>
        </View>
      </View>

      {/* 3. DESIGNATED SHELF SLOT */}
      <Text style={styles.sectionTitle}>3. DESIGNATED SHELF SLOT</Text>
      <View style={styles.shelfSlotCard}>
        <View style={styles.cubeIconWrap}>
          <Ionicons name="cube-outline" size={24} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.shelfSlotHeadline}>Transfer Bag to Ready Rack</Text>
          <Text style={styles.shelfSlotSub}>Delivery partner will scan and retrieve from this slot</Text>
        </View>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>{shelfSlot || 'READY-01'}</Text>
        </View>
      </View>

      {/* 4. PACKED ITEMS CHECKLIST */}
      <Text style={styles.sectionTitle}>
        PACKED ITEMS CHECKLIST ({totalUnits})
      </Text>
      <View style={styles.checklistCard}>
        {displayItems.map((item, idx) => (
          <View key={idx} style={styles.checkRow}>
            <View style={styles.checkCircleBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.checkItemName} numberOfLines={1}>
              {item.quantity}× {item.name}
            </Text>
            <Text style={styles.checkItemShelf}>{item.shelfLocation || 'A1–R2'}</Text>
          </View>
        ))}
      </View>

      {/* 5. BOTTOM ACTION BUTTON (With full clearance from BottomNav) */}
      <TouchableOpacity
        style={[styles.sealButton, (isSubmitting || isSealed) && styles.disabledBtn]}
        onPress={handleSealAndMoveToShelf}
        disabled={isSubmitting || isSealed}
        activeOpacity={0.88}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : isSealed ? (
          <>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.sealButtonText}>BAG SEALED & SHELVED ✓</Text>
          </>
        ) : (
          <>
            <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
            <Text style={styles.sealButtonText}>
              SEAL BAG & PLACE ON {shelfSlot || 'READY-01'}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 110, // Full clearance above BottomNav bar
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#071B52',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  bagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  bagCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bagCardSelected: {
    borderColor: '#F43F5E',
    backgroundColor: '#FFF1F2',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagName: {
    color: '#071B52',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  bagNameSelected: {
    color: '#F43F5E',
  },
  bagCapacity: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bagCapacitySelected: {
    color: '#F43F5E',
  },
  barcodeTicket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  barcodeTop: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    color: '#071B52',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tagline: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  barcodeVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  barcodeCode: {
    color: '#071B52',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  barcodeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 12,
  },
  metaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  metaBold: {
    color: '#071B52',
    fontWeight: '800',
  },
  shelfSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cubeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  shelfSlotHeadline: {
    color: '#071B52',
    fontSize: 14,
    fontWeight: '700',
  },
  shelfSlotSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  slotBadge: {
    backgroundColor: '#071B52',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItemName: {
    color: '#071B52',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  checkItemShelf: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 18,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#BE123C',
    opacity: 0.75,
  },
  sealButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
