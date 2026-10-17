import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  PlusCircle,
  X,
  Upload,
  Trash2,
  Plus,
  Check,
  Tag,
  Warehouse,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
} from 'lucide-react-native';
import { useAdminState } from '../../context/AdminStateContext';
import { ProductVariantItem } from '../../types/admin';

interface FormVariant {
  id: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
}

export const AddProductModal: React.FC = () => {
  const { activeModal, setActiveModal, categories, addProductItem } = useAdminState();

  // Basic Info
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('Womup Fresh');
  const [shelfLocation, setShelfLocation] = useState('A1-R2');
  const [description, setDescription] = useState('');

  // Image Upload / URL
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multi-Variant Pack Size Matrix
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      id: 'v_1',
      sku: '',
      weightOrVolume: '250 g',
      mrp: '15',
      sellingPrice: '12',
      stock: '50',
      isDefault: true,
      isActive: true,
    },
    {
      id: 'v_2',
      sku: '',
      weightOrVolume: '500 g',
      mrp: '28',
      sellingPrice: '22',
      stock: '50',
      isDefault: false,
      isActive: true,
    },
    {
      id: 'v_3',
      sku: '',
      weightOrVolume: '1 kg',
      mrp: '50',
      sellingPrice: '40',
      stock: '50',
      isDefault: false,
      isActive: true,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (activeModal !== 'AddProduct') return null;

  const handleClose = () => {
    setActiveModal('none');
    setErrorMsg(null);
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
        id: `v_${Date.now()}`,
        sku: '',
        weightOrVolume: '1 unit',
        mrp: '',
        sellingPrice: '',
        stock: '50',
        isDefault: prev.length === 0,
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
      setErrorMsg('Product title / item name is required.');
      return;
    }

    if (variants.length === 0) {
      setErrorMsg('Please configure at least one pack variant.');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.weightOrVolume.trim()) {
        setErrorMsg(`Variant #${i + 1} requires a pack size (e.g. 500 g).`);
        return;
      }
      const sPrice = parseFloat(v.sellingPrice);
      const mPrice = parseFloat(v.mrp);
      if (isNaN(sPrice) || sPrice <= 0) {
        setErrorMsg(`Variant "${v.weightOrVolume}" requires a valid Selling Price.`);
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
      const chosenCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];
      const formattedVariants: ProductVariantItem[] = variants.map((v) => ({
        id: v.id.startsWith('v_') ? '' : v.id,
        productId: '',
        sku:
          v.sku.trim() ||
          `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.weightOrVolume
            .replace(/[^a-z0-9]+/gi, '')
            .toLowerCase()}`,
        weightOrVolume: v.weightOrVolume.trim(),
        mrp: parseFloat(v.mrp),
        sellingPrice: parseFloat(v.sellingPrice),
        stock: parseInt(v.stock, 10) || 50,
        isDefault: v.isDefault,
        isActive: v.isActive,
      }));

      const defaultVar = formattedVariants.find((v) => v.isDefault) || formattedVariants[0];

      const success = await addProductItem({
        name: name.trim(),
        category: chosenCat?.name || 'Vegetables',
        categoryId: chosenCat?.id || '',
        brand: brand.trim() || 'Womup Fresh',
        description: description.trim(),
        imageUrl: imageUrl || imagePreview || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
        images: [imageUrl || imagePreview || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80'],
        sellingPrice: defaultVar.sellingPrice,
        mrp: defaultVar.mrp,
        basePrice: defaultVar.sellingPrice,
        stockKg: defaultVar.stock || 50,
        isActive: true,
        variants: formattedVariants,
        shelfLocation: shelfLocation.trim() || 'A1-R2',
      } as any);

      if (success) {
        handleClose();
      } else {
        setErrorMsg('Failed to add product. Please check your network and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PlusCircle size={18} color="#4F46E5" />
              <Text style={styles.modalTitle}>Add New Product Item</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Top Error Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* SECTION 1: PRODUCT CORE DETAILS */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>
                <Tag size={13} color="#4F46E5" /> 1. PRODUCT CORE DETAILS
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Product Title / Item Name <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Fresh Tomato"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    setErrorMsg(null);
                  }}
                />
              </View>

              <View style={styles.threeColRow}>
                {/* Category Dropdown */}
                <View style={styles.colOneThird}>
                  <Text style={styles.formLabel}>
                    Category <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      value={selectedCategoryId}
                      onChange={(e: any) => setSelectedCategoryId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#071B52',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => {
                        const idx = categories.findIndex((c) => c.id === selectedCategoryId);
                        const nextCat = categories[(idx + 1) % categories.length];
                        if (nextCat) setSelectedCategoryId(nextCat.id);
                      }}
                    >
                      <Text style={styles.dropdownBtnText} numberOfLines={1}>
                        {categories.find((c) => c.id === selectedCategoryId)?.name || 'Category'}
                      </Text>
                      <ChevronDown size={14} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Brand Name */}
                <View style={styles.colOneThird}>
                  <Text style={styles.formLabel}>
                    Brand Name <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Womup Fresh"
                    placeholderTextColor="#94A3B8"
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>

                {/* Shelf Location / Bin */}
                <View style={styles.colOneThird}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <Warehouse size={12} color="#64748B" />
                    <Text style={styles.formLabel}>
                      Shelf Location / Bin (A1-R2) <Text style={{ color: '#DC2626' }}>*</Text>
                    </Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. A1-R2"
                    placeholderTextColor="#94A3B8"
                    value={shelfLocation}
                    onChangeText={setShelfLocation}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Produce description, storage conditions, provenance..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* SECTION 2: MEDIA & PRODUCT PHOTO */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>
                <ImageIcon size={13} color="#4F46E5" /> 2. MEDIA & PRODUCT PHOTO
              </Text>

              <View style={styles.mediaRow}>
                <View style={styles.photoPreviewBox}>
                  {imagePreview || imageUrl ? (
                    <>
                      <Image
                        source={{ uri: imagePreview || imageUrl }}
                        style={styles.photoImg}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.photoDeleteBtn}
                        onPress={() => {
                          setImageUrl('');
                          setImagePreview('');
                        }}
                      >
                        <X size={11} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.noPhotoBox}>
                      <ImageIcon size={26} color="#94A3B8" />
                      <Text style={styles.noPhotoText}>No Image</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.formLabel}>Image Web URL</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="https://..."
                      placeholderTextColor="#94A3B8"
                      value={imageUrl}
                      onChangeText={(val) => {
                        setImageUrl(val);
                        setImagePreview(val);
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      style={styles.replacePhotoBtn}
                      onPress={handlePickImage}
                      disabled={uploadingImage}
                    >
                      <Upload size={13} color="#071B52" />
                      <Text style={styles.replacePhotoBtnText}>
                        {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadInfoText}>JPG, PNG or WEBP up to 5MB</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION 3: PACK SIZES & PRICING MATRIX */}
            <View style={styles.sectionWrap}>
              <View style={styles.matrixHeaderRow}>
                <Text style={styles.sectionHeading}>
                  <Sparkles size={13} color="#10B981" /> 3. PACK SIZES & PRICING MATRIX ({variants.length} VARIANTS)
                </Text>

                <TouchableOpacity
                  style={styles.addPackSizeBtn}
                  onPress={handleAddVariant}
                  activeOpacity={0.8}
                >
                  <Plus size={13} color="#4F46E5" />
                  <Text style={styles.addPackSizeBtnText}>+ Add Pack Size</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.matrixTableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 700 }}>
                    {/* Header */}
                    <View style={styles.matrixTableHeader}>
                      <Text style={[styles.matrixHeaderCell, { width: 60, textAlign: 'center' }]}>Default</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 140 }]}>Pack Size / Weight *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 140 }]}>SKU</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 110 }]}>Selling Price (₹) *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 100 }]}>MRP (₹) *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 85, textAlign: 'center' }]}>Discount</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 90 }]}>Stock</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 65, textAlign: 'center' }]}>Action</Text>
                    </View>

                    {/* Rows */}
                    {variants.map((v) => {
                      const sp = parseFloat(v.sellingPrice) || 0;
                      const mrp = parseFloat(v.mrp) || 0;
                      const discount = mrp > 0 && sp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
                      const isPriceInvalid = sp > mrp;

                      return (
                        <View
                          key={v.id}
                          style={[
                            styles.matrixTableRow,
                            v.isDefault && { backgroundColor: '#FFFDF5' },
                          ]}
                        >
                          <View style={[styles.matrixCell, { width: 60, alignItems: 'center' }]}>
                            <TouchableOpacity
                              style={[
                                styles.radioCircle,
                                v.isDefault && styles.radioCircleActive,
                              ]}
                              onPress={() => handleUpdateVariant(v.id, 'isDefault', true)}
                            >
                              {v.isDefault && <View style={styles.radioDot} />}
                            </TouchableOpacity>
                          </View>

                          <View style={[styles.matrixCell, { width: 140 }]}>
                            <TextInput
                              style={styles.matrixInput}
                              value={v.weightOrVolume}
                              placeholder="e.g. 500 g"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'weightOrVolume', val)}
                            />
                          </View>

                          <View style={[styles.matrixCell, { width: 140 }]}>
                            <TextInput
                              style={[styles.matrixInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}
                              value={v.sku}
                              placeholder="SKU Code"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'sku', val)}
                            />
                          </View>

                          <View style={[styles.matrixCell, { width: 110 }]}>
                            <TextInput
                              style={[
                                styles.matrixInput,
                                { fontWeight: '800', color: '#071B52' },
                                isPriceInvalid && { borderColor: '#DC2626' },
                              ]}
                              keyboardType="numeric"
                              value={v.sellingPrice}
                              placeholder="₹0"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'sellingPrice', val)}
                            />
                          </View>

                          <View style={[styles.matrixCell, { width: 100 }]}>
                            <TextInput
                              style={[styles.matrixInput, { color: '#64748B' }]}
                              keyboardType="numeric"
                              value={v.mrp}
                              placeholder="₹0"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'mrp', val)}
                            />
                          </View>

                          <View style={[styles.matrixCell, { width: 85, alignItems: 'center' }]}>
                            <View
                              style={[
                                styles.discountBadge,
                                isPriceInvalid
                                  ? { backgroundColor: '#FEE2E2' }
                                  : discount > 0
                                  ? { backgroundColor: '#ECFDF5' }
                                  : { backgroundColor: '#F1F5F9' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.discountBadgeText,
                                  isPriceInvalid
                                    ? { color: '#DC2626' }
                                    : discount > 0
                                    ? { color: '#059669' }
                                    : { color: '#64748B' },
                                ]}
                              >
                                {isPriceInvalid ? 'INVALID' : `${discount}% OFF`}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.matrixCell, { width: 90 }]}>
                            <TextInput
                              style={styles.matrixInput}
                              keyboardType="numeric"
                              value={v.stock}
                              placeholder="50"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'stock', val)}
                            />
                          </View>

                          <View style={[styles.matrixCell, { width: 65, alignItems: 'center' }]}>
                            <TouchableOpacity
                              onPress={() => handleRemoveVariant(v.id)}
                              disabled={variants.length <= 1}
                              style={{ padding: 4 }}
                            >
                              <Trash2
                                size={15}
                                color={variants.length <= 1 ? '#CBD5E1' : '#DC2626'}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <View />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveProdBtn}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={15} color="#FFFFFF" />
                    <Text style={styles.saveProdBtnText}>Save Product Changes</Text>
                  </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  closeBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#071B52',
    backgroundColor: '#FFFFFF',
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  colOneThird: {
    flex: 1,
    minWidth: 200,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  dropdownBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
    flex: 1,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  photoPreviewBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 3,
  },
  replacePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  replacePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
  },
  uploadInfoText: {
    fontSize: 11,
    color: '#64748B',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addPackSizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addPackSizeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  matrixTableCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  matrixTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  matrixHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    paddingHorizontal: 6,
  },
  matrixTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  matrixCell: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  matrixInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    color: '#071B52',
    backgroundColor: '#FFFFFF',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#FF3B98',
    backgroundColor: '#FF3B98',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveProdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF3B98',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveProdBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
