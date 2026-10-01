import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

const CATEGORIES = [
  'Vegetables & Fruits',
  'Dairy & Breakfast',
  'Munchies & Snacks',
  'Cold Drinks & Juices',
  'Instant & Frozen Food',
  'Tea, Coffee & Health Drinks',
  'Bakery & Biscuits',
  'Atta, Rice & Dal',
  'Cleaning Essentials',
  'Personal Care',
];

const CATEGORY_EMOJIS: Record<string, string> = {
  'Vegetables & Fruits': '🥬',
  'Dairy & Breakfast': '🥛',
  'Munchies & Snacks': '🍿',
  'Cold Drinks & Juices': '🥤',
  'Instant & Frozen Food': '🍕',
  'Tea, Coffee & Health Drinks': '☕',
  'Bakery & Biscuits': '🍞',
  'Atta, Rice & Dal': '🌾',
  'Cleaning Essentials': '🧼',
  'Personal Care': '🧴',
};

const PRESET_IMAGES = [
  { label: 'Tomatoes', icon: '🍅', url: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?w=400' },
  { label: 'Onions', icon: '🧅', url: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400' },
  { label: 'Milk', icon: '🥛', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400' },
  { label: 'Bread', icon: '🍞', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { label: 'Apples', icon: '🍎', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
  { label: 'Snacks', icon: '🍿', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400' },
];

interface VariantForm {
  packSize: string;
  sellingPrice: string;
  mrp: string;
  sku: string;
}

export const ST17_AddProductScreen: React.FC = () => {
  const { store, setSubScreen, addNewProduct } = useStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('Farm Fresh');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSource, setUploadSource] = useState<'preset' | 'cloudinary' | 'custom'>('preset');

  // Store Inventory & Shelf
  const [initialStock, setInitialStock] = useState('100');
  const [shelfLocation, setShelfLocation] = useState('A3-R2');

  // Variants list
  const [variants, setVariants] = useState<VariantForm[]>([
    { packSize: '250 g', sellingPrice: '13', mrp: '15', sku: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const areaName =
    store?.areaName ||
    (store?.name
      ? store.name.replace(/^Wom\s*Up\s*/i, '').replace(/\s*(Dark\s*Store|Store)$/i, '').trim()
      : 'Chandlodiya');

  const cityName = store?.cityName || store?.city || 'Ahmedabad';

  const handleUploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setIsUploadingImage(true);
      setErrorMsg(null);
      const secureUrl = await StoreApiService.uploadImage(asset);
      setImageUrl(secureUrl);
      setUploadSource('cloudinary');
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed. You can paste an image URL instead.');
      Alert.alert('Upload Failed', err.message || 'Could not upload image to server.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Wom Up needs photo gallery permission to upload product images.'
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
        await handleUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Failed to open photo gallery');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Wom Up needs camera permission to capture product photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUploadAsset(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Failed to open camera');
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { packSize: '500 g', sellingPrice: '25', mrp: '30', sku: '' },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof VariantForm, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Product name is required');
      return;
    }

    if (!shelfLocation.trim()) {
      setErrorMsg('Shelf location is required (e.g. A3-R2)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formattedVariants = variants.map((v) => ({
        packSize: v.packSize.trim() || '1 unit',
        sellingPrice: parseFloat(v.sellingPrice) || 20,
        mrp: parseFloat(v.mrp) || parseFloat(v.sellingPrice) || 25,
        sku: v.sku.trim() || `SKU-${name.trim().slice(0, 3).toUpperCase()}-${v.packSize.replace(/\s+/g, '')}`,
      }));

      await addNewProduct({
        name: name.trim(),
        category,
        brand: brand.trim() || 'Wom Up',
        description: description.trim() || `Fresh ${name.trim()}`,
        imageUrl: imageUrl.trim(),
        variants: formattedVariants,
        initialStock: parseInt(initialStock, 10) || 100,
        shelfLocation: shelfLocation.trim().toUpperCase(),
      });

      setIsSubmitting(false);
      // Return back to inventory tab
      setSubScreen(null);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to save product');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen(null)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add New Product</Text>
          <Text style={styles.subtitle}>
            Registering for {areaName} · {cityName}
          </Text>
        </View>
        <View style={styles.storeBadge}>
          <Ionicons name="storefront" size={12} color={COLORS.primary} />
          <Text style={styles.storeBadgeText}>DARK STORE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* Section 1: Product Image */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>📸 PRODUCT IMAGE</Text>
            {uploadSource === 'cloudinary' ? (
              <View style={styles.badgeCloudinary}>
                <Ionicons name="cloud-done" size={11} color={COLORS.primary} />
                <Text style={styles.badgeCloudinaryText}>Cloudinary</Text>
              </View>
            ) : uploadSource === 'preset' ? (
              <View style={styles.badgePreset}>
                <Ionicons name="flash" size={11} color={COLORS.accentCyan} />
                <Text style={styles.badgePresetText}>Preset</Text>
              </View>
            ) : null}
          </View>

          {/* Main Image Preview & Upload Actions */}
          <View style={styles.imageMainContainer}>
            <View style={styles.imageBox}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreviewLarge} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                  <Text style={styles.imagePlaceholderText}>No Image Selected</Text>
                </View>
              )}

              {isUploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>

            {/* Upload Buttons */}
            <View style={styles.uploadButtonsCol}>
              <TouchableOpacity
                style={[styles.uploadActionBtn, styles.galleryBtn]}
                onPress={handlePickFromGallery}
                disabled={isUploadingImage}
              >
                <Ionicons name="images" size={16} color="#FFF" />
                <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadActionBtn, styles.cameraBtn]}
                onPress={handleTakePhoto}
                disabled={isUploadingImage}
              >
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.cameraBtnText}>Take Photo</Text>
              </TouchableOpacity>

              {imageUrl ? (
                <TouchableOpacity
                  style={styles.clearImageBtn}
                  onPress={() => {
                    setImageUrl('');
                    setUploadSource('custom');
                  }}
                  disabled={isUploadingImage}
                >
                  <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                  <Text style={styles.clearImageBtnText}>Clear Image</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Quick Preset Chips */}
          <Text style={styles.subSectionTitle}>QUICK IMAGE PRESETS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PRESET_IMAGES.map((preset) => {
              const isActive = imageUrl === preset.url;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.imagePresetChip,
                    isActive && styles.imagePresetChipActive,
                  ]}
                  onPress={() => {
                    setImageUrl(preset.url);
                    setUploadSource('preset');
                  }}
                  disabled={isUploadingImage}
                >
                  <Text style={styles.presetEmoji}>{preset.icon}</Text>
                  <Text
                    style={[
                      styles.imagePresetText,
                      isActive && styles.imagePresetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Fallback URL Input */}
          <View style={styles.urlInputContainer}>
            <Text style={styles.urlInputLabel}>OR PASTE CUSTOM IMAGE URL</Text>
            <TextInput
              style={styles.urlInput}
              value={imageUrl}
              onChangeText={(t) => {
                setImageUrl(t);
                setUploadSource('custom');
              }}
              placeholder="https://images.unsplash.com/..."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Section 2: Basic Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📦 BASIC DETAILS</Text>

          {/* Product Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PRODUCT NAME *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fresh Tomato"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CATEGORY *</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <View style={styles.categoryDropdownSelected}>
                <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[category] || '📦'}</Text>
                <Text style={styles.dropdownBtnText}>{category}</Text>
              </View>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryDropdown}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={styles.categoryOptionContent}>
                      <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat] || '📦'}</Text>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </View>
                    {category === cat && (
                      <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Brand */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BRAND</Text>
            <TextInput
              style={styles.textInput}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Farm Fresh / Local Producer"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Freshly sourced quality produce..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Section 3: Store Inventory & Shelf Assignment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>🏪 STORE INVENTORY & SHELF</Text>
            <View style={styles.lockedAreaPill}>
              <Ionicons name="lock-closed" size={11} color={COLORS.accentCyan} />
              <Text style={styles.lockedAreaPillText}>{areaName}</Text>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>INITIAL STOCK UNITS *</Text>
              <TextInput
                style={styles.textInput}
                value={initialStock}
                onChangeText={setInitialStock}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>SHELF LOCATION *</Text>
              <TextInput
                style={[styles.textInput, { fontFamily: 'monospace', fontWeight: '800' }]}
                value={shelfLocation}
                onChangeText={(t) => setShelfLocation(t.toUpperCase())}
                placeholder="A3-R2"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>
          </View>
          <Text style={styles.fieldHint}>
            Format: AisleA-RackB (e.g. A3-R2). Pickers will use this slot to pick incoming orders.
          </Text>
        </View>

        {/* Section 4: Variants */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>🏷️ VARIANTS & DEFAULT PRICING</Text>
            <TouchableOpacity style={styles.addVariantBtn} onPress={handleAddVariant}>
              <Ionicons name="add" size={14} color={COLORS.primary} />
              <Text style={styles.addVariantBtnText}>Add Variant</Text>
            </TouchableOpacity>
          </View>

          {variants.map((v, index) => (
            <View key={index} style={styles.variantCard}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantNumber}>Variant #{index + 1}</Text>
                {variants.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveVariant(index)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.fieldLabel}>PACK SIZE *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={v.packSize}
                    onChangeText={(val) => handleUpdateVariant(index, 'packSize', val)}
                    placeholder="250 g / 1 pc"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>SELLING (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={v.sellingPrice}
                    onChangeText={(val) => handleUpdateVariant(index, 'sellingPrice', val)}
                    keyboardType="numeric"
                    placeholder="13"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>MRP (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={v.mrp}
                    onChangeText={(val) => handleUpdateVariant(index, 'mrp', val)}
                    keyboardType="numeric"
                    placeholder="15"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { marginTop: 8 }]}>
                <Text style={styles.fieldLabel}>SKU (AUTO OR MANUAL)</Text>
                <TextInput
                  style={[styles.textInput, { fontFamily: 'monospace', fontSize: 12 }]}
                  value={v.sku}
                  onChangeText={(val) => handleUpdateVariant(index, 'sku', val)}
                  placeholder={`Auto e.g. SKU-${name.slice(0, 3).toUpperCase() || 'PROD'}-${v.packSize || '1'}`}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Informative Note Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.accentCyan} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>Dark Store Authority Notice</Text>
            <Text style={styles.infoBoxDesc}>
              This product will be created in master catalog and stocked in your {areaName} dark store.
              Admin Console retains authority to adjust area-specific customer pricing.
            </Text>
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSubScreen(null)}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color="#FFF" />
                <Text style={styles.submitButtonText}>SAVE PRODUCT</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCard,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  storeBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  lockedAreaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 12,
  },
  lockedAreaPillText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeCloudinary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeCloudinaryText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  badgePreset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  badgePresetText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
  },
  imageMainContainer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  imagePlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  uploadButtonsCol: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  uploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  galleryBtn: {
    backgroundColor: COLORS.primary,
  },
  galleryBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cameraBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  cameraBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  clearImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  clearImageBtnText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  subSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imagePresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  imagePresetChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.primary,
  },
  presetEmoji: {
    fontSize: 13,
  },
  imagePresetText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  imagePresetTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  urlInputContainer: {
    marginTop: 4,
  },
  urlInputLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  urlInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  categoryDropdownSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 15,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldHint: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryDropdown: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  categoryOptionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  categoryOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  addVariantBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  variantCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantNumber: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  infoBoxTitle: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: '800',
  },
  infoBoxDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitButton: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
