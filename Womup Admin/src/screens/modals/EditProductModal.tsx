import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Edit2,
  X,
  Upload,
  Trash2,
  Plus,
  Check,
  Package,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { PricingCategory, ProductVariantItem } from '../../types/admin';

interface FormVariant {
  id: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  isDefault: boolean;
  isActive: boolean;
}

export const EditProductModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProduct,
    setSelectedProduct,
    updateProductItem,
    deleteProductItem,
    categories,
  } = useAdminState();

  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('Womup Fresh');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [variants, setVariants] = useState<FormVariant[]>([]);

  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name || '');
      const matchedCat = categories.find((c) => c.id === selectedProduct.categoryId || c.name === selectedProduct.category);
      setSelectedCategoryId(matchedCat?.id || selectedProduct.categoryId || categories[0]?.id || '');
      setBrand(selectedProduct.brand || 'Womup Fresh');
      setDescription(selectedProduct.description || '');
      setImageUrl(selectedProduct.imageUrl || selectedProduct.image || '');
      setImagePreview(selectedProduct.imageUrl || selectedProduct.image || '');
      setErrorMsg(null);

      // Load variants
      const prodVariants = selectedProduct.variants || [];
      if (prodVariants.length > 0) {
        setVariants(
          prodVariants.map((v) => ({
            id: v.id,
            sku: v.sku || '',
            weightOrVolume: v.weightOrVolume || '1 unit',
            mrp: String(v.mrp || v.sellingPrice || 0),
            sellingPrice: String(v.sellingPrice || 0),
            isDefault: !!v.isDefault,
            isActive: v.isActive !== false,
          }))
        );
      } else {
        setVariants([
          {
            id: `v_${Date.now()}`,
            sku: '',
            weightOrVolume: '1 unit',
            mrp: String(selectedProduct.mrp || 50),
            sellingPrice: String(selectedProduct.sellingPrice || 40),
            isDefault: true,
            isActive: true,
          },
        ]);
      }
    }
  }, [selectedProduct]);

  if (activeModal !== 'EditProduct' || !selectedProduct) {
    return null;
  }

  const handleClose = () => {
    setSelectedProduct(null);
    setErrorMsg(null);
    setActiveModal('none');
  };

  const handlePickImage = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/jpg';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          setErrorMsg('Only JPG, JPEG, PNG, and WEBP formats are allowed.');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg('Maximum allowed image size is 5MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
          setUploadingImage(true);
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('http://localhost:5050/api/v1/media/upload?folder=wormup/products', {
            method: 'POST',
            body: formData,
          });
          const json = await res.json();
          if (json.success && json.data) {
            const uploadedUrl = json.data.url || json.data.secureUrl;
            setImageUrl(uploadedUrl);
            setErrorMsg(null);
          }
        } catch (err) {
          console.warn('Image upload error:', err);
        } finally {
          setUploadingImage(false);
        }
      };
      input.click();
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `new_v_${Date.now()}`,
        sku: '',
        weightOrVolume: '1 unit',
        mrp: '',
        sellingPrice: '',
        isDefault: false,
        isActive: true,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      setErrorMsg('Product must have at least one variant.');
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateVariant = (id: string, field: keyof FormVariant, val: any) => {
    setErrorMsg(null);
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: val };
        }
        if (field === 'isDefault' && val === true) {
          return { ...v, isDefault: false };
        }
        return v;
      })
    );
  };

  const handleSave = async () => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name cannot be empty.');
      return;
    }

    if (variants.length === 0) {
      setErrorMsg('Please configure at least one pack variant.');
      return;
    }

    // Validate each variant
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.weightOrVolume.trim()) {
        setErrorMsg(`Variant #${i + 1} requires a pack size (e.g. 250 g).`);
        return;
      }
      const sPrice = parseFloat(v.sellingPrice);
      const mPrice = parseFloat(v.mrp);
      if (isNaN(sPrice) || sPrice <= 0) {
        setErrorMsg(`Variant "${v.weightOrVolume}" requires a valid Default Selling Price.`);
        return;
      }
      if (isNaN(mPrice) || mPrice <= 0) {
        setErrorMsg(`Variant "${v.weightOrVolume}" requires a valid MRP.`);
        return;
      }
      if (sPrice > mPrice) {
        setErrorMsg(`Variant "${v.weightOrVolume}": Selling Price (₹${sPrice}) cannot exceed MRP (₹${mPrice}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const formattedVariants: ProductVariantItem[] = variants.map((v, idx) => ({
        id: v.id.startsWith('new_') ? '' : v.id,
        productId: selectedProduct.id,
        sku: v.sku.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.weightOrVolume.replace(/[^a-z0-9]+/gi, '').toLowerCase()}`,
        weightOrVolume: v.weightOrVolume.trim(),
        mrp: parseFloat(v.mrp),
        sellingPrice: parseFloat(v.sellingPrice),
        isDefault: v.isDefault,
        isActive: v.isActive,
      }));

      const defaultVar = formattedVariants.find((v) => v.isDefault) || formattedVariants[0];
      const chosenCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      const success = await updateProductItem(selectedProduct.id, {
        name: name.trim(),
        category: chosenCat?.name || selectedProduct.category || 'Vegetables',
        categoryId: chosenCat?.id || selectedProduct.categoryId,
        brand: brand.trim() || 'Womup Fresh',
        description: description.trim(),
        imageUrl: imageUrl || imagePreview,
        images: (imageUrl || imagePreview) ? [imageUrl || imagePreview] : [],
        sellingPrice: defaultVar.sellingPrice,
        mrp: defaultVar.mrp,
        basePrice: defaultVar.sellingPrice,
        isActive: selectedProduct.isActive !== false,
        variants: formattedVariants,
      });

      if (success) {
        handleClose();
      } else {
        setErrorMsg('Failed to update product. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${selectedProduct.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProductItem(selectedProduct.id);
            handleClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Edit2 size={20} color={COLORS.purple} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Edit Product & Variants</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Top Error Banner if any */}
          {errorMsg && (
            <View style={styles.topErrorBanner}>
              <AlertCircle size={16} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Image Upload / Preview */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Image (Cloudinary)</Text>
              <View style={styles.imageUploadRow}>
                {imagePreview || imageUrl ? (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: imageUrl || imagePreview }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.changeImageBtn}
                      onPress={handlePickImage}
                    >
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={COLORS.purple} />
                    ) : (
                      <>
                        <Upload size={22} color={COLORS.purple} style={{ marginBottom: 6 }} />
                        <Text style={styles.uploadText}>Select Image to Upload</Text>
                        <Text style={styles.uploadSubtext}>JPG, JPEG, PNG, WEBP (Max 5MB)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Item Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Item Name <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errorMsg && !name.trim() && styles.inputError,
                ]}
                placeholder="Product name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  setErrorMsg(null);
                }}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categoryRow}>
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          isSelected && styles.categoryBtnTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Brand & Description */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Brand</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Womup Fresh"
                  placeholderTextColor={COLORS.textMuted}
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Produce description..."
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Variants Section */}
            <View style={styles.variantsHeaderRow}>
              <View>
                <Text style={styles.variantsHeading}>SKU Pack Variants</Text>
                <Text style={styles.variantsSubheading}>
                  Catalog default prices and pack sizes.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addVariantBtn}
                onPress={handleAddVariant}
              >
                <Plus size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                <Text style={styles.addVariantText}>Add Variant</Text>
              </TouchableOpacity>
            </View>

            {variants.map((v, index) => (
              <View key={v.id} style={styles.variantCard}>
                <View style={styles.variantCardHeader}>
                  <View style={styles.variantBadge}>
                    <Package size={13} color={COLORS.purple} style={{ marginRight: 4 }} />
                    <Text style={styles.variantBadgeText}>Variant #{index + 1}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.defaultPill, v.isDefault && styles.defaultPillActive]}
                      onPress={() => handleUpdateVariant(v.id, 'isDefault', true)}
                    >
                      {v.isDefault && <Check size={11} color={COLORS.white} style={{ marginRight: 2 }} />}
                      <Text
                        style={[
                          styles.defaultPillText,
                          v.isDefault && styles.defaultPillTextActive,
                        ]}
                      >
                        {v.isDefault ? 'Default Variant' : 'Set Default'}
                      </Text>
                    </TouchableOpacity>

                    {variants.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeVariantBtn}
                        onPress={() => handleRemoveVariant(v.id)}
                      >
                        <Trash2 size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Variant fields */}
                <View style={styles.variantGrid}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.variantFieldLabel}>Pack Size *</Text>
                    <TextInput
                      style={styles.variantInput}
                      placeholder="e.g. 250 g, 1 kg"
                      placeholderTextColor={COLORS.textMuted}
                      value={v.weightOrVolume}
                      onChangeText={(val) => handleUpdateVariant(v.id, 'weightOrVolume', val)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.variantFieldLabel}>Default Price (₹) *</Text>
                    <TextInput
                      style={[styles.variantInput, { borderColor: COLORS.purple, borderWidth: 1.5 }]}
                      placeholder="e.g. 12"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={v.sellingPrice}
                      onChangeText={(val) => handleUpdateVariant(v.id, 'sellingPrice', val)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.variantFieldLabel}>MRP (₹) *</Text>
                    <TextInput
                      style={styles.variantInput}
                      placeholder="e.g. 15"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={v.mrp}
                      onChangeText={(val) => handleUpdateVariant(v.id, 'mrp', val)}
                    />
                  </View>

                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.variantFieldLabel}>SKU Code</Text>
                    <TextInput
                      style={styles.variantInput}
                      placeholder="Auto if empty"
                      placeholderTextColor={COLORS.textMuted}
                      value={v.sku}
                      onChangeText={(val) => handleUpdateVariant(v.id, 'sku', val)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Bottom Error Banner if any */}
          {errorMsg && (
            <View style={styles.bottomErrorBanner}>
              <AlertCircle size={15} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Trash2 size={15} color={COLORS.error} style={{ marginRight: 4 }} />
              <Text style={styles.deleteBtnText}>Delete Item</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Product & Variants</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
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
    padding: 6,
  },
  topErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  bottomErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: 10,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '700',
    flex: 1,
  },
  formScroll: {
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
    backgroundColor: '#FFF5F5',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  categoryBtnTextActive: {
    color: COLORS.white,
  },

  // Image Upload Styles
  imageUploadRow: {
    marginTop: 2,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.purple,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.purple,
  },
  uploadSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.sm,
    borderRadius: RADIUS.card,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
  },
  changeImageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.purple,
  },
  changeImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Variants Section
  variantsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  variantsHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  variantsSubheading: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  addVariantText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  variantCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: 8,
  },
  variantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.purple,
  },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultPillActive: {
    backgroundColor: COLORS.purple,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  defaultPillTextActive: {
    color: COLORS.white,
  },
  removeVariantBtn: {
    padding: 4,
  },
  variantGrid: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  variantFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  variantInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.textPrimary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.button,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.button,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  saveBtn: {
    backgroundColor: COLORS.purple,
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.button,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
});
