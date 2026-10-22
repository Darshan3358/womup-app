import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Check,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  Store,
  ChevronDown,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { CategoryItem, SubCategoryItem } from '../types/admin';

// Category Presets (Emoji & Color styles)
const IMAGE_PRESETS = [
  { label: 'Vegetables', url: '', emoji: '🥦', color: '#E8F5E9' },
  { label: 'Fruits', url: '', emoji: '🍎', color: '#FFF3E0' },
  { label: 'Dairy & Milk', url: '', emoji: '🥛', color: '#E3F2FD' },
  { label: 'Cooking Essentials', url: '', emoji: '🧄', color: '#F3E5F5' },
  { label: 'Bakery & Bread', url: '', emoji: '🍞', color: '#FFF8E1' },
  { label: 'Cold Beverages', url: '', emoji: '🥤', color: '#FCE4EC' },
  { label: 'Snacks & Munchies', url: '', emoji: '🍿', color: '#FBE9E7' },
  { label: 'Organic Wellness', url: '', emoji: '🌿', color: '#EEF9F3' },
  { label: 'Personal Care', url: '', emoji: '🧴', color: '#EDE9FE' },
  { label: 'Cleaning & Household', url: '', emoji: '🧼', color: '#F1F5F9' },
  { label: 'Paan Corner', url: '', emoji: '🍃', color: '#DCFCE7' },
  { label: 'Baby Care', url: '', emoji: '🍼', color: '#FCE7F3' },
];

const COLOR_PRESETS = [
  '#E8F5E9',
  '#FFF3E0',
  '#E3F2FD',
  '#F3E5F5',
  '#FFF8E1',
  '#FCE4EC',
  '#FBE9E7',
  '#EEF9F3',
  '#EDE9FE',
  '#F1F5F9',
];

