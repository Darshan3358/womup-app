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
  Platform,
} from 'react-native';
import {
  Edit2,
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
import { COLORS } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { ProductVariantItem } from '../../types/admin';
import { ApiService } from '../../services/api';

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

export const EditProductModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProduct,
    setSelectedProduct,
    updateProductItem,
    deleteProductItem,
    categories,
    updateVariantAreaPrice,
    areaPricingRecords,
    zones,
    darkStores,
    inventory,
    selectedDarkStore,
    refreshFromDb,
  } = useAdminState();

  // Basic Details
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('Womup Fresh');
  const [shelfLocation, setShelfLocation] = useState('A1-R2');
  const [description, setDescription] = useState('');

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Variants
  const [variants, setVariants] = useState<FormVariant[]>([]);

  // State
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name || '');
      const matchedCat = categories.find(
        (c) =>
          c.id === selectedProduct.categoryId ||
          c.name.toLowerCase() === (selectedProduct.category || '').toLowerCase()
      );
      setSelectedCategoryId(matchedCat?.id || selectedProduct.categoryId || categories[0]?.id || '');
      setBrand(selectedProduct.brand || 'Womup Fresh');
      setShelfLocation((selectedProduct as any).shelfLocation || 'A1-R2');
      setDescription(selectedProduct.description || '');

      const img = selectedProduct.imageUrl || selectedProduct.image || '';
      setImageUrl(img);
      setImagePreview(img);
      setErrorMsg(null);

      // Resolve store & inventory if available
      const targetStore = darkStores.find(
        (s) =>
          (selectedProduct as any).selectedStoreId === String(s.id || (s as any)._id) ||
          (selectedProduct as any).selectedStoreName === s.name ||
          s.name === selectedDarkStore ||
          String(s.id || (s as any)._id) === selectedDarkStore
      );
      const invRecord = inventory.find(
        (i) =>
          i.productId === selectedProduct.id &&
          targetStore &&
          (i.darkStoreId === String(targetStore.id || (targetStore as any)._id) || i.darkStoreName === targetStore.name)
      );

      // Resolve area pricing if available
      const targetAreaId = (selectedProduct as any).selectedAreaId;

      // Load variants
      const prodVariants = selectedProduct.variants || [];
      if (prodVariants.length > 0) {
        setVariants(
          prodVariants.map((v, idx) => {
            const vId = String(v.id || (v as any)._id || '');
            const areaRecord =
              targetAreaId && targetAreaId !== 'ALL'
                ? areaPricingRecords.find(
                    (ap) =>
                      (ap.variantId === vId || ap.variantId === v.sku) &&
                      (ap.areaId === targetAreaId || (ap as any).areaName === (selectedProduct as any).selectedAreaName)
                  )
                : null;

            const effectivePrice =
              v.sellingPrice !== undefined && v.sellingPrice > 0
                ? v.sellingPrice
                : areaRecord?.price !== undefined && areaRecord.price > 0
                ? areaRecord.price
                : 0;

            const effectiveMrp =
              v.mrp !== undefined && v.mrp > 0
                ? v.mrp
                : areaRecord?.mrp !== undefined && areaRecord.mrp > 0
                ? areaRecord.mrp
                : effectivePrice;

            const effectiveStock =
              v.stock !== undefined
                ? v.stock
                : invRecord?.availableKg !== undefined
                ? invRecord.availableKg
                : 50;

            return {
              id: v.id || `v_${idx}`,
              sku: v.sku || '',
              weightOrVolume: v.weightOrVolume || '1 unit',
              mrp: String(effectiveMrp),
              sellingPrice: String(effectivePrice),
              stock: String(effectiveStock),
              isDefault: v.isDefault !== undefined ? !!v.isDefault : idx === 0,
              isActive: v.isActive !== false,
            };
          })
        );
      } else {
        const storeStock = invRecord?.availableKg !== undefined ? invRecord.availableKg : (selectedProduct.stockKg || 50);
        setVariants([
          {
            id: `v_${Date.now()}`,
            sku: '',
            weightOrVolume: '1 unit',
            mrp: String(selectedProduct.mrp || 50),
            sellingPrice: String(selectedProduct.sellingPrice || 40),
            stock: String(storeStock),
            isDefault: true,
            isActive: true,
          },
        ]);
      }
    }
  }, [selectedProduct, categories, inventory, areaPricingRecords, darkStores, selectedDarkStore]);

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
      const formattedVariants: ProductVariantItem[] = variants.map((v) => ({
        id: v.id.startsWith('new_') ? '' : v.id,
        productId: selectedProduct.id,
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
      const chosenCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      const success = await updateProductItem(selectedProduct.id, {
        name: name.trim(),
        category: chosenCat?.name || selectedProduct.category || 'Vegetables',
        categoryId: chosenCat?.id || selectedProduct.categoryId,
        brand: brand.trim() || 'Womup Fresh',
        description: description.trim(),
        imageUrl: imageUrl || imagePreview,
        images: imageUrl || imagePreview ? [imageUrl || imagePreview] : [],
        sellingPrice: defaultVar.sellingPrice,
        mrp: defaultVar.mrp,
        basePrice: defaultVar.sellingPrice,
        stockKg: defaultVar.stock || 50,
        isActive: selectedProduct.isActive !== false,
        variants: formattedVariants,
        shelfLocation: shelfLocation.trim(),
      } as any);

      if (success) {
        // 1. Sync store-specific inventory if store context exists
        const targetStore = darkStores.find(
          (s) =>
            (selectedProduct as any).selectedStoreId === String(s.id || (s as any)._id) ||
            (selectedProduct as any).selectedStoreName === s.name ||
            s.name === selectedDarkStore ||
            String(s.id || (s as any)._id) === selectedDarkStore
        );
        if (targetStore) {
          const storeId = String(targetStore.id || (targetStore as any)._id);
          const invRecord = inventory.find(
            (i) => i.productId === selectedProduct.id && (i.darkStoreId === storeId || i.darkStoreName === targetStore.name)
          );
          const newStock = defaultVar.stock !== undefined ? defaultVar.stock : 50;
          const oldStock = invRecord ? invRecord.availableKg : (selectedProduct.stockKg || 50);
          const delta = newStock - oldStock;
          if (delta !== 0) {
            await ApiService.adjustStock(
              storeId,
              selectedProduct.id,
              delta,
              'Product edit modal stock sync',
              invRecord?.id
            );
          }
          if (shelfLocation.trim()) {
            await ApiService.updateShelfLocation({
              inventoryId: invRecord?.id,
              productId: selectedProduct.id,
              storeId,
              shelfLocation: shelfLocation.trim(),
            });
          }
        }

        // 2. Sync Area Pricing if area context exists
        const targetAreaId = (selectedProduct as any).selectedAreaId;
        if (targetAreaId && targetAreaId !== 'ALL' && updateVariantAreaPrice) {
          for (const v of formattedVariants) {
            if (v.id) {
              await updateVariantAreaPrice(
                selectedProduct.id,
                v.id,
                targetAreaId,
                v.sellingPrice,
                v.mrp,
                v.stock
              );
            }
          }
        }

        if (refreshFromDb) {
          await refreshFromDb();
        }
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
            setDeleting(true);
            await deleteProductItem(selectedProduct.id);
            setDeleting(false);
            handleClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit2 size={18} color="#4F46E5" />
                <Text style={styles.modalTitle}>Edit Product & Variants</Text>
              </View>
              {Boolean((selectedProduct as any)?.selectedStoreName || (selectedProduct as any)?.selectedAreaName) && (
                <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '700', marginTop: 3 }}>
                  🏬 {(selectedProduct as any).selectedStoreName || selectedDarkStore || 'Selected Store'}{Boolean((selectedProduct as any)?.selectedAreaName) && ` • 📍 ${(selectedProduct as any).selectedAreaName}`}
                </Text>
              )}
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
            {/* ========================================================================= */}
            {/* SECTION 1: PRODUCT CORE DETAILS                                          */}
            {/* ========================================================================= */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>
                <Tag size={13} color="#4F46E5" /> 1. PRODUCT CORE DETAILS
              </Text>

              {/* Product Title / Item Name */}
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

              {/* 3 Columns: Category, Brand, Shelf Location */}
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
                        // Cycle through categories on mobile tap
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

              {/* Product Description */}
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

            {/* ========================================================================= */}
            {/* SECTION 2: MEDIA & PRODUCT PHOTO                                         */}
            {/* ========================================================================= */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>
                <ImageIcon size={13} color="#4F46E5" /> 2. MEDIA & PRODUCT PHOTO
              </Text>

              <View style={styles.mediaRow}>
                {/* Photo Preview Box */}
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

                {/* URL input and Upload button */}
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
                        {uploadingImage ? 'Uploading...' : 'Replace Photo'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadInfoText}>JPG, PNG or WEBP up to 5MB</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ========================================================================= */}
            {/* SECTION 3: PACK SIZES & PRICING MATRIX                                    */}
            {/* ========================================================================= */}
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

              {/* Matrix Table */}
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
                          {/* Radio Button for Default */}
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

                          {/* Pack Size / Weight */}
                          <View style={[styles.matrixCell, { width: 140 }]}>
                            <TextInput
                              style={styles.matrixInput}
                              value={v.weightOrVolume}
                              placeholder="e.g. 500 g"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'weightOrVolume', val)}
                            />
                          </View>

                          {/* SKU */}
                          <View style={[styles.matrixCell, { width: 140 }]}>
                            <TextInput
                              style={[styles.matrixInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}
                              value={v.sku}
                              placeholder="SKU Code"
                              placeholderTextColor="#94A3B8"
                              onChangeText={(val) => handleUpdateVariant(v.id, 'sku', val)}
                            />
                          </View>

                          {/* Selling Price */}
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

                          {/* MRP */}
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

                          {/* Discount Badge */}
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

                          {/* Stock */}
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

                          {/* Action Delete */}
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
            <TouchableOpacity
              style={styles.deleteProdBtn}
              onPress={handleDelete}
              disabled={deleting || saving}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color="#DC2626" />
              <Text style={styles.deleteProdBtnText}>
                {deleting ? 'Deleting...' : 'Delete Product'}
              </Text>
            </TouchableOpacity>

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
    flexWrap: 'wrap',
    gap: 10,
  },
  deleteProdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
  },
  deleteProdBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
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
