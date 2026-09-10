import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Printer, FileText, X, CheckCircle2, Clock, MapPin, User, Tag, ShieldCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

const PRINT_STAGES = ['PENDING', 'PRINTING', 'PRINTED', 'DISPATCHED', 'DELIVERED'] as const;

export const PrintOrderModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedPrintOrder,
    setSelectedPrintOrder,
    updatePrintOrderStatus,
    openLabelPrint,
  } = useAdminState();

  if (activeModal !== 'PrintOrderDetails' || !selectedPrintOrder) {
    return null;
  }

  const handleClose = () => {
    setSelectedPrintOrder(null);
    setActiveModal('none');
  };

  const handleAdvanceStatus = () => {
    const currentIndex = PRINT_STAGES.indexOf(selectedPrintOrder.status as any);
    if (currentIndex >= 0 && currentIndex < PRINT_STAGES.length - 1) {
      const nextStatus = PRINT_STAGES[currentIndex + 1];
      updatePrintOrderStatus(selectedPrintOrder.id, nextStatus);
      Alert.alert('Status Updated', `Print job moved to "${nextStatus}" in MongoDB.`);
    } else {
      Alert.alert('Completed', 'Print job has already reached final Delivered state.');
    }
  };

  const handleOpenLabel = () => {
    openLabelPrint({
      orderId: selectedPrintOrder.printOrderNumber,
      type: 'PRINT',
      customerName: selectedPrintOrder.customerName || 'WormUp Customer',
      customerPhone: selectedPrintOrder.customerPhone || '9879432011',
      address: selectedPrintOrder.deliveryAddress || 'Prahlad Nagar, Ahmedabad',
      items: [
        {
          name: `${selectedPrintOrder.originalFileName || 'Document'} (${selectedPrintOrder.pageCount} pgs)`,
          quantity: selectedPrintOrder.numberOfCopies,
          subtotal: selectedPrintOrder.totalAmount,
        },
      ],
      total: selectedPrintOrder.totalAmount,
      paymentMethod: 'UPI Online Paid',
      specs: {
        pageCount: selectedPrintOrder.pageCount,
        copies: selectedPrintOrder.numberOfCopies,
        color: selectedPrintOrder.isColor,
        paperQuality: selectedPrintOrder.paperQuality,
      },
    });
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Printer size={22} color={COLORS.purple} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.orderNumber}>{selectedPrintOrder.printOrderNumber}</Text>
                <Text style={styles.subTitle}>Paper Print & Xerox Job Details</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            {/* Status Pill Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current Job Status:</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{selectedPrintOrder.status}</Text>
                </View>
              </View>
              <Text style={styles.timeText}>Ordered at: {selectedPrintOrder.timestamp || selectedPrintOrder.createdAt}</Text>
            </View>

            {/* Customer Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Customer & Delivery</Text>
              <View style={styles.infoRow}>
                <User size={14} color={COLORS.purple} style={{ marginRight: 6 }} />
                <Text style={styles.infoVal}>
                  {selectedPrintOrder.customerName} ({selectedPrintOrder.customerPhone || '9879432011'})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={14} color={COLORS.hotPink} style={{ marginRight: 6 }} />
                <Text style={styles.infoVal}>{selectedPrintOrder.deliveryAddress || 'Prahlad Nagar, Ahmedabad'}</Text>
              </View>
            </View>

            {/* Document Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Print Specifications</Text>
              
              <View style={styles.fileBox}>
                <FileText size={22} color={COLORS.purple} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedPrintOrder.originalFileName || 'Document.pdf'}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {selectedPrintOrder.fileSize} • {selectedPrintOrder.fileType || 'PDF'}
                  </Text>
                </View>
              </View>

              <View style={styles.grid2}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Page Count</Text>
                  <Text style={styles.gridVal}>{selectedPrintOrder.pageCount} Pages</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Copies</Text>
                  <Text style={styles.gridVal}>{selectedPrintOrder.numberOfCopies} Copy</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Print Mode</Text>
                  <Text style={styles.gridVal}>
                    {selectedPrintOrder.isColor ? 'Full Color' : 'Black & White (B&W)'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Paper Type</Text>
                  <Text style={styles.gridVal}>{selectedPrintOrder.paperQuality || '70 GSM Standard'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Sides</Text>
                  <Text style={styles.gridVal}>
                    {selectedPrintOrder.isDoubleSided ? 'Double Sided' : 'Single Sided'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Binding</Text>
                  <Text style={styles.gridVal}>{selectedPrintOrder.binding || 'None'}</Text>
                </View>
              </View>
            </View>

            {/* Price Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Financial Breakdown</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price Per Page</Text>
                <Text style={styles.priceVal}>₹{selectedPrintOrder.pricePerPage}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Binding Cost</Text>
                <Text style={styles.priceVal}>₹{selectedPrintOrder.bindingPrice || 0}</Text>
              </View>
              <View style={[styles.priceRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Paid</Text>
                <Text style={styles.grandTotalVal}>₹{selectedPrintOrder.totalAmount}</Text>
              </View>
            </View>

            {/* Privacy Compliance */}
            <View style={styles.privacyBox}>
              <ShieldCheck size={16} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.privacyText}>
                {selectedPrintOrder.isDocumentPurged
                  ? 'Compliant: Original file purged from S3 storage.'
                  : 'Active Print Job: Auto-purges file 24 hours after delivery.'}
              </Text>
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.printLabelBtn} onPress={handleOpenLabel}>
              <Printer size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Print Label</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.advanceBtn} onPress={handleAdvanceStatus}>
              <CheckCircle2 size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Advance Status</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
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
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    maxHeight: 440,
  },
  statusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  statusPill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoVal: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fileMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  gridLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  priceVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.purple,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginVertical: 4,
  },
  privacyText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  printLabelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  advanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
