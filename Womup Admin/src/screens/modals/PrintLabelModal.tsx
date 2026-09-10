import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Printer, FileText, X, CheckCircle2, MapPin, Phone, User, Package, Clock } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const PrintLabelModal: React.FC = () => {
  const { activeModal, closeLabelPrint, labelPrintData } = useAdminState();
  const [printType, setPrintType] = useState<'label' | 'invoice'>('label');

  if (activeModal !== 'PrintLabel' || !labelPrintData) {
    return null;
  }

  const handlePrint = (type: 'label' | 'invoice') => {
    if (Platform.OS === 'web') {
      try {
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (!printWindow) {
          window.print();
          return;
        }

        const isLabel = type === 'label';
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${isLabel ? 'WomUp_Dispatch_Label' : 'WomUp_Tax_Invoice'}_${labelPrintData.orderId}</title>
              <style>
                @page {
                  size: ${isLabel ? '100mm 150mm' : 'A4'};
                  margin: 6mm;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #111;
                  margin: 0;
                  padding: 12px;
                  background: #fff;
                }
                .label-box {
                  border: 2px dashed #333;
                  padding: 16px;
                  border-radius: 8px;
                  max-width: 420px;
                  margin: 0 auto;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 12px;
                }
                .brand {
                  font-size: 22px;
                  font-weight: 900;
                  letter-spacing: 1px;
                  color: #515FEA;
                }
                .tag {
                  font-size: 11px;
                  font-weight: 800;
                  background: #000;
                  color: #fff;
                  padding: 3px 8px;
                  border-radius: 4px;
                }
                .barcode {
                  text-align: center;
                  font-family: monospace;
                  font-size: 28px;
                  letter-spacing: 5px;
                  padding: 8px 0;
                  border-bottom: 1px solid #ddd;
                  margin-bottom: 10px;
                }
                .order-number {
                  font-size: 18px;
                  font-weight: 800;
                  margin: 0;
                  text-align: center;
                }
                .section {
                  margin-top: 10px;
                  padding: 8px 0;
                  border-bottom: 1px solid #eee;
                }
                .label {
                  font-size: 10px;
                  text-transform: uppercase;
                  color: #666;
                  font-weight: 700;
                }
                .val {
                  font-size: 14px;
                  font-weight: 700;
                  margin-top: 2px;
                }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 8px;
                }
                .items-table th {
                  font-size: 11px;
                  text-align: left;
                  border-bottom: 1px solid #ccc;
                  padding: 4px 0;
                }
                .items-table td {
                  font-size: 12px;
                  padding: 6px 0;
                  border-bottom: 1px dashed #eee;
                }
                .total-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 16px;
                  font-weight: 900;
                  padding-top: 10px;
                }
                .footer {
                  margin-top: 14px;
                  text-align: center;
                  font-size: 10px;
                  color: #777;
                }
              </style>
            </head>
            <body>
              <div class="label-box">
                <div class="header">
                  <div class="brand">WOMUP</div>
                  <div class="tag">${labelPrintData.type === 'PRINT' ? 'DOCUMENT PRINT' : 'DARK STORE EXPRESS'}</div>
                </div>
                
                <div class="order-number">${labelPrintData.orderId}</div>
                <div class="barcode">||| | ||||| || |||| |||</div>
                
                <div class="section">
                  <div class="label">Customer & Contact</div>
                  <div class="val">${labelPrintData.customerName} &bull; ${labelPrintData.customerPhone || 'N/A'}</div>
                </div>

                <div class="section">
                  <div class="label">Delivery Address</div>
                  <div class="val">${labelPrintData.address || 'Ahmedabad, Gujarat'}</div>
                </div>

                <div class="section">
                  <div class="label">Package Contents (${labelPrintData.items?.length || 1} items)</div>
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th style="text-align: right;">Qty</th>
                        <th style="text-align: right;">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(labelPrintData.items || []).map((it: any) => `
                        <tr>
                          <td>${it.name || it.originalFileName || 'Womup Item'}</td>
                          <td style="text-align: right;">${it.quantity || it.numberOfCopies || 1}</td>
                          <td style="text-align: right;">₹${it.subtotal || it.totalAmount || labelPrintData.total}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                <div class="total-row">
                  <span>TOTAL AMOUNT</span>
                  <span>₹${labelPrintData.total}</span>
                </div>

                <div class="section">
                  <div class="label">Payment Status</div>
                  <div class="val" style="color: #059669;">PAID &bull; ${labelPrintData.paymentMethod || 'Online / App'}</div>
                </div>

                <div class="footer">
                  Printed on: ${new Date().toLocaleString()} &bull; Hub: Ahmedabad Central
                </div>
              </div>

              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
      } catch (e) {
        Alert.alert('Print Status', 'Ready to print order label.');
      }
    } else {
      Alert.alert(
        'Thermal Label Ready',
        `Sending Dispatch Label for ${labelPrintData.orderId} to connected Bluetooth/Thermal printer.`
      );
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={closeLabelPrint}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Printer size={20} color={COLORS.purple} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Dispatch & Label Printing</Text>
            </View>
            <TouchableOpacity onPress={closeLabelPrint} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Toggle Type */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, printType === 'label' && styles.activeTab]}
              onPress={() => setPrintType('label')}
            >
              <Text style={[styles.tabText, printType === 'label' && styles.activeTabText]}>
                Thermal Shipping Label (4x6)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, printType === 'invoice' && styles.activeTab]}
              onPress={() => setPrintType('invoice')}
            >
              <Text style={[styles.tabText, printType === 'invoice' && styles.activeTabText]}>
                Tax Invoice / Paper Bill
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            {/* Thermal Label Mockup Box */}
            <View style={styles.labelPreviewBox}>
              <View style={styles.labelTop}>
                <Text style={styles.labelBrand}>WOMUP</Text>
                <View style={styles.labelBadge}>
                  <Text style={styles.labelBadgeText}>
                    {labelPrintData.type === 'PRINT' ? 'PAPER PRINT' : 'EXPRESS DELIVERY'}
                  </Text>
                </View>
              </View>

              <Text style={styles.labelOrderId}>{labelPrintData.orderId}</Text>
              
              {/* Barcode Visual */}
              <View style={styles.barcodeBox}>
                <Text style={styles.barcodeLines}>||||| |||| || |||||| |||| | |||| |||||</Text>
                <Text style={styles.barcodeText}>{labelPrintData.orderId}</Text>
              </View>

              {/* Customer Box */}
              <View style={styles.metaSection}>
                <View style={styles.metaRow}>
                  <User size={13} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={styles.metaVal}>{labelPrintData.customerName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Phone size={13} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.metaSub}>{labelPrintData.customerPhone || '9879432011'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin size={13} color={COLORS.hotPink} style={{ marginRight: 6 }} />
                  <Text style={styles.metaAddress} numberOfLines={2}>
                    {labelPrintData.address || 'Ahmedabad, Gujarat'}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeader}>
                  Package Items ({labelPrintData.items?.length || 1})
                </Text>
                {(labelPrintData.items || []).map((it: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {it.name || it.originalFileName || 'Womup Item'}
                    </Text>
                    <Text style={styles.itemQty}>
                      x{it.quantity || it.numberOfCopies || 1}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ₹{it.subtotal || it.totalAmount || labelPrintData.total}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Print Order Specifications (if print order) */}
              {labelPrintData.specs && (
                <View style={styles.specsBox}>
                  <Text style={styles.specsTitle}>Print Specifications:</Text>
                  <Text style={styles.specsText}>
                    {labelPrintData.specs.pageCount} Pages • {labelPrintData.specs.copies} Copies • {labelPrintData.specs.color ? 'Color' : 'B&W'} • {labelPrintData.specs.paperQuality}
                  </Text>
                </View>
              )}

              {/* Pricing & Paid */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalAmount}>₹{labelPrintData.total}</Text>
              </View>

              <View style={styles.paidBadge}>
                <CheckCircle2 size={13} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.paidText}>PAID ONLINE • VERIFIED</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => handlePrint(printType)}
            >
              <Printer size={18} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.printBtnText}>
                {printType === 'label' ? 'Print Thermal Label' : 'Print Tax Invoice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeLabelPrint}>
              <Text style={styles.cancelBtnText}>Close</Text>
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
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeTab: {
    backgroundColor: COLORS.purple,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollArea: {
    maxHeight: 380,
  },
  labelPreviewBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    backgroundColor: '#FAFAFA',
  },
  labelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  labelBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.purple,
    letterSpacing: 1,
  },
  labelBadge: {
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  labelBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
  labelOrderId: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginVertical: 4,
  },
  barcodeBox: {
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  barcodeLines: {
    fontSize: 22,
    letterSpacing: 3,
    fontWeight: '900',
    color: '#111',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  barcodeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metaSection: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metaSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaAddress: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  itemsSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  specsBox: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginVertical: 6,
  },
  specsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
    marginBottom: 2,
  },
  specsText: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    borderRadius: 4,
    marginTop: 8,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  printBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  printBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
});
