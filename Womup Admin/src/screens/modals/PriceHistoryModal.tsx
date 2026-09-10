import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { History, X, Clock, User, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const PriceHistoryModal: React.FC = () => {
  const { activeModal, setActiveModal, selectedProduct, setSelectedProduct } = useAdminState();

  if (activeModal !== 'PriceHistory' || !selectedProduct) {
    return null;
  }

  const handleClose = () => {
    setSelectedProduct(null);
    setActiveModal('none');
  };

  const history = selectedProduct.priceHistory || [];

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <History size={20} color={COLORS.purple} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.title}>Price Change Audit History</Text>
                <Text style={styles.subTitle}>{selectedProduct.name} ({selectedProduct.category})</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current Live Price Card */}
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Current Live Pricing</Text>
            <View style={styles.currentRow}>
              <View style={styles.currentBox}>
                <Text style={styles.priceType}>Base Price</Text>
                <Text style={styles.priceVal}>₹{selectedProduct.basePrice}</Text>
              </View>
              <View style={[styles.currentBox, { backgroundColor: '#EEF2FF' }]}>
                <Text style={[styles.priceType, { color: COLORS.purple }]}>Selling Price</Text>
                <Text style={[styles.priceVal, { color: COLORS.purple }]}>₹{selectedProduct.sellingPrice}</Text>
              </View>
              <View style={styles.currentBox}>
                <Text style={styles.priceType}>MRP</Text>
                <Text style={styles.priceVal}>₹{selectedProduct.mrp}</Text>
              </View>
            </View>
          </View>

          {/* History List */}
          <ScrollView style={styles.historyList}>
            {history.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No price change history recorded yet.</Text>
              </View>
            ) : (
              history.map((entry, idx) => (
                <View key={entry.id || idx} style={styles.historyItem}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.userRow}>
                      <User size={13} color={COLORS.purple} style={{ marginRight: 4 }} />
                      <Text style={styles.adminName}>{entry.changedBy || 'Admin'}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={11} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.timeText}>
                        {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : 'Recently'}
                      </Text>
                    </View>
                  </View>

                  {/* Price Transition */}
                  <View style={styles.transitionBox}>
                    <View style={styles.transitionCol}>
                      <Text style={styles.transitionLabel}>Old Price</Text>
                      <Text style={styles.oldPrice}>₹{entry.oldSellingPrice}</Text>
                    </View>

                    <ArrowRight size={16} color={COLORS.purple} />

                    <View style={styles.transitionCol}>
                      <Text style={styles.transitionLabel}>New Selling Price</Text>
                      <Text style={styles.newPrice}>₹{entry.newSellingPrice}</Text>
                    </View>

                    <View style={styles.transitionCol}>
                      <Text style={styles.transitionLabel}>MRP</Text>
                      <Text style={styles.mrpText}>₹{entry.newMrp}</Text>
                    </View>
                  </View>

                  {entry.notes && (
                    <Text style={styles.notesText}>{entry.notes}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeActionBtn} onPress={handleClose}>
            <Text style={styles.closeActionText}>Close History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  currentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  currentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currentBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  priceType: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  historyList: {
    maxHeight: 320,
  },
  emptyBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  historyItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  transitionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  transitionCol: {
    alignItems: 'center',
  },
  transitionLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  oldPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.purple,
  },
  mrpText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  closeActionBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  closeActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
