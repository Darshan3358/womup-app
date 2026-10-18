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
  ScrollView,
} from 'react-native';
import { MapPin, X, Check, DollarSign, Package, AlertCircle, Edit2 } from 'lucide-react-native';
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
    updateProductItem,
  } = useAdminState();

  const [priceStr, setPriceStr] = useState('');
  const [defaultPriceStr, setDefaultPriceStr] = useState('');
  const [mrpStr, setMrpStr] = useState('');
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
      setDefaultPriceStr(String(variant.sellingPrice || ''));
      setMrpStr(String(variant.mrp || variant.sellingPrice || ''));
      setStockStr(String(variant.stock ?? 100));
      setErrorMsg(null);
    }
  }, [selectedVariantPricing, areaPricing, zones]);

  if (!isVisible || !selectedVariantPricing) {
    return null;
  }

  const { product, variant, zone } = selectedVariantPricing;
  const defaultPrice = parseFloat(defaultPriceStr) || variant.sellingPrice;
  const mrp = parseFloat(mrpStr) || variant.mrp || defaultPrice;
  const currentPriceNum = parseFloat(priceStr) || 0;

  const handleClose = () => {
    setActiveModal('none');
    setSelectedVariantPricing(null);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const parsedPrice = parseFloat(priceStr);
    const parsedDefault = parseFloat(defaultPriceStr);
    const parsedMrp = parseFloat(mrpStr);
    const parsedStock = parseInt(stockStr, 10);

    const effectiveMrp = !isNaN(parsedMrp) && parsedMrp > 0 ? parsedMrp : mrp;

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Zone selling price must be a valid positive number.');
      return;
    }

    if (parsedPrice > effectiveMrp) {
      setErrorMsg(`Zone price (₹${parsedPrice}) cannot exceed MRP (₹${effectiveMrp}).`);
      return;
    }

    if (!isNaN(parsedDefault) && parsedDefault > effectiveMrp) {
      setErrorMsg(`Catalog default price (₹${parsedDefault}) cannot exceed MRP (₹${effectiveMrp}).`);
      return;
    }

    setSaving(true);
    try {
      const zoneObj = zones.find((z) => z.name === zone || z.id === zone);
      const zoneId = zoneObj?.id || zone;

      // 1. Save area override price & mrp
      const success = await updateVariantAreaPrice(
        product.id,
        variant.id,
        zoneId,
        parsedPrice,
        effectiveMrp,
        isNaN(parsedStock) ? undefined : parsedStock
      );

      // 2. If default price or MRP was modified, update product variants master catalog
      if (updateProductItem && (!isNaN(parsedDefault) || !isNaN(parsedMrp))) {
        const updatedVariants = (product.variants || []).map((v) => {
          if (v.id === variant.id) {
            return {
              ...v,
              sellingPrice: !isNaN(parsedDefault) ? parsedDefault : v.sellingPrice,
              mrp: effectiveMrp,
            };
          }
          return v;
        });
        await updateProductItem(product.id, { variants: updatedVariants });
      }

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
                <DollarSign size={20} color="#F562AF" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>Edit Zone Price & MRP</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>Area: {zone} · Live Sync</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={saving} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Body Content */}
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Target Information Summary Card */}
            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Product</Text>
                <Text style={styles.targetValueBold} numberOfLines={1}>{product.name}</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Pack / Variant</Text>
                <View style={styles.variantBadge}>
                  <Package size={12} color="#F562AF" style={{ marginRight: 4 }} />
                  <Text style={styles.variantBadgeText}>{variant.weightOrVolume || variant.sku}</Text>
                </View>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Operational Zone</Text>
                <View style={styles.zoneBadge}>
                  <MapPin size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.zoneBadgeText}>{zone} Zone</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalDivider} />

            {/* 2. Zone Selling Price (Primary Focus) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>
                  Zone Selling Price (₹) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.zoneActiveBadge}>
                  <Text style={styles.zoneActiveBadgeText}>Active Zone</Text>
                </View>
              </View>
              <View style={[styles.inputWrapper, styles.inputWrapperPrimary, currentPriceNum > mrp && styles.inputWrapperError]}>
                <Text style={styles.inputCurrencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={priceStr}
                  onChangeText={(val) => {
                    setPriceStr(val);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. 23"
                  placeholderTextColor="#94A3B8"
                  editable={!saving}
                />
              </View>
              <Text style={styles.inputHelp}>
                This price will only apply to customers ordering in <Text style={{ fontWeight: '700', color: '#1E293B' }}>{zone} Zone</Text>.
              </Text>
            </View>

            {/* 3. Catalog Default Price (Stacked) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>
                  Catalog Default Price (₹)
                </Text>
                <View style={styles.editPencilBadge}>
                  <Edit2 size={10} color="#4F46E5" style={{ marginRight: 3 }} />
                  <Text style={styles.editPencilText}>Editable Base</Text>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputCurrencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={defaultPriceStr}
                  onChangeText={setDefaultPriceStr}
                  placeholder="e.g. 10"
                  placeholderTextColor="#94A3B8"
                  editable={!saving}
                />
              </View>
              <Text style={styles.inputHelp}>
                Global catalog fallback price when no zone override exists.
              </Text>
            </View>

            {/* 4. MRP (Stacked) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>
                  Maximum Retail Price - MRP (₹) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.editPencilBadge}>
                  <Edit2 size={10} color="#4F46E5" style={{ marginRight: 3 }} />
                  <Text style={styles.editPencilText}>Max Price</Text>
                </View>
              </View>
              <View style={[styles.inputWrapper, currentPriceNum > mrp && styles.inputWrapperError]}>
                <Text style={styles.inputCurrencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={mrpStr}
                  onChangeText={setMrpStr}
                  placeholder="e.g. 28"
                  placeholderTextColor="#94A3B8"
                  editable={!saving}
                />
              </View>
              <Text style={styles.inputHelp}>
                Zone selling price cannot legally exceed this printed MRP.
              </Text>
            </View>

            {/* 5. Stock Allocation */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Stock Allocation (Units) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.priceTextInput}
                  keyboardType="numeric"
                  value={stockStr}
                  onChangeText={setStockStr}
                  placeholder="100"
                  placeholderTextColor="#94A3B8"
                  editable={!saving}
                />
                <Text style={styles.inputSuffix}>Units</Text>
              </View>
              <Text style={styles.inputHelp}>
                Available inventory allocated to the {zone} Zone dark store.
              </Text>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color="#E8596C" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={saving} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} strokeWidth={2.5} />
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
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flexShrink: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  targetCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  targetValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE1F5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F562AF33',
  },
  variantBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F562AF',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  zoneBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  requiredStar: {
    color: '#EF4444',
  },
  zoneActiveBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoneActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  editPencilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editPencilText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperPrimary: {
    borderColor: '#4F46E5',
    backgroundColor: '#FBFBFE',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputCurrencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 8,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 6,
  },
  inputHelp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 1.5,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F562AF',
    borderRadius: 10,
    shadowColor: '#F562AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
