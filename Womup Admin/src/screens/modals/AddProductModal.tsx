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
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import {
  PlusCircle,
  X,
  Upload,
  Trash2,
  Plus,
  Check,
  Package,
  AlertCircle,
  Info,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Search,
  Link as LinkIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';
import { PricingCategory } from '../../types/admin';

interface FormVariant {
  id: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  isDefault: boolean;
  isActive: boolean;
}

// Map categories to modern emojis for a polished presentation
const CATEGORY_EMOJIS: Record<string, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  dairy: '🥛',
  bakery: '🍞',
  beverages: '🥤',
  snacks: '🍿',
  cooking: '🍳',
  essentials: '🛒',
  personal: '🧼',
  cleaning: '🧹',
  household: '🏠',
  meat: '🍗',
  seafood: '🐟',
};

const getCategoryEmoji = (name?: string) => {
  if (!name) return '📦';
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '📦';
};

const getBackendUploadUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5050/api/v1/media/upload?folder=wormup/products';
    }
  }
  return 'http://localhost:5050/api/v1/media/upload?folder=wormup/products';
};

export const AddProductModal: React.FC = () => {
  const { activeModal, setActiveModal, addProductItem, categories } = useAdminState();

  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('Womup Fresh');
  const [description, setDescription] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');

  // Image Upload State
  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Category Dropdown Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [variants, setVariants] = useState<FormVariant[]>([
    {
      id: 'v_1',
      sku: '',
      weightOrVolume: '250 g',
      mrp: '15',
      sellingPrice: '12',
      isDefault: true,
      isActive: true,
    },
    {
      id: 'v_2',
      sku: '',
      weightOrVolume: '500 g',
      mrp: '28',
      sellingPrice: '22',
      isDefault: false,
      isActive: true,
    },
    {
      id: 'v_3',
      sku: '',
      weightOrVolume: '1 kg',
      mrp: '50',
      sellingPrice: '40',
      isDefault: false,
      isActive: true,
    },
  ]);

  if (activeModal !== 'AddProduct') {
    return null;
  }

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) ||
    categories[0] || { id: 'default', name: 'Vegetables' };

  const handleClose = () => {
    setName('');
    setSelectedCategoryId(categories[0]?.id || '');
    setBrand('Womup Fresh');
    setDescription('');
    setImageUrl('');
    setCloudinaryPublicId('');
    setImagePreview('');
    setShowUrlInput(false);
    setCustomUrl('');
    setShowCategoryModal(false);
    setErrorMsg(null);
    setVariants([
      {
        id: 'v_1',
        sku: '',
        weightOrVolume: '250 g',
        mrp: '15',
        sellingPrice: '12',
        isDefault: true,
        isActive: true,
      },
    ]);
    setActiveModal('none');
  };

  // ── Native Image Picker Handlers (Works on Android APK, iOS, Web) ──
  const uploadImageFile = async (asset: ImagePicker.ImagePickerAsset) => {
    setImagePreview(asset.uri);
    setUploadingImage(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('file', blob, asset.fileName || 'product.jpg');
      } else {
        // Native APK (Android/iOS)
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || `prod_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any);
      }

      const uploadUrl = getBackendUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data) {
        const finalUrl = json.data.url || json.data.secureUrl;
        setImageUrl(finalUrl);
        setCloudinaryPublicId(json.data.publicId || '');
        setErrorMsg(null);
      } else {
        // Fallback to local URI so admin can continue previewing
        setImageUrl(asset.uri);
      }
    } catch (err: any) {
      console.warn('Image upload error:', err);
      // Keep local preview intact
      setImageUrl(asset.uri);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Photo gallery access is required to upload product images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImageFile(result.assets[0]);
      }
    } catch (e: any) {
      console.warn('Gallery pick error:', e);
      setErrorMsg('Failed to open gallery. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera access is required to take product photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImageFile(result.assets[0]);
      }
    } catch (e: any) {
      console.warn('Camera error:', e);
      setErrorMsg('Failed to open camera. Please try again.');
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setImageUrl(customUrl.trim());
    setImagePreview(customUrl.trim());
    setShowUrlInput(false);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview('');
    setCloudinaryPublicId('');
    setCustomUrl('');
  };

  // ── Variant Helpers ──
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `v_${Date.now()}`,
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

  // ── Save Product ──
  const handleSave = async () => {
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a product name in the Item Name field.');
      return;
    }

    if (variants.length === 0) {
      setErrorMsg('Please add at least one variant.');
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
      const formattedVariants = variants.map((v) => ({
        sku: v.sku.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.weightOrVolume.replace(/[^a-z0-9]+/gi, '').toLowerCase()}`,
        weightOrVolume: v.weightOrVolume.trim(),
        mrp: parseFloat(v.mrp),
        sellingPrice: parseFloat(v.sellingPrice),
        isDefault: v.isDefault,
        isActive: v.isActive,
      }));

      const defaultVar = formattedVariants.find((v) => v.isDefault) || formattedVariants[0];
      const activeCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

      const success = await addProductItem({
        name: name.trim(),
        category: activeCat?.name || 'Vegetables',
        categoryId: activeCat?.id,
        brand: brand.trim() || 'Womup Fresh',
        description: description.trim(),
        imageUrl: imageUrl || imagePreview,
        images: (imageUrl || imagePreview) ? [imageUrl || imagePreview] : [],
        cloudinaryPublicId,
        sellingPrice: defaultVar.sellingPrice,
        mrp: defaultVar.mrp,
        basePrice: defaultVar.sellingPrice,
        shelfLocation: shelfLocation.trim().toUpperCase() || undefined,
        isActive: true,
        variants: formattedVariants as any,
      });

      if (success) {
        handleClose();
      } else {
        setErrorMsg('Failed to save product in MongoDB. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <PlusCircle size={20} color={COLORS.purple} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Add New Item</Text>
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
            {/* Master Catalog Context Hint */}
            <View style={styles.masterNoticeBox}>
              <Info size={16} color={COLORS.purple} style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.masterNoticeTitle}>Global Master Catalog Item</Text>
                <Text style={styles.masterNoticeText}>
                  This product will be added to the master catalog with default fallback prices. Configure area-specific selling prices after saving using the Area Pricing screen.
                </Text>
              </View>
            </View>

            {/* 📸 CHANGE 1: Product Image Upload (Native Gallery + Camera + Fallback) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Image (Cloudinary)</Text>

              {imageUrl || imagePreview ? (
                /* Selected Image Preview with Actions */
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imageUrl || imagePreview }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewDetails}>
                    <Text style={styles.previewTitle} numberOfLines={1}>
                      {imageUrl.startsWith('http') ? 'Cloudinary Hosted Image' : 'Local Image Selected'}
                    </Text>
                    <Text style={styles.previewSubtitle} numberOfLines={1}>
                      {imageUrl || imagePreview}
                    </Text>
                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.changeActionBtn}
                        onPress={handlePickFromGallery}
                        disabled={uploadingImage}
                      >
                        <Text style={styles.changeActionText}>Change Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeActionBtn}
                        onPress={handleRemoveImage}
                      >
                        <Trash2 size={14} color={COLORS.error} />
                        <Text style={styles.removeActionText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* Native Upload Options Card */
                <View style={styles.uploadCardContainer}>
                  {uploadingImage ? (
                    <View style={styles.uploadLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.purple} />
                      <Text style={styles.uploadLoadingText}>Uploading to Cloudinary...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.uploadButtonsGrid}>
                        {/* 1. Choose from Gallery */}
                        <TouchableOpacity
                          style={styles.actionPickBtn}
                          onPress={handlePickFromGallery}
                          activeOpacity={0.8}
                        >
                          <ImageIcon size={20} color={COLORS.purple} />
                          <Text style={styles.actionPickText}>Choose from Gallery</Text>
                        </TouchableOpacity>

                        {/* 2. Take Photo with Camera */}
                        <TouchableOpacity
                          style={styles.actionPickBtn}
                          onPress={handleTakePhoto}
                          activeOpacity={0.8}
                        >
                          <Camera size={20} color={COLORS.purple} />
                          <Text style={styles.actionPickText}>Take Photo</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Divider with 'OR' */}
                      <View style={styles.orDividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.orText}>OR PASTE URL</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      {/* Paste URL Option */}
                      {showUrlInput ? (
                        <View style={styles.urlInputRow}>
                          <TextInput
                            style={styles.urlTextInput}
                            placeholder="https://images.unsplash.com/..."
                            placeholderTextColor={COLORS.textMuted}
                            value={customUrl}
                            onChangeText={setCustomUrl}
                            autoCapitalize="none"
                          />
                          <TouchableOpacity
                            style={styles.urlApplyBtn}
                            onPress={handleApplyCustomUrl}
                          >
                            <Text style={styles.urlApplyBtnText}>Apply</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.showUrlBtn}
                          onPress={() => setShowUrlInput(true)}
                        >
                          <LinkIcon size={14} color={COLORS.purple} style={{ marginRight: 6 }} />
                          <Text style={styles.showUrlBtnText}>Enter Image Web URL directly</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
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
                placeholder="e.g. Fresh Tomato, Green Capsicum"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  setErrorMsg(null);
                }}
              />
              {errorMsg && !name.trim() && (
                <Text style={styles.inlineFieldHelp}>Product name is required.</Text>
              )}
            </View>

            {/* 🥬 CHANGE 2: Category Dropdown (Redesigned from wrapping chips) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Category <Text style={{ color: COLORS.error }}>*</Text>
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.categoryDropdownTrigger}
                onPress={() => setShowCategoryModal(true)}
              >
                <View style={styles.categoryDropdownLeft}>
                  <Text style={styles.categoryDropdownIcon}>
                    {getCategoryEmoji(activeCategory?.name)}
                  </Text>
                  <Text style={styles.categoryDropdownText}>
                    {activeCategory?.name || 'Select Category'}
                  </Text>
                </View>
                <ChevronDown size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
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
                  placeholder="Farm-fresh produce..."
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Warehouse Shelf Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shelf / Bin Coordinate (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. A3-R2 (Aisle 3, Rack 2), B1-04, COOLER-1"
                placeholderTextColor={COLORS.textMuted}
                value={shelfLocation}
                onChangeText={(val) => setShelfLocation(val.toUpperCase())}
                autoCapitalize="characters"
              />
              <Text style={styles.inlineFieldHelp}>Pickers in Dark Store will walk directly to this coordinate when fulfilling orders.</Text>
            </View>

            {/* Variants Section */}
            <View style={styles.variantsHeaderRow}>
              <View>
                <Text style={styles.variantsHeading}>Weight & Pack Size Variants</Text>
                <Text style={styles.variantsSubheading}>
                  At least 1 variant required with base selling price
                </Text>
              </View>
              <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
                <Plus size={14} color={COLORS.purple} style={{ marginRight: 4 }} />
                <Text style={styles.addVariantBtnText}>Add Pack Size</Text>
              </TouchableOpacity>
            </View>

            {variants.map((v, index) => (
              <View key={v.id} style={styles.variantCard}>
                <View style={styles.variantCardHeader}>
                  <View style={styles.variantBadgeRow}>
                    <Text style={styles.variantBadgeText}>Variant #{index + 1}</Text>
                    {v.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Check size={10} color={COLORS.purple} style={{ marginRight: 2 }} />
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.variantHeaderActions}>
                    {!v.isDefault && (
                      <TouchableOpacity
                        style={styles.setDefaultBtn}
                        onPress={() => handleUpdateVariant(v.id, 'isDefault', true)}
                      >
                        <Text style={styles.setDefaultBtnText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    {variants.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteVariantBtn}
                        onPress={() => handleRemoveVariant(v.id)}
                      >
                        <Trash2 size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.variantFieldsContainer}>
                  <View style={styles.variantRow}>
                    <View style={styles.variantFieldHalf}>
                      <Text style={styles.variantFieldLabel}>Pack Size *</Text>
                      <TextInput
                        style={styles.variantInput}
                        placeholder="e.g. 500 g"
                        placeholderTextColor={COLORS.textMuted}
                        value={v.weightOrVolume}
                        onChangeText={(val) => handleUpdateVariant(v.id, 'weightOrVolume', val)}
                      />
                    </View>

                    <View style={styles.variantFieldHalf}>
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

                  <View style={styles.variantRow}>
                    <View style={styles.variantFieldHalf}>
                      <Text style={styles.variantFieldLabel}>Selling (₹) *</Text>
                      <TextInput
                        style={styles.variantInput}
                        placeholder="e.g. 12"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        value={v.sellingPrice}
                        onChangeText={(val) => handleUpdateVariant(v.id, 'sellingPrice', val)}
                      />
                    </View>

                    <View style={styles.variantFieldHalf}>
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
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
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

      {/* 🥬 CATEGORY SELECTOR MODAL (Option A - Dropdown List with Search) */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.catModalOverlay}>
          <View style={styles.catModalCard}>
            {/* Modal Header */}
            <View style={styles.catModalHeader}>
              <View>
                <Text style={styles.catModalTitle}>Select Category</Text>
                <Text style={styles.catModalSubtitle}>Choose the product department</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.catModalCloseBtn}
              >
                <X size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.catSearchBox}>
              <Search size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.catSearchInput}
                placeholder="Search categories..."
                placeholderTextColor={COLORS.textMuted}
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
                autoCorrect={false}
              />
              {categorySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                  <X size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Items List */}
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const isSelected = selectedCategoryId
                  ? selectedCategoryId === item.id
                  : categories[0]?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.catListItem,
                      isSelected && styles.catListItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setShowCategoryModal(false);
                      setCategorySearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.catListItemLeft}>
                      <Text style={styles.catListEmoji}>
                        {getCategoryEmoji(item.name)}
                      </Text>
                      <View>
                        <Text
                          style={[
                            styles.catListName,
                            isSelected && styles.catListNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {item.itemCount !== undefined && (
                          <Text style={styles.catListItemCount}>
                            {item.itemCount} items in catalog
                          </Text>
                        )}
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.catSelectedCheck}>
                        <Check size={14} color={COLORS.purple} />
                      </View>
                    ) : (
                      <View style={styles.catUnselectedCheck} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.catEmptyState}>
                  <Package size={32} color={COLORS.border} />
                  <Text style={styles.catEmptyText}>
                    No categories found matching "{categorySearchQuery}"
                  </Text>
                </View>
              }
            />

            <View style={styles.catModalFooter}>
              <TouchableOpacity
                style={styles.catCancelBtn}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.catCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
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
  masterNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: RADIUS.input,
    padding: 10,
    marginBottom: SPACING.md,
  },
  masterNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
    marginBottom: 2,
  },
  masterNoticeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
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
  inlineFieldHelp: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 4,
  },

  // 📸 Image Upload Styles
  uploadCardContainer: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D8B4FE',
    borderRadius: RADIUS.card,
    padding: 14,
  },
  uploadButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: RADIUS.button,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  actionPickText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9D5FF',
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9333EA',
    letterSpacing: 0.5,
  },
  showUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  showUrlBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.purple,
    textDecorationLine: 'underline',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlTextInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  urlApplyBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
  },
  urlApplyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  uploadLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBackground,
    padding: 10,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
  },
  previewDetails: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  previewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  changeActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: RADIUS.sm,
  },
  changeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  removeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.error,
  },

  // 🥬 Category Dropdown Styles
  categoryDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  categoryDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDropdownIcon: {
    fontSize: 16,
  },
  categoryDropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Category Modal Styles
  catModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  catModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    width: '100%',
    maxWidth: 420,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  catModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  catModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  catModalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  catModalCloseBtn: {
    padding: 4,
  },
  catSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  catSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  catListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  catListItemSelected: {
    backgroundColor: '#FAF5FF',
  },
  catListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catListEmoji: {
    fontSize: 18,
  },
  catListName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  catListNameSelected: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  catListItemCount: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  catSelectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catUnselectedCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  catEmptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  catEmptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  catModalFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 8,
    alignItems: 'flex-end',
  },
  catCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.sm,
  },
  catCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  variantsSubheading: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.button,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  addVariantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  variantCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: SPACING.sm,
  },
  variantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variantBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: COLORS.purple,
    fontWeight: '700',
  },
  variantHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  setDefaultBtnText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  deleteVariantBtn: {
    padding: 4,
  },
  variantFieldsContainer: {
    gap: 8,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 8,
  },
  variantFieldHalf: {
    flex: 1,
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

  // Footer Actions
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexWrap: 'wrap',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.cardBackground,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