export const CategoryManagementScreen: React.FC = () => {
  const {
    categories,
    products,
    refreshCategories,
    addCategoryItem,
    updateCategoryItem,
    toggleCategoryItemStatus,
    deleteCategoryItem,
    addSubcategoryItem,
    deleteSubcategoryItem,
  } = useAdminState();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Top Dark Store Selector
  const [selectedDarkStore, setSelectedDarkStore] = useState<string>('All Dark Stores & Shops (12)');
  const [showDarkStoreModal, setShowDarkStoreModal] = useState<boolean>(false);
  const darkStoresList = [
    'All Dark Stores & Shops (12)',
    'Satellite Hub Dark Store',
    'Chandlodiya - Tragad Dark Store',
    'Prahlad Nagar Express Store',
    'Vastrapur - Bodakdev Hub',
    'Navrangpura Quick Hub',
  ];

  // ================= ADD CATEGORY MODAL STATE =================
  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatSlug, setNewCatSlug] = useState<string>('');
  const [newCatImage, setNewCatImage] = useState<string>('');
  const [newCatBgColor, setNewCatBgColor] = useState<string>('#E8F5E9');
  const [newCatIcon, setNewCatIcon] = useState<string>('🥦');
  const [newCatDescription, setNewCatDescription] = useState<string>('');
  const [newCatSortOrder, setNewCatSortOrder] = useState<string>(String(categories.length + 1));
  const [submittingCat, setSubmittingCat] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ================= EDIT CATEGORY MODAL STATE =================
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editSlug, setEditSlug] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [editBgColor, setEditBgColor] = useState<string>('#F3E5F5');
  const [editIcon, setEditIcon] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editSortOrder, setEditSortOrder] = useState<string>('0');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ================= SUBCATEGORY MODAL STATE =================
  const [selectedCatForSub, setSelectedCatForSub] = useState<CategoryItem | null>(null);
  const [newSubName, setNewSubName] = useState<string>('');
  const [submittingSub, setSubmittingSub] = useState<boolean>(false);

  useEffect(() => {
    refreshCategories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCategories();
    setRefreshing(false);
  };

  // Helper to resolve image if category has an image URL
  const getCategoryImage = (cat: CategoryItem): string => {
    if (cat.image && cat.image.startsWith('http')) return cat.image;
    if (cat.imageUrl && cat.imageUrl.startsWith('http')) return cat.imageUrl;
    return '';
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q));
      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
          ? c.isActive !== false
          : c.isActive === false;
      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  // Start Edit Category
  const startEditCategory = (cat: CategoryItem) => {
    setEditingCat(cat);
    setEditName(cat.name || '');
    setEditSlug(cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    setEditImage(getCategoryImage(cat));
    setEditIcon(cat.icon || '🥦');
    setEditBgColor(cat.bgColor || '#F3E5F5');
    setEditDescription(cat.description || '');
    setEditSortOrder(String(cat.sortOrder ?? 0));
    setEditIsActive(cat.isActive !== false);
    setEditError(null);
  };

  // Save Category Edit
  const handleSaveCategoryEdit = async () => {
    if (!editingCat || !editName.trim()) return;
    setSavingEdit(true);
    setEditError(null);

    const catId = editingCat.id || editingCat._id || '';
    const cleanSlug = (editSlug.trim() || editName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const updates = {
      name: editName.trim(),
      slug: cleanSlug,
      image: editImage.trim() || null,
      imageUrl: editImage.trim() || null,
      icon: editIcon.trim() || 'shopping-bag',
      bgColor: editBgColor,
      description: editDescription.trim(),
      sortOrder: Number(editSortOrder) || 0,
      isActive: Boolean(editIsActive),
    };

    const res = await updateCategoryItem(catId, updates);
    setSavingEdit(false);

    if (res?.success) {
      setEditingCat(null);
      await refreshCategories();
    } else {
      setEditError(res?.error || 'Failed to update category.');
    }
  };

  // Create Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      setAddError('Category name is required');
      return;
    }
    setSubmittingCat(true);
    setAddError(null);

    const cleanSlug = (newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const cleanCode = cleanSlug.toUpperCase().replace(/-/g, '_');

    const payload = {
      name: newCatName.trim(),
      code: cleanCode,
      slug: cleanSlug,
      image: newCatImage.trim() || null,
      imageUrl: newCatImage.trim() || null,
      bgColor: newCatBgColor,
      icon: newCatIcon.trim() || 'shopping-bag',
      description: newCatDescription.trim(),
      sortOrder: Number(newCatSortOrder) || categories.length + 1,
      isActive: true,
    };

    const res = await addCategoryItem(payload);
    setSubmittingCat(false);

    if (res?.success) {
      setShowAddCatModal(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatImage('');
      setNewCatDescription('');
      await refreshCategories();
    } else {
      setAddError(res?.error || 'Failed to create category.');
    }
  };

  // Toggle Category Status
  const handleToggleStatus = async (cat: CategoryItem) => {
    const catId = cat.id || cat._id || '';
    await toggleCategoryItemStatus(catId);
  };

  // Delete Category
  const handleDeleteCategory = (cat: CategoryItem) => {
    const doDelete = async () => {
      const catId = cat.id || cat._id || '';
      await deleteCategoryItem(catId);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  // Add Subcategory
  const handleCreateSubcategory = async () => {
    if (!selectedCatForSub || !newSubName.trim()) return;
    setSubmittingSub(true);
    const catId = selectedCatForSub.id || selectedCatForSub._id || '';
    await addSubcategoryItem(catId, {
      name: newSubName.trim(),
      slug: newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
    setSubmittingSub(false);
    setSelectedCatForSub(null);
    setNewSubName('');
  };

  // Delete Subcategory
  const handleDeleteSubcategory = (cat: CategoryItem, subId: string, subName: string) => {
    const doDelete = async () => {
      const catId = cat.id || cat._id || '';
      await deleteSubcategoryItem(catId, subId);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete subcategory "${subName}" from ${cat.name}?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Subcategory', `Delete subcategory "${subName}" from ${cat.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Top Breadcrumb & Store Selector (100% Website Header Alignment) */}
      <View style={styles.topBar}>
        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbPortal}>Portal</Text>
          <Text style={styles.breadcrumbSlash}> / </Text>
          <Text style={styles.breadcrumbActive}>Categories</Text>
        </View>

        <TouchableOpacity
          style={styles.storeSelectorBtn}
          onPress={() => setShowDarkStoreModal(true)}
          activeOpacity={0.8}
        >
          <Store size={14} color="#071B52" />
          <Text style={styles.storeSelectorText} numberOfLines={1}>
            {selectedDarkStore}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 2. Main Page Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.mainTitle}>Category Taxonomy & Department Shelves</Text>
          <Text style={styles.mainSubtitle}>
            Manage category titles, product images, visual icons, background colors, and subcategories
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addCategoryBtn}
          onPress={() => {
            setNewCatSortOrder(String(categories.length + 1));
            setShowAddCatModal(true);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#071B52', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addCategoryGradient}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addCategoryBtnText}>+ Add Department / Category</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 3. Filter Pills and Search Bar */}
      <View style={styles.filterCard}>
        {/* Status Filter Tabs (Pill Bar) */}
        <View style={styles.statusFilterRow}>
          {(['All', 'Active', 'Inactive'] as const).map((tab) => {
            const isSelected = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.statusPill, isSelected && styles.statusPillActive]}
                onPress={() => setStatusFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.statusPillText, isSelected && styles.statusPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories & slugs..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Category Cards Grid (Mobile Responsive Matching Image 1) */}
      <View style={styles.categoriesGrid}>
        {filteredCategories.map((c) => {
          const catId = c.id || c._id || '';
          const productCount = products.filter(
            (p) =>
              p.category === c.name ||
              p.categoryId === catId ||
              (p.category && c.slug && p.category.toLowerCase() === c.slug.toLowerCase())
          ).length;
          const subCount = c.subCategories?.length || 0;
          const catImg = getCategoryImage(c);

          return (
            <View key={catId} style={styles.categoryCard}>
              {/* Header row with Image, Title, Metadata & Actions */}
              <View style={styles.cardHeaderRow}>
                {/* Category Thumbnail Box */}
                <View
                  style={[
                    styles.thumbnailBox,
                    { backgroundColor: c.bgColor || '#F3F0FF', alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  {catImg ? (
                    <Image
                      source={{ uri: catImg }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{c.icon || '🏷️'}</Text>
                  )}
                  {Boolean(catImg && c.icon && c.icon.length <= 4) && (
                    <View style={styles.emojiOverlayBadge}>
                      <Text style={styles.emojiOverlayText}>{c.icon}</Text>
                    </View>
                  )}
                </View>

                {/* Title & Metadata */}
                <View style={styles.cardTitleCol}>
                  <Text style={styles.cardCategoryName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.cardSlug}>/{c.slug || c.name.toLowerCase().replace(/\s+/g, '-')}</Text>

                  <View style={styles.tagsRow}>
                    {c.sortOrder !== undefined && (
                      <View style={styles.orderTag}>
                        <Text style={styles.orderTagText}>Order #{c.sortOrder}</Text>
                      </View>
                    )}
                    {c.code && (
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>{c.code}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Top-Right Action Buttons: Edit, Status, Delete */}
                <View style={styles.cardActionsCol}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => startEditCategory(c)}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={12} color="#1D4ED8" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      c.isActive !== false ? styles.statusActive : styles.statusHidden,
                    ]}
                    onPress={() => handleToggleStatus(c)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        c.isActive !== false ? styles.statusActiveText : styles.statusHiddenText,
                      ]}
                    >
                      {c.isActive !== false ? 'ACTIVE' : 'HIDDEN'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDeleteCategory(c)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Optional Description */}
              {c.description ? (
                <Text style={styles.categoryDesc} numberOfLines={2}>
                  {c.description}
                </Text>
              ) : null}

              {/* Subcategories Section */}
              <View style={styles.subcategoriesSection}>
                <View style={styles.subcategoriesHeader}>
                  <Text style={styles.subcategoriesTitle}>
                    SUBCATEGORIES ({subCount})
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCatForSub(c)}>
                    <Text style={styles.addSubText}>+ Add Sub</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subChipsRow}>
                  {c.subCategories && c.subCategories.length > 0 ? (
                    c.subCategories.map((sub, i) => (
                      <View key={sub.id || sub._id || i} style={styles.subChip}>
                        <Text style={styles.subChipText}>{sub.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteSubcategory(c, sub.id || sub._id || '', sub.name)}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <X size={11} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noSubsText}>No subcategories defined</Text>
                  )}
                </View>
              </View>

              {/* Footer with Product Count & Quick Edit Link */}
              <View style={styles.cardFooter}>
                <View style={styles.productCountRow}>
                  <Text style={styles.productCountLabel}>Live Products: </Text>
                  <Text style={styles.productCountValue}>{productCount} items</Text>
                </View>

                <TouchableOpacity
                  style={styles.quickEditLink}
                  onPress={() => startEditCategory(c)}
                  activeOpacity={0.7}
                >
                  <ImageIcon size={12} color="#2563EB" />
                  <Text style={styles.quickEditText}>Edit Image / Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL (100% Same as Website Image 2)                       */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(editingCat)} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalEmojiBox, { backgroundColor: editBgColor }]}>
                  <Text style={styles.modalEmojiText}>{editIcon || '🥦'}</Text>
                </View>
                <View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    Edit Category: {editingCat?.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>ID: {editingCat?.id || editingCat?._id}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setEditingCat(null)} style={styles.modalCloseBtn}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {editError && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#B91C1C" />
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              )}

              {/* 1. Category Image URL & Preview */}
              <Text style={styles.formLabel}>Category Image URL *</Text>
              <Text style={styles.formSubLabel}>Direct image URL (PNG/JPG/WEBP)</Text>

              <View style={styles.imageInputRow}>
                <View style={[styles.imagePreviewBox, { backgroundColor: editBgColor }]}>
                  {editImage ? (
                    <Image source={{ uri: editImage }} style={styles.imagePreview} resizeMode="cover" />
                  ) : (
                    <ImageIcon size={28} color="#94A3B8" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://images.unsplash.com/... or CDN link"
                    placeholderTextColor="#94A3B8"
                    value={editImage}
                    onChangeText={setEditImage}
                  />
                  <Text style={styles.urlHint}>Paste any online image URL or click a ready preset below:</Text>
                </View>
              </View>

              {/* ⚡ Quick-Select Image Presets */}
              <Text style={styles.presetsHeader}>⚡ Quick-Select Image Presets:</Text>
              <View style={styles.presetsRow}>
                {IMAGE_PRESETS.map((p) => {
                  const isSelected = editImage === p.url;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => {
                        setEditImage(p.url);
                        setEditIcon(p.emoji);
                        setEditBgColor(p.color);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.presetChipEmoji}>{p.emoji}</Text>
                      <Text style={[styles.presetChipLabel, isSelected && styles.presetChipLabelActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Category Name & URL Slug */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>Category Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={(val) => {
                      setEditName(val);
                      if (!editSlug || editSlug === editingCat?.slug) {
                        setEditSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.formLabel}>URL Slug *</Text>
                  <TextInput
                    style={[styles.textInput, styles.monoFont]}
                    value={editSlug}
                    onChangeText={setEditSlug}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* 3. Icon / Emoji & Sort Order */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>Icon / Emoji</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editIcon}
                    onChangeText={setEditIcon}
                    placeholder="e.g. 🥦 or 🧄"
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.formLabel}>Display Sort Order</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editSortOrder}
                    onChangeText={setEditSortOrder}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* 4. Background Color Swatches */}
              <Text style={styles.formLabel}>Card Background Accent Color</Text>
              <View style={styles.colorSwatchesRow}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      editBgColor === color && styles.colorSwatchActive,
                    ]}
                    onPress={() => setEditBgColor(color)}
                    activeOpacity={0.8}
                  >
                    {editBgColor === color && <Check size={14} color="#071B52" />}
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.hexInput}
                  value={editBgColor}
                  onChangeText={setEditBgColor}
                />
              </View>

              {/* 5. Description (Optional) */}
              <Text style={[styles.formLabel, { marginTop: 14 }]}>Description (Optional)</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Short description of products found in this aisle..."
                placeholderTextColor="#94A3B8"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline={true}
                numberOfLines={2}
              />

              {/* 6. Category Visibility Checkbox */}
              <View style={styles.visibilityCard}>
                <TouchableOpacity
                  style={styles.visibilityRow}
                  onPress={() => setEditIsActive(!editIsActive)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, editIsActive && styles.checkboxActive]}>
                    {editIsActive && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.visibilityLabel}>ACTIVE</Text>
                </TouchableOpacity>
                <Text style={styles.visibilityHint}>
                  Active categories appear in consumer app & website navigation
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingCat(null)}
                disabled={savingEdit}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCategoryEdit}
                disabled={savingEdit}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {savingEdit ? 'Saving...' : 'Commit Category Changes'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* ADD CATEGORY MODAL                                                        */}
      {/* ========================================================================= */}
      <Modal visible={showAddCatModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Plus size={20} color="#FF3B98" />
                <Text style={styles.modalTitle}>Add Department / Category</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCatModal(false)}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {addError && (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color="#B91C1C" />
                  <Text style={styles.errorText}>{addError}</Text>
                </View>
              )}

              {/* Category Name & Slug */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>Category Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Vegetables"
                    value={newCatName}
                    onChangeText={(val) => {
                      setNewCatName(val);
                      if (!newCatSlug) {
                        setNewCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>URL Slug *</Text>
                  <TextInput
                    style={[styles.textInput, styles.monoFont]}
                    placeholder="e.g. vegetables"
                    value={newCatSlug}
                    onChangeText={setNewCatSlug}
                  />
                </View>
              </View>

              {/* Image URL & Presets */}
              <Text style={[styles.formLabel, { marginTop: 12 }]}>Category Image URL</Text>
              <TextInput
                style={styles.urlInput}
                placeholder="https://images.unsplash.com/..."
                value={newCatImage}
                onChangeText={setNewCatImage}
              />

              <Text style={styles.presetsHeader}>⚡ Quick Presets:</Text>
              <View style={styles.presetsRow}>
                {IMAGE_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={styles.presetChip}
                    onPress={() => {
                      setNewCatName(p.label);
                      setNewCatSlug(p.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      setNewCatImage(p.url);
                      setNewCatIcon(p.emoji);
                      setNewCatBgColor(p.color);
                    }}
                  >
                    <Text>{p.emoji} {p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Icon & Sort Order */}
              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>Icon / Emoji</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCatIcon}
                    onChangeText={setNewCatIcon}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.formLabel}>Display Sort Order</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newCatSortOrder}
                    onChangeText={setNewCatSortOrder}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={[styles.formLabel, { marginTop: 12 }]}>Description</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Short description..."
                value={newCatDescription}
                onChangeText={setNewCatDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddCatModal(false)}
                disabled={submittingCat}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateCategory}
                disabled={submittingCat}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {submittingCat ? 'Creating...' : '+ Create Category'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* ADD SUBCATEGORY MODAL                                                     */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedCatForSub)} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subcategory</Text>
              <TouchableOpacity onPress={() => setSelectedCatForSub(null)}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.formSubLabel}>
              Adding subcategory to <Text style={{ fontWeight: '800', color: '#071B52' }}>{selectedCatForSub?.name}</Text>
            </Text>

            <Text style={[styles.formLabel, { marginTop: 12 }]}>Subcategory Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Potato, Onion & Tomato"
              value={newSubName}
              onChangeText={setNewSubName}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedCatForSub(null)}
                disabled={submittingSub}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateSubcategory}
                disabled={submittingSub}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>
                    {submittingSub ? 'Adding...' : '+ Add Subcategory'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dark Store Filter Modal */}
      <Modal visible={showDarkStoreModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Dark Store / Shop</Text>
              <TouchableOpacity onPress={() => setShowDarkStoreModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {darkStoresList.map((storeName) => (
                <TouchableOpacity
                  key={storeName}
                  style={[
                    styles.pickerItem,
                    selectedDarkStore === storeName && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDarkStore(storeName);
                    setShowDarkStoreModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDarkStore === storeName && styles.pickerItemTextActive,
                    ]}
                  >
                    {storeName}
                  </Text>
                  {selectedDarkStore === storeName && <Check size={16} color="#FF3B98" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },

  // 1. Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbPortal: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbSlash: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  storeSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))' },
      default: { elevation: 1 },
    }),
  },
  storeSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
    maxWidth: 180,
  },

  // 2. Main Page Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  addCategoryBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addCategoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addCategoryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // 3. Filter & Search Bar
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  statusPillActive: {
    backgroundColor: '#071B52',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    flex: 1,
    minWidth: 180,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 12,
    fontWeight: '600',
    color: '#071B52',
  },

  // 4. Categories Grid & Cards
  categoriesGrid: {
    gap: 14,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 2px 4px rgba(15,23,42,0.03))' },
      default: { elevation: 1 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbnailBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emojiOverlayBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  emojiOverlayText: {
    fontSize: 10,
  },
  cardTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  cardCategoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  cardSlug: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  orderTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orderTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  codeTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
  },
  cardActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusHidden: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusHiddenText: {
    color: '#64748B',
  },
  deleteIconBtn: {
    padding: 4,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  subcategoriesSection: {
    gap: 6,
  },
  subcategoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subcategoriesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  addSubText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B98',
  },
  subChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  noSubsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  productCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  productCountValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
  },
  quickEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmojiText: {
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 4,
  },
  formSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  imagePreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  urlInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#071B52',
  },
  urlHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  presetsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  presetChipEmoji: {
    fontSize: 12,
  },
  presetChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipLabelActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#071B52',
  },
  monoFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: {
    borderColor: '#071B52',
    borderWidth: 2.5,
  },
  hexInput: {
    width: 80,
    height: 30,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#071B52',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#071B52',
    minHeight: 50,
    marginBottom: 10,
  },
  visibilityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  visibilityLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
  },
  visibilityHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },

  // Dark Store Picker Modal
  pickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(255, 59, 152, 0.06)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B52',
  },
  pickerItemTextActive: {
    color: '#FF3B98',
    fontWeight: '800',
  },
});
