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
  Link2,
  Store,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { COLORS } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { ProductVariantItem } from '../../types/admin';
import { ApiService, API_BASE_URL } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { resolveProductImageSource } from '../../utils/imageUrl';

interface FormVariant {
  id: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
  isHiddenInStore?: boolean;
}

export const EditProductModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    selectedProduct,
    setSelectedProduct,
    updateProductItem,
    deleteProductItem,
    removeProductFromStore,
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

  // Store Assignment ("All Stores" vs "Particular Store(s)")
  const [storeScope, setStoreScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [assignedStoreIds, setAssignedStoreIds] = useState<string[]>([]);
  const toggleAssignedStoreId = (storeId: string) => {
    setAssignedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
    setErrorMsg(null);
  };

  const activeDarkStores = (darkStores || []).filter((s: any) => s && s.isActive !== false);

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageSource, setImageSource] = useState<'url' | 'upload' | null>(null);
  const [imageMode, setImageMode] = useState<'link' | 'upload'>('link');
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

      const prodScope = (selectedProduct as any).storeScope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL';
      const prodAssignedIds: string[] = Array.isArray((selectedProduct as any).assignedStoreIds)
        ? (selectedProduct as any).assignedStoreIds.map((id: any) => String(id)).filter(Boolean)
        : [];
      setStoreScope(prodScope);
      setAssignedStoreIds(prodAssignedIds);

      const img = selectedProduct.imageUrl || selectedProduct.image || '';
      setImageUrl(img);
      setImagePreview(img);
      const isCloudinary = img && (img.includes('res.cloudinary.com') || img.includes('/upload/'));
      setImageSource(img ? (isCloudinary ? 'upload' : 'url') : null);
      setImageMode(isCloudinary ? 'upload' : 'link');
      setErrorMsg(null);

      // Resolve store & inventory if available (respect empty store assignment on No-Store areas)
      const hasExplicitStoreKey =
        'selectedStoreId' in selectedProduct || 'selectedStoreName' in selectedProduct;
      const explicitStoreId = (selectedProduct as any).selectedStoreId
        ? String((selectedProduct as any).selectedStoreId)
        : '';
      const explicitStoreName =
        (selectedProduct as any).selectedStoreName ||
        (!hasExplicitStoreKey ? selectedDarkStore : '') ||
        '';
      const targetStore = explicitStoreId
        ? darkStores.find((s) => String(s.id || (s as any)._id) === explicitStoreId)
        : explicitStoreName && !explicitStoreName.includes('No Dark Store')
        ? darkStores.find((s) => s.name === explicitStoreName || String(s.id || (s as any)._id) === explicitStoreName)
        : undefined;
      const targetStoreIdStr = targetStore ? String(targetStore.id || (targetStore as any)._id) : '';
      const storeInvList = targetStoreIdStr
        ? inventory.filter(
            (i) =>
              i.productId === selectedProduct.id &&
              (String(i.darkStoreId) === targetStoreIdStr || i.darkStoreName === targetStore?.name)
          )
        : [];
      const prodInvRecord = storeInvList.find((i) => !i.variantId) || storeInvList[0];

      // Resolve area pricing if available
      const targetAreaId = (selectedProduct as any).selectedAreaId;

      // Load variants
      const prodVariants = selectedProduct.variants || [];
      if (prodVariants.length > 0) {
        setVariants(
          prodVariants.map((v, idx) => {
            const vId = String(v.id || (v as any)._id || '');
            const varInvRecord = storeInvList.find((i) => i.variantId && String(i.variantId) === vId) || prodInvRecord;
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
              varInvRecord && varInvRecord.availableKg !== undefined
                ? Math.max(0, varInvRecord.availableKg)
                : v.stock !== undefined
                ? Math.max(0, v.stock)
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
              isHiddenInStore: Boolean(varInvRecord?.isHiddenInStore),
            };
          })
        );
      } else {
        const storeStock = prodInvRecord?.availableKg !== undefined ? Math.max(0, prodInvRecord.availableKg) : Math.max(0, selectedProduct.stockKg ?? 50);
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
            isHiddenInStore: Boolean(prodInvRecord?.isHiddenInStore),
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

  const handlePickImage = async () => {
    // 1. Native Mobile (iOS/Android) via expo-image-picker
    if (Platform.OS !== 'web') {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          setErrorMsg('Permission to access photo library is required.');
          return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

        if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
        const asset = pickerResult.assets[0];

        setImagePreview(asset.uri);
        setUploadingImage(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'upload.jpg',
        } as any);

        const res = await fetch(`${API_BASE_URL}/api/v1/media/upload?folder=wormup/products`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (json.success && json.data) {
          const uploadedUrl = json.data.url || json.data.secureUrl;
          if (!uploadedUrl) throw new Error('No URL returned from upload server');
          setImageUrl(uploadedUrl);
          setImagePreview(uploadedUrl); // preview = verified CDN URL
          setImageSource('upload');
          setErrorMsg(null);
        } else {
          throw new Error(json.message || 'Upload failed');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Upload failed. Please try again.');
        setImagePreview(imageUrl || ''); // rollback
        setImageSource(imageUrl ? 'upload' : null);
      } finally {
        setUploadingImage(false);
      }
      return;
    }

    // 2. Web Browser via input[type=file]
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
          setErrorMsg(null);

          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch(`${API_BASE_URL}/api/v1/media/upload?folder=wormup/products`, {
            method: 'POST',
            body: formData,
          });
          const json = await res.json();

          if (json.success && json.data) {
            const uploadedUrl = json.data.url || json.data.secureUrl;
            if (!uploadedUrl) throw new Error('No URL returned from upload server');
            setImageUrl(uploadedUrl);
            setImagePreview(uploadedUrl); // preview = verified CDN URL
            setImageSource('upload');
            setErrorMsg(null);
          } else {
            throw new Error(json.message || 'Upload failed');
          }
        } catch (err: any) {
          setErrorMsg(err?.message || 'Upload failed. Please try again.');
          setImagePreview(imageUrl || ''); // rollback
          setImageSource(imageUrl ? 'upload' : null);
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

  const hasExplicitStoreKey =
    'selectedStoreId' in selectedProduct || 'selectedStoreName' in selectedProduct;
  const explicitContextStoreId = (selectedProduct as any).selectedStoreId
    ? String((selectedProduct as any).selectedStoreId)
    : '';
  const explicitContextStoreName =
    (selectedProduct as any).selectedStoreName ||
    (!hasExplicitStoreKey ? selectedDarkStore : '') ||
    '';
  const contextDarkStore = explicitContextStoreId
    ? darkStores.find((s) => String(s.id || (s as any)._id) === explicitContextStoreId)
    : (explicitContextStoreName && !explicitContextStoreName.includes('No Dark Store')
        ? darkStores.find((s) => s.name === explicitContextStoreName || String(s.id || (s as any)._id) === explicitContextStoreName)
        : undefined);
  const contextStoreIdStr = contextDarkStore ? String(contextDarkStore.id || (contextDarkStore as any)._id) : '';
  const contextStoreNameStr = contextDarkStore?.name || explicitContextStoreName || '';
  const displayedDarkStores = contextStoreIdStr
    ? [...activeDarkStores].sort((a: any, b: any) => {
        const aId = String(a.id || a._id || '');
        const bId = String(b.id || b._id || '');
        if (aId === contextStoreIdStr) return -1;
        if (bId === contextStoreIdStr) return 1;
        return 0;
      })
    : activeDarkStores;

  const handleSave = async () => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Product name cannot be empty.');
      return;
    }

    if (storeScope === 'SPECIFIC' && assignedStoreIds.length === 0) {
      setErrorMsg('Please select at least one Dark Store for Particular Store(s) assignment.');
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
      const formattedVariants: ProductVariantItem[] = variants.map((v) => {
        const parsedStock = parseInt(v.stock, 10);
        return {
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
          stock: Number.isNaN(parsedStock) ? 50 : Math.max(0, parsedStock),
          isDefault: v.isDefault,
          isActive: v.isActive,
          isHiddenInStore: Boolean(v.isHiddenInStore),
        };
      });

      const defaultVar = formattedVariants.find((v) => v.isDefault) || formattedVariants[0];
      const chosenCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      const finalImage = (imageUrl || '').trim(); // NEVER save base64 imagePreview to database

      const targetStore =
        contextDarkStore ||
        (storeScope === 'SPECIFIC' && assignedStoreIds[0]
          ? darkStores.find((s) => String(s.id || (s as any)._id) === String(assignedStoreIds[0]))
          : undefined);

      const success = await updateProductItem(selectedProduct.id, {
        name: name.trim(),
        category: chosenCat?.name || selectedProduct.category || 'Vegetables',
        categoryId: chosenCat?.id || selectedProduct.categoryId,
        brand: brand.trim() || 'Womup Fresh',
        description: description.trim(),
        imageUrl: finalImage,
        image: finalImage,
        images: finalImage ? [finalImage] : [],
        thumbnailUrl: finalImage,
        sellingPrice: defaultVar.sellingPrice,
        mrp: defaultVar.mrp,
        basePrice: defaultVar.sellingPrice,
        stockKg: defaultVar.stock !== undefined ? defaultVar.stock : 50,
        isActive: selectedProduct.isActive !== false,
        variants: formattedVariants,
        shelfLocation: shelfLocation.trim(),
        storeScope,
        assignedStoreIds: storeScope === 'SPECIFIC' ? assignedStoreIds : [],
        preserveGlobalStock: Boolean(targetStore),
      } as any);

      if (success) {
        // 1. Sync EVERY variant's store-specific inventory & visibility when store context exists
        if (targetStore) {
          const storeId = String(targetStore.id || (targetStore as any)._id);
          const storeInvList = inventory.filter(
            (i) =>
              i.productId === selectedProduct.id &&
              (String(i.darkStoreId) === storeId || i.darkStoreName === targetStore.name)
          );
          const prodInvFallback = storeInvList.find((i) => !i.variantId) || storeInvList[0];

          for (let idx = 0; idx < formattedVariants.length; idx++) {
            const v = formattedVariants[idx];
            if (!v.id) continue;
            const varInvRecord =
              storeInvList.find((i) => i.variantId && String(i.variantId) === String(v.id)) ||
              prodInvFallback;
            const newStock = v.stock !== undefined ? Math.max(0, v.stock) : 50;
            const oldStock =
              varInvRecord && varInvRecord.availableKg !== undefined
                ? Math.max(0, varInvRecord.availableKg)
                : Math.max(0, selectedProduct.stockKg ?? 50);
            const delta = newStock - oldStock;
            const wantHidden = Boolean(v.isHiddenInStore);
            const wasHidden = Boolean(varInvRecord?.isHiddenInStore);

            if (delta !== 0 || wantHidden !== wasHidden || !varInvRecord) {
              await ApiService.adjustStock(
                storeId,
                selectedProduct.id,
                delta,
                'Product edit modal variant sync',
                varInvRecord && varInvRecord.variantId ? varInvRecord.id : undefined,
                v.id,
                wantHidden
              );
            }
          }

          if (shelfLocation.trim()) {
            await ApiService.updateShelfLocation({
              inventoryId: prodInvFallback?.id,
              productId: selectedProduct.id,
              storeId,
              shelfLocation: shelfLocation.trim(),
            });
          }
        }

        // 2. Sync Area Pricing price only if area context exists
        const targetAreaId = (selectedProduct as any).selectedAreaId;
        if (targetAreaId && targetAreaId !== 'ALL' && updateVariantAreaPrice) {
          for (const v of formattedVariants) {
            if (v.id) {
              await updateVariantAreaPrice(
                selectedProduct.id,
                v.id,
                targetAreaId,
                v.sellingPrice,
                v.mrp
              );
            }
          }
        }

        handleClose();
        if (refreshFromDb) {
          refreshFromDb().catch(() => {});
        }
      } else {
        setErrorMsg('Failed to update product. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromStore = () => {
    if (!contextStoreIdStr) return;
    const prodId = selectedProduct.id || (selectedProduct as any)._id;
    const label = contextStoreNameStr || 'this store';
    const msg = `Remove "${selectedProduct.name}" from ${label} only?\n\nOther dark stores and the Master Catalog will NOT be affected.`;

    const runRemove = async () => {
      setDeleting(true);
      handleClose();
      try {
        await removeProductFromStore(prodId, contextStoreIdStr);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        runRemove();
      }
      return;
    }

    Alert.alert('Remove From Store', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove from Store', style: 'destructive', onPress: runRemove },
    ]);
  };

  const handleDelete = () => {
    const prodId = selectedProduct.id || (selectedProduct as any)._id;
    const globalWarning = contextStoreIdStr
      ? `PERMANENTLY DELETE "${selectedProduct.name}" from ALL stores and the Master Catalog? This affects every dark store and cannot be undone.`
      : `Are you sure you want to delete "${selectedProduct.name}"? This cannot be undone.`;
    if (Platform.OS === 'web') {
      if (window.confirm(globalWarning)) {
        setDeleting(true);
        handleClose();
        deleteProductItem(prodId).finally(() => {
          setDeleting(false);
          if (refreshFromDb) refreshFromDb().catch(() => {});
        });
      }
      return;
    }

    Alert.alert(
      'Confirm Global Deletion',
      globalWarning,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Globally',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            handleClose();
            await deleteProductItem(prodId);
            setDeleting(false);
            if (refreshFromDb) refreshFromDb().catch(() => {});
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
            {/* SECTION 1B: STORE AVAILABILITY (ALL STORES VS PARTICULAR STORE(S))        */}
            {/* ========================================================================= */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>
                <Store size={13} color="#4F46E5" /> STORE AVAILABILITY & INVENTORY TARGET
              </Text>

              <View style={styles.storeScopeRow}>
                <TouchableOpacity
                  style={[
                    styles.storeScopeCard,
                    storeScope === 'ALL' && styles.storeScopeCardActive,
                  ]}
                  onPress={() => {
                    setStoreScope('ALL');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.storeScopeTop}>
                    <View style={[styles.radioCircle, storeScope === 'ALL' && styles.radioCircleActive]}>
                      {storeScope === 'ALL' && <View style={styles.radioDot} />}
                    </View>
                    <Layers size={14} color={storeScope === 'ALL' ? '#FF3B98' : '#64748B'} />
                    <Text style={[styles.storeScopeTitle, storeScope === 'ALL' && { color: '#071B52' }]}>
                      All Stores (Global Catalog)
                    </Text>
                  </View>
                  <Text style={styles.storeScopeDesc}>
                    Available in all active dark stores ({activeDarkStores.length} stores)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.storeScopeCard,
                    storeScope === 'SPECIFIC' && styles.storeScopeCardActive,
                  ]}
                  onPress={() => {
                    setStoreScope('SPECIFIC');
                    if (assignedStoreIds.length === 0 && contextStoreIdStr) {
                      setAssignedStoreIds([contextStoreIdStr]);
                    }
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.storeScopeTop}>
                    <View style={[styles.radioCircle, storeScope === 'SPECIFIC' && styles.radioCircleActive]}>
                      {storeScope === 'SPECIFIC' && <View style={styles.radioDot} />}
                    </View>
                    <Store size={14} color={storeScope === 'SPECIFIC' ? '#FF3B98' : '#64748B'} />
                    <Text style={[styles.storeScopeTitle, storeScope === 'SPECIFIC' && { color: '#071B52' }]}>
                      Particular Store(s)
                    </Text>
                  </View>
                  <Text style={styles.storeScopeDesc}>
                    Visible & stocked ONLY in the checked dark store(s)
                  </Text>
                </TouchableOpacity>
              </View>

              {storeScope === 'SPECIFIC' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.formLabel}>
                    Select Dark Store(s) — {assignedStoreIds.length} selected <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <View style={styles.storeDropdownList}>
                    {displayedDarkStores.length === 0 ? (
                      <Text style={{ padding: 10, fontSize: 12, color: '#94A3B8' }}>
                        No active dark stores found.
                      </Text>
                    ) : (
                      displayedDarkStores.map((s: any) => {
                        const sId = String(s.id || s._id || '');
                        const isChosen = assignedStoreIds.includes(sId);
                        const isCurrentContext = Boolean(contextStoreIdStr && sId === contextStoreIdStr);
                        return (
                          <TouchableOpacity
                            key={sId}
                            style={[
                              styles.storeDropdownItem,
                              isChosen && { backgroundColor: '#FDF2F8' },
                            ]}
                            onPress={() => toggleAssignedStoreId(sId)}
                            activeOpacity={0.75}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                              <View
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  borderWidth: 1.5,
                                  borderColor: isChosen ? '#FF3B98' : '#94A3B8',
                                  backgroundColor: isChosen ? '#FF3B98' : '#FFFFFF',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isChosen && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                              <Text
                                style={[
                                  styles.storeDropdownItemText,
                                  isChosen && { color: '#BE185D', fontWeight: '800' },
                                ]}
                                numberOfLines={1}
                              >
                                {s.name} ({s.areaName || s.city || 'Hub'})
                              </Text>
                              {isCurrentContext && (
                                <View
                                  style={{
                                    backgroundColor: '#EEF2FF',
                                    borderColor: '#C7D2FE',
                                    borderWidth: 1,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                  }}
                                >
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#4F46E5' }}>
                                    CURRENT
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* ========================================================================= */}
            {/* SECTION 2: MEDIA & PRODUCT PHOTO                                         */}
            {/* ========================================================================= */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionHeading}>
                  <ImageIcon size={13} color="#4F46E5" /> 2. MEDIA & PRODUCT PHOTO
                </Text>

                {/* Mode Toggle: Link vs Upload */}
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, imageMode === 'link' && styles.toggleBtnActive]}
                    onPress={() => setImageMode('link')}
                    activeOpacity={0.7}
                  >
                    <Link2 size={12} color={imageMode === 'link' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.toggleBtnText, imageMode === 'link' && styles.toggleBtnTextActive]}>
                      Link
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, imageMode === 'upload' && styles.toggleBtnActive]}
                    onPress={() => setImageMode('upload')}
                    activeOpacity={0.7}
                  >
                    <Upload size={12} color={imageMode === 'upload' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.toggleBtnText, imageMode === 'upload' && styles.toggleBtnTextActive]}>
                      Upload
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.mediaRow}>
                {/* Photo Preview Box */}
                <View style={styles.photoPreviewBox}>
                  {imagePreview || imageUrl ? (
                    <>
                      <Image
                        source={
                          imagePreview
                            ? { uri: imagePreview }
                            : imageMode === 'upload' && imageUrl
                            ? { uri: imageUrl }
                            : resolveProductImageSource(imageUrl, selectedProduct?.name, (selectedProduct as any)?.slug)
                        }
                        style={styles.photoImg}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.photoDeleteBtn}
                        onPress={() => {
                          setImageUrl('');
                          setImagePreview('');
                          setImageSource(null);
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

                {/* Conditional Body based on imageMode */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  {imageMode === 'link' ? (
                    <View>
                      <Text style={styles.formLabel}>Image Web URL (Direct link or standard asset)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="https://images.unsplash.com/... or CDN link"
                        placeholderTextColor="#94A3B8"
                        value={imageUrl}
                        onChangeText={(val) => {
                          const trimmed = val.trim();
                          setImageUrl(trimmed);
                          setImagePreview(trimmed);
                          setImageSource(trimmed ? 'url' : null);
                        }}
                      />
                      <Text style={[styles.uploadInfoText, { marginTop: 4 }]}>
                        Paste any public image link. Bundled catalog assets load instantly.
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.formLabel}>Upload Photo to Cloudinary CDN</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                        <TouchableOpacity
                          style={styles.replacePhotoBtn}
                          onPress={handlePickImage}
                          disabled={uploadingImage}
                        >
                          <Upload size={13} color="#071B52" />
                          <Text style={styles.replacePhotoBtnText}>
                            {uploadingImage ? 'Uploading...' : imageUrl ? 'Replace Photo' : 'Choose Photo'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.uploadInfoText}>JPG, PNG or WEBP up to 5MB</Text>
                      </View>
                      {imageUrl && (imageUrl.includes('res.cloudinary.com') || imageUrl.includes('/upload/')) && (
                        <Text style={[styles.uploadInfoText, { marginTop: 6, color: '#059669', fontWeight: '600' }]} numberOfLines={1}>
                          ✓ Uploaded to CDN: {imageUrl.split('/').pop()}
                        </Text>
                      )}
                    </View>
                  )}
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
                  <View style={{ minWidth: 740 }}>
                    {/* Header */}
                    <View style={styles.matrixTableHeader}>
                      <Text style={[styles.matrixHeaderCell, { width: 60, textAlign: 'center' }]}>Default</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 140 }]}>Pack Size / Weight *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 140 }]}>SKU</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 110 }]}>Selling Price (₹) *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 100 }]}>MRP (₹) *</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 85, textAlign: 'center' }]}>Discount</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 90 }]}>Stock</Text>
                      <Text style={[styles.matrixHeaderCell, { width: 95, textAlign: 'center' }]}>
                        {contextStoreIdStr ? 'Hide / Del' : 'Action'}
                      </Text>
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
                            v.isHiddenInStore && { opacity: 0.55, backgroundColor: '#F8FAFC' },
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

                          {/* Action: Store Variant Hide/Show + Global Delete */}
                          <View style={[styles.matrixCell, { width: 95, flexDirection: 'row', justifyContent: 'center', gap: 6 }]}>
                            {contextStoreIdStr ? (
                              <TouchableOpacity
                                onPress={() =>
                                  handleUpdateVariant(v.id, 'isHiddenInStore', !v.isHiddenInStore)
                                }
                                style={{
                                  padding: 4,
                                  borderRadius: 6,
                                  backgroundColor: v.isHiddenInStore ? '#FEF3C7' : '#F1F5F9',
                                }}
                                accessibilityLabel={v.isHiddenInStore ? 'Show in this store' : 'Hide in this store'}
                              >
                                {v.isHiddenInStore ? (
                                  <EyeOff size={14} color="#D97706" />
                                ) : (
                                  <Eye size={14} color="#475569" />
                                )}
                              </TouchableOpacity>
                            ) : null}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {contextStoreIdStr ? (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    backgroundColor: '#FFF7ED',
                  }}
                  onPress={handleRemoveFromStore}
                  disabled={deleting || saving}
                  activeOpacity={0.8}
                >
                  <Store size={14} color="#C2410C" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#C2410C' }}>
                    {deleting ? 'Updating...' : 'Remove from This Store'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.deleteProdBtn}
                onPress={handleDelete}
                disabled={deleting || saving}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.deleteProdBtnText}>
                  {deleting ? 'Deleting...' : contextStoreIdStr ? 'Delete Globally' : 'Delete Product'}
                </Text>
              </TouchableOpacity>
            </View>

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
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  toggleBtnActive: {
    backgroundColor: '#071B52',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
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
  storeScopeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  storeScopeCard: {
    flex: 1,
    minWidth: 200,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  storeScopeCardActive: {
    borderColor: '#FF3B98',
    backgroundColor: '#FFF1F7',
  },
  storeScopeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  storeScopeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    flex: 1,
  },
  storeScopeDesc: {
    fontSize: 11,
    color: '#64748B',
    paddingLeft: 25,
  },
  storeDropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 170,
    overflow: 'hidden',
  },
  storeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  storeDropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#071B52',
    flex: 1,
    marginRight: 8,
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
