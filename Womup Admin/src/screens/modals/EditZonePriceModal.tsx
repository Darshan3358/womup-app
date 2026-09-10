import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, X, Check, DollarSign, Package, AlertCircle } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const EditZonePriceModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedVariantPricing,
    setSelectedVariantPricing,
    selectedZone,
    zones,
    areaPricing,
    updateVariantAreaPrice,
  } = useAdminState();

  const [priceStr, setPriceStr] = useState('');
  const [stockStr, setStockStr] = useState('100');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVisible = activeModal === 'EditZonePrice' && !!selectedVariantPricing;

  useEffect(() => {
    if (selectedVariantPricing) {
      const { variant, zone } = selectedVariantPricing;
      // Resolve existing area price or fallback to variant default price
      const zoneObj = zones.find((z) => z.name === zone || z.id === zone);
      const zoneId = zoneObj?.id || zone;
      const currentAreaPrice =
        areaPricing[variant.id]?.[zoneId] ??
        areaPricing[variant.id]?.[zone] ??
        variant.sellingPrice;

      setPriceStr(String(currentAreaPrice));
      setStockStr(String(variant.stock ?? 100));
      setErrorMsg(null);
    }
  }, [selectedVariantPricing, areaPricing, zones]);

  if (!isVisible || !selectedVariantPricing) {
    return null;
  }

  const { product, variant, zone } = selectedVariantPricing;
  const defaultPrice = variant.sellingPrice;
  const mrp = variant.mrp || defaultPrice;
  const currentPriceNum = parseFloat(priceStr) || 0;

  const handleClose = () => {
    setActiveModal('none');
    setSelectedVariantPricing(null);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const parsedPrice = parseFloat(priceStr);
    const parsedStock = parseInt(stockStr, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Selling price must be a valid positive number.');
      return;
    }

    if (parsedPrice > mrp) {
      setErrorMsg(`Selling price (₹${parsedPrice}) cannot exceed MRP (₹${mrp}).`);
      return;
    }

    setSaving(true);
    try {
      const zoneObj = zones.find((z) => z.name === zone || z.id === zone);
      const zoneId = zoneObj?.id || zone;

      const success = await updateVariantAreaPrice(
        product.id,
        variant.id,
        zoneId,
        parsedPrice,
        mrp,
        isNaN(parsedStock) ? undefined : parsedStock
      );

      if (success) {
        handleClose();
      } else {
        setErrorMsg('Failed to update area price in MongoDB. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <DollarSign size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Edit Zone Price</Text>
                <Text style={styles.modalSubtitle}>Single Source of Truth: area_pricing</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={saving}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.modalBody}>
            {/* Target Information Card */}
            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Product:</Text>
                <Text style={styles.targetValueBold}>{product.name}</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Pack / Variant:</Text>
                <View style={styles.variantBadge}>
                  <Package size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.variantBadgeText}>{variant.weightOrVolume || variant.sku}</Text>
                </View>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Operational Zone:</Text>
                <View style={styles.zoneBadge}>
                  <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.zoneBadgeText}>{zone} Zone</Text>
                </View>
              </View>
            </View>

            {/* Reference Price Tags */}
            <View style={styles.refPricesRow}>
              <View style={styles.refPriceBox}>
                <Text style={styles.refPriceLabel}>Catalog Default</Text>
                <Text style={styles.refPriceVal}>₹{defaultPrice}</Text>
                <Text style={styles.refPriceSub}>Global Fallback</Text>
              </View>
              <View style={[styles.refPriceBox, { borderColor: '#E5E7EB' }]}>
                <Text style={styles.refPriceLabel}>MRP</Text>
                <Text style={[styles.refPriceVal, { color: COLORS.textMuted }]}>₹{mrp}</Text>
                <Text style={styles.refPriceSub}>Max Retail Price</Text>
              </View>
            </View>

            {/* Price Edit Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Zone Selling Price (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, currentPriceNum > mrp && styles.inputWrapperError]}>
                <Text style={styles.inputCurrencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={priceStr}
                  onChangeText={(val) => {
                    setPriceStr(val);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. 14"
                  placeholderTextColor={COLORS.textMuted}
                  editable={!saving}
                />
              </View>
              <Text style={styles.inputHelp}>
                This price will only apply to customers ordering in <Text style={{ fontWeight: '600' }}>{zone} Zone</Text>.
              </Text>
            </View>

            {/* Stock in Zone Dark Store */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stock Allocation (Units)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={stockStr}
                  onChangeText={setStockStr}
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                  editable={!saving}
                />
              </View>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={COLORS.error} style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Check size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save Zone Price</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  modalBody: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  targetCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  targetValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  variantBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  refPricesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.md,
  },
  refPriceBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.input,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refPriceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  refPriceVal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  refPriceSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  requiredStar: {
    color: COLORS.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 44,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  inputCurrencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  inputHelp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 4,
  },
  errorBannerText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});
